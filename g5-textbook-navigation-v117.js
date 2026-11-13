/* Grade 5: navigable two-volume textbook table of contents (Vilenkin 2023). */
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
function norm(v){return String(v||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\\p{L}\\p{N}]+/gu,' ').trim()}
function mount(){
 const host=mainView,topics=g5AllTopics(),cards=[...host.querySelectorAll('.g5-card')];
 const anchor=host.querySelector('.g5-group');
 if(!anchor||!cards.length)return;
 const old=host.querySelector('#mk-g5-textbook-nav');
 if(old)old.remove();
 const byId=new Map(topics.map(t=>[t.id,t]));
 // Do not rely on DOM order: the section organizer moves cards after rendering.
 const byTitle=new Map();
 for(const topic of topics){
  const matches=cards.filter(c=>norm(c.textContent).includes(norm(topic.title)));
  if(matches.length===1)byTitle.set(topic.id,matches[0]);
 }
 const root=document.createElement('section');root.id='mk-g5-textbook-nav';root.className='mk-g5-toc';
 const heading=document.createElement('h2');heading.textContent='Темы по учебнику Виленкина — 5 класс';
 const lead=document.createElement('p');lead.textContent='Обе части, все 51 пункта. Нажмите название, чтобы перейти к упражнениям.';
 const search=document.createElement('input');search.type='search';search.placeholder='Найти пункт: деление с остатком, упрощение выражений…';
 search.setAttribute('aria-label','Поиск по оглавлению пятого класса');search.className='mk-g5-toc-search';
 const status=document.createElement('p');status.setAttribute('role','status');status.className='mk-g5-toc-status';
 root.append(heading,lead,search,status);
 const rows=[];
 const issues=[];
 for(const ch of chapters){
  const detail=document.createElement('details');detail.className='mk-g5-toc-chapter';
  const summary=document.createElement('summary');summary.textContent='Часть '+ch.part+' · § '+ch.chapter+'. '+ch.title;
  const list=document.createElement('ol');list.start=ch.items[0][0];list.className='mk-g5-toc-list';
  detail.append(summary,list);
  root.append(detail);
  for(const [number,title,ids] of ch.items){
   const item=document.createElement('li');item.value=number;
   const label=document.createElement('span');label.textContent=title;label.className='mk-g5-toc-item-title';
   item.append(label);
   const links=document.createElement('div');links.className='mk-g5-toc-links';
   let resolved=0;
   for(const id of ids){
    const topic=byId.get(id),card=byTitle.get(id);
    if(!topic||!card){issues.push(number+': '+id);continue}
    const button=document.createElement('button');button.type='button';button.className='mk-g5-toc-link';
    button.textContent=topic.title;
    button.addEventListener('click',()=>{
      // Reveal topics that were hidden by the separate catalog search.
      const existing=host.querySelector('#mk-textbook-search-input-5');
      if(existing&&existing.value){existing.value='';existing.dispatchEvent(new Event('input',{bubbles:true}))}
      const group=card.closest('.g5-group');
      if(group){group.hidden=false;group.style.display=''}
      card.hidden=false;card.style.display='';
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.setAttribute('tabindex','-1');card.focus({preventScroll:true});
    });
    links.append(button);resolved++;
   }
   if(!resolved){const missing=document.createElement('strong');missing.className='mk-g5-toc-missing';missing.textContent='Тема не сопоставлена с каталогом';links.append(missing)}
   item.append(links);list.append(item);
   rows.push({number,title,ids,resolved,element:item,chapter:detail});
  }
 }
 search.addEventListener('input',()=>{
  const query=norm(search.value);let visible=0;
  for(const row of rows){
   const match=!query||norm([row.title,...row.ids.map(id=>byId.get(id)?.title||'')].join(' ')).includes(query);
   row.element.hidden=!match;if(match)visible++;
  }
  for(const d of root.querySelectorAll('details')){
   const found=[...d.querySelectorAll('li')].some(li=>!li.hidden);
   d.hidden=!found;
   if(query)d.open=found;
  }
  status.textContent='Найдено пунктов: '+visible+' из 51';
 });
 search.dispatchEvent(new Event('input'));
 // Placing immediately before sections preserves their existing layout and old topic IDs.
 anchor.insertAdjacentElement('beforebegin',root);
 if(!document.getElementById('mk-g5-toc-style')){
  const style=document.createElement('style');style.id='mk-g5-toc-style';
  style.textContent='.mk-g5-toc{padding:18px;margin:20px 0;border:1px solid var(--border,#9faebe);border-radius:16px;background:var(--card,#fff)}.mk-g5-toc h2{font-size:1.25rem;margin:0 0 10px}.mk-g5-toc p{margin:6px 0 12px}.mk-g5-toc-search{width:100%;min-height:44px;box-sizing:border-box;border:1px solid #929cae;border-radius:10px;padding:10px 12px;background:var(--bg,#fff);color:inherit;font:inherit}.mk-g5-toc-chapter{border-top:1px solid var(--border,#cbd5e1);padding:10px 0}.mk-g5-toc-chapter summary{cursor:pointer;font-weight:700;line-height:1.45}.mk-g5-toc-list{padding-left:28px;margin:10px 0}.mk-g5-toc-list li{padding:8px 0;overflow-wrap:anywhere}.mk-g5-toc-item-title{font-weight:600}.mk-g5-toc-links{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.mk-g5-toc-link{font:inherit;font-size:.9rem;border:1px solid #7187af;border-radius:9px;background:transparent;color:inherit;padding:8px 10px;cursor:pointer;text-align:left;max-width:100%}.mk-g5-toc-link:focus-visible,.mk-g5-toc-search:focus-visible{outline:3px solid #4385d8;outline-offset:2px}.mk-g5-toc-missing{color:#a32d2d}';
  document.head.append(style);
 }
 window.mkG5TextbookNavigation={total:rows.length,missing:issues,chapters:chapters.length};
}
renderGrade5=function(...args){const result=previous(...args);mount();return result};
})();