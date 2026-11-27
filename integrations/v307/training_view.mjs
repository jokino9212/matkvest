import {createApp,h,shallowRef} from 'vue';
import SchoolAttempt from '../../frontend/knowledge-map/SchoolAttempt.vue';
import {SCHOOL_TOPICS,STAGES,PASS,isColumn,isFraction,maxDigits} from '../backend95-next/school_block_queue.mjs';
import {fractionView,readFractionCells} from '../backend95/fraction_training.mjs';
import * as layout from './column_layout_generated.mjs';
import {columnView,readColumnCells,moveColumnCell,normalizeColumnCell} from '../backend95/column_training.mjs';
export const reviewTopics=Object.entries(SCHOOL_TOPICS);
export async function mountTraining({host,queue,topic,stage,device,exit}){
 const initial=await queue.prepare(topic,stage,device);
 if(isColumn(topic))for(const question of initial.questions)columnView(topic,question,{},false,layout);
 const row=shallowRef(initial),busy=shallowRef(false),error=shallowRef(''),alive={value:true};
 let chain=Promise.resolve();
 const read=()=>{const r=row.value,items=r.draft,item=items[r.index],q=r.questions[r.index],finished=r.status!=='draft',confirmed=r.status==='confirmed';
  const correct=items.filter(x=>x.solved&&x.checks.length===1).length,done=items.filter(x=>x.solved||x.skipped).length;
  const summary=confirmed?r.receipt?.summary:{correct,corrected:items.filter(x=>x.solved&&x.checks.length>1).length,skipped:items.filter(x=>x.skipped).length,passed:correct>=PASS[r.stage],pending:true};
  return {title:SCHOOL_TOPICS[r.topic],rootId:'mk95-table-practice',questionId:'mk95-table-question',column:isColumn(r.topic),pauseOnly:true,progress:{stage:STAGES[r.stage],done,total:r.count,correct},finished,summary:r.status==='blocked'?null:summary,exercise:finished?{}:isColumn(r.topic)?columnView(r.topic,q,item,busy.value,layout):isFraction(r.topic)?fractionView(q,item,busy.value):{a:q.a,b:q.b,prompt:q.expression,maxDigits:maxDigits(r.topic),placeValues:q.place_values,choices:q.choices?.map(v=>({label:String(q.choice_labels?.[v]??v),selected:item.answer===String(v),disabled:item.solved||busy.value,className:'btn soft'})),solution:item.solved?q.steps:undefined,answer:item.answer,readOnly:item.solved,disabled:busy.value,wrong:!item.solved&&item.feedback?.startsWith('Проверь'),feedback:item.feedback||'',primaryLabel:item.solved?'Далее':'Проверить',nextReady:item.solved,hideSkip:item.solved}};
 };
 const value=()=>isColumn(row.value.topic)?readColumnCells():isFraction(row.value.topic)?readFractionCells():host.querySelector('#fin')?.value??row.value.draft[row.value.index].answer;
 async function flush(){
  if(!alive.value||busy.value||row.value.status!=='pending')return;
  busy.value=true;try{await queue.flush();const rows=await queue.list();if(alive.value){const updated=rows.find(x=>x.key===row.value.key);if(updated)row.value=updated;}}catch{if(alive.value)error.value='Результат сохранён. Повторите синхронизацию.';}finally{busy.value=false;}
 }
 function enqueue(kind,v){
  if(!alive.value||row.value.status!=='draft')return;
  const index=row.value.index;
  chain=chain.then(async()=>{if(!alive.value||row.value.status!=='draft'||row.value.index!==index)return;
   try{row.value=await queue.act(row.value,kind,v);error.value='';if(row.value.status==='pending')void flush();}
   catch{if(alive.value){error.value='Черновик изменён или не сохранён. Откройте блок повторно.';const rows=await queue.list();const latest=rows.find(x=>x.key===row.value.key);if(latest)row.value=latest;}}
  }).catch(()=>{if(alive.value)error.value='Не удалось сохранить ответ.';});
 }
 const leave=()=>{void chain.then(()=>{if(alive.value)exit();});};
 const actions={close:leave,back:leave,abandon:leave,input:e=>{if(e.type==='input'&&(e.target?.id==='fin'||e.target?.dataset?.mk95Fraction))enqueue('input',value());},inputCell:el=>{if(normalizeColumnCell(el))enqueue('input',value());},moveCell:(event,el)=>moveColumnCell(event,el),toggleDot:el=>{if(normalizeColumnCell(el,true))enqueue('input',value());},primary:()=>enqueue(row.value.draft[row.value.index].solved?'advance':'check',value()),pick:i=>{const choices=row.value.questions[row.value.index].choices;if(Number.isInteger(i)&&choices&&Object.hasOwn(choices,i))enqueue('check',String(choices[i]));},skip:()=>{if(confirm('Пропустить задание?'))enqueue('skip',value());}};
 const app=createApp({setup(){return ()=>h('div',{class:'v307-training'},[h('p',{class:'notice'},row.value.context.kind==='homework'?'Домашнее задание':row.value.context.kind==='lesson'?'Занятие с преподавателем':'Самостоятельная работа'),h(SchoolAttempt,{model:read(),actions}),error.value?h('p',{role:'alert'},error.value):null,row.value.status==='pending'?h('button',{disabled:busy.value,onClick:flush},'Повторить синхронизацию'):null,row.value.status==='blocked'?h('p',{role:'alert'},'Сервер отклонил блок. Черновик сохранён для проверки; награда не начислена.'):null]);}});
 app.mount(host);
 const online=()=>void flush();window.addEventListener('online',online);if(initial.status==='pending')void flush();
 return {dispose(){alive.value=false;window.removeEventListener('online',online);app.unmount();}};
}
