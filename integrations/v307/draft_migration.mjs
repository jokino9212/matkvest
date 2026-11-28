// Candidate upgrade of the v1 blocks store; never runs on application startup.
// No network or asynchronous cryptography is performed inside an IndexedDB transaction.
import {assertDraftEnvelope,canonicalDraftJSON,sealDraft,openDraft} from './draft_cipher.mjs';
const STORE='blocks',META='v307DraftMigration',MARKER='encrypted-v1';
function openExisting(idb,name,version){
 return new Promise((resolve,reject)=>{
  const r=idb.open(name,version);let abandoned=false;
  r.onblocked=()=>{abandoned=true;reject(Error('DRAFT_MIGRATION_BLOCKED'))};
  r.onupgradeneeded=()=>{r.transaction.abort();reject(Error('DRAFT_DB_VERSION'))};
  r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{if(abandoned){r.result.close();return}r.result.onversionchange=()=>r.result.close();resolve(r.result)};
 });
}
function readSnapshot(db,encrypted=false){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(encrypted?[STORE,META]:[STORE],'readonly');
  const rows=tx.objectStore(STORE).getAll(),marker=encrypted?tx.objectStore(META).get(MARKER):null;
  tx.oncomplete=()=>resolve({rows:rows.result,marker:marker?.result});
  tx.onabort=()=>reject(tx.error||Error('DRAFT_READ_ABORT'));
  tx.onerror=()=>reject(tx.error||Error('DRAFT_READ_FAILED'));
 });
}
async function alreadyMigrated(idb,name){
 const db=await openExisting(idb,name,2);
 try{
  const {rows,marker}=await readSnapshot(db,true);
  if(marker?.id!==MARKER||marker.format!==1)throw Error('DRAFT_MIGRATION_UNKNOWN');
  for(const row of rows)assertDraftEnvelope(row);
  return {already:true,count:rows.length};
 }finally{db.close()}
}
function commitUpgrade(idb,name,snapshot,envelopes){
 return new Promise((resolve,reject)=>{
  const r=idb.open(name,2);let failure,abandoned=false,upgraded=false;
  const abort=e=>{failure=e;try{r.transaction.abort()}catch{}};
  r.onblocked=()=>{abandoned=true;reject(Error('DRAFT_MIGRATION_BLOCKED'))};
  r.onerror=()=>reject(failure||r.error||Error('DRAFT_MIGRATION_ABORT'));
  r.onupgradeneeded=event=>{
   if(abandoned){abort(Error('DRAFT_MIGRATION_BLOCKED'));return}
   if(event.oldVersion!==1){abort(Error('DRAFT_DB_VERSION'));return}
   upgraded=true;
   try{
    const tx=r.transaction,store=tx.objectStore(STORE),meta=r.result.createObjectStore(META,{keyPath:'id'});
    const get=store.getAll();
    get.onsuccess=()=>{
     try{
      // Detect any legacy change during crypto/key retrieval, including insertion and deletion.
      if(canonicalDraftJSON(get.result)!==snapshot)throw Error('DRAFT_MIGRATION_CONFLICT');
      store.clear();
      for(const row of envelopes)store.add(assertDraftEnvelope(row));
      meta.add({id:MARKER,format:1,migratedRows:envelopes.length});
     }catch(e){abort(e)}
    };
   }catch(e){abort(e)}
  };
  r.onsuccess=()=>{
   r.result.close();
   if(abandoned)return;
   if(!upgraded){reject(Error('DRAFT_MIGRATION_CONFLICT'));return}
   resolve({already:false,count:envelopes.length});
  };
 });
}
export async function migrateDraftStore({indexedDB:idb=globalThis.indexedDB,databaseName,keyFor}){
 if(!idb||typeof databaseName!=='string'||!databaseName||typeof keyFor!=='function')throw Error('DRAFT_MIGRATION_CONFIG');
 let db;
 try{db=await openExisting(idb,databaseName,1)}
 catch(e){if(e?.name==='VersionError')return alreadyMigrated(idb,databaseName);throw e}
 let rows,snapshot;
 try{({rows}=await readSnapshot(db));snapshot=canonicalDraftJSON(rows)}finally{db.close()}
 const envelopes=[];
 // All rows must be encrypted and authenticated before attempting the destructive phase.
 for(const row of rows){
  const credential=await keyFor(structuredClone(row.context));
  const envelope=await sealDraft(row,credential);
  const reopened=await openDraft(envelope,credential,row.context,row.revision);
  if(canonicalDraftJSON(reopened)!==canonicalDraftJSON(row))throw Error('DRAFT_MIGRATION_ROUNDTRIP');
  envelopes.push(envelope);
 }
 return commitUpgrade(idb,databaseName,snapshot,envelopes);
}
