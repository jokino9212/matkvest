import {createSchoolBlockQueue,indexedSchoolOutbox,SCHOOL_TOPICS,STAGES,COUNTS,PASS,stageOf,stageAllowed,isColumn,validateQuestion,isFraction,maxDigits,gradeOf} from './school_block_queue.mjs?v=299';
import {columnView,readColumnCells,moveColumnCell,normalizeColumnCell} from './column_training.mjs?v=299';
import {fractionView,readFractionCells} from './fraction_training.mjs?v=299';
// Shared school trainer; no calls to legacy reward or save routines.
export function createTableTraining({api,store,mode,emit,sessionGet,sessionSet}){
 const db=indexedSchoolOutbox(),queue=createSchoolBlockQueue({api,store,outbox:db});
 const bindingKey='mk95-table-binding',openKey='mk95-table-open',eventKey='mk95-auth-change';
 let row=null,error='',busy=false,generation=0,chain=Promise.resolve(),syncing=false,refreshing=false,retry=null;
 const epoch=()=>{try{return localStorage.getItem(eventKey)||''}catch{return null}};
 const readJSON=key=>{try{return JSON.parse(sessionGet(key)||'null')}catch{return null}};
 const ready=()=>{const s=store.read();return mode()==='server'&&s.status==='ready'&&s.user?.role==='student'&&s.snapshot?.profile.id===s.selectedId&&!store.logoutPending()?{owner:s.user.id,profile:s.selectedId,epoch:epoch()}:null};
 const scope=()=>{if(mode()!=='server'||store.logoutPending())return null;const r=ready();if(r)return r;
  if(store.read().status!=='offline'||navigator.onLine)return null;
  const cached=readJSON(bindingKey);return cached&&cached.epoch!==null&&cached.epoch===epoch()?cached:null;};
 const owns=(r,sc=scope())=>!!r&&!!sc&&r.owner===sc.owner&&r.profile===sc.profile;
 const notify=()=>emit();
 const visible=()=>owns(row)&&sessionGet(openKey)===row.key;
 const catalogue=()=>{
  const progress=store.read().snapshot?.progress.course_progress||[];
  return Object.entries(SCHOOL_TOPICS).map(([topic,title])=>{
   const best=STAGES.map((_,i)=>Math.max(0,...progress.filter(r=>r.course_key===topic&&r.stage_index===i).map(r=>Number(r.best_score)||0)));
   return {topic,title,grade:gradeOf(topic),stages:STAGES.map((label,stage)=>({label,stage,enabled:!!ready()&&stageAllowed(best,stage),best:best[stage]}))};
  });
 };
 const read=()=>{
  const r=visible()?row:null;
  if(!r)return {enabled:!!scope(),open:false,busy,error,catalogue:catalogue()};
  const items=r.draft||[],item=items[r.index],question=r.questions[r.index];
  const done=items.filter(x=>x.solved||x.skipped).length,correct=items.filter(x=>x.solved&&x.checks.length===1).length;
  const finished=r.status!=='draft',confirmed=r.status==='confirmed';
  const summary=confirmed?r.receipt?.summary:{correct,corrected:items.filter(x=>x.solved&&x.checks.length>1).length,skipped:items.filter(x=>x.skipped).length,passed:correct>=PASS[stageOf(r)]||(stageOf(r)===2&&correct===7&&items.some(x=>x.solved&&x.checks.length>1)),pending:true};
  return {enabled:true,open:true,busy,error,status:r.status,revision:r.revision,index:r.index,model:{title:gradeOf(r.topic)+' класс · '+SCHOOL_TOPICS[r.topic],rootId:'mk95-table-practice',questionId:'mk95-table-question',column:isColumn(r.topic),pauseOnly:true,progress:{stage:STAGES[stageOf(r)],icon:'',done,total:r.count,correct},finished,summary,exercise:finished?{}:isColumn(r.topic)?columnView(r.topic,question,item,busy):isFraction(r.topic)?fractionView(question,item,busy):{a:question.a,b:question.b,prompt:question.expression,maxDigits:maxDigits(r.topic),placeValues:question.place_values,choices:question.choices?.map(value=>({label:String(question.choice_labels?.[value]??value),selected:item.answer===String(value),disabled:item.solved,className:'btn soft'+(item.answer===String(value)&&!item.solved&&item.feedback?.startsWith('Проверь')?' school-choice-wrong':'')})),solution:item.solved?question.steps:undefined,answer:item.answer,readOnly:item.solved,disabled:busy,wrong:!item.solved&&item.feedback?.startsWith('Проверь'),feedback:item.feedback||'',primaryLabel:item.solved?'Далее':'Проверить',nextReady:item.solved,hideSkip:item.solved}}};
 };
 function pause(){sessionSet(openKey,null);row=null;error='';generation++;notify();}
 async function load(){
  const sc=scope(),token=++generation;if(!sc){row=null;notify();return;}
  const key=sessionGet(openKey);
  const rows=await db.list(sc.owner,sc.profile);
  if(token!==generation||!scope()||!owns({owner:sc.owner,profile:sc.profile}))return;
  row=rows.find(x=>x.key===key)||null;notify();
 }
 function onAccount(){
  const sc=ready();if(sc)sessionSet(bindingKey,JSON.stringify(sc));
  if(!scope()){row=null;generation++;notify();return;}
  void load().catch(()=>{error='Не удалось открыть черновик.';notify()});
  if(sc)void sync();
 }
 function device(){let id=localStorage.getItem('mk95-table-device');if(!id){id=crypto.randomUUID();localStorage.setItem('mk95-table-device',id);}return id;}
 async function open(topic='g4:table',stage=0){
  if(!Object.hasOwn(SCHOOL_TOPICS,topic)||!Number.isInteger(stage)||stage<0||stage>2)return;
  const sc=scope();if(!sc||busy)return;busy=true;error='';notify();
  try{
   let rows=await db.list(sc.owner,sc.profile);
   if(!owns({owner:sc.owner,profile:sc.profile}))return;
   let found=rows.find(r=>r.status==='draft'||r.status==='pending'||r.status==='blocked');
   if(found&&(found.topic!==topic||stageOf(found)!==stage)){error='Сначала завершите сохранённый блок: '+SCHOOL_TOPICS[found.topic]+' · '+STAGES[stageOf(found)];}
   if(!found&&!ready())found=rows.find(r=>r.topic===topic&&stageOf(r)===stage&&r.status==='confirmed');
   if(!found){
    if(!ready()){error='Для нового блока необходимо подключение к серверу.';return;}
    const entry=catalogue().find(x=>x.topic===topic);
    if(!entry?.stages[stage]?.enabled){error='Сначала пройдите предыдущую ступень.';return;}
    const actor=await api.resumeSession();if(actor.id!==sc.owner||!ready()||!owns({owner:sc.owner,profile:sc.profile}))return;
    const response=await api.request('POST','/student/profiles/'+encodeURIComponent(sc.profile)+'/offline-school',{body:{device:device(),grade:gradeOf(topic),topic,unavailable_permits:rows.filter(r=>r.status!=='confirmed').map(r=>r.start.permit).filter(Boolean).slice(-10)}});
    if(!ready()||!owns({owner:sc.owner,profile:sc.profile}))return;
    const prepared=response.topics?.[topic];
    if(!stageAllowed(prepared?.best,stage)){error='Сначала пройдите предыдущую ступень.';return;}
    const pack=prepared?.packs?.find(p=>p.stage===stage&&p.topic_id===topic);
    if(!pack||pack.questions.length!==COUNTS[stage])throw Error('INVALID_PACK');
    if(isColumn(topic))pack.questions.forEach((question,i)=>columnView(topic,validateQuestion(topic,question,pack.column_keys?.[i])));
    const permit=response.permits?.find(p=>Date.parse(p.expires_at)>Date.parse(response.server_time)&&!rows.some(r=>r.start.permit===p.id));
    if(!pack.full&&!permit){error='Нет доступных тренировок Free. Попробуйте позже.';return;}
    try{found=await queue.begin({pack,startedAt:response.server_time,permit:permit?.id});}
    catch(e){rows=await db.list(sc.owner,sc.profile);found=rows.find(r=>r.status==='draft'||r.status==='pending');if(!found)throw e;}
   }
   if(!owns(found))return;
   sessionSet(openKey,found.key);row=found;
   if(row.status==='pending')void sync();
  }catch(e){error='Не удалось подготовить блок. Проверьте подключение.';}
  finally{busy=false;notify();}
 }
 function action(kind,event){
  if(!visible()||row.status!=='draft')return;
  const column=isColumn(row.topic),fraction=isFraction(row.topic);
  if(kind==='input'&&(column||event?.type!=='input'||(fraction?!event.target?.dataset?.mk95Fraction:event.target?.id!=='fin')))return;
  if(kind==='input'&&fraction)event.target.value=event.target.value.replace(/[^0-9]/g,'').slice(0,6);
  if((kind==='cell'||kind==='dot')&&(!column||!normalizeColumnCell(event,kind==='dot')))return;
  if(kind==='move'){if(column)moveColumnCell(event.event,event.el);return;}
  const key=row.key,index=row.index;
  const question=row.questions[index];
  if(kind==='pick'&&(!question.choices||!Number.isInteger(event)||!question.choices.hasOwnProperty(event)))return;
  const value=column?readColumnCells():fraction?readFractionCells():kind==='pick'?String(question.choices[event]):kind==='input'?event.target.value:document.querySelector('#mk95-table-question #fin')?.value??row.draft[index].answer;
  if(kind==='skip'&&!window.confirm('Пропустить задание?'))return;
  chain=chain.then(async()=>{
   if(!visible()||row.key!==key||row.index!==index||row.status!=='draft')return;
   let op=kind==='cell'||kind==='dot'?'input':kind==='pick'?'check':kind==='primary'?(row.draft[index].solved?'advance':'check'):kind;
   try{const next=await db.act(key,row.revision,op,value);if(owns(next)&&sessionGet(openKey)===key){row=next;error='';notify();}if(next.status==='pending')void sync();}
   catch(e){error='Черновик изменён в другой вкладке или не сохранён. Откройте его повторно.';await load().catch(()=>{});notify();}
  }).catch(()=>{error='Не удалось сохранить ответ.';notify()});
 }
 async function sync(){
  if(syncing||refreshing||!ready()||!navigator.onLine)return;
  syncing=true;clearTimeout(retry);
  try{
   const sent=await queue.flush();await load();
   if(sent.length&&ready()){refreshing=true;try{await store.select(ready().profile);}finally{refreshing=false;}}
   const sc=ready();if(sc&&(await db.list(sc.owner,sc.profile)).some(r=>r.status==='pending'))retry=setTimeout(()=>void sync(),4000);
  }catch{if(ready())retry=setTimeout(()=>void sync(),4000);}
  finally{syncing=false;notify();}
 }
 return {read,open,pause,action,onAccount,sync};
}
