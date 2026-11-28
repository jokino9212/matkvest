// Encrypted outbox candidate for createV307Queue. Deliberately not enabled in the
// account UI until the real server's key authorization/lease/rollback contract is verified.
// keyFor and floorFor must enforce the authenticated actor, profile and lesson/assignment
// permissions. They may use an authorized in-memory lease while offline; no key is persisted.
import {assertDraftEnvelope,canonicalDraftJSON,sealDraft,openDraft,validatePlainDraft} from './draft_cipher.mjs';
import {applyTableAction} from '../backend95-next/school_block_queue.mjs';
const BLOCKS='blocks',META='v307DraftMigration',MARKER='encrypted-v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validId=x=>typeof x==='string'&&uuid.test(x);
const jsonEqual=(a,b)=>canonicalDraftJSON(a)===canonicalDraftJSON(b);
const bytesEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const header=e=>({version:e.version,keyId:e.keyId,key:e.key,context:e.context,pack:e.pack,revision:e.revision});
function checkedRows(rows,marker){
 if(marker?.id!==MARKER||marker.format!==1)throw Error('DRAFT_MIGRATION_UNKNOWN');
 return rows.map(assertDraftEnvelope);
}
function equalSnapshot(a,b){
 return a.length===b.length&&a.every((x,i)=>jsonEqual(header(x),header(b[i]))&&bytesEqual(x.iv,b[i].iv)&&bytesEqual(x.ciphertext,b[i].ciphertext));
}
function openMigrated(idb,name){
 return new Promise((resolve,reject)=>{
  const req=idb.open(name,2);let abandoned=false;
  req.onblocked=()=>{abandoned=true;reject(Error('DRAFT_STORAGE_BLOCKED'))};
  req.onupgradeneeded=()=>{req.transaction.abort();reject(Error('DRAFT_MIGRATION_REQUIRED'))};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{const db=req.result;if(abandoned){db.close();return}db.onversionchange=()=>db.close();resolve(db)};
 });
}
export function encryptedSchoolOutbox({indexedDB:idb=globalThis.indexedDB,databaseName,keyFor,floorFor,guardFor=()=>()=>true}){
 if(!idb||typeof databaseName!=='string'||!databaseName||typeof keyFor!=='function'||typeof floorFor!=='function'||typeof guardFor!=='function')throw Error('DRAFT_OUTBOX_CONFIG');
 async function snapshot(){
  const db=await openMigrated(idb,databaseName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction([BLOCKS,META],'readonly'),rows=tx.objectStore(BLOCKS).getAll(),marker=tx.objectStore(META).get(MARKER);
   tx.oncomplete=()=>{try{resolve(checkedRows(rows.result,marker.result))}catch(e){reject(e)}};
   tx.onabort=()=>reject(tx.error||Error('DRAFT_READ_ABORT'));tx.onerror=()=>reject(tx.error);
  })}finally{db.close()}
 }
 // WebCrypto and key retrieval run outside transactions. Re-check the exact encrypted
 // snapshot in a readwrite transaction before writing, so stale tabs cannot overwrite.
 async function commit(previous,replacement,guard){
  const db=await openMigrated(idb,databaseName);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction([BLOCKS,META],'readwrite'),store=tx.objectStore(BLOCKS);
   const rows=store.getAll(),marker=tx.objectStore(META).get(MARKER);let error;
   const abort=e=>{error=e;try{tx.abort()}catch{}};
   tx.oncomplete=()=>resolve();
   tx.onabort=()=>reject(error||tx.error||Error('DRAFT_WRITE_ABORT'));
   tx.onerror=()=>{};
   marker.onsuccess=()=>{
    try{
     if(!equalSnapshot(previous,checkedRows(rows.result,marker.result)))throw Error('DRAFT_CHANGED');
     if(guard&&guard()!==true)throw Error('SCOPE_CHANGED');
     store.put(assertDraftEnvelope(replacement));
    }catch(e){abort(e)}
   };
  })}finally{db.close()}
 }
 async function floor(context,pack){
  const n=await floorFor(structuredClone(context),pack);
  if(!Number.isSafeInteger(n)||n<0)throw Error('DRAFT_REVISION_FLOOR');
  return n;
 }
 function check(guard){if(guard()!==true)throw Error('KEY_SESSION_CHANGED')}
 async function decrypt(e){
  const request={operation:'open',keyId:e.keyId,pack:e.pack};
  const guard=guardFor(e.context,{requests:[request],pack:e.pack,revision:e.revision});
  const minimum=await floor(e.context,e.pack);
  const k=await keyFor(structuredClone(e.context),request);
  const row=await openDraft(e,k,e.context,minimum,e.pack);check(guard);
  return {row,guard};
 }
 async function encrypt(row){
  const id=validatePlainDraft(row),request={operation:'seal',keyId:null,pack:id.pack};
  const guard=guardFor(id.context,{requests:[request],pack:id.pack,revision:id.revision});
  if(id.revision<await floor(id.context,id.pack))throw Error('DRAFT_REVISION_FLOOR');
  const k=await keyFor(structuredClone(id.context),request);
  const envelope=await sealDraft(row,k);check(guard);
  return {envelope,guard};
 }
 async function profileRows(s,owner,profile){
  if(!validId(owner)||!validId(profile))throw Error('DRAFT_SCOPE');
  const records=await Promise.all(s.filter(e=>e.context.owner===owner&&e.context.profile===profile).map(decrypt));
  for(const record of records)check(record.guard);
  return records;
 }
 async function list(owner,profile){return (await profileRows(await snapshot(),owner,profile)).map(x=>x.row)}
 async function insert(row,guard){
  validatePlainDraft(row);
  if(row.status!=='draft'||row.revision!==0||!row.start||!Number.isInteger(row.count)||row.count<1)throw Error('DRAFT_INSERT_INVALID');
  const s=await snapshot(),records=await profileRows(s,row.owner,row.profile),all=records.map(x=>x.row),existing=all.find(x=>x.key===row.key);
  if(existing){
   if(!jsonEqual(existing.start,row.start)||!jsonEqual(existing.context,row.context)||existing.topic!==row.topic||existing.stage!==row.stage||existing.count!==row.count||!jsonEqual(existing.questions,row.questions))throw Error('BLOCK_START_CONFLICT');
   if(guard&&guard()!==true)throw Error('SCOPE_CHANGED');
   return existing;
  }
  if(all.some(x=>['draft','pending','blocked'].includes(x.status)))throw Error('BLOCK_ALREADY_ACTIVE');
  if(row.start.permit&&all.some(x=>x.start?.permit===row.start.permit))throw Error('PERMIT_ALREADY_ASSIGNED');
  const sealed=await encrypt(row);await commit(s,sealed.envelope,()=>records.every(x=>x.guard()===true)&&sealed.guard()===true&&(!guard||guard()===true));return structuredClone(row);
 }
 async function act(key,revision,kind,value,guard){
  const s=await snapshot(),e=s.find(x=>x.key===key);if(!e)throw Error('BLOCK_MISSING');
  const {row,guard:keyGuard}=await decrypt(e);
  if(typeof guard!=='function'||guard(row)!==true)throw Error('SCOPE_CHANGED');
  const next=applyTableAction(row,revision,kind,value),sealed=await encrypt(next);
  await commit(s,sealed.envelope,()=>keyGuard()===true&&sealed.guard()===true&&guard(row)===true);return next;
 }
 async function settle(key,status,receipt){
  const s=await snapshot(),e=s.find(x=>x.key===key);if(!e)throw Error('BLOCK_MISSING');
  const {row,guard:keyGuard}=await decrypt(e);
  if(row.status==='confirmed')return row;
  if(!['pending','blocked'].includes(row.status)||!['confirmed','blocked'].includes(status))throw Error('DRAFT_SETTLE_INVALID');
  if(status==='confirmed'&&(receipt?.id!==row.pack||receipt.status!=='finished'))throw Error('INVALID_RECEIPT');
  if(status==='blocked'&&typeof receipt?.code!=='string')throw Error('INVALID_RECEIPT');
  if(row.status==='blocked'&&status==='blocked')return row;
  const next={...row,status,receipt:structuredClone(receipt),revision:row.revision+1};
  const sealed=await encrypt(next);await commit(s,sealed.envelope,()=>keyGuard()===true&&sealed.guard()===true);return next;
 }
 async function rotate(key,guard){
  const s=await snapshot(),e=s.find(x=>x.key===key);if(!e)throw Error('BLOCK_MISSING');
  const {row,guard:keyGuard}=await decrypt(e);
  if(typeof guard!=='function'||guard(row)!==true)throw Error('SCOPE_CHANGED');
  const sealed=await encrypt(row);check(keyGuard);
  if(sealed.envelope.keyId===e.keyId)return row;
  await commit(s,sealed.envelope,()=>keyGuard()===true&&sealed.guard()===true&&guard(row)===true);return row;
 }
 return {list,insert,act,settle,rotate};
}
