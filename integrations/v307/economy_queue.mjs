// Durable one-operation journal per authenticated student/profile. No credentials stored.
const valid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const bodyKey=b=>JSON.stringify(Object.fromEntries(Object.entries(b).sort(([a],[z])=>a.localeCompare(z))));
const knownNoWrite=new Set(['PRICE_CHANGED','REFUND_CHANGED','INSUFFICIENT_COINS','ALREADY_OWNED','LEVEL_REQUIRED','ITEM_NOT_FOR_SALE','ITEM_NOT_RESELLABLE','ITEM_NOT_OWNED','ITEM_NOT_SELECTABLE','CHEST_COLLECTION_COMPLETE','LEGACY_CHEST_HISTORY_REVIEW_REQUIRED','CHEST_SALE_NO_MISSION','EQUIPMENT_SLOTS_FULL','SALE_MISSION_EXISTS','SALE_TOPIC_NOT_USEFUL','SALE_MISSION_NOT_COMPLETED','SALE_MISSION_CHANGED','SALE_MISSION_COMPLETED','SELECT_REPLACEMENT_REQUIRED']);
function assertScope(s){if(s?.role!=='student'||!valid(s.owner)||!valid(s.profile))throw Error('INVALID_ECONOMY_SCOPE');return s;}
function scopeKey(s){assertScope(s);return s.owner+':'+s.profile;}
export function createEconomyQueue({api,scope,store,online=()=>navigator.onLine,uuid=()=>crypto.randomUUID()}){
 const get=()=>assertScope(scope()),same=(a,b)=>a?.ticket===b?.ticket&&a?.owner===b?.owner&&a?.profile===b?.profile&&a?.role===b?.role;
 async function check(s){if(!online()||!same(s,scope()))throw Error('SCOPE_CHANGED');const actor=await api.resumeSession();if(!same(s,scope())||actor?.id!==s.owner||actor.role!=='student')throw Error('SCOPE_CHANGED');}
 async function pending(){const s=get(),r=await store.read(scopeKey(s));if(!same(s,scope()))throw Error('SCOPE_CHANGED');return r;}
 async function submit(body){
  const s=get();await check(s);
  const k=scopeKey(s);const candidate={scope:k,owner:s.owner,profile:s.profile,key:uuid(),body:structuredClone(body)};
  const r=await store.reserve(candidate);
  if(!same(s,scope())||r.owner!==s.owner||r.profile!==s.profile||!valid(r.key)||bodyKey(r.body)!==bodyKey(body))throw Error('PENDING_OTHER_OPERATION');
  await check(s);
  let receipt;
  try{receipt=await api.economyOperation(s.profile,r.body,r.key);}
  catch(e){if(same(s,scope())&&knownNoWrite.has(e.code)&&[403,409].includes(e.status))await store.clear(k,r.key);throw e;}
  if(receipt?.profile_id!==s.profile||receipt.operation_id!==r.key||receipt.action!==r.body.action||!Number.isSafeInteger(receipt.balance)||receipt.balance<0)throw Error('INVALID_RECEIPT');
  await store.clear(k,r.key);
  if(!same(s,scope()))throw Error('SCOPE_CHANGED');
  return receipt;
 }
 return {pending,submit};
}
export function economyOutbox(indexedDB=globalThis.indexedDB,databaseName='matkvest-v307-economy-outbox'){
 let promise;
 function open(){if(!indexedDB)throw Error('PERSISTENCE_REQUIRED');return promise??=new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName,1);r.onupgradeneeded=()=>r.result.createObjectStore('pending',{keyPath:'scope'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('STORAGE_BLOCKED'));});}
 async function transact(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction('pending',mode),s=t.objectStore('pending');let result;t.oncomplete=()=>resolve(result);t.onabort=()=>reject(t.error||Error('STORAGE_ABORT'));t.onerror=()=>reject(t.error);fn(s,v=>{result=v});});}
 return {read:k=>transact('readonly',(s,done)=>{const r=s.get(k);r.onsuccess=()=>done(r.result||null);}),reserve:row=>transact('readwrite',(s,done)=>{const r=s.get(row.scope);r.onsuccess=()=>{if(r.result)done(r.result);else{s.add(row);done(row);}};}),clear:(k,key)=>transact('readwrite',(s,done)=>{const r=s.get(k);r.onsuccess=()=>{if(r.result?.key===key)s.delete(k);done(true);};})};
}
