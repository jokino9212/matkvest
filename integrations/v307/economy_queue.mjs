// Durable one-operation journal per authenticated student/profile. No credentials stored.
const valid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const bodyKey=b=>JSON.stringify(canonical(b));
export function validatePendingRecord(row,owner,profile){
 if(!row||row.scope!==owner+':'+profile||row.owner!==owner||row.profile!==profile||!valid(row.key)||!row.body||typeof row.body!=='object'||Array.isArray(row.body))throw Error('PENDING_RECORD_INVALID');
 return row;
}
const knownNoWrite=new Set(['PRICE_CHANGED','REFUND_CHANGED','INSUFFICIENT_COINS','ALREADY_OWNED','LEVEL_REQUIRED','ITEM_NOT_FOR_SALE','ITEM_NOT_RESELLABLE','ITEM_NOT_OWNED','ITEM_NOT_SELECTABLE','CHEST_COLLECTION_COMPLETE','LEGACY_CHEST_HISTORY_REVIEW_REQUIRED','CHEST_SALE_NO_MISSION','EQUIPMENT_SLOTS_FULL','SALE_MISSION_EXISTS','SALE_TOPIC_NOT_USEFUL','SALE_MISSION_NOT_COMPLETED','SALE_MISSION_CHANGED','SALE_MISSION_COMPLETED','SELECT_REPLACEMENT_REQUIRED']);
function assertScope(s){if(s?.role!=='student'||!valid(s.owner)||!valid(s.profile))throw Error('INVALID_ECONOMY_SCOPE');return s;}
function scopeKey(s){assertScope(s);return s.owner+':'+s.profile;}
export function createEconomyQueue({api,scope,store,online=()=>navigator.onLine,uuid=()=>crypto.randomUUID()}){
 const get=()=>assertScope(scope()),same=(a,b)=>a?.ticket===b?.ticket&&a?.owner===b?.owner&&a?.profile===b?.profile&&a?.role===b?.role;
 async function check(s){if(!online()||!same(s,scope()))throw Error('SCOPE_CHANGED');const actor=await api.resumeSession();if(!online()||!same(s,scope())||actor?.id!==s.owner||actor.role!=='student')throw Error('SCOPE_CHANGED');}
 async function pending(){const s=get();await check(s);const r=await store.read(scopeKey(s));if(!same(s,scope())||!online())throw Error('SCOPE_CHANGED');return r===null?null:validatePendingRecord(r,s.owner,s.profile);}
 async function submit(body){
  body=structuredClone(body);if(!body||typeof body.action!=='string')throw Error('INVALID_ECONOMY_REQUEST');
  const s=get();await check(s);
  const k=scopeKey(s);const candidate={scope:k,owner:s.owner,profile:s.profile,key:uuid(),body:structuredClone(body)};
  const r=await store.reserve(candidate,()=>online()&&same(s,scope()));
  validatePendingRecord(r,s.owner,s.profile);
  if(!same(s,scope())||bodyKey(r.body)!==bodyKey(body))throw Error('PENDING_OTHER_OPERATION');
  await check(s);
  let receipt;
  try{receipt=await api.economyOperation(s.profile,r.body,r.key);}
  catch(e){if(online()&&same(s,scope())&&knownNoWrite.has(e.code)&&[403,409].includes(e.status))await store.clear(k,r.key,()=>online()&&same(s,scope()));throw e;}
  if(receipt?.profile_id!==s.profile||receipt.operation_id!==r.key||receipt.action!==r.body.action||!Number.isSafeInteger(receipt.balance)||receipt.balance<0)throw Error('INVALID_RECEIPT');
  if(!online()||!same(s,scope()))throw Error('SCOPE_CHANGED');
  await store.clear(k,r.key,()=>online()&&same(s,scope()));
  if(!same(s,scope()))throw Error('SCOPE_CHANGED');
  return receipt;
 }
 return {pending,submit};
}
export function economyOutbox(indexedDB=globalThis.indexedDB,databaseName='matkvest-v307-economy-outbox'){
 let promise;
 function open(){if(!indexedDB)throw Error('PERSISTENCE_REQUIRED');return promise??=new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName,1);r.onupgradeneeded=()=>r.result.createObjectStore('pending',{keyPath:'scope'});r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();promise=undefined};resolve(r.result)};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('STORAGE_BLOCKED'));});}
 async function transact(mode,fn){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction('pending',mode),s=t.objectStore('pending');let result,error;t.oncomplete=()=>resolve(result);t.onabort=()=>reject(error||t.error||Error('STORAGE_ABORT'));t.onerror=()=>{};fn(s,v=>{result=v},e=>{error=e;t.abort()});});}
 return {read:k=>transact('readonly',(s,done)=>{const r=s.get(k);r.onsuccess=()=>done(r.result||null);}),reserve:(row,guard)=>transact('readwrite',(s,done,fail)=>{const r=s.get(row.scope);r.onsuccess=()=>{try{if(guard!==undefined&&(typeof guard!=='function'||guard()!==true))throw Error('SCOPE_CHANGED');if(r.result)done(r.result);else{s.add(row);done(row);}}catch(e){fail(e)}};}),clear:(k,key,guard)=>transact('readwrite',(s,done,fail)=>{const r=s.get(k);r.onsuccess=()=>{try{if(guard!==undefined&&(typeof guard!=='function'||guard()!==true))throw Error('SCOPE_CHANGED');if(r.result?.key===key)s.delete(k);done(true);}catch(e){fail(e)}};})};
}
