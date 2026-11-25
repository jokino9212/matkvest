// Numeric/choice Grade 4 formats; column journals remain disabled until their own gate.
export const SCHOOL_TOPICS=Object.freeze({
 'g4:table':'Таблица умножения',
 'g4:moro_order_1000':'Числовые выражения. Порядок действий',
 'g4:order':'Порядок действий',
 'g4:equations':'Выражения и уравнения',
 'g4:moro_missing_sub':'Неизвестное уменьшаемое и вычитаемое',
 'g4:moro_missing_add':'Неизвестное слагаемое',
 'g4:moro_missing_muldiv':'Неизвестный множитель, делимое и делитель'
});
export const STAGES=['Разминка','Тренировка','Мастерство'];
export const COUNTS=[5,7,10], PASS=[4,5,8];
export const stageOf=row=>row.stage??0;
export const expectedAnswer=(topic,question)=>topic==='g4:table'?question.a*question.b:question.answer;
export function stageAllowed(best,stage){return Number.isInteger(stage)&&stage>=0&&stage<3&&(stage===0||Number(best?.[stage-1]||0)>=PASS[stage-1]);}
export function validateQuestion(topic,question){
 if(topic==='g4:table'){
  const {a,b}=question;if(!Number.isInteger(a)||!Number.isInteger(b)||a<2||b<2||a>9||b>9)throw Error('INVALID_QUESTION');
  return {a,b};
 }
 const {expression,answer,steps,choices}=question;
 if(typeof expression!=='string'||!expression||expression.length>300||!Number.isInteger(answer)||answer<0||answer>9999||!Array.isArray(steps)||steps.some(x=>typeof x!=='string'))throw Error('INVALID_QUESTION');
 if(choices!==undefined&&(!Array.isArray(choices)||!choices.includes(answer)||new Set(choices).size!==choices.length||choices.some(x=>!Number.isInteger(x)||x<0||x>9999)))throw Error('INVALID_CHOICES');
 return {expression,answer,steps,...(choices?{choices}:{})};
}
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
    if(!validId(pack?.id) || !Object.hasOwn(SCHOOL_TOPICS,pack.topic_id) || !Number.isInteger(pack.stage) || pack.stage<0 || pack.stage>2 || !Array.isArray(pack.questions) || pack.questions.length!==COUNTS[pack.stage]) throw Error('INVALID_BLOCK');
    if(typeof startedAt!=='string' || !Number.isFinite(Date.parse(startedAt)) || !Number.isFinite(Date.parse(pack.expires_at)) || Date.parse(startedAt)>=Date.parse(pack.expires_at) || (!pack.full && !validId(permit))) throw Error('INVALID_START');
    const start={started_at:startedAt,...(!pack.full?{permit}:{})};
    const questions=pack.questions.map(question=>validateQuestion(pack.topic_id,question));
    const row={key:keyOf(s.owner,s.profile,pack.id),owner:s.owner,profile:s.profile,pack:pack.id,topic:pack.topic_id,stage:pack.stage,count:pack.questions.length,start,status:'draft',questions,index:0,revision:0,draft:questions.map(()=>({answer:'',checks:[],skipped:false,solved:false}))};
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
      let actor;try{actor=await api.resumeSession()}catch{return [];}
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
// One transaction applies the input/check/advance and creates the immutable final
// journal. No separate completion write can be lost during F5.
export function applyTableAction(row,revision,kind,value){
 if(row.status!=='draft'||row.revision!==revision)throw Error('DRAFT_CHANGED');
 const next=structuredClone(row),item=next.draft[next.index],question=next.questions[next.index];
 const numeric=String(value??'').replace(/[^0-9]/g,'').slice(0,next.topic==='g4:table'?3:4);
 if(kind==='input'&&!item.solved){item.answer=numeric;item.feedback='';}
 else if(kind==='check'&&!item.solved){
  item.answer=numeric;
  if(!numeric){item.feedback='Введи ответ.';}
  else{
   if(item.checks.length>=1000)throw Error('CHECK_LIMIT');
   if(question.choices&&!question.choices.includes(Number(numeric)))throw Error('INVALID_CHOICE');
   item.checks.push({'answer:0':numeric});
   item.solved=Number(numeric)===expectedAnswer(next.topic,question);
   item.feedback=item.solved?'Верно!':'Проверь ответ и попробуй ещё раз.';
  }
 }else if((kind==='advance'&&item.solved)||(kind==='skip'&&!item.solved)){
  if(kind==='skip'){item.answer=question.choices&&!question.choices.includes(Number(numeric))?'':numeric;item.skipped=true;}
  if(next.index+1===next.count){
   next.body={...next.start,items:next.draft.map(x=>({checks:x.checks,skipped:x.skipped,...(x.skipped&&x.answer?{cells:{'answer:0':x.answer}}:{})}))};
   next.status='pending';
  }else next.index++;
 }else throw Error('INVALID_ACTION');
 next.revision++;return next;
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
    insert(row){return transact('readwrite',(s,done,fail)=>{const r=s.getAll();r.onsuccess=()=>{const old=r.result.find(x=>x.key===row.key);if(old){if(JSON.stringify(old.start)!==JSON.stringify(row.start)||old.count!==row.count)return fail(Error('BLOCK_START_CONFLICT'));done(old);return;}if(r.result.some(x=>x.owner===row.owner&&x.profile===row.profile&&(x.status==='draft'||x.status==='pending')))return fail(Error('BLOCK_ALREADY_ACTIVE'));if(row.start.permit&&r.result.some(x=>x.owner===row.owner&&x.profile===row.profile&&x.start.permit===row.start.permit))return fail(Error('PERMIT_ALREADY_ASSIGNED'));s.add(row);done(row);};});},
    act(key,revision,kind,value){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{try{if(!r.result)throw Error('BLOCK_MISSING');const next=applyTableAction(r.result,revision,kind,value);s.put(next);done(next);}catch(e){fail(e)}};});},
    complete(key,items){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row||!Array.isArray(items)||items.length!==row.count)return fail(Error('INVALID_BLOCK'));const body={items,...row.start};if(row.status!=='draft'){if(JSON.stringify(row.body)!==JSON.stringify(body))return fail(Error('BLOCK_BODY_CONFLICT'));done(row);return;}const next={...row,body,status:'pending'};s.put(next);done(next);};});},
    list(owner,profile){return transact('readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result.filter(x=>x.owner===owner&&x.profile===profile));});},
    settle(key,status,receipt){return transact('readwrite',(s,done,fail)=>{const r=s.get(key);r.onsuccess=()=>{const row=r.result;if(!row)return fail(Error('BLOCK_MISSING'));if(row.status==='confirmed'){done(row);return;}const next={...row,status,receipt};s.put(next);done(next);};});}
  };
}
