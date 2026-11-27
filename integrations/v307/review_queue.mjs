// Same durable journal pattern as economy and quick practice; one review write
// per actor/profile. No answer keys, credentials or profile counters persisted.
import {economyOutbox} from './economy_queue.mjs';
import {SCHOOL_TOPICS} from '../backend95-next/school_block_queue.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,valid=x=>typeof x==='string'&&uuid.test(x);
const same=(a,b)=>a?.ticket===b?.ticket&&a?.owner===b?.owner&&a?.profile===b?.profile&&a?.role===b?.role;
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const noWrite=new Set(['REVIEW_EMPTY','REVIEW_MIXED_REQUIRES_BOTH','ACTIVE_REVIEW_EXISTS','REVIEW_REVISION_CONFLICT','REVIEW_ITEM_CLOSED','REVIEW_ITEM_OPEN','LEGACY_REVIEW_REQUIRED','REVIEW_QUESTION_UNAVAILABLE','TOPIC_FULL_REQUIRED','TRAINING_QUOTA_EXCEEDED','VALIDATION_ERROR','ANSWER_INVALID','COLUMN_CELLS_INVALID','SCHOOL_CHOICE_INVALID','COMPARISON_CHOICE_INVALID','EQUATION_CHOICE_INVALID','ORDER_CHOICE_INVALID']);
function checkBody(b){
 if(b?.kind==='start'){
  const p=b.body;
  if(['errors','control'].includes(p?.mode)&&['4','5','mixed'].includes(p.grade)&&Number.isInteger(p.count)&&(p.mode==='errors'?p.count>=1&&p.count<=15&&(p.topic===null||Object.hasOwn(SCHOOL_TOPICS,p.topic)):[10,15,20].includes(p.count)&&p.topic===null))return;
 }
 if(b?.kind==='step'&&valid(b.review)){
  const p=b.body;
  if(Number.isSafeInteger(p?.revision)&&p.revision>=0&&['save','check','skip','advance','abandon'].includes(p.action)&&p.cells&&typeof p.cells==='object'&&!Array.isArray(p.cells)&&Object.keys(p.cells).length<=100&&Object.entries(p.cells).every(([k,v])=>/^[a-zA-Z0-9]{1,16}:[0-9]{1,2}$/.test(k)&&typeof v==='string'&&v.length<=64))return;
 }
 throw Error('INVALID_REVIEW_REQUEST');
}
export function reviewOutbox(){return economyOutbox(globalThis.indexedDB,'matkvest-v307-review-outbox')}
export function createReviewQueue({api,scope,store=reviewOutbox(),online=()=>navigator.onLine,makeId=()=>crypto.randomUUID()}){
 const get=()=>{const s=scope();if(s?.role!=='student'||!valid(s.owner)||!valid(s.profile))throw Error('REVIEW_SCOPE');return s};
 const key=s=>s.owner+':'+s.profile;
 async function auth(s){if(!online()||!same(s,scope()))throw Error('REVIEW_SCOPE');const actor=await api.resumeSession();if(!online()||!same(s,scope())||actor?.id!==s.owner||actor.role!=='student')throw Error('REVIEW_SCOPE');}
 async function pending(){const s=get(),r=await store.read(key(s));if(!same(s,scope()))throw Error('REVIEW_SCOPE');return r;}
 async function submit(body){
  checkBody(body);const s=get();await auth(s);const k=key(s),row=await store.reserve({scope:k,owner:s.owner,profile:s.profile,key:makeId(),body:structuredClone(body)});
  if(row.owner!==s.owner||row.profile!==s.profile||!valid(row.key)||!equal(row.body,body))throw Error('PENDING_OTHER_OPERATION');
  await auth(s);let receipt;
  try{receipt=body.kind==='start'?await api.reviewStart(s.profile,row.body.body,row.key):await api.reviewStep(s.profile,row.body.review,row.body.body,row.key);}
  catch(e){if(same(s,scope())&&noWrite.has(e.code)&&[403,409,422,429].includes(e.status))await store.clear(k,row.key);throw e;}
  if(!valid(receipt?.id)||!Number.isSafeInteger(receipt.revision)||!['active','finished','abandoned'].includes(receipt.status)||body.kind==='start'&&(receipt.mode!==body.body.mode||receipt.revision!==0||receipt.status!=='active')||body.kind==='step'&&(receipt.id!==body.review||receipt.revision!==body.body.revision+1))throw Error('INVALID_REVIEW_RECEIPT');
  await store.clear(k,row.key);if(!same(s,scope()))throw Error('REVIEW_SCOPE');return receipt;
 }
 return {pending,submit};
}
