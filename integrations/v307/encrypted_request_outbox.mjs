// R13 candidate for quick/review/economy request journals. No backend endpoint is
// assumed. A trusted key provider must authorize the actor/profile/channel and
// current key generation. Keys are never stored. Not enabled in the account UI.
import {canonicalDraftJSON} from './draft_cipher.mjs';
import {validatePendingRecord} from './economy_queue.mjs';
const STORE='pending',META='v307JournalMigration',MARKER='encrypted-v1';
const domains=new Set(['quick','review','economy']);
const valid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const keyIdOk=x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(x);
const utf8=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const same=(a,b)=>canonicalDraftJSON(a)===canonicalDraftJSON(b);
const bytesEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const header=e=>({version:e.version,channel:e.channel,scope:e.scope,owner:e.owner,profile:e.profile,key:e.key,keyId:e.keyId});
const aad=e=>utf8.encode(canonicalDraftJSON({purpose:'matkvest-v307-request-journal',...header(e)}));
const fields=['version','channel','scope','owner','profile','key','keyId','iv','ciphertext'].sort().join(',');
function context(channel,scope){
 if(!domains.has(channel)||typeof scope!=='string')throw Error('JOURNAL_SCOPE');
 const parts=scope.split(':');if(parts.length!==2||!parts.every(valid))throw Error('JOURNAL_SCOPE');
 return {channel,owner:parts[0],profile:parts[1],role:'student',scope};
}
function credentials(c,usage){
 const k=c?.key;
 if(!keyIdOk(c?.keyId)||!k||k.type!=='secret'||k.extractable!==false||k.algorithm?.name!=='AES-GCM'||k.algorithm.length!==256||!k.usages?.includes(usage))throw Error('JOURNAL_KEY_INVALID');
 return k;
}
function assertEnvelope(e,channel,scope){
 const s=context(channel,scope);
 if(!e||Object.keys(e).sort().join(',')!==fields||e.version!==1||e.channel!==channel||e.scope!==scope||e.owner!==s.owner||e.profile!==s.profile||!valid(e.key)||!keyIdOk(e.keyId)||!(e.iv instanceof Uint8Array)||e.iv.length!==12||!(e.ciphertext instanceof Uint8Array)||e.ciphertext.length<16)throw Error('JOURNAL_ENVELOPE_INVALID');
 return e;
}
function plain(row,channel,scope){
 const s=context(channel,scope);validatePendingRecord(row,s.owner,s.profile);canonicalDraftJSON(row);return s;
}
async function seal(row,channel,credential){
 plain(row,channel,row.scope);
 const key=credentials(credential,'encrypt'),iv=crypto.getRandomValues(new Uint8Array(12)),bytes=utf8.encode(canonicalDraftJSON(row));
 const e={version:1,channel,scope:row.scope,owner:row.owner,profile:row.profile,key:row.key,keyId:credential.keyId,iv};
 try{e.ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(e),tagLength:128},key,bytes));return e}finally{bytes.fill(0)}
}
async function unseal(e,channel,scope,credential){
 assertEnvelope(e,channel,scope);const key=credentials(credential,'decrypt');
 if(credential.keyId!==e.keyId)throw Error('JOURNAL_KEY_INVALID');
 let bytes;
 try{bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:e.iv,additionalData:aad(e),tagLength:128},key,e.ciphertext))}catch{throw Error('JOURNAL_AUTHENTICATION_FAILED')}
 try{const row=JSON.parse(decoder.decode(bytes));plain(row,channel,scope);if(row.key!==e.key)throw Error('JOURNAL_IDENTITY');return row}finally{bytes.fill(0)}
}
function equalEnvelope(a,b){
 if(a===null||b===null)return a===b;
 return same(header(a),header(b))&&bytesEqual(a.iv,b.iv)&&bytesEqual(a.ciphertext,b.ciphertext);
}
function connect(idb,name,version,{initialize=false}={}){
 return new Promise((resolve,reject)=>{
  const req=idb.open(name,version);let abandoned=false;
  req.onblocked=()=>{abandoned=true;reject(Error('JOURNAL_STORAGE_BLOCKED'))};
  req.onerror=()=>reject(req.error);
  req.onupgradeneeded=e=>{
   if(abandoned||!initialize||e.oldVersion!==0||version!==1){req.transaction.abort();reject(Error('JOURNAL_MIGRATION_REQUIRED'));return}
   req.result.createObjectStore(STORE,{keyPath:'scope'});
  };
  req.onsuccess=()=>{const db=req.result;if(abandoned){db.close();return}db.onversionchange=()=>db.close();resolve(db)};
 });
}
function snapshot(db,channel,encrypted){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(encrypted?[STORE,META]:[STORE],'readonly'),rows=tx.objectStore(STORE).getAll(),marker=encrypted?tx.objectStore(META).get(MARKER):null;
  tx.oncomplete=()=>{try{if(encrypted){if(marker.result?.channel!==channel||marker.result?.format!==1)throw Error('JOURNAL_MIGRATION_UNKNOWN');rows.result.forEach(r=>assertEnvelope(r,channel,r.scope))}resolve(rows.result)}catch(e){reject(e)}};
  tx.onabort=()=>reject(tx.error||Error('JOURNAL_READ_ABORT'));tx.onerror=()=>reject(tx.error);
 });
}
function upgrade(idb,name,channel,before,after,guard,keyGuards){
 return new Promise((resolve,reject)=>{
  const req=idb.open(name,2);let error,abandoned=false,upgraded=false;
  const abort=e=>{error=e;try{req.transaction.abort()}catch{}};
  req.onblocked=()=>{abandoned=true;reject(Error('JOURNAL_STORAGE_BLOCKED'))};
  req.onerror=()=>reject(error||req.error||Error('JOURNAL_MIGRATION_ABORT'));
  req.onupgradeneeded=e=>{
   if(abandoned||e.oldVersion!==1){abort(Error('JOURNAL_MIGRATION_CONFLICT'));return}
   upgraded=true;
   try{
    const tx=req.transaction,store=tx.objectStore(STORE),meta=req.result.createObjectStore(META,{keyPath:'id'}),get=store.getAll();
    get.onsuccess=()=>{
     try{
      if(canonicalDraftJSON(get.result)!==before)throw Error('JOURNAL_MIGRATION_CONFLICT');
      if(guard()!==true||!keyGuards.every(g=>g()===true))throw Error('SCOPE_CHANGED');
      store.clear();for(const row of after)store.add(assertEnvelope(row,channel,row.scope));
      meta.add({id:MARKER,format:1,channel,migratedRows:after.length});
     }catch(e){abort(e)}
    };
   }catch(e){abort(e)}
  };
  req.onsuccess=()=>{req.result.close();if(abandoned)return;if(!upgraded){reject(Error('JOURNAL_MIGRATION_CONFLICT'));return}resolve({already:false,count:after.length})};
 });
}
export async function migrateRequestJournal({indexedDB:idb=globalThis.indexedDB,databaseName,channel,keyFor,guard,guardFor=()=>()=>true}){
 if(!idb||typeof databaseName!=='string'||!databaseName||!domains.has(channel)||typeof keyFor!=='function'||typeof guard!=='function'||typeof guardFor!=='function'||guard()!==true)throw Error('JOURNAL_MIGRATION_CONFIG');
 let db;
 try{db=await connect(idb,databaseName,1,{initialize:true})}catch(e){
  if(e?.name!=='VersionError')throw e;
  db=await connect(idb,databaseName,2);
  try{const rows=await snapshot(db,channel,true);if(guard()!==true)throw Error('SCOPE_CHANGED');return {already:true,count:rows.length}}finally{db.close()}
 }
 let rows;
 try{rows=await snapshot(db,channel,false)}finally{db.close()}
 const before=canonicalDraftJSON(rows),after=[],keyGuards=[];
 for(const row of rows){
  if(guard()!==true)throw Error('SCOPE_CHANGED');
  const s=plain(row,channel,row.scope),request={operation:'seal',keyId:null,requestId:row.key},keyGuard=guardFor(s,{requests:[request]});
  const c=await keyFor(s,request);
  const envelope=await seal(row,channel,c);
  if(!same(row,await unseal(envelope,channel,row.scope,c)))throw Error('JOURNAL_MIGRATION_ROUNDTRIP');
  if(keyGuard()!==true)throw Error('KEY_SESSION_CHANGED');
  after.push(envelope);keyGuards.push(keyGuard);
 }
 return upgrade(idb,databaseName,channel,before,after,guard,keyGuards);
}
export function encryptedRequestOutbox({indexedDB:idb=globalThis.indexedDB,databaseName,channel,keyFor,guardFor=()=>()=>true}){
 if(!idb||typeof databaseName!=='string'||!databaseName||!domains.has(channel)||typeof keyFor!=='function'||typeof guardFor!=='function')throw Error('JOURNAL_CONFIG');
 async function transaction(mode,scope,work){
  context(channel,scope);
  const db=await connect(idb,databaseName,2);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction([STORE,META],mode),store=tx.objectStore(STORE),get=store.get(scope),marker=tx.objectStore(META).get(MARKER);let value,error;
   const abort=e=>{error=e;try{tx.abort()}catch{}};
   tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(error||tx.error||Error('JOURNAL_WRITE_ABORT'));tx.onerror=()=>{};
   marker.onsuccess=()=>{try{
    if(marker.result?.channel!==channel||marker.result?.format!==1)throw Error('JOURNAL_MIGRATION_UNKNOWN');
    const current=get.result===undefined?null:assertEnvelope(get.result,channel,scope);
    value=work(current,store);
   }catch(e){abort(e)}};
  })}finally{db.close()}
 }
 const readEnvelope=scope=>transaction('readonly',scope,e=>e);
 function check(guard){if(guard()!==true)throw Error('KEY_SESSION_CHANGED')}
 async function decrypt(e,scope){
  if(e===null)return {row:null,guard:()=>true};
  const s=context(channel,scope),request={operation:'open',keyId:e.keyId,requestId:e.key},guard=guardFor(s,{requests:[request]});
  const c=await keyFor(s,request),row=await unseal(e,channel,scope,c);check(guard);
  return {row,guard};
 }
 async function encrypt(row){
  const s=plain(row,channel,row.scope),request={operation:'seal',keyId:null,requestId:row.key},guard=guardFor(s,{requests:[request]});
  const c=await keyFor(s,request),envelope=await seal(row,channel,c);check(guard);
  return {envelope,guard};
 }
 async function read(scope){const result=await decrypt(await readEnvelope(scope),scope);check(result.guard);return result.row}
 async function reserve(row,guard){
  plain(row,channel,row.scope);
  if(typeof guard!=='function'||guard()!==true)throw Error('SCOPE_CHANGED');
  const existing=await readEnvelope(row.scope);
  if(existing){const restored=await decrypt(existing,row.scope);check(restored.guard);if(guard()!==true)throw Error('SCOPE_CHANGED');return restored.row}
  const sealed=await encrypt(row);
  const committed=await transaction('readwrite',row.scope,(current,store)=>{
   if(guard()!==true)throw Error('SCOPE_CHANGED');
   check(sealed.guard);
   if(current)return current;
   store.add(sealed.envelope);return sealed.envelope;
  });
  const result=await decrypt(committed,row.scope);
  check(result.guard);if(guard()!==true)throw Error('SCOPE_CHANGED');return result.row;
 }
 async function clear(scope,key){
  if(!valid(key))throw Error('JOURNAL_IDENTITY');
  const previous=await readEnvelope(scope);if(!previous||previous.key!==key)return false;
  const restored=await decrypt(previous,scope);
  return transaction('readwrite',scope,(current,store)=>{
   check(restored.guard);
   if(!equalEnvelope(previous,current))return false;
   store.delete(scope);return true;
  });
 }
 async function rotate(scope,key,guard){
  if(!valid(key)||typeof guard!=='function'||guard()!==true)throw Error('SCOPE_CHANGED');
  const previous=await readEnvelope(scope);if(!previous||previous.key!==key)throw Error('JOURNAL_MISSING');
  const restored=await decrypt(previous,scope),sealed=await encrypt(restored.row);
  return transaction('readwrite',scope,(current,store)=>{
   if(guard()!==true)throw Error('SCOPE_CHANGED');
   if(!equalEnvelope(previous,current))throw Error('JOURNAL_CHANGED');
   check(restored.guard);check(sealed.guard);
   if(previous.keyId!==sealed.envelope.keyId)store.put(sealed.envelope);
   return restored.row;
  });
 }
 return {read,reserve,clear,rotate};
}
