// Isolated v307 queue. A server-issued pack never changes actor or learning context.
import {SCHOOL_TOPICS,COUNTS,validateQuestion,gradeOf,indexedSchoolOutbox} from '../backend95-next/school_block_queue.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valid=x=>typeof x==='string'&&uuid.test(x);
export function contextOf(s){
 if(!s||!valid(s.owner)||!valid(s.profile)||!['student','tutor'].includes(s.role))return null;
 const kind=s.kind;
 if(kind==='lesson'&&s.role==='tutor'&&valid(s.lesson)&&!s.assignment)return {owner:s.owner,profile:s.profile,role:s.role,kind,lesson:s.lesson};
 if(s.role==='student'&&!s.lesson&&(kind==='practice'&&!s.assignment||kind==='homework'&&valid(s.assignment)))return {owner:s.owner,profile:s.profile,role:s.role,kind,...(kind==='homework'?{assignment:s.assignment}:{})};
 return null;
}
const same=(a,b)=>JSON.stringify(contextOf(a))===JSON.stringify(contextOf(b))&&!!contextOf(a);
const key=(s,pack)=>JSON.stringify([s.owner,s.profile,pack]);
export function createV307Queue({api,scope,outbox,online=()=>navigator.onLine}){
 const active=new Map();
 const current=()=>{const s=scope();return contextOf(s)&&s.ticket!==undefined?s:null};
 const still=s=>{const c=current();return !!c&&c.ticket===s.ticket&&same(c,s)};
 async function authorized(s){
  if(!online()||!still(s))throw Error('SCOPE_CHANGED');
  const actor=await api.resumeSession();
  if(!still(s)||!online()||actor?.id!==s.owner||actor.role!==s.role)throw Error('SCOPE_CHANGED');
 }
 async function rows(s){return outbox.list(s.owner,s.profile)}
 async function list(){const s=current();if(!s)return [];const result=await rows(s);if(!still(s))return [];return result.filter(r=>same(r.context,s));}
 async function prepare(topic,stage,device){
  const s=current();if(!s||!Object.hasOwn(SCHOOL_TOPICS,topic)||!Number.isInteger(stage)||stage<0||stage>2||!valid(device))throw Error('INVALID_START');
  const ctx=contextOf(s);
  // Before any new opening, prove the live actor and profile/lesson entitlement.
  await authorized(s);
  if(ctx.kind==='lesson'){
   const access=await api.lesson(ctx.profile);
   if(access?.allowed!==true||access.lesson?.id!==ctx.lesson)throw Error('SCOPE_CHANGED');
  }else{
   const profiles=await api.profiles();
   if(!Array.isArray(profiles)||!profiles.some(x=>x?.id===ctx.profile))throw Error('SCOPE_CHANGED');
  }
  if(!still(s)||!online())throw Error('SCOPE_CHANGED');
  let all=await rows(s);if(!still(s)||!online())throw Error('SCOPE_CHANGED');
  const open=all.find(r=>['draft','pending','blocked'].includes(r.status));
  if(open){if(!same(open.context,ctx)||open.topic!==topic||open.stage!==stage)throw Error('OTHER_BLOCK_ACTIVE');return open;}
  // Existing confirmed homework is not started again; ordinary practice can start a fresh pack.
  const done=all.find(r=>ctx.kind==='homework'&&same(r.context,ctx)&&r.status==='confirmed');if(done)return done;
  await authorized(s);
  const unavailable=all.map(r=>r.start?.permit).filter(valid).slice(-10);
  let response;
  if(ctx.kind==='homework')response=await api.prepareHomework(ctx.profile,ctx.assignment,device,unavailable);
  else if(ctx.kind==='lesson')response=await api.prepareLesson(ctx.profile,ctx.lesson,device,gradeOf(topic),topic,unavailable);
  else response=await api.request('POST','/student/profiles/'+ctx.profile+'/offline-school',{body:{device,grade:gradeOf(topic),topic,unavailable_permits:unavailable}});
  if(!still(s))throw Error('SCOPE_CHANGED');
  if(ctx.kind==='homework'&&response.assignment_id!==ctx.assignment)throw Error('INVALID_ASSIGNMENT');
  const pack=ctx.kind==='homework'?response.pack:response.topics?.[topic]?.packs?.find(p=>p.stage===stage);
  const startedAt=response.server_time,started=Date.parse(startedAt),expires=Date.parse(pack?.expires_at);
  if(!valid(pack?.id)||pack.topic_id!==topic||pack.stage!==stage||typeof pack.full!=='boolean'||!Array.isArray(pack.questions)||pack.questions.length!==COUNTS[stage]||!Number.isFinite(started)||!Number.isFinite(expires)||started>=expires)throw Error('INVALID_PACK');
  all=await rows(s);if(!still(s))throw Error('SCOPE_CHANGED');
  const existing=all.find(r=>r.pack===pack.id);
  if(existing){if(!same(existing.context,ctx)||existing.topic!==topic||existing.stage!==stage)throw Error('PACK_CONTEXT_CONFLICT');return existing;}
  const permit=response.permits?.find(p=>valid(p.id)&&Date.parse(p.expires_at)>started&&!all.some(r=>r.start?.permit===p.id));
  if(!pack.full&&!permit)throw Error('FREE_QUOTA');
  const questions=pack.questions.map((q,i)=>validateQuestion(topic,q,pack.column_keys?.[i]));
  const row={key:key(s,pack.id),owner:s.owner,profile:s.profile,context:ctx,pack:pack.id,topic,stage,count:questions.length,start:{started_at:startedAt,...(!pack.full?{permit:permit.id}:{})},status:'draft',questions,index:0,revision:0,draft:questions.map(()=>({answer:'',cells:{},checks:[],skipped:false,solved:false}))};
  const inserted=await outbox.insert(row);if(!still(s)||!same(inserted.context,ctx))throw Error('SCOPE_CHANGED');return inserted;
 }
 async function act(row,kind,value){
  const s=current();if(!s||!row||!same(row.context,s)||row.owner!==s.owner||row.profile!==s.profile||!valid(row.pack)||row.key!==key(s,row.pack))throw Error('SCOPE_CHANGED');
  const next=await outbox.act(row.key,row.revision,kind,value);if(!still(s)||!next||!same(next.context,s)||next.owner!==s.owner||next.profile!==s.profile||next.pack!==row.pack||next.key!==row.key)throw Error('SCOPE_CHANGED');return next;
 }
 async function flush(){
  const s=current();if(!s||!online())return [];
  const ctx=contextOf(s),k=JSON.stringify(ctx);if(active.has(k))return active.get(k);
  const run=(async()=>{
   try{await authorized(s)}catch{return []}
   const sent=[];
   for(const row of await rows(s)){
    if(!still(s)||!online())break;
    if(row.status!=='pending'||!same(row.context,ctx))continue;
    try{
     // Re-verify cookie actor immediately before each PUT. No path is taken from storage.
     await authorized(s);
     const receipt=await api.submitBlock(ctx.profile,row.pack,row.body,ctx.kind==='lesson'?ctx.lesson:null);
     if(receipt?.id!==row.pack||receipt.status!=='finished')throw Error('INVALID_RECEIPT');
     // A confirmed receipt may settle its original immutable row even if the UI changed.
     await outbox.settle(row.key,'confirmed',receipt);sent.push(row.key);
    }catch(error){if([409,422].includes(error.status)&&still(s))await outbox.settle(row.key,'blocked',{code:error.code||'REJECTED'});break;}
   }
   return sent;
  })().finally(()=>active.delete(k));active.set(k,run);return run;
 }
 return {prepare,act,list,flush};
}
export function v307Outbox(){return indexedSchoolOutbox(globalThis.indexedDB,'matkvest-v307-context-outbox')}
