import {isCurriculum,curriculumModel,readCurriculumCells,validateCurriculum} from './curriculum.mjs';
import {createApp,h,shallowRef} from 'vue';
import ColumnExercise from '../../frontend/knowledge-map/ColumnExercise.vue';
import TableExercise from '../../frontend/knowledge-map/TableExercise.vue';
import {SCHOOL_TOPICS,V307_CHOICE_TOPICS,V307_VISUAL_TOPICS,STAGES,isColumn,isFraction,maxDigits} from '../backend95-next/school_block_queue.mjs';
import {validateNodes} from './visual_nodes.mjs';
import {fractionView,readFractionCells} from '../backend95/fraction_training.mjs';
import {columnView,readColumnCells,moveColumnCell,normalizeColumnCell} from '../backend95/column_training.mjs';
import * as layout from './column_layout_generated.mjs';
import {safeMathText} from './training_view.mjs';
import {createReviewQueue} from './review_queue.mjs';
const title=t=>SCHOOL_TOPICS[t]||t;
const valid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
function checked(r){
 if(!r)return null;
 if(!valid(r.id)||!['errors','control'].includes(r.mode)||!['active','finished','abandoned'].includes(r.status)||!Number.isSafeInteger(r.revision)||r.revision<0||!Number.isInteger(r.index)||!Number.isInteger(r.total)||r.index<0||r.index>=r.total||r.total>20||!Object.hasOwn(SCHOOL_TOPICS,r.topic_id)||![0,1,2].includes(r.stage)||!['open','solved','skipped'].includes(r.outcome))throw Error('REVIEW_INVALID_STATE');
 if(r.status==='active'){
  const q=r.question;if(!q||Object.hasOwn(q,'answer')||Object.hasOwn(q,'column_keys'))throw Error('REVIEW_INVALID_QUESTION');
  if(isCurriculum(r.topic_id))validateCurriculum(q,{publicOnly:true});if(q.prompt)validateNodes(q.prompt);if(q.solution_nodes){if(r.outcome!=='solved')throw Error('REVIEW_UNEXPECTED_SOLUTION');validateNodes(q.solution_nodes);}if(q.choice_nodes)q.choice_nodes.forEach(validateNodes);
  if(q.choices&&(!Array.isArray(q.choices)||q.choices.length<2||q.choices.length>4||q.choices.some(x=>!Number.isSafeInteger(x))))throw Error('REVIEW_INVALID_CHOICES');
  if(isColumn(r.topic_id))columnView(r.topic_id,{...q,columnFields:q.column_fields},{},false,layout);
 }
 return r;
}
export async function mountReview({host,api,scope,exit}){
 const initial=scope(),queue=createReviewQueue({api,scope}),row=shallowRef(null),overview=shallowRef(null),pending=shallowRef(null),busy=shallowRef(false),error=shallowRef(''),grade=shallowRef('mixed'),mode=shallowRef('errors'),topic=shallowRef(''),count=shallowRef(5);
 let alive=true;
 async function refresh(id=null){const [data,p]=await Promise.all([api.reviewOverview(initial.profile,grade.value),queue.pending()]);if(!alive)return;if(data?.test_only!==true||!Array.isArray(data.groups)||!Array.isArray(data.studied))throw Error('REVIEW_INVALID_OVERVIEW');overview.value=data;pending.value=p;row.value=checked(id?await api.reviewRead(initial.profile,id):data.active);}
 await refresh();
 async function run(body){
  if(!alive||busy.value)return false;busy.value=true;error.value='';
  try{const receipt=await queue.submit(body);if(!alive)return false;await refresh(receipt.id);return true;}
  catch(e){if(!alive)return false;error.value=e.code==='REVIEW_REVISION_CONFLICT'?'Состояние изменилось в другой вкладке. Загружено актуальное задание.':'Запрос не подтверждён. Проверьте соединение и сохранённый запрос.';try{await refresh()}catch{}return false;}
  finally{busy.value=false;}
 }
 const locked=()=>busy.value||!!pending.value;
 const btn=(name,fn,disabled=false)=>h('button',{type:'button',onClick:fn,disabled:busy.value||disabled},name);
 const values=()=>{const r=row.value;if(isCurriculum(r.topic_id))return readCurriculumCells(host);if(isColumn(r.topic_id))return readColumnCells();if(isFraction(r.topic_id))return readFractionCells();return {'answer:0':host.querySelector('#fin')?.value??r.cells?.['answer:0']??''};};
 const act=(action,cells={})=>{if(locked()||row.value?.status!=='active')return Promise.resolve(false);return run({kind:'step',review:row.value.id,body:{revision:row.value.revision,action,cells,...(isCurriculum(row.value.topic_id)?{format:'curriculum-v307'}:{})}});};
 const leave=async()=>{if(locked())return;if(row.value?.status==='active'&&row.value.outcome==='open'){if(!await act('save',values()))return;}if(alive)exit();};
 const actions={input:()=>{},inputCell:el=>normalizeColumnCell(el),moveCell:(e,el)=>moveColumnCell(e,el),toggleDot:el=>normalizeColumnCell(el,true),primary:()=>act(row.value.outcome==='solved'?'advance':'check',row.value.outcome==='solved'?{}:values()),pick:i=>{const q=row.value.question;if(q.choices&&Object.hasOwn(q.choices,i))void act('check',{'answer:0':String(q.choices[i])});},skip:()=>{if(!locked()&&confirm('Пропустить задание?'))void act('skip',values());}};
 function exercise(){
  const r=row.value,q=r.question,solved=r.outcome==='solved',feedback=r.feedback?.missing?.length?'Заполни обязательные поля.':r.feedback?.wrong?.length?'Проверь ответ.':solved?(r.mode==='errors'&&!r.reward?.resolved?'Верно. Старую ошибку нужно повторить.':r.reward?.resolved?'Ошибка отработана: +5 XP и 1 монета.':'Верно! +5 XP и 1 монета.'):'';
  const item={cells:r.cells,answer:r.cells?.['answer:0']||'',solved,feedback,wrong:r.feedback?.wrong||[]},disabled=locked();
  if(isCurriculum(r.topic_id))return h(TableExercise,{model:curriculumModel(q,item,disabled,{publicOnly:true}),actions});
  if(isColumn(r.topic_id))return h(ColumnExercise,{model:columnView(r.topic_id,{...q,columnFields:q.column_fields},item,disabled,layout),actions});
  if(isFraction(r.topic_id))return h(TableExercise,{model:fractionView(q,item,disabled),actions});
  const model={a:q.a,b:q.b,prompt:q.expression,promptNodes:q.prompt,solutionNodes:solved?q.solution_nodes:undefined,...(Object.hasOwn(V307_CHOICE_TOPICS,r.topic_id)?{safePrompt:safeMathText(q.expression)}:{}),maxDigits:maxDigits(r.topic_id),placeValues:q.place_values,choices:q.choices?.map((v,i)=>({label:String(q.choice_labels?.[i]??v),...(q.choice_nodes?{nodes:q.choice_nodes[i]}:{}),...(Object.hasOwn(V307_CHOICE_TOPICS,r.topic_id)?{labelHtml:safeMathText(q.choice_labels[i])}:{}),selected:item.answer===String(v),disabled:solved||disabled,className:'btn soft'})),solution:solved?q.steps:undefined,answer:item.answer,readOnly:solved,disabled,wrong:!!r.feedback?.wrong?.length,feedback,primaryLabel:solved?'Далее':'Проверить',nextReady:solved,hideSkip:solved};
  return h(TableExercise,{model,actions});
 }
 async function filter(next){if(locked())return;busy.value=true;grade.value=next;topic.value='';try{await refresh();error.value='';}catch{error.value='Не удалось обновить список.';}finally{busy.value=false;}}
 function menu(){const data=overview.value,groups=data.groups.filter(g=>g.active>0),mixedOk=new Set(data.studied.map(t=>t.topic[1])).size>=2,disabled=locked()||(mode.value==='errors'?groups.length===0:!data.studied.length||grade.value==='mixed'&&!mixedOk);
  return h('section',[h('div',{class:'actions'},[btn('Работа над ошибками',()=>{mode.value='errors';count.value=5;topic.value=''},locked()),btn('Контрольное повторение',()=>{mode.value='control';count.value=10;topic.value=''},locked())]),h('h2',mode.value==='errors'?'Работа над ошибками':'Контрольное повторение'),h('label',['Класс',h('select',{'aria-label':'Класс',value:grade.value,disabled:locked(),onChange:e=>filter(e.target.value)},[['mixed','4 и 5 классы'],['4','4 класс'],['5','5 класс']].map(([value,label])=>h('option',{value},label)))]),
  mode.value==='errors'?h('section',[h('p','Новое аналогичное задание нужно решить с первой попытки, чтобы закрыть старую ошибку.'),...data.groups.map(g=>h('p',title(g.topic_id)+' · активных '+g.active+' · отработано '+g.resolved)),h('label',['Тема',h('select',{'aria-label':'Тема ошибок',value:topic.value,disabled:locked(),onChange:e=>topic.value=e.target.value},[h('option',{value:''},'Все доступные темы'),...groups.map(g=>h('option',{value:g.topic_id},title(g.topic_id)))])])]):h('section',[h('p','Только изученные темы, на подтверждённом уровне сложности.'),...data.studied.map(t=>h('p',title(t.topic)+' · '+STAGES[t.stage])),grade.value==='mixed'&&!mixedOk?h('p','Сначала изучите темы обоих классов.'):null]),
  h('label',['Количество заданий',h('select',{'aria-label':'Количество заданий',value:String(count.value),disabled:locked(),onChange:e=>count.value=Number(e.target.value)},(mode.value==='errors'?[5,10,15]:[10,15,20]).map(n=>h('option',{value:String(n)},String(n))))]),btn('Начать',()=>run({kind:'start',body:{mode:mode.value,grade:grade.value,count:count.value,topic:mode.value==='errors'?topic.value||null:null}}),disabled),btn('Назад',exit)]);
 }
 function result(){const r=row.value,s=r.summary||{};return h('section',[h('h2',r.status==='abandoned'?'Блок прерван':r.mode==='errors'?'Работа над ошибками завершена':'Контрольное повторение завершено'),h('p','С первой попытки: '+s.first_try+' · исправлено: '+s.corrected+' · неверно: '+s.wrong+' · пропущено: '+s.skipped),r.mode==='errors'?h('p','Отработано ошибок: '+s.resolved):null,h('p','Начислено '+s.xp+' XP и '+s.coins+' монет.'),...(s.topics||[]).map(t=>h('p',title(t.topic_id)+': '+t.first_try+' с первой, '+t.corrected+' исправлено, '+t.skipped+' пропущено')),...(s.achievement_rewards||[]).map(a=>h('p','Достижение: '+a.id)),btn('К списку',()=>{row.value=null}),btn('Назад',exit)]);}
 const app=createApp({setup(){return ()=>h('section',{class:'v307-training v307-review'},[h('p',{class:'notice'},'Тестовый серверный режим. Требуется интернет.'),error.value?h('p',{role:'alert'},error.value):null,pending.value?h('div',{class:'notice'},['Сохранён незавершённый запрос. ',btn('Повторить запрос',()=>run(pending.value.body))]):null,row.value?(row.value.status==='active'?h('section',[h('h2',row.value.mode==='errors'?'Работа над ошибками':'Контрольное повторение'),h('p','Задание '+(row.value.index+1)+' из '+row.value.total+' · '+title(row.value.topic_id)+' · '+STAGES[row.value.stage]),h('div',{id:'mk95-table-question',key:row.value.id+':'+row.value.index},[exercise()]),btn('Сохранить и выйти',leave,!!pending.value),btn('Прервать блок',()=>{if(confirm('Прервать блок? Уже полученные награды сохранятся.'))void act('abandon')},!!pending.value)]):result()):menu()]);}});app.mount(host);return {dispose(){alive=false;app.unmount();}};
}
