import {analyzeV306Backups} from './backup_preflight.mjs';
const $=id=>document.getElementById(id);
const input=$('backups'),review=$('review'),reset=$('reset'),status=$('status'),results=$('results'),rows=$('rows');
let generation=0;
function clear(){generation++;results.hidden=true;rows.replaceChildren();$('summary').textContent='';review.disabled=!input.files.length;status.textContent=input.files.length?'Выбрано файлов: '+input.files.length:'Файлы не выбраны';}
input.addEventListener('change',clear);reset.addEventListener('click',()=>{input.value='';clear();input.focus()});
function row(title,details,warning=false){
 const el=document.createElement('div');el.className='row';const h=document.createElement('strong');h.textContent=title;if(warning)h.className='warning';el.append(h);
 for(const detail of details){const p=document.createElement('p');p.textContent=detail;el.append(p)}rows.append(el);
}
review.addEventListener('click',async()=>{
 const token=++generation;review.disabled=true;results.hidden=true;rows.replaceChildren();status.textContent='Читаем файлы…';
 try{
  const files=Array.from(input.files);if(files.length>20)throw Error('Не более 20 файлов за один раз.');
  if(files.some(f=>f.size>32*1024*1024))throw Error('Одна из копий превышает 32 МБ.');
  const data=await Promise.all(files.map(async f=>({label:f.name,text:await f.text()})));
  if(token!==generation)return;
  const report=analyzeV306Backups(data);
  $('summary').textContent='Профилей: '+report.profiles.length+' · требуют ручной сверки: '+report.profiles.filter(p=>p.variants.length>1).length+' · ошибок файлов: '+report.errors.length;
  for(const p of report.profiles){
   row(p.variants[0].name+' — '+(p.variants.length===1?'Копия найдена':'Расхождение — нужна сверка'),p.variants.map(v=>v.name+' · '+v.xp+' XP · '+v.coins+' монет · '+v.sources.map(s=>s.label).join(', ')),p.variants.length>1);
  }
  for(const p of report.unresolved)row(p.name+' — нужен ID профиля',[p.source.label],true);
  for(const e of report.errors)row('Не удалось прочитать копию',[e.source.label+' · '+e.reason],true);
  for(const n of report.sameNameDifferentIds)row('Совпадающие имена, разные профили',[n.name+' · '+n.ids.length+' разных ID'],true);
  results.hidden=false;status.textContent='Сверка завершена. Ничего не перенесено.';$('results-title').focus();
 }catch(e){if(token===generation)status.textContent='Сверка остановлена: '+e.message;}
 finally{if(token===generation)review.disabled=!input.files.length;}
});