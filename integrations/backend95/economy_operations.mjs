// A durable, per-owner/profile single pending operation. Never change its UUID
// or request body after a possible commit. No offline purchases are initiated.
const scopeOf=s=>s?.status==='ready'&&s.snapshot?.economy&&s.user?.id&&s.selectedId===s.snapshot.profile.id?{owner:s.user.id,profile:s.selectedId}:null;
const keyOf=s=>JSON.stringify([s.owner,s.profile]);
const rejected=new Set(['PRICE_CHANGED','REFUND_CHANGED','ITEM_NOT_FOR_SALE','ITEM_NOT_FOUND','ITEM_UNAVAILABLE','ITEM_NOT_RESELLABLE','ITEM_NOT_OWNED','ITEM_NOT_SELECTABLE','ITEM_TYPE_MISMATCH','ALREADY_OWNED','LEVEL_REQUIRED','INSUFFICIENT_COINS','EQUIPMENT_SLOTS_FULL','SELECT_REPLACEMENT_REQUIRED','CHEST_COLLECTION_COMPLETE','LEGACY_CHEST_HISTORY_REVIEW_REQUIRED','SALE_MISSION_EXISTS','SALE_TOPIC_NOT_USEFUL','SALE_MISSION_CHANGED','SALE_MISSION_COMPLETED','SALE_MISSION_NOT_COMPLETED']);
export function createEconomyJournal(indexedDB=globalThis.indexedDB){
 const db=new Promise((resolve,reject)=>{
  const r=indexedDB.open('matkvest-backend95-economy-journal',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('pending',{keyPath:'scope'});
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 async function tx(mode,work){const d=await db;return new Promise((resolve,reject)=>{
  const transaction=d.transaction('pending',mode),store=transaction.objectStore('pending');let result;
  transaction.oncomplete=()=>resolve(result);transaction.onabort=()=>reject(transaction.error||Error('ECONOMY_JOURNAL_ABORTED'));
  const done=x=>{result=x;};try{work(store,done)}catch(e){transaction.abort();reject(e)}
 });}
 return {read:scope=>tx('readonly',(s,done)=>{const r=s.get(scope);r.onsuccess=()=>done(r.result||null)}),
  claim:row=>tx('readwrite',(s,done)=>{const r=s.get(row.scope);r.onsuccess=()=>{if(r.result){done(null);return;}s.add(row);done(row)}}),
  settle:(scope,id)=>tx('readwrite',(s,done)=>{const r=s.get(scope);r.onsuccess=()=>{if(r.result?.id===id)s.delete(scope);done(true)}})};
}
export function createEconomyOperations({api,store,mode,emit,journal=createEconomyJournal(),uuid=()=>crypto.randomUUID(),online=()=>navigator.onLine}){
 let row=null,busy=false,error='',scope=null,revision=0;
 const ready=()=>mode()==='server'&&!store.logoutPending?.()?scopeOf(store.read()):null;
 const same=sc=>!!sc&&keyOf(ready()||{})===keyOf(sc);
 const read=()=>({busy,pending:same(scope)&&!!row,error:same(scope)?error:''});
 function notify(){emit()}
 async function onAccount(){
  const sc=ready(),token=++revision;
  if(!sc){row=null;scope=null;error='';notify();return;}
  if(!scope||!same(scope)){row=null;error='';}
  scope=sc;
  try{const value=await journal.read(keyOf(sc));if(token===revision&&same(sc)){row=value;notify();}}
  catch{if(token===revision&&same(sc)){error='Не удалось прочитать журнал операций. Покупки отключены до восстановления хранилища.';notify();}}
 }
 async function send(sc,pending){
  const actor=await api.resumeSession();
  if(actor.id!==sc.owner||actor.role!=='student'||!same(sc)||!online())return;
  try{
   const receipt=await api.request('POST','/student/profiles/'+encodeURIComponent(sc.profile)+'/economy/operations',{body:pending.body,idempotencyKey:pending.id});
   if(receipt?.profile_id!==sc.profile||receipt.operation_id!==pending.id||receipt.action!==pending.body.action)throw Error('ECONOMY_RECEIPT_INVALID');
   await journal.settle(pending.scope,pending.id);
   if(same(sc)){row=null;error='';await store.select(sc.profile);}
  }catch(e){
   if(rejected.has(e.code)){await journal.settle(pending.scope,pending.id);if(same(sc)){row=null;await store.select(sc.profile);if(same(sc))error='Операция отклонена сервером: '+e.code;}}
   else if(same(sc))error='Подтверждение не получено. Повтори тот же запрос; новое списание не создаётся.';
  }
 }
 async function run(body=null){
  const sc=ready();if(!sc||busy||!online())return;
  busy=true;error='';scope=sc;notify();
  try{
   let existing=await journal.read(keyOf(sc));
   if(!same(sc))return;
   if(body){
    if(existing){row=existing;error='Сначала заверши ожидающую операцию.';return;}
    const candidate={scope:keyOf(sc),owner:sc.owner,profile:sc.profile,id:uuid(),body:structuredClone(body)};
    existing=await journal.claim(candidate);
    if(!existing){row=await journal.read(keyOf(sc));error='Операция уже начата в другой вкладке.';return;}
   }
   if(!existing)return;
   if(!same(sc))return;
   row=existing;notify();
   await send(sc,existing);
  }catch(e){if(same(sc))error='Операция не подтверждена. Сохранённый запрос можно повторить.';}
  finally{busy=false;notify();await onAccount();}
 }
 return {read,onAccount,run,retry:()=>run(null)};
}
