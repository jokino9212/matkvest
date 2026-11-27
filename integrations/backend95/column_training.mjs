// Use the existing legacy pure layout factory (same as Backend 9.5 pilot).
// Do not set global mode/task, run legacy checks, or use local rewards.
export function columnTask({a,b},op,layout=window){
 if(op==='div'){
  const steps=layout.divisionSteps(a,b);
  return {a,b,ans:a/b,op:'÷',steps,quotient:steps.map(step=>step.qd).join('')};
 }
 if(op==='mul'){
  const ans=a*b,cols=Math.max(String(ans).length,String(a).length+2),tens=Math.floor(b/10),units=b%10,p1=a*units,p2=a*tens;
  return {a,b,ans,op:'×',cols,tens,units,p1,p2,carry1:layout.calcMulCarries(a,units,cols),carry2:layout.calcMulCarries(a,tens,cols),finalCarry:layout.calcCarries(p1,p2*10,cols)};
 }
 const ans=op==='add'?a+b:a-b,cols=Math.max(String(a).length,String(b).length,String(ans).length);
 if(op==='add')return {a,b,ans,op:'+',marks:layout.calcCarries(a,b,cols)};
 const {receive,donor}=layout.calcBorrows(a,b,cols);
 return {a,b,ans,op:'−',marks:receive,dotMarks:donor};
}
export function columnView(topic,question,item={},busy=false,layout=window){
 const op=topic.split(':').at(-1),view=layout.columnExerciseModel(columnTask(question,op,layout),op);
 const cells=view.rows.flatMap(row=>row.cells).concat(view.division?.quotient||[]).filter(cell=>cell.field);
 const actual=new Map(cells.map(cell=>[cell.row+':'+cell.col,cell]));
 if(question.columnFields&&question.columnKeys===undefined){
  // Online review receives field names only. The server independently checks
  // every required/optional cell; the existing pure layout computes geometry.
  if(!Array.isArray(question.columnFields)||actual.size!==cells.length||JSON.stringify([...actual.keys()].sort())!==JSON.stringify([...question.columnFields].sort()))throw Error('COLUMN_LAYOUT_CONTRACT');
 }else{
  const [required,optional]=question.columnKeys,keys={...required,...optional};
  if(actual.size!==cells.length||actual.size!==Object.keys(keys).length||Object.entries(keys).some(([key,exp])=>!actual.has(key)||String(actual.get(key).expected??'')!==exp))throw Error('COLUMN_LAYOUT_CONTRACT');
 }
 for(const [key,cell] of actual){
  cell.value=item.cells?.[key]||'';cell.readOnly=!!item.solved;cell.disabled=busy;
  if(item.wrong?.includes(key))cell.className+=' bad';
 }
 return {...view,primaryLabel:item.solved?'Далее':view.primaryLabel,primaryClass:'btn primary'+(item.solved?' next-ready':''),skipLabel:'⏭ Пропустить задание',hideSkip:!!item.solved,feedback:item.feedback||''};
}
const root=()=>document.querySelector('#mk95-table-question');
export function readColumnCells(){
 const cells={};
 for(const el of root()?.querySelectorAll('input[data-row][data-col]')||[]){
  const key=el.dataset.row+':'+el.dataset.col;cells[key]=el.value;
 }
 return cells;
}
const rowFields=el=>Array.from(root()?.querySelectorAll('input[data-row][data-col]')||[]).filter(x=>x.dataset.row===el.dataset.row&&!x.disabled&&!x.readOnly).sort((a,b)=>Number(a.dataset.col)-Number(b.dataset.col));
function focus(el){if(!el)return false;el.focus();el.select?.();return true;}
function move(el,dir){const row=rowFields(el);return focus(row[row.indexOf(el)+dir]);}
export function moveColumnCell(event,el){
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(el,event.key==='ArrowLeft'?-1:1);}
 else if(event.key==='Backspace'&&!el.value){event.preventDefault();move(el,el.classList.contains('div-work-in')||el.classList.contains('qin')?-1:1);}
}
export function normalizeColumnCell(el,toggle=false){
 if(!el||el.readOnly||el.disabled||!root()?.contains(el))return false;
 if(el.classList.contains('dot-in'))el.value=toggle?(el.value==='•'?'':'•'):/^[.,·•]$/.test(el.value)?'•':'';
 else el.value=(el.value.match(/\d/)||[''])[0];
 if(el.value&&!el.classList.contains('mark-in')){
  const div=el.classList.contains('div-work-in')||el.classList.contains('qin');
  if(!move(el,div?1:-1)){
   if(div&&el.classList.contains('div-work-in')){const all=Array.from(root().querySelectorAll('.div-work-in'));focus(all[all.indexOf(el)+1]);}
   else if(['mul1','mul2'].includes(el.dataset.row)){const next=el.dataset.row==='mul1'?'mul2':'final';focus(Array.from(root().querySelectorAll('input[data-row="'+next+'"]')).at(-1));}
  }
 }
 return true;
}
