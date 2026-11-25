// Server-issued §31 markup is reconstructed from a strict allowlist, not injected raw.
const textEscape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const allowedClasses=new Set(['mixed','whole','frac','num','den','mk-g5-mixed-model','mk-g5-mixed-wholes']);
const tags=new Set(['span','div','svg','rect','line','text']);
const numbers=new Set(['x','y','x1','x2','y1','y2','width','height','stroke-width','font-size']);
export function safeFractionPrompt(markup){
 const doc=new DOMParser().parseFromString(markup,'text/html');
 function render(n){
  if(n.nodeType===3)return textEscape(n.textContent);
  if(n.nodeType!==1)return '';
  const tag=n.localName.toLowerCase();if(!tags.has(tag))return '';
  const attrs=[];
  for(const a of n.attributes){
   const k=a.name.toLowerCase(),value=a.value;
   if(k==='class'&&allowedClasses.has(value))attrs.push('class="'+value+'"');
   else if(numbers.has(k)&&/^(?:[0-9]+(?:\.[0-9]+)?)(?:%)?$/.test(value))attrs.push(k+'="'+value+'"');
   else if(['fill','stroke'].includes(k)&&/^(?:#[0-9a-f]{3,8}|none|currentColor)$/i.test(value))attrs.push(k+'="'+value+'"');
   else if(tag==='svg'&&k==='viewbox'&&/^\d+(?: \d+){3}$/.test(value))attrs.push('viewBox="'+value+'"');
   else if(tag==='svg'&&k==='role'&&value==='img')attrs.push('role="img"');
   else if(tag==='svg'&&k==='aria-label')attrs.push('aria-label="'+textEscape(value)+'"');
   else if(tag==='svg'&&k==='preserveaspectratio'&&value==='xMidYMid meet')attrs.push('preserveAspectRatio="xMidYMid meet"');
  }
  return '<'+tag+(attrs.length?' '+attrs.join(' '):'')+'>'+Array.from(n.childNodes,render).join('')+'</'+tag+'>';
 }
 return Array.from(doc.body.childNodes,render).join('');
}
export function fractionView(question,item,busy){
 const {form}=question,field=(key,label)=>({key,label,value:item.cells?.[key]||'',wrong:item.wrong?.includes(key)||false});
 return {safePrompt:safeFractionPrompt(question.prompt_markup),fraction:{kind:form.kind,denominator:form.denominator,label:form.label,
  whole:form.kind==='mixed'?field('fraction:0','Целая часть'):null,
  numerator:form.kind!=='number'?field('fraction:1','Числитель'):null,
  number:form.kind==='number'?field('answer:0',form.label||'Ответ'):null},
  readOnly:item.solved,disabled:busy,feedback:item.feedback||'',primaryLabel:item.solved?'Далее':'Проверить',
  nextReady:item.solved,hideSkip:item.solved,solution:item.solved?question.steps:undefined};
}
export function readFractionCells(){
 const cells={};
 for(const el of document.querySelectorAll('#mk95-table-question input[data-mk95-fraction]'))cells[el.dataset.mk95Fraction]=el.value.replace(/[^0-9]/g,'').slice(0,6);
 return cells;
}
