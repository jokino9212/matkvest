// R13 candidate. Server key acquisition is deliberately external to this module.
// Never persist the CryptoKey or raw key bytes. This is not a server API contract.
import {contextOf} from './training_queue.mjs';
const utf8=new TextEncoder(), decoder=new TextDecoder('utf-8',{fatal:true});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validId=x=>typeof x==='string'&&uuid.test(x);
const keyIdOk=x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(x);
const revisionOk=x=>Number.isSafeInteger(x)&&x>=0;
const fields=['ciphertext','context','iv','key','keyId','pack','revision','version'].sort().join(',');
export function canonicalDraftJSON(value){
 const seen=new Set();
 function visit(x){
  if(x===null||typeof x==='string'||typeof x==='boolean')return x;
  if(typeof x==='number'&&Number.isFinite(x)&&!Object.is(x,-0))return x;
  if(!x||typeof x!=='object'||seen.has(x))throw Error('DRAFT_NOT_JSON');
  seen.add(x);let result;
  if(Array.isArray(x)){
   if(Object.keys(x).length!==x.length||Array.from({length:x.length},(_,i)=>Object.hasOwn(x,i)).some(v=>!v))throw Error('DRAFT_NOT_JSON');
   result=x.map(visit);
  }else{
   if(Object.getPrototypeOf(x)!==Object.prototype&&Object.getPrototypeOf(x)!==null)throw Error('DRAFT_NOT_JSON');
   result=Object.fromEntries(Object.keys(x).sort().map(k=>[k,visit(x[k])]));
  }
  seen.delete(x);return result;
 }
 return JSON.stringify(visit(value));
}
function identity(row){
 const context=contextOf(row?.context);
 if(!context||canonicalDraftJSON(context)!==canonicalDraftJSON(row.context)||!validId(row.pack)||
    row.key!==JSON.stringify([context.owner,context.profile,row.pack])||!revisionOk(row.revision))throw Error('DRAFT_IDENTITY');
 return {key:row.key,context,pack:row.pack,revision:row.revision};
}
export function validatePlainDraft(row){
 const id=identity(row);
 if(row.owner!==id.context.owner||row.profile!==id.context.profile)throw Error('DRAFT_IDENTITY');
 canonicalDraftJSON(row);return id;
}
function credentials(credential,usage){
 const k=credential?.key;
 if(!keyIdOk(credential?.keyId)||!k||k.type!=='secret'||k.extractable!==false||
    k.algorithm?.name!=='AES-GCM'||k.algorithm.length!==256||!k.usages?.includes(usage))throw Error('DRAFT_KEY_INVALID');
 return k;
}
const aad=e=>utf8.encode(canonicalDraftJSON({version:e.version,keyId:e.keyId,key:e.key,context:e.context,pack:e.pack,revision:e.revision}));
export function assertDraftEnvelope(e){
 if(!e||Object.keys(e).sort().join(',')!==fields||e.version!==1||!keyIdOk(e.keyId)||
    !(e.iv instanceof Uint8Array)||e.iv.length!==12||!(e.ciphertext instanceof Uint8Array)||e.ciphertext.length<16)throw Error('DRAFT_ENVELOPE_INVALID');
 identity(e);return e;
}
export async function sealDraft(row,credential){
 const key=credentials(credential,'encrypt'),id=validatePlainDraft(row);
 const plaintext=utf8.encode(canonicalDraftJSON(row)),iv=crypto.getRandomValues(new Uint8Array(12));
 const envelope={version:1,keyId:credential.keyId,...id,iv};
 try{
  envelope.ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(envelope),tagLength:128},key,plaintext));
  return envelope;
 }finally{plaintext.fill(0)}
}
// minRevision must come from the trusted caller, not from the untrusted envelope.
// This rejects versions below that floor; it cannot detect rollback of the entire local database.
export async function openDraft(envelope,credential,expectedContext,minRevision,expectedPack){
 const e=assertDraftEnvelope(envelope),key=credentials(credential,'decrypt'),scope=contextOf(expectedContext);
 if(!scope||canonicalDraftJSON(scope)!==canonicalDraftJSON(e.context)||credential.keyId!==e.keyId||!validId(expectedPack)||e.pack!==expectedPack)throw Error('DRAFT_SCOPE');
 if(!revisionOk(minRevision)||e.revision<minRevision)throw Error('DRAFT_REVISION_FLOOR');
 let bytes;
 try{bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:e.iv,additionalData:aad(e),tagLength:128},key,e.ciphertext))}
 catch{throw Error('DRAFT_AUTHENTICATION_FAILED')}
 try{
  const row=JSON.parse(decoder.decode(bytes)),id=identity(row);
  if(row.owner!==scope.owner||row.profile!==scope.profile||canonicalDraftJSON(id)!==canonicalDraftJSON(identity(e)))throw Error('DRAFT_IDENTITY');
  return row;
 }finally{bytes.fill(0)}
}
export async function rotateDraft(envelope,previous,next,context,minRevision,expectedPack){
 if(previous?.keyId===next?.keyId||previous?.key===next?.key)throw Error('DRAFT_ROTATION_KEY');
 const row=await openDraft(envelope,previous,context,minRevision,expectedPack);
 return sealDraft(row,next);
}
