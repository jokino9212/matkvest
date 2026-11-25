import {createSchoolBlockQueue,indexedSchoolOutbox} from './school_block_queue.mjs?v=293';
// Only one pilot topic, stage 0. No calls to legacy state, reward or save routines.
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
 const read=()=>{
  const r=visible()?row:null;
  if(!r)return {enabled:!!scope(),open:false,busy,error};
  const items=r.draft||[],item=items[r.index],question=r.questions[r.index];
  const done=items.filter(x=>x.solved||x.skipped).length,correct=items.filter(x=>x.solved&&x.checks.length===1).length;
  const finished=r.status!=='draft',confirmed=r.status==='confirmed';
  const summary=confirmed?r.receipt?.summary:{correct,corrected:items.filter(x=>x.solved&&x.checks.length>1).length,skipped:items.filter(x=>x.skipped).length,passed:correct>=4,pending:true};
  return {enabled:true,open:true,busy,error,status:r.status,revision:r.revision,index:r.index,model:{title:'4 класс · Таблица умножения',rootId:'mk95-table-practice',questionId:'mk95-table-question',column:false,pauseOnly:true,progress:{stage:'Разминка',icon:'',done,total:r.count,correct},finished,summary,exercise:finished?{}:{a:question.a,b:question.b,answer:item.answer,readOnly:item.solved,disabled:busy,wrong:!item.solved&&item.feedback?.startsWith('Проверь'),feedback:item.feedback||'',primaryLabel:item.solved?'Далее':'Проверить',nextReady:item.solved,hideSkip:item.solved}}};
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
 async function open(){
  const sc=scope();if(!sc||busy)return;busy=true;error='';notify();
  try{
   let rows=await db.list(sc.owner,sc.profile);
   if(!owns({owner:sc.owner,profile:sc.profile}))return;
   let found=rows.find(r=>r.status==='draft'||r.status==='pending'||r.status==='blocked');
   if(!found){
    if(!ready()){error='Для нового блока необходимо подключение к серверу.';return;}
    const actor=await api.resumeSession();if(actor.id!==sc.owner||!ready()||!owns({owner:sc.owner,profile:sc.profile}))return;
    const response=await api.request('POST','/student/profiles/'+encodeURIComponent(sc.profile)+'/offline-school',{body:{device:device(),grade:4,topic:'g4:table',unavailable_permits:rows.map(r=>r.start.permit).filter(Boolean).slice(-10)}});
    if(!ready()||!owns({owner:sc.owner,profile:sc.profile}))return;
    const pack=response.topics?.['g4:table']?.packs?.find(p=>p.stage===0);
    if(!pack||pack.questions.length!==5)throw Error('INVALID_PACK');
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
  if(kind==='input'&&(event?.type!=='input'||event.target?.id!=='fin'))return;
  const key=row.key,index=row.index;
  const value=kind==='input'?event.target.value:document.querySelector('#mk95-table-question #fin')?.value??row.draft[index].answer;
  if(kind==='skip'&&!window.confirm('Пропустить задание?'))return;
  chain=chain.then(async()=>{
   if(!visible()||row.key!==key||row.index!==index||row.status!=='draft')return;
   let op=kind==='primary'?(row.draft[index].solved?'advance':'check'):kind;
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
