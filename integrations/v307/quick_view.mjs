import {createApp,h,shallowRef} from 'vue';
import {createQuickQueue} from './quick_queue.mjs';
const label={correct:'Правильные ответы',streak:'Серия правильных ответов',weak:'Слабые факты',errors:'Факты с ошибками'};
export async function mountQuick({host,api,scope,exit}){
 const initial=scope(),queue=createQuickQueue({api,scope});
 const draft=shallowRef(null),questions=shallowRef(null),goals=shallowRef(null),pending=shallowRef(null),latest=shallowRef(null),busy=shallowRef(false),error=shallowRef(''),input=shallowRef(''),feedback=shallowRef(''),other=shallowRef(false);
 let alive=true;
 async function refresh(){
  const [d,g,p,l]=await Promise.all([api.quickDraft(initial.profile),api.trainingGoals(initial.profile),queue.pending(),api.quickLatest(initial.profile)]);
  if(!alive)return;
  if(!Number.isSafeInteger(d?.revision)||d.revision<0||!Array.isArray(g?.options)||!Number.isInteger(g.completed))throw Error('QUICK_INVALID_STATE');
  draft.value=d;goals.value=g;pending.value=p;latest.value=l.training;questions.value=null;other.value=false;
  if(d.draft){
   let pack;try{pack=await api.quickQuestions(initial.profile,d.draft.training_start_id);}catch(e){if(e.code==='SERVER_GRADING_UNAVAILABLE'){other.value=true;return;}throw e;}
   if(pack.training_start_id!==d.draft.training_start_id||pack.topic_id!=='quick:multiplication'||pack.status!=='active'||![5,10].includes(pack.questions?.length)||pack.questions.some(x=>!Number.isInteger(x.left)||!Number.isInteger(x.right)||x.left<1||x.right>10||x.left>x.right)||!Number.isInteger(d.draft.question_index)||d.draft.question_index<0||d.draft.question_index>pack.questions.length||Object.keys(d.draft.answers).length!==d.draft.question_index)throw Error('QUICK_INVALID_PACK');
   questions.value=pack.questions;
  }
 }
 await refresh();
 async function run(body){
  if(!alive||busy.value)return;busy.value=true;error.value='';
  try{
   const r=await queue.submit(body);if(!alive)return;
   if(body.kind==='draft'){const ix=body.body.draft.question_index-1,q=questions.value?.[ix],a=body.body.draft.answers[String(ix)];feedback.value=a===''?'Пропущено.':q&&Number(a)===q.left*q.right?'Верно!':q?'Правильный ответ: '+q.left*q.right+'.':'';input.value='';}
   if(body.kind==='start'){feedback.value='';input.value='';}
   if(body.kind==='finish')feedback.value='Результат подтверждён сервером.';
   await refresh();
  }catch(e){if(!alive)return;error.value='Запрос не подтверждён. Проверьте соединение и сохранённый запрос.';try{await refresh()}catch{}}
  finally{busy.value=false;}
 }
 function update(answer){const d=draft.value,old=d.draft,i=old.question_index;void run({kind:'draft',body:{base_revision:d.revision,draft:{training_start_id:old.training_start_id,question_index:i+1,answers:{...old.answers,[String(i)]:answer===null?'':String(answer)}}}});}
 function finish(){const d=draft.value;void run({kind:'finish',start:d.draft.training_start_id,body:{draft_revision:d.revision,answers:Array.from({length:questions.value.length},(_,i)=>d.draft.answers[String(i)]===''?null:Number(d.draft.answers[String(i)]))}});}
 const btn=(name,fn,disabled=false)=>h('button',{type:'button',onClick:fn,disabled:busy.value||disabled},name);
 const lock=()=>!!pending.value;
 function goalView(){const g=goals.value.active;return h('section',{class:'row'},[h('h2','Цель тренировки'),h('p','Выполнено целей: '+goals.value.completed),g?h('div',[h('strong',label[g.type]+' — '+g.progress+' / '+g.target),h('p','Награда: +'+g.reward_xp+' XP и '+g.reward_coins+' монет.'),g.eligible_fact_keys?h('p','Засчитываются только разные факты из выбранного списка. Остальные задания — обычная тренировка.'):null,btn('Отменить цель',()=>{if(confirm('Закрыть цель без награды?'))void run({kind:'goal_cancel',goal:g.id})},lock())]):h('div',[h('p','Цели не имеют срока. Сейчас поддерживается таблица умножения.'),...goals.value.options.map(x=>btn(label[x.type]+' — '+x.target,()=>run({kind:'goal_start',type:x.type}),lock()))])]);}
 function latestView(){const s=latest.value?.summary;if(!s)return null;return h('section',{class:'row'},[h('h2','Последняя завершённая тренировка'),h('p','Верно: '+s.correct+' · Ошибок: '+s.wrong+' · Пропущено: '+s.skipped),h('p','Начислено '+s.xp+' XP и '+s.coins+' монет.'),s.training_goal?.reward_xp?h('p','Цель выполнена: +'+s.training_goal.reward_xp+' XP и '+s.training_goal.reward_coins+' монет.'):null,...(s.achievement_rewards||[]).map(x=>h('p','Достижение: '+x.id+' · +'+x.xp+' XP · +'+x.coins+' монет'))]);}
 function training(){if(other.value)return h('p','Сначала завершите другой активный серверный черновик.');const d=draft.value.draft;if(!d)return h('div',{class:'actions'},[btn('5 заданий',()=>run({kind:'start',count:5}),lock()),btn('10 заданий',()=>run({kind:'start',count:10}),lock())]);const q=questions.value?.[d.question_index],n=questions.value?.length;if(!q)return h('section',[h('p','Все '+n+' ответов сохранены.'),btn('Подтвердить результат',finish,lock())]);const can=/^\d{1,6}$/.test(input.value);return h('section',[h('p','Задание '+(d.question_index+1)+' из '+n),h('div',{class:'v307-quick-task'},q.left+' × '+q.right+' = ?'),h('form',{onSubmit:e=>{e.preventDefault();if(!busy.value&&!lock()&&can)update(Number(input.value))}},[h('label',['Ответ',h('input',{value:input.value,inputmode:'numeric',autocomplete:'off',maxlength:6,disabled:busy.value||lock(),onInput:e=>input.value=e.target.value})]),h('button',{type:'submit',disabled:busy.value||lock()||!can},'Ответить')]),btn('Пропустить',()=>update(null),lock())]);}
 const app=createApp({setup(){return ()=>h('section',{class:'v307-quick'},[h('h2','Быстрая тренировка — таблица умножения'),h('p',{class:'notice'},'Требуется интернет. Каждый подтверждённый ответ сохраняется на сервере; награды выдаются только после завершения.'),error.value?h('p',{role:'alert'},error.value):null,pending.value?h('div',{class:'notice'},['Сохранён незавершённый запрос. ',btn('Повторить запрос',()=>run(pending.value.body))]):null,feedback.value?h('p',{role:'status'},feedback.value):null,training(),goalView(),latestView(),h('div',{class:'actions'},[btn('Обновить',async()=>{if(busy.value)return;busy.value=true;try{await refresh();error.value='';}catch{error.value='Не удалось обновить.';}finally{busy.value=false;}}),btn('Сохранить и выйти',exit)])]);}});
 app.mount(host);return {dispose(){alive=false;app.unmount();}};
}
