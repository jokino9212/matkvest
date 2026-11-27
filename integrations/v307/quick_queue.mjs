// One immutable request per authenticated student/profile. Server draft is authoritative.
// No local rewards; the same request survives lost responses and tab reload.
import {economyOutbox} from './economy_queue.mjs';
const valid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const same=(a,b)=>a?.ticket===b?.ticket&&a?.owner===b?.owner&&a?.profile===b?.profile&&a?.role===b?.role;
const isAnswer=x=>x===null||Number.isSafeInteger(x)&&Math.abs(x)<=1000000;
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const noWrite=new Set(['DRAFT_REVISION_CONFLICT','ACTIVE_DRAFT_EXISTS','TRAINING_ALREADY_FINISHED','ACTIVE_GOAL_EXISTS','GOAL_FACTS_INSUFFICIENT','GOAL_ALREADY_COMPLETED','GOALS_TEST_ONLY','LEGACY_GOAL_REVIEW_REQUIRED','TOPIC_FULL_REQUIRED','TRAINING_QUOTA_EXCEEDED']);
function checkBody(b){
 if(!b||typeof b!=='object')throw Error('BAD_QUICK_REQUEST');
 if(b.kind==='start'&&[5,10].includes(b.count))return;
 if(b.kind==='goal_start'&&['correct','streak','weak','errors'].includes(b.type))return;
 if(b.kind==='goal_cancel'&&valid(b.goal))return;
 if(b.kind==='draft'){
  const d=b.body?.draft;
  if(Number.isSafeInteger(b.body?.base_revision)&&b.body.base_revision>=0&&valid(d?.training_start_id)&&Number.isInteger(d.question_index)&&d.question_index>=1&&d.question_index<=10&&d.answers&&Object.keys(d.answers).length===d.question_index&&Array.from({length:d.question_index},(_,i)=>d.answers[String(i)]).every(x=>typeof x==='string'&&(x===''||String(Number(x))===x&&isAnswer(Number(x)))))return;
 }
 if(b.kind==='finish'&&valid(b.start)&&Number.isSafeInteger(b.body?.draft_revision)&&b.body.draft_revision>=0&&[5,10].includes(b.body?.answers?.length)&&b.body.answers.every(isAnswer))return;
 throw Error('BAD_QUICK_REQUEST');
}
export function quickOutbox(){return economyOutbox(globalThis.indexedDB,'matkvest-v307-quick-outbox')}
export function createQuickQueue({api,scope,store=quickOutbox(),online=()=>navigator.onLine,uuid=()=>crypto.randomUUID()}){
 const get=()=>{const s=scope();if(s?.role!=='student'||!valid(s.owner)||!valid(s.profile))throw Error('QUICK_SCOPE');return s};
 const key=s=>s.owner+':'+s.profile;
 async function auth(s){if(!online()||!same(s,scope()))throw Error('QUICK_SCOPE');const actor=await api.resumeSession();if(!online()||!same(s,scope())||actor?.id!==s.owner||actor.role!=='student')throw Error('QUICK_SCOPE');}
 async function pending(){const s=get();const row=await store.read(key(s));if(!same(s,scope()))throw Error('QUICK_SCOPE');return row;}
 async function submit(body){
  checkBody(body);const s=get();await auth(s);const k=key(s);
  const row=await store.reserve({scope:k,owner:s.owner,profile:s.profile,key:uuid(),body:structuredClone(body)});
  if(row.owner!==s.owner||row.profile!==s.profile||!valid(row.key)||!equal(row.body,body))throw Error('PENDING_OTHER_OPERATION');
  await auth(s);let receipt;
  try{
   if(body.kind==='start')receipt=await api.quickStart(s.profile,body.count,row.key);
   if(body.kind==='draft')receipt=await api.quickSave(s.profile,body.body,row.key);
   if(body.kind==='finish')receipt=await api.quickFinish(s.profile,body.start,body.body);
   if(body.kind==='goal_start')receipt=await api.startGoal(s.profile,body.type,row.key);
   if(body.kind==='goal_cancel')receipt=await api.cancelGoal(s.profile,body.goal);
  }catch(e){if(same(s,scope())&&noWrite.has(e.code)&&[403,409,429].includes(e.status))await store.clear(k,row.key);throw e;}
  if(body.kind==='start'&&!valid(receipt?.id)||body.kind==='draft'&&(receipt?.revision!==body.body.base_revision+1||!equal(receipt.draft,body.body.draft))||body.kind==='finish'&&(receipt?.training_start_id!==body.start||receipt?.status!=='finished'||!receipt.summary)||body.kind==='goal_start'&&(!valid(receipt?.id)||receipt.type!==body.type)||body.kind==='goal_cancel'&&(receipt?.id!==body.goal||receipt.status!=='cancelled'))throw Error('INVALID_QUICK_RECEIPT');
  await store.clear(k,row.key);if(!same(s,scope()))throw Error('QUICK_SCOPE');return receipt;
 }
 return {pending,submit};
}
