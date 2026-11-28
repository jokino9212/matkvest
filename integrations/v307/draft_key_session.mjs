// Client-only session boundary for an eventual verified server key adapter.
// fetchKey/fetchFloor are injected trusted callbacks, NOT a proposed HTTP API.
// Offline use is opt-in via explicit bounded leases; no key or floor is persisted.
import {contextOf} from './training_queue.mjs';
import {canonicalDraftJSON} from './draft_cipher.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valid=x=>typeof x==='string'&&uuid.test(x);
const keyIdOk=x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(x);
const channels=new Set(['quick','review','economy']);
function context(s){
 if(s?.channel!==undefined){
  if(!channels.has(s.channel)||s.role!=='student'||!valid(s.owner)||!valid(s.profile)||s.scope!==s.owner+':'+s.profile)throw Error('KEY_SCOPE');
  return {channel:s.channel,owner:s.owner,profile:s.profile,role:'student',scope:s.scope};
 }
 const c=contextOf(s);if(!c)throw Error('KEY_SCOPE');return c;
}
function requestOf(c,r){
 if(!r||!['open','seal'].includes(r.operation)||(r.operation==='open'?!keyIdOk(r.keyId):r.keyId!==null))throw Error('KEY_REQUEST');
 const field=c.channel?'requestId':'pack';
 if(!valid(r[field])||Object.keys(r).some(k=>!['operation','keyId',field].includes(k)))throw Error('KEY_REQUEST');
 return {operation:r.operation,keyId:r.keyId,[field]:r[field]};
}
function credentialOf(c,r){
 const k=c?.key,usage=r.operation==='open'?'decrypt':'encrypt';
 if(!keyIdOk(c?.keyId)||r.operation==='open'&&c.keyId!==r.keyId||!k||k.type!=='secret'||k.extractable!==false||k.algorithm?.name!=='AES-GCM'||k.algorithm.length!==256||!k.usages?.includes(usage))throw Error('KEY_INVALID');
 return {keyId:c.keyId,key:k};
}
const same=(a,b)=>canonicalDraftJSON(a)===canonicalDraftJSON(b);
export function createDraftKeySession({scope,fetchKey,fetchFloor,online=()=>navigator.onLine,now=()=>performance.now(),maxOfflineMs=0}){
 if([scope,fetchKey,fetchFloor,online,now].some(f=>typeof f!=='function')||!Number.isSafeInteger(maxOfflineMs)||maxOfflineMs<0)throw Error('KEY_CONFIG');
 let generation=0,active=null,lastClock=-Infinity;
 const keys=new Map(),floors=new Map(),highestFloor=new Map();
 function revokeGrants(){generation++;keys.clear();floors.clear()}
 function invalidate(){revokeGrants();active=null;highestFloor.clear()}
 function clock(){
  const n=now();
  if(!Number.isFinite(n)||n<lastClock){invalidate();throw Error('KEY_CLOCK')}
  lastClock=n;return n;
 }
 function current(){
  const s=scope();let c;
  try{c=context(s);if(typeof s.ticket!=='string'&&typeof s.ticket!=='number'||s.ticket===''||typeof s.ticket==='number'&&!Number.isSafeInteger(s.ticket))throw Error('KEY_SCOPE')}
  catch(e){invalidate();throw e}
  if(!active||active.ticket!==s.ticket||!same(active.context,c)){invalidate();active={ticket:s.ticket,context:c}}
  return {generation,ticket:s.ticket,context:c};
 }
 function assertCurrent(token){
  const c=current();
  if(token.generation!==c.generation||token.ticket!==c.ticket||!same(token.context,c.context))throw Error('KEY_SESSION_CHANGED');
  return c;
 }
 function capture(expected){
  const token=current();
  if(!same(token.context,context(expected)))throw Error('KEY_SCOPE');
  return token;
 }
 function ttl(grant,started){
  const n=grant?.offlineForMs;
  if(!Number.isSafeInteger(n)||n<0)throw Error('KEY_LEASE_INVALID');
  // Count from before the request, never extend the server grant by network delay.
  const expires=started+Math.min(n,maxOfflineMs);
  if(!Number.isFinite(expires))throw Error('KEY_LEASE_INVALID');
  return expires;
 }
 function cached(map,k,t){
  const entry=map.get(k);
  if(!entry||t>=entry.expires){map.delete(k);throw Error('KEY_OFFLINE_LEASE_REQUIRED')}
  return entry.value;
 }
 async function keyFor(expected,raw){
  const token=capture(expected),r=requestOf(token.context,raw),k=canonicalDraftJSON(r),started=clock();
  if(!online())return cached(keys,k,started);
  // An online denial or transport failure is never replaced with a cached key.
  keys.delete(k);
  let grant;
  try{grant=await fetchKey(structuredClone(token.context),r);assertCurrent(token)}
  catch(e){if(token.generation===generation)revokeGrants();throw e}
  try{
   if(!online())throw Error('KEY_CONNECTION_CHANGED');
   const value=credentialOf(grant?.credential,r),expires=ttl(grant,started);
   assertCurrent(token);if(clock()<expires)keys.set(k,{value,expires});
   return value;
  }catch(e){if(token.generation===generation)revokeGrants();throw e}
 }
 async function floorFor(expected,pack){
  const token=capture(expected);
  if(token.context.channel||!valid(pack))throw Error('KEY_REQUEST');
  const started=clock();
  if(!online())return cached(floors,pack,started);
  floors.delete(pack);
  let grant;
  try{grant=await fetchFloor(structuredClone(token.context),pack);assertCurrent(token)}
  catch(e){if(token.generation===generation)revokeGrants();throw e}
  try{
   if(!online())throw Error('KEY_CONNECTION_CHANGED');
   const value=grant?.minimum;
   if(!Number.isSafeInteger(value)||value<0)throw Error('KEY_FLOOR_INVALID');
   const expires=ttl(grant,started);assertCurrent(token);
   // A concurrent, older response must never lower a floor already observed in this session.
   if(value<(highestFloor.get(pack)??0))throw Error('KEY_FLOOR_REGRESSION');
   highestFloor.set(pack,value);
   if(clock()<expires)floors.set(pack,{value,expires});
   return value;
  }catch(e){if(token.generation===generation)revokeGrants();throw e}
 }
 // The caller must use this synchronous guard inside its storage CAS. Revocation
 // invalidates future use, not copies of CryptoKey already returned to a caller.
 function guardFor(expected,{requests=[],pack=null,revision=null}={}){
  const token=capture(expected),required=requests.map(r=>canonicalDraftJSON(requestOf(token.context,r)));
  if(pack!==null&&(!valid(pack)||token.context.channel||!Number.isSafeInteger(revision)||revision<0))throw Error('KEY_REQUEST');
  return ()=>{try{
   assertCurrent(token);const t=clock();
   if(pack!==null&&revision<(highestFloor.get(pack)??0))return false;
   if(!online()){
    for(const r of required)cached(keys,r,t);
    if(pack!==null&&revision<cached(floors,pack,t))return false;
   }
   return true;
  }catch{return false}};
 }
 return {keyFor,floorFor,guardFor,invalidate};
}
