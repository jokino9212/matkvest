import {createApp,h,shallowRef} from 'vue';
import {createQuickQueue,QUICK_MODES,validQuickConfig,isQuickTopic,isAnswer,decodeAnswer} from './quick_queue.mjs';
const label={correct:'Правильные ответы',streak:'Серия правильных ответов',weak:'Слабые факты',errors:'Факты с ошибками'};
const titles={'quick:multiplication':'таблица умножения','quick:addition':'сложение','quick:squares':'квадраты чисел','quick:cubes':'кубы чисел'};
const modeNames={all:'Все',to10:'До 10',to20:'До 20','1-10':'1–10','11-20':'11–20','1-5':'1–5','6-10':'6–10'};
const smartNames={all:'Все факты',weak:'Слабые факты',errors:'Факты с ошибками'};
const owns=(x,k)=>!!x&&Object.hasOwn(x,k);
const number=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000;
export function validateQuickQuestion(topic,q){
 if(!q||typeof q!=='object')return false;
 if(topic==='quick:multiplication')return Object.keys(q).length===2&&Number.isInteger(q.left)&&Number.isInteger(q.right)&&q.left>=1&&q.right<=10&&q.left<=q.right;
 if(!isQuickTopic(topic)||Object.keys(q).length!==2||typeof q.text!=='string'||!q.text||q.text.length>500||!Array.isArray(q.options))return false;
 return q.options.length===4&&q.options.every(number)&&new Set(q.options).size===4||q.options.length===2&&q.options.includes('ДА')&&q.options.includes('НЕТ');
}
export function validateQuickPack(pack,draft){
 if(!pack||pack.training_start_id!==draft.training_start_id||!isQuickTopic(pack.topic_id)||pack.status!=='active'||![5,10].includes(pack.questions?.length)||pack.questions.some(q=>!validateQuickQuestion(pack.topic_id,q)))throw Error('QUICK_INVALID_PACK');
 const cfg=pack.config??(pack.topic_id==='quick:multiplication'?{count:pack.questions.length,mode:'all',smart:'all'}:null);
 if(!cfg||cfg.count!==pack.questions.length||!validQuickConfig({topic:pack.topic_id,mode:cfg.mode,smart:cfg.smart})||!Number.isInteger(draft.question_index)||draft.question_index<0||draft.question_index>cfg.count||!draft.answers||Object.keys(draft.answers).length!==draft.question_index)throw Error('QUICK_INVALID_PACK');
 for(let i=0;i<draft.question_index;i++){const raw=draft.answers[String(i)],q=pack.questions[i];if(typeof raw!=='string'||raw!==''&&raw!=='ДА'&&raw!=='НЕТ'&&String(Number(raw))!==raw)throw Error('QUICK_INVALID_PACK');const a=decodeAnswer(raw);if(!isAnswer(a)||a!==null&&(pack.topic_id==='quick:multiplication'?typeof a!=='number':!q.options.includes(a)))throw Error('QUICK_INVALID_PACK');}
 return cfg;
}
export async function mountQuick({host,api,scope,exit}){
 const initial=scope(),queue=createQuickQueue({api,scope});
 const draft=shallowRef(null),questions=shallowRef(null),goals=shallowRef(null),pending=shallowRef(null),latest=shallowRef(null),busy=shallowRef(false),error=shallowRef(''),input=shallowRef(''),feedback=shallowRef(''),other=shallowRef(false);
 const access=shallowRef({}),topic=shallowRef('quick:multiplication'),mode=shallowRef('all'),smart=shallowRef('all');
 let alive=true;
 const allowed=t=>access.value[t]?.allowed===true;
 async function refresh(){
  const [d,p,l,a]=await Promise.all([api.quickDraft(initial.profile),queue.pending(),api.quickLatest(initial.profile),api.quickAccess(initial.profile)]);
  if(!alive)return;
  if(!Number.isSafeInteger(d?.revision)||d.revision<0||a?.test_only!==true||!a.topics||Object.keys(a.topics).length!==4||Object.keys(QUICK_MODES).some(t=>typeof a.topics[t]?.allowed!=='boolean'))throw Error('QUICK_INVALID_STATE');
  access.value=a.topics;draft.value=d;pending.value=p;latest.value=l.training;questions.value=null;other.value=false;
  if(d.draft){
   let pack;try{pack=await api.quickQuestions(initial.profile,d.draft.training_start_id);}catch(e){if(e.code==='SERVER_GRADING_UNAVAILABLE'){other.value=true;return;}throw e;}
   const cfg=validateQuickPack(pack,d.draft);topic.value=pack.topic_id;mode.value=cfg.mode;smart.value=cfg.smart;questions.value=pack.questions;
  }else if(!allowed(topic.value)){const t=Object.keys(QUICK_MODES).find(allowed);if(t){topic.value=t;mode.value='all';smart.value='all';}}
  const goalTopic=allowed(topic.value)?topic.value:Object.keys(QUICK_MODES).find(allowed);
  const g=goalTopic?await api.trainingGoals(initial.profile,goalTopic):null;
  if(!alive)return;
  if(g&&(!Array.isArray(g.options)||!Number.isInteger(g.completed)||g.topic_id&&g.topic_id!==goalTopic))throw Error('QUICK_INVALID_STATE');
  goals.value=g;
 }
 await refresh();
 async function run(body){
  if(!alive||busy.value)return;busy.value=true;error.value='';
  try{
   const r=await queue.submit(body);if(!alive)return;
   if(body.kind==='draft'){const ix=body.body.draft.question_index-1,q=questions.value?.[ix],a=body.body.draft.answers[String(ix)];feedback.value=a===''?'Пропущено.':topic.value!=='quick:multiplication'?'Ответ сохранён.':q&&Number(a)===q.left*q.right?'Верно!':q?'Правильный ответ: '+q.left*q.right+'.':'';input.value='';}
   if(body.kind==='start'){feedback.value='';input.value='';}
   if(body.kind==='finish')feedback.value='Результат подтверждён сервером.';
   await refresh();
  }catch(e){if(!alive)return;error.value=e.code==='QUICK_EMPTY_POOL'?'Нет подтверждённых фактов для этого режима.':'Запрос не подтверждён. Проверьте соединение и сохранённый запрос.';try{await refresh()}catch{}}
  finally{busy.value=false;}
 }
 function update(answer){const d=draft.value,old=d.draft,i=old.question_index,q=questions.value?.[i];if(!q||!isAnswer(answer)||answer!==null&&(topic.value==='quick:multiplication'?typeof answer!=='number':!q.options.includes(answer)))return;void run({kind:'draft',body:{base_revision:d.revision,draft:{training_start_id:old.training_start_id,question_index:i+1,answers:{...old.answers,[String(i)]:answer===null?'':String(answer)}}}});}
 function finish(){const d=draft.value;void run({kind:'finish',start:d.draft.training_start_id,body:{draft_revision:d.revision,answers:Array.from({length:questions.value.length},(_,i)=>decodeAnswer(d.draft.answers[String(i)]))}});}
 const btn=(name,fn,disabled=false)=>h('button',{type:'button',onClick:fn,disabled:busy.value||disabled},name);
 const lock=()=>!!pending.value;
 async function choose(t){if(busy.value||lock()||draft.value?.draft||!allowed(t))return;busy.value=true;topic.value=t;mode.value='all';smart.value='all';feedback.value='';try{await refresh();error.value='';}catch{error.value='Не удалось обновить.';}finally{busy.value=false;}}
 function select(labelText,current,options,onChange){return h('label',[labelText,h('select',{'aria-label':labelText,value:current,disabled:busy.value||lock(),onChange:e=>onChange(e.target.value)},options.map(([value,name,disabled])=>h('option',{value,disabled:!!disabled},name)))]);}
 function goalView(){if(!goals.value)return null;const g=goals.value.active;return h('section',{class:'row'},[h('h2','Цель тренировки'),h('p','Выполнено целей: '+goals.value.completed),g?h('div',[h('strong',label[g.type]+' — '+g.progress+' / '+g.target),g.topic_id?h('p','Тренажёр: '+titles[g.topic_id]):null,h('p','Награда: +'+g.reward_xp+' XP и '+g.reward_coins+' монет.'),g.eligible_fact_keys?.length?h('p','Засчитываются только разные факты из выбранного списка. Остальные задания — обычная тренировка.'):null,btn('Отменить цель',()=>{if(confirm('Закрыть цель без награды?'))void run({kind:'goal_cancel',goal:g.id})},lock())]):h('div',[h('p','Цели не имеют срока и привязаны к выбранному тренажёру.'),...goals.value.options.map(x=>btn(label[x.type]+' — '+x.target,()=>run({kind:'goal_start',type:x.type,topic:topic.value}),lock()||!allowed(topic.value)))])]);}
 function latestView(){const s=latest.value?.summary;if(!s)return null;return h('section',{class:'row'},[h('h2','Последняя завершённая тренировка'),h('p','Верно: '+s.correct+' · Ошибок: '+s.wrong+' · Пропущено: '+s.skipped),h('p','Начислено '+s.xp+' XP и '+s.coins+' монет.'),s.training_goal?.reward_xp?h('p','Цель выполнена: +'+s.training_goal.reward_xp+' XP и '+s.training_goal.reward_coins+' монет.'):null,...(s.achievement_rewards||[]).map(x=>h('p','Достижение: '+x.id+' · +'+x.xp+' XP · '+x.coins+' монет'))]);}
 function training(){if(other.value)return h('p','Сначала завершите другой активный серверный черновик.');const d=draft.value.draft;if(!d)return h('section',[select('Тренажёр',topic.value,Object.keys(QUICK_MODES).map(t=>[t,titles[t]+(allowed(t)?'':' — недоступно'),!allowed(t)]),choose),select('Диапазон',mode.value,QUICK_MODES[topic.value].map(m=>[m,modeNames[m]]),m=>mode.value=m),select('Режим фактов',smart.value,Object.entries(smartNames),m=>smart.value=m),h('div',{class:'actions'},[5,10].map(count=>btn(count+' заданий',()=>run({kind:'start',count,config:{topic:topic.value,mode:mode.value,smart:smart.value}}),lock()||!allowed(topic.value))))]);const q=questions.value?.[d.question_index],n=questions.value?.length;if(!q)return h('section',[h('p','Все '+n+' ответов сохранены.'),btn('Подтвердить результат',finish,lock())]);const mul=topic.value==='quick:multiplication',can=/^\d{1,6}$/.test(input.value);return h('section',[h('p','Задание '+(d.question_index+1)+' из '+n),h('div',{class:'v307-quick-task'},mul?q.left+' × '+q.right+' = ?':q.text),mul?h('form',{onSubmit:e=>{e.preventDefault();if(!busy.value&&!lock()&&can)update(Number(input.value))}},[h('label',['Ответ',h('input',{value:input.value,inputmode:'numeric',autocomplete:'off',maxlength:6,disabled:busy.value||lock(),onInput:e=>input.value=e.target.value})]),h('button',{type:'submit',disabled:busy.value||lock()||!can},'Ответить')]):h('div',{class:'actions'},q.options.map(a=>btn(String(a),()=>update(a),lock()))),btn('Пропустить',()=>update(null),lock())]);}
 const app=createApp({setup(){return ()=>h('section',{class:'v307-quick'},[h('h2','Быстрая тренировка — '+titles[topic.value]),h('p',{class:'notice'},'Требуется интернет. Каждый подтверждённый ответ сохраняется на сервере; награды выдаются только после завершения.'),error.value?h('p',{role:'alert'},error.value):null,pending.value?h('div',{class:'notice'},['Сохранён незавершённый запрос. ',btn('Повторить запрос',()=>run(pending.value.body))]):null,feedback.value?h('p',{role:'status'},feedback.value):null,training(),goalView(),latestView(),h('div',{class:'actions'},[btn('Обновить',async()=>{if(busy.value)return;busy.value=true;try{await refresh();error.value='';}catch{error.value='Не удалось обновить.';}finally{busy.value=false;}}),btn('Сохранить и выйти',exit)])]);}});
 app.mount(host);return {dispose(){alive=false;app.unmount();}};
}
