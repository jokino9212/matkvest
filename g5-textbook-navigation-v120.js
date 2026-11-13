/* Grade 5 v120: a single existing upper search and collapsible textbook navigation. */
(function () {
'use strict';
const chapters = [
 {part:1,chapter:1,title:'Натуральные числа и нуль. Шкалы',items:[
 [1,'Представление числовой информации в таблицах',['number_tables']],
 [2,'Цифры и числа',['natural']],
 [3,'Отрезок и его длина. Ломаная. Многоугольник',['segments_polygons']],
 [4,'Плоскость, прямая, луч, угол',['plane_line_ray']],
 [5,'Шкалы и координатная прямая',['coordinate']],
 [6,'Сравнение натуральных чисел',['natural_compare']],
 [7,'Представление числовой информации в столбчатых диаграммах',['column_charts']]
 ]},
 {part:1,chapter:2,title:'Сложение и вычитание натуральных чисел',items:[
 [8,'Действие сложения. Свойства сложения',['natural_add']],
 [9,'Действие вычитания. Свойства вычитания',['natural_subtract']],
 [10,'Числовые и буквенные выражения',['numeric_literal_expressions']],
 [11,'Уравнение',['equations']]
 ]},
 {part:1,chapter:3,title:'Умножение и деление натуральных чисел',items:[
 [12,'Действие умножения. Свойства умножения',['natural_multiply']],
 [13,'Действие деления',['natural_divide']],
 [14,'Деление с остатком',['division_remainder']],
 [15,'Упрощение выражений',['simplify_expressions','expand_brackets']],
 [16,'Порядок действий в вычислениях',['order']],
 [17,'Степень с натуральным показателем',['powers']],
 [18,'Делители и кратные',['divisors_multiples_g5']],
 [19,'Свойства и признаки делимости',['divisibility_rules_g5']]
 ]},
 {part:1,chapter:4,title:'Площади и объёмы',items:[
 [20,'Формулы',['formulas_g5']],
 [21,'Площадь. Формула площади прямоугольника',['area_rectangle']],
 [22,'Единицы измерения площадей',['area_units_g5']],
 [23,'Прямоугольный параллелепипед',['cuboid']],
 [24,'Объёмы. Объём прямоугольного параллелепипеда',['volume']]
 ]},
 {part:2,chapter:5,title:'Обыкновенные дроби',items:[
 [25,'Окружность, круг, шар, цилиндр',['frac_shapes']],
 [26,'Доли и дроби. Изображение дробей на координатной прямой',['frac_parts','frac_read','frac_ray']],
 [27,'Сравнение дробей',['frac_compare_den','frac_compare_num']],
 [28,'Правильные и неправильные дроби',['frac_types']],
 [29,'Сложение и вычитание дробей с одинаковыми знаменателями',['frac_add','frac_sub']],
 [30,'Деление натуральных чисел и дроби',['frac_division']],
 [31,'Смешанные числа',['frac_to_mixed','mixed_to_frac','mixed_compare']],
 [32,'Сложение и вычитание смешанных чисел',['mixed_add','mixed_sub']],
 [33,'Основное свойство дроби',['frac_equal']],
 [34,'Сокращение дробей',['frac_reduce']],
 [35,'Приведение дробей к общему знаменателю',['frac_common_lcm']],
 [36,'Сравнение, сложение и вычитание дробей с разными знаменателями',['frac_compare_diff','frac_add_diff','frac_sub_diff']],
 [37,'Умножение дробей',['frac_mul_common']],
 [38,'Нахождение части целого',['frac_part_number']],
 [39,'Деление дробей',['frac_div_common']],
 [40,'Нахождение целого по его части',['frac_restore']]
 ]},
 {part:2,chapter:6,title:'Десятичные дроби',items:[
 [41,'Десятичная запись дробей',['dec_place','dec_to_common']],
 [42,'Сравнение десятичных дробей',['dec_compare']],
 [43,'Сложение и вычитание десятичных дробей',['dec_add','dec_sub']],
 [44,'Округление чисел. Прикидка',['dec_round']],
 [45,'Умножение десятичной дроби на натуральное число',['dec_mul_nat']],
 [46,'Деление десятичной дроби на натуральное число',['dec_div_nat']],
 [47,'Умножение на десятичную дробь',['dec_mul_dec']],
 [48,'Деление на десятичную дробь',['dec_div_dec']]
 ]},
 {part:2,chapter:7,title:'Инструменты для вычислений и измерений',items:[
 [49,'Калькулятор',['calculator']],
 [50,'Виды углов. Чертёжный треугольник',['angle_types']],
 [51,'Измерение углов. Транспортир',['angles']]
 ]}
];
const expected=chapters.flatMap(c=>c.items);
if(expected.length!==51 || expected.some((e,i)=>e[0]!==i+1))throw Error('Vilenkin Grade 5 textbook numbering error');

const previous=renderGrade5;
let collapsed=false,menuObserver=null;
function norm(value){
 return String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function menuStyle(){
 if(document.getElementById('mk-g5-toc-style'))return;
 const style=document.createElement('style');
 style.id='mk-g5-toc-style';
 style.textContent=[
 '.mk-g5-toc{margin:24px 0;padding:22px;border:1px solid #dbe5f3;border-radius:20px;background:var(--card,#fff);box-shadow:0 8px 30px rgba(29,59,104,.055);color:inherit}',
 '.mk-g5-toc *{box-sizing:border-box}',
 '.mk-g5-toc-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap}',
 '.mk-g5-toc-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;max-width:100%}',
 '.mk-g5-toc-actions .mk-g5-toc-search{flex:1 1 230px;min-width:160px}',
 '.mk-g5-toc-toggle{min-height:46px;padding:10px 15px;border:1px solid #9fb7d9;border-radius:12px;color:inherit;font:inherit;font-size:.94rem;font-weight:750;cursor:pointer;white-space:nowrap;background:var(--bg,#f7faff)}',
 '.mk-g5-toc-toggle:hover{background:#e8f1ff}',
 '.mk-g5-toc-toggle:focus-visible{outline:3px solid #78a5ec;outline-offset:2px}',
 '.mk-g5-toc-body[hidden]{display:none!important}',
 '.mk-g5-toc-collapsed{padding-top:14px;padding-bottom:14px}',
 '.mk-g5-toc-collapsed .mk-g5-toc-head{margin-bottom:0}',
 '.mk-g5-toc h2{margin:0;font-size:clamp(1.18rem,2.3vw,1.5rem);line-height:1.25;font-weight:800;letter-spacing:-.015em}',
 '.mk-g5-toc-search{width:min(100%,340px);min-height:46px;padding:11px 14px;border:1px solid #c7d5e9;border-radius:12px;background:var(--bg,#f7faff);color:inherit;font:inherit;font-size:1rem}',
 '.mk-g5-toc-search:focus-visible{outline:3px solid #78a5ec;outline-offset:2px}',
 '.mk-g5-toc-status{margin:0 0 10px;font-size:.9rem;color:var(--muted,#617186)}',
 '.mk-g5-toc-status[hidden],.mk-g5-toc-chapter[hidden],.mk-g5-toc-part[hidden],.mk-g5-toc-list li[hidden]{display:none!important}',
 '.mk-g5-toc-part{margin:0 0 17px}',
 '.mk-g5-toc-part:last-child{margin-bottom:0}',
 '.mk-g5-toc-part-heading{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:0 2px;font-size:.98rem;font-weight:800;color:var(--text,#253e67)}',
 '.mk-g5-toc-part-heading::before{content:"";display:block;width:5px;height:20px;border-radius:5px;background:#537fe1}',
 '.mk-g5-toc-chapter{margin:9px 0;border:1px solid #dce5f2;border-radius:14px;overflow:hidden;background:var(--card,#fff)}',
 '.mk-g5-toc-chapter>summary{display:flex;align-items:center;gap:12px;list-style:none;cursor:pointer;min-height:56px;padding:14px 16px;font-weight:720;font-size:.98rem;line-height:1.4;background:var(--bg,#f7faff);color:inherit}',
 '.mk-g5-toc-chapter>summary::-webkit-details-marker{display:none}',
 '.mk-g5-toc-chapter>summary::after{content:"";flex:none;width:9px;height:9px;margin-left:auto;border-right:2px solid #58749e;border-bottom:2px solid #58749e;transform:rotate(45deg);transition:transform .15s ease}',
 '.mk-g5-toc-chapter[open]>summary::after{transform:rotate(225deg)}',
 '.mk-g5-toc-chapter>summary:hover{background:#eaf2ff}',
 '.mk-g5-toc-chapter>summary:focus-visible{outline:3px solid #78a5ec;outline-offset:-3px}',
 '.mk-g5-toc-num{display:inline-grid;place-items:center;flex:none;width:37px;min-height:27px;padding:3px 5px;border-radius:8px;background:#e2eafe;color:#3159a0;font-size:.86rem;font-weight:800;font-variant-numeric:tabular-nums}',
 '.mk-g5-toc-chapter[open]>.mk-g5-toc-list{border-top:1px solid #e2e9f3}',
 '.mk-g5-toc-list{margin:0;padding:5px 10px;list-style:none}',
 '.mk-g5-toc-list li{margin:0;padding:0;border-bottom:1px solid #e7ecf4;list-style:none}',
 '.mk-g5-toc-list li:last-child{border-bottom:0}',
 '.mk-g5-toc-link{width:100%;display:grid;grid-template-columns:33px minmax(0,1fr) 18px;align-items:center;gap:12px;min-height:55px;padding:10px 12px;border:0;border-radius:9px;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit;font-size:.96rem;line-height:1.38;transition:background .12s ease}',
 '.mk-g5-toc-link:hover{background:#ebf3ff}',
 '.mk-g5-toc-link:focus-visible{outline:3px solid #78a5ec;outline-offset:-3px;background:#ebf3ff}',
 '.mk-g5-toc-item-title{min-width:0;overflow-wrap:break-word;font-weight:590}',
 '.mk-g5-toc-item-number{font-size:.88rem;font-weight:750;font-variant-numeric:tabular-nums;color:var(--muted,#66768b);text-align:center}',
 '.mk-g5-toc-link::after{content:"";display:block;width:9px;height:9px;border-top:2px solid #8092ab;border-right:2px solid #8092ab;transform:rotate(45deg);justify-self:center}',
 '.mk-g5-toc-extra{padding-left:23px}',
 '.mk-g5-toc-extra .mk-g5-toc-link{min-height:49px;font-size:.91rem;color:var(--muted,#586c88)}',
 '.mk-g5-toc-extra .mk-g5-toc-item-title{font-weight:500}',
 '.mk-g5-toc-extra .mk-g5-toc-item-number{font-size:1rem;color:#8aa0bd}',
 '.mk-g5-toc-missing{display:block;padding:12px;color:#a32d2d}',
 '@media(max-width:650px){.mk-g5-toc{margin:14px 0;padding:13px;border-radius:15px}.mk-g5-toc-actions{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.mk-g5-toc-actions .mk-g5-toc-search{min-width:0;width:100%;font-size:.93rem}.mk-g5-toc-toggle{font-size:.86rem;padding:8px 10px;min-height:46px}.mk-g5-toc-head{align-items:stretch;flex-direction:column;gap:11px}.mk-g5-toc-search{width:100%;max-width:none}.mk-g5-toc-part{margin-bottom:16px}.mk-g5-toc-chapter>summary{min-height:54px;padding:12px;gap:9px}.mk-g5-toc-list{padding:4px}.mk-g5-toc-link{grid-template-columns:25px minmax(0,1fr) 17px;gap:8px;min-height:53px;padding:10px 8px;font-size:.92rem}.mk-g5-toc-extra{padding-left:14px}.mk-g5-toc-extra .mk-g5-toc-link{font-size:.88rem}}',
 '@media(prefers-reduced-motion:reduce){.mk-g5-toc-link,.mk-g5-toc-chapter>summary::after{transition:none}}'
 ].join('');
 document.head.append(style);
}
function mount(){
 const host=mainView,topics=g5AllTopics(),cards=[...host.querySelectorAll('.g5-card')],anchor=host.querySelector('.g5-group');
 if(!anchor||!cards.length)return;
 host.querySelector('#mk-g5-textbook-nav')?.remove();
 const byId=new Map(topics.map(t=>[t.id,t]));
 // The existing section organizer moves cards. Match by title, preferring its own heading.
 const byTitle=new Map();
 for(const topic of topics){
  const matches=cards.filter(card=>norm(card.textContent).includes(norm(topic.title)));
  matches.sort((a,b)=>{
   const needle=norm(topic.title);
   const x=norm(a.textContent),y=norm(b.textContent);
   return x.indexOf(needle)-y.indexOf(needle)||x.length-y.length;
  });
  if(matches.length)byTitle.set(topic.id,matches[0]);
 }
 menuStyle();
 const root=document.createElement('section');root.id='mk-g5-textbook-nav';root.className='mk-g5-toc';
 const head=document.createElement('div');head.className='mk-g5-toc-head';
 const heading=document.createElement('h2');heading.textContent='Темы 5 класса';
 const actions=document.createElement('div');actions.className='mk-g5-toc-actions';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='mk-g5-toc-toggle';
 const body=document.createElement('div');body.className='mk-g5-toc-body';body.id='mk-g5-toc-parts';
 toggle.setAttribute('aria-controls',body.id);
 actions.append(toggle);head.append(heading,actions);root.append(head,body);
 // The native search above the menu must be the ONLY visible search.
 // For legacy/anonymous screens without it, retain the older top textbook field as fallback.
 const textbookInput=host.querySelector('#mk-textbook-search-input-5');
 const textbookPanel=textbookInput?.closest('.mk-textbook-search');
 let primarySearch=null;
 const findNativeSearch=()=>[...host.querySelectorAll('input')].find(field=>
  field!==textbookInput && !field.closest('#mk-g5-textbook-nav') &&
  !field.closest('.mk-textbook-search') &&
  /найти тему по названию|найти тему/i.test(norm(field.placeholder))
 )||null;
 function clearActiveSearch(){
  if(primarySearch&&primarySearch.value){
   primarySearch.value='';
   primarySearch.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(textbookInput&&textbookInput.value){
   textbookInput.value='';
   textbookInput.dispatchEvent(new Event('input',{bubbles:true}));
  }
 }
 const rows=[],issues=[],parts=new Map(),details=[];
 function visit(card){
   // The old catalog search may have hidden all the original cards and their groups.
   clearActiveSearch();
   const group=card.closest('.g5-group');
   if(group){group.hidden=false;group.style.display=''}
   card.hidden=false;card.style.display='';
   card.scrollIntoView({behavior:'smooth',block:'center'});
   card.setAttribute('tabindex','-1');card.focus({preventScroll:true});
 }
 function button(text,card,number,secondary){
   const b=document.createElement('button');b.type='button';b.className='mk-g5-toc-link';
   const num=document.createElement('span');num.className='mk-g5-toc-item-number';num.textContent=secondary?'↳':String(number);
   num.setAttribute('aria-hidden','true');
   const title=document.createElement('span');title.className='mk-g5-toc-item-title';title.textContent=text;
   b.append(num,title);
   b.addEventListener('click',()=>visit(card));
   return b;
 }
 for(const ch of chapters){
  let part=parts.get(ch.part);
  if(!part){
    const container=document.createElement('div');container.className='mk-g5-toc-part';
    const label=document.createElement('h3');label.className='mk-g5-toc-part-heading';label.textContent='Часть '+ch.part;
    container.append(label);body.append(container);
    part={container,chapters:[]};parts.set(ch.part,part);
  }
  const detail=document.createElement('details');detail.className='mk-g5-toc-chapter';
  const summary=document.createElement('summary');
  const ordinal=document.createElement('span');ordinal.className='mk-g5-toc-num';ordinal.textContent='§ '+ch.chapter;
  const text=document.createElement('span');text.textContent=ch.title;
  summary.append(ordinal,text);
  const list=document.createElement('ol');list.className='mk-g5-toc-list';list.start=ch.items[0][0];
  detail.append(summary,list);part.container.append(detail);part.chapters.push(detail);details.push(detail);
  for(const [number,title,ids] of ch.items){
   const li=document.createElement('li');li.value=number;
   let resolved=0;
   for(let i=0;i<ids.length;i++){
    const id=ids[i],topic=byId.get(id),card=byTitle.get(id);
    if(!topic||!card){issues.push(number+': '+id);continue}
    const label=i===0?title:topic.title;
    const b=button(label,card,number,i>0);
    if(i===0)li.append(b);
    else{
     const secondary=document.createElement('div');secondary.className='mk-g5-toc-extra';secondary.append(b);li.append(secondary);
    }
    resolved++;
   }
   if(!resolved){
    const unavailable=document.createElement('strong');unavailable.className='mk-g5-toc-missing';
    unavailable.textContent=title;li.append(unavailable);
   }
   list.append(li);
   rows.push({number,title,ids,resolved,element:li,chapter:detail,part});
  }
 }
 const previousOpen=new Map();
 let filtering=false;
 function update(){
  const query=norm(primarySearch?.value||'');
  if(query&&!filtering){
   for(const d of details)previousOpen.set(d,d.open);
   filtering=true;
  }
  let count=0;
  for(const row of rows){
   const haystack=norm([row.title,...row.ids.map(id=>byId.get(id)?.title||'')].join(' '));
   const show=!query||query.split(' ').every(term=>haystack.includes(term));
   row.element.hidden=!show;
   if(show)count++;
  }
  for(const detail of details){
   const show=[...detail.querySelectorAll('.mk-g5-toc-list li')].some(li=>!li.hidden);
   detail.hidden=!show;
   if(query)detail.open=show;
   else if(filtering)detail.open=previousOpen.get(detail)||false;
  }
  for(const part of parts.values())part.container.hidden=part.chapters.every(d=>d.hidden);
  if(!query){filtering=false;previousOpen.clear()}
 }
 function synchronizeSearch(){
  update();
  if(primarySearch && textbookInput && primarySearch!==textbookInput && textbookInput.value!==primarySearch.value){
   textbookInput.value=primarySearch.value;
   textbookInput.dispatchEvent(new Event('input',{bubbles:true}));
  }
 }
 function bindUpperSearch(){
  const native=findNativeSearch(),target=native||textbookInput;
  if(target===primarySearch)return;
  if(primarySearch)primarySearch.removeEventListener('input',synchronizeSearch);
  primarySearch=target;
  if(textbookPanel){
   textbookPanel.hidden=!!native;
   textbookPanel.style.display=native?'none':'';
   if(!native){
    const label=textbookPanel.querySelector('label');
    if(label)label.textContent='Найти тему';
    if(textbookInput)textbookInput.placeholder='Найти тему по названию...';
   }
  }
  if(primarySearch)primarySearch.addEventListener('input',synchronizeSearch);
  synchronizeSearch();
 }
 function showCollapsed(scroll){
  body.hidden=collapsed;
  root.classList.toggle('mk-g5-toc-collapsed',collapsed);
  toggle.textContent=collapsed?'Показать разделы':'К карточкам';
  toggle.setAttribute('aria-expanded',String(!collapsed));
  if(scroll){
    const target=collapsed?host.querySelector('.g5-group'):root;
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 toggle.addEventListener('click',()=>{collapsed=!collapsed;showCollapsed(true)});
 showCollapsed(false);
 anchor.insertAdjacentElement('beforebegin',root);
 if(menuObserver)menuObserver.disconnect();
 bindUpperSearch();
 // Some account-specific UI inserts the upper search after the lesson list has rendered.
 menuObserver=new MutationObserver(()=>{if(findNativeSearch()!==null&&findNativeSearch()!==primarySearch)bindUpperSearch()});
 menuObserver.observe(host,{subtree:true,childList:true});
 window.mkG5TextbookNavigation={total:rows.length,missing:issues,chapters:details.length,volumes:parts.size,version:120,refreshSearch:bindUpperSearch};
}
renderGrade5=function(...args){const result=previous(...args);mount();return result};
})();