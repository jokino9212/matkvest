// First integration slice: completed multiplication-table blocks only.
// The existing backend issues questions/permits and grades the full journal.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validId = x => typeof x === 'string' && uuid.test(x);
const keyOf = (owner, profile, pack) => JSON.stringify([owner, profile, pack]);
const identity = s => s?.status === 'ready' && s.user?.id && s.selectedId === s.snapshot?.profile?.id && s.user.role === 'student'
  ? {owner:s.user.id,profile:s.selectedId} : null;
export function createSchoolBlockQueue({api, store, outbox}) {
  const same = (owner,profile) => {const s=identity(store.read());return s?.owner===owner && s.profile===profile && !store.logoutPending?.();};
  async function begin({pack,startedAt,permit}) {
    const s=identity(store.read());
    if(!s || !same(s.owner,s.profile) || !validId(s.owner) || !validId(s.profile)) throw Error('PROFILE_NOT_READY');
    if(!validId(pack?.id) || pack.topic_id!=='g4:table' || !Array.isArray(pack.questions) || !pack.questions.length) throw Error('INVALID_BLOCK');
    if(typeof startedAt!=='string' || !Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(pack.expires_at)) || Date.parse(startedAt)>=Date.parse(pack.expires_at) || (!pack.full && !validId(permit))) throw Error('INVALID_START');
    const start={started_at:startedAt,...(!pack.full?{permit}:{})};
    const row={key:keyOf(s.owner,s.profile,pack.id),owner:s.owner,profile:s.profile,pack:pack.id,topic:pack.topic_id,count:pack.questions.length,start,status:'draft'};
    return outbox.insert(row); // persist immutable identity and start before going offline
  }
  async function complete(key,items){
    // The key is recovered from the existing local draft. Local completion is not
    // a server authorization; flush independently verifies the cookie-bound owner.
    return outbox.complete(key,structuredClone(items));
  }
  const active=new Map();
  async function flush() {
    const s=identity(store.read());if(!s || !same(s.owner,s.profile))return [];
    const scope=keyOf(s.owner,s.profile,'');
    if(active.has(scope))return active.get(scope);
    const run=(async()=>{
      const actor=await api.resumeSession();
      if(actor?.id!==s.owner || actor.role!=='student' || !same(s.owner,s.profile))return [];
      const sent=[];
      for(const row of await outbox.list(s.owner,s.profile)){
        if(row.status!=='pending' || !same(s.owner,s.profile))continue;
        try{
          const receipt=await api.request('PUT','/student/profiles/'+encodeURIComponent(row.profile)+'/offline-school/'+encodeURIComponent(row.pack),{body:row.body});
          if(receipt?.id!==row.pack || receipt.status!=='finished')throw Error('INVALID_RECEIPT');
          await outbox.settle(row.key,'confirmed',receipt);sent.push(row.key);
        }catch(error){
          // No deletion on errors, including a response lost after server commit.
          // 401/403 may mean a changed session; do not mark the journal as permanently rejected.
          if([409,422].includes(error.status))await outbox.settle(row.key,'blocked',{code:error.code||'REJECTED'});
          break;
        }
      }
      return sent;
    })().finally(()=>active.delete(scope));
    active.set(scope,run);return run;
  }
  return {begin,complete,flush};
}
export function indexedSchoolOutbox(indexedDB=globalThis.indexedDB){
  const opened=new Promise((resolve,reject)=>{
    const r=indexedDB.open('matkvest-backend95-block-outbox',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  async function transact(mode,work){const db=await opened;return new Promise((resolve,reject)=>{
    const tx=db.transaction('blocks',mode),s=tx.objectStore('blocks');let value,err;
    const finish=x=>{value=x;};const fail=e=>{err=e;tx.abort();};
    tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(err||tx.error||Error('OUTBOX_ABORTED'));
    try{work(s,finish,fail)}catch(e){fail(e)}
  });}
  return {
    insert(row){return transact('readwrite',(s,done,fail)=>{const r=s.get(row.key);r.onsuccess=()=>{const old=r.result;if(old){if(JSON.stringify(old.start)!==JSON.stringify(row.start)||old.count!==row.count)return fail(Error('BLOCK_START_CONFLICT'));done(old);}else{s.add(row);done(row);}};});},
    complete(key,items){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row||!Array.isArray(items)||items.length!==row.count)return fail(Error('INVALID_BLOCK'));const body={items,...row.start};if(row.status!=='draft'){if(JSON.stringify(row.body)!==JSON.stringify(body))return fail(Error('BLOCK_BODY_CONFLICT'));done(row);return;}const next={...row,body,status:'pending'};s.put(next);done(next);};});},
    list(owner,profile){return transact('readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result.filter(x=>x.owner===owner&&x.profile===profile));});},
    settle(key,status,receipt){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row)return fail(Error('BLOCK_MISSING'));if(row.status==='confirmed'){done(row);return;}const next={...row,status,receipt};s.put(next);done(next);};});}
  };
}
