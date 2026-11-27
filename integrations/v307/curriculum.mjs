import {validateNodes} from './visual_nodes.mjs';
export const V307_CURRICULUM_TOPICS=Object.freeze({"g5:calculator":"Калькулятор","g4:numbers":"Многозначные числа","g4:quantities":"Величины","g4:geometry":"Периметр и площадь","g4:word":"Текстовые задачи","g4:moro_to_1000":"Нумерация. Счёт предметов. Разряды","g4:moro_add_sub_1000":"Сложение и вычитание в пределах 1 000","g4:moro_small_multiply":"Умножение в пределах 1 000","g4:moro_small_divide":"Деление в пределах 1 000","g4:moro_charts":"Столбчатые диаграммы","g4:moro_classes":"Разряды и классы","g4:moro_read":"Чтение многозначных чисел","g4:moro_write":"Запись многозначных чисел","g4:moro_expanded":"Разрядные слагаемые","g4:moro_compare":"Сравнение многозначных чисел","g4:moro_times_ten":"Увеличение и уменьшение в 10, 100 и 1 000 раз","g4:moro_millions":"Класс миллионов. Класс миллиардов","g4:moro_length":"Единицы длины. Таблица единиц длины","g4:moro_area":"Единицы площади. Таблица единиц площади","g4:moro_grid_area":"Палетка","g4:moro_mass":"Единицы массы. Тонна и центнер","g4:moro_year":"Единицы времени. Год","g4:moro_clock":"Время от 0 до 24 часов","g4:moro_century":"Век","g4:moro_time":"Таблица единиц времени","g4:moro_add_sub":"Устные и письменные приёмы сложения и вычитания","g4:moro_sum_terms":"Нахождение суммы нескольких слагаемых","g4:moro_written_sub":"Письменные приёмы вычитания","g4:moro_share":"Нахождение нескольких долей целого","g4:moro_add_units":"Сложение и вычитание величин","g4:moro_mul_properties":"Свойства умножения","g4:moro_mul_one":"Письменное умножение на однозначное число","g4:moro_mul_units":"Умножение величины на число","g4:moro_mul_trailing_one":"Умножение на однозначное число, когда один множитель оканчивается нулями","g4:moro_div_one":"Письменное деление на однозначное число","g4:moro_partition":"Задачи на пропорциональное деление","g4:moro_speed":"Скорость. Единицы скорости. Задачи на движение","g4:moro_mul_product":"Умножение числа на произведение","g4:moro_mul_zeros":"Умножение на числа, оканчивающиеся нулями","g4:moro_mul_two_zeros":"Умножение двух чисел, оканчивающихся нулями","g4:moro_meeting":"Задачи на встречное движение","g4:moro_mul_group":"Перестановка и группировка множителей","g4:moro_cube":"Куб числа и куб","g4:moro_box":"Прямоугольный параллелепипед","g4:moro_div_product":"Деление числа на произведение","g4:moro_div_powers":"Деление с остатком на 10, 100 и 1 000","g4:moro_div_zeros":"Письменное деление на числа, оканчивающиеся нулями","g4:moro_fourth":"Задачи на нахождение четвёртого пропорционального","g4:moro_opposite":"Задачи на движение в противоположных направлениях","g4:moro_mul_sum":"Умножение числа на сумму","g4:moro_mul_double":"Письменное умножение на двузначное число","g4:moro_pyramid":"Пирамида","g4:moro_cylinder_cone":"Цилиндр и конус","g4:moro_mul_triple":"Письменное умножение на трёхзначное число","g4:moro_two_differences":"Задачи на нахождение неизвестных по двум разностям","g4:moro_div_double":"Письменное деление на двузначное число","g4:moro_div_double_rest":"Деление с остатком на двузначное число","g4:moro_circle":"Окружность и круг. Радиус и диаметр","g4:moro_work":"Задачи на производительность труда","g4:moro_div_triple":"Письменное деление на трёхзначное число","g4:moro_review_calculation":"Арифметические действия. Сложение и вычитание","g4:moro_review_muldiv":"Арифметические действия. Умножение и деление","g4:moro_review_all":"Смешанные задания за год","g5:natural":"Цифры и числа","g5:coordinate":"Шкалы и координатная прямая","g5:numeric_literal_expressions":"Числовые и буквенные выражения","g5:number_tables":"Представление числовой информации в таблицах","g5:column_charts":"Представление числовой информации в столбчатых диаграммах","g5:divisors_multiples_g5":"Делители и кратные","g5:divisibility_rules_g5":"Свойства и признаки делимости","g5:formulas_g5":"Формулы","g5:area_units_g5":"Единицы измерения площадей","g5:segments_polygons":"Отрезок и его длина. Ломаная. Многоугольник","g5:plane_line_ray":"Плоскость, прямая, луч, угол","g5:area_rectangle":"Площадь. Формула площади прямоугольника","g5:cuboid":"Прямоугольный параллелепипед","g5:angle_types":"Виды углов. Чертёжный треугольник","g5:operations":"Действия с натуральными","g5:division_remainder":"Деление с остатком","g5:expand_brackets":"Раскрытие скобок","g5:simplify_expressions":"Упрощение выражений","g5:order":"Порядок действий","g5:powers":"Степень числа","g5:equations":"Уравнения","g5:geometry":"Периметр и площадь","g5:volume":"Объёмы. Объём прямоугольного параллелепипеда","g5:angles":"Измерение углов. Транспортир","g5:charts":"Круг и диаграммы","g5:units":"Единицы величин","g5:word":"Текстовые задачи"});
export const isCurriculum=topic=>Object.hasOwn(V307_CURRICULUM_TOPICS,topic);
const safe=9007199254740991n;
const bound=n=>{if(n>safe||n< -safe)throw Error('ANSWER_INVALID');return n};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n};
function rational(n,d){bound(n);bound(d);if(!d)throw Error('ANSWER_INVALID');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g]}
export function parseNumber(raw,allowPercent=false){
 if(typeof raw!=='string'||raw.length>64)throw Error('ANSWER_INVALID');
 let s=raw.trim().replace(/[−–—]/g,'-');if(s.endsWith('%')){if(!allowPercent)throw Error('ANSWER_INVALID');s=s.slice(0,-1).trim()}
 let m=s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(m){let w=bound(BigInt(m[1])),n=bound(BigInt(m[2])),d=bound(BigInt(m[3]));if(n<0n||n>=d)throw Error('ANSWER_INVALID');return rational((w<0n?-1n:1n)*((w<0n?-w:w)*d+n),d);}
 m=s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);if(m)return rational(BigInt(m[1]),BigInt(m[2]));
 m=s.replace(/\s+/g,'').match(/^([+-]?\d+)(?:[.,](\d{1,6}))?$/);if(!m)throw Error('ANSWER_INVALID');
 const w=bound(BigInt(m[1])),digits=m[2]||'',d=10n**BigInt(digits.length),n=(m[1].startsWith('-')?-1n:1n)*((w<0n?-w:w)*d+BigInt(digits||'0'));return rational(n,d);
}
export function parseTime(raw){const m=String(raw).trim().match(/^(\d{1,2}):([0-5]\d)$/);if(!m||Number(m[1])>23)throw Error('ANSWER_INVALID');return Number(m[1])*60+Number(m[2]);}
const equal=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const modes=['choice','number','time','remainder'];
export function validateCurriculum(q,{publicOnly=false,solved=false}={}){
 if(!q||!modes.includes(q.mode)||typeof q.expression!=='string'||!q.expression||q.expression.length>500)throw Error('CURRICULUM_QUESTION');
 validateNodes(q.prompt);
 if(!publicOnly){if(!Array.isArray(q.steps)||q.steps.length!==1||typeof q.steps[0]!=='string'||!q.steps[0]||q.steps[0].length>2500)throw Error('CURRICULUM_QUESTION');validateNodes(q.solution);}
 if(q.mode==='choice'){
  const n=q.choice_labels?.length;if(!Number.isInteger(n)||n<2||n>4||q.choice_labels.some(x=>typeof x!=='string'||!x||x.length>160)||new Set(q.choice_labels).size!==n||JSON.stringify(q.choices)!==JSON.stringify(Array.from({length:n},(_,i)=>i))||!Array.isArray(q.choice_nodes)||q.choice_nodes.length!==n)throw Error('CURRICULUM_CHOICE');
  q.choice_nodes.forEach(validateNodes);if(!publicOnly&&(!Number.isInteger(q.answer)||!q.choices.includes(q.answer)))throw Error('CURRICULUM_CHOICE');
 }else{
  if(q.choices!==undefined||q.answer!==undefined)throw Error('CURRICULUM_QUESTION');
  if(q.mode==='number'&&(typeof q.unit_suffix!=='string'||q.unit_suffix.length>20||typeof q.allow_percent!=='boolean'))throw Error('CURRICULUM_NUMBER');
  if(!publicOnly){const e=q.expected;if(!e)throw Error('CURRICULUM_EXPECTED');if(q.mode==='number'&&(!Number.isSafeInteger(e.n)||!Number.isSafeInteger(e.d)||e.d<1||e.unitSuffix!==q.unit_suffix||e.allowPercent!==q.allow_percent)||q.mode==='time'&&(!Number.isInteger(e.minutes)||e.minutes<0||e.minutes>=1440)||q.mode==='remainder'&&(!Number.isSafeInteger(e.quotient)||!Number.isSafeInteger(e.remainder)||e.quotient<0||e.remainder<0))throw Error('CURRICULUM_EXPECTED');}
 }
 if(publicOnly){
  const allowed=new Set(['mode','expression','prompt','unit_suffix','allow_percent','choices','choice_labels','choice_nodes',...(solved?['steps','solution_nodes']:[])]);
  if(Object.keys(q).some(k=>!allowed.has(k)))throw Error('CURRICULUM_SECRET');
  if(Object.hasOwn(q,'steps')&&(!Array.isArray(q.steps)||q.steps.length!==1||typeof q.steps[0]!=='string'||!q.steps[0]||q.steps[0].length>2500))throw Error('CURRICULUM_QUESTION');
  if(Object.hasOwn(q,'solution_nodes'))validateNodes(q.solution_nodes);
 }
 return q;
}
export function curriculumKeys(q){return q.mode==='remainder'?['answer:0','answer:1']:['answer:0'];}
export function normalizeCurriculum(q,raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_CELLS');
 const keys=curriculumKeys(q),cells={};
 for(const [k,v] of Object.entries(raw)){if(!keys.includes(k)||typeof v!=='string'||v.length>64)throw Error('INVALID_CELLS');if(v.trim())cells[k]=v.trim();}
 return cells;
}
export function curriculumFeedback(q,raw){
 const cells=normalizeCurriculum(q,raw),missing=curriculumKeys(q).filter(k=>!Object.hasOwn(cells,k)),wrong=[];
 for(const [k,v] of Object.entries(cells)){
  let ok;
  if(q.mode==='choice'){if(!/^\d{1,2}$/.test(v)||!q.choices.includes(Number(v)))throw Error('ANSWER_INVALID');ok=Number(v)===q.answer;}
  else if(q.mode==='time')ok=parseTime(v)===q.expected.minutes;
  else{const a=parseNumber(v,q.mode==='number'&&q.allow_percent);if(q.mode==='remainder'&&a[1]!==1n)throw Error('ANSWER_INVALID');const e=q.mode==='number'?rational(BigInt(q.expected.n),BigInt(q.expected.d)):[BigInt(k==='answer:0'?q.expected.quotient:q.expected.remainder),1n];ok=equal(a,e);}
  if(!ok)wrong.push(k);
 }
 return {cells,missing,wrong:missing.length?[]:wrong};
}
export function applyCurriculumAction(row,revision,kind,value){
 if(row.status!=='draft'||row.revision!==revision)throw Error('DRAFT_CHANGED');
 const next=structuredClone(row),item=next.draft[next.index],q=next.questions[next.index];
 if(['input','check','skip'].includes(kind)&&!item.solved){
  item.cells=normalizeCurriculum(q,value);item.wrong=[];
  if(kind==='input')item.feedback='';
  else if(kind==='check'){
   let f;try{f=curriculumFeedback(q,item.cells);}catch(e){item.feedback='Проверь формат ответа.';next.revision++;return next;}
   item.wrong=f.wrong;
   if(f.missing.length)item.feedback='Заполни обязательные поля.';
   else{if(item.checks.length>=1000)throw Error('CHECK_LIMIT');item.checks.push(f.cells);item.solved=!f.wrong.length;item.feedback=item.solved?'Верно!':'Проверь ответ и попробуй ещё раз.';}
  }else{item.skipped=true;try{curriculumFeedback(q,item.cells);}catch{item.cells={};}}
 }else if(kind!=='advance'||!item.solved)throw Error('INVALID_ACTION');
 if(kind==='advance'||kind==='skip'){if(next.index+1===next.count){next.body={...next.start,items:next.draft.map(x=>({format:'curriculum-v307',checks:x.checks,skipped:x.skipped,...(x.skipped?{cells:x.cells}:{})}))};next.status='pending';}else next.index++;}
 next.revision++;return next;
}
export function readCurriculumCells(host){return Object.fromEntries([...host.querySelectorAll('input[data-mk307-cell]')].map(e=>[e.dataset.mk307Cell,e.value]));}
export function curriculumModel(q,item,busy=false,{publicOnly=false}={}){
 const solved=!!item.solved,cells=item.cells||{},field=(key,label,placeholder='')=>({key,label,placeholder,value:cells[key]||'',wrong:item.wrong?.includes(key)||false});
 return {promptNodes:q.prompt,solutionNodes:solved?(publicOnly?q.solution_nodes:q.solution):undefined,solution:solved?q.steps:undefined,curriculumMode:q.mode,curriculumFields:q.mode==='choice'?[]:q.mode==='remainder'?[field('answer:0','Частное'),field('answer:1','Остаток')]:[field('answer:0','Ответ',q.mode==='time'?'чч:мм':'')],unitSuffix:q.unit_suffix||'',answer:cells['answer:0']||'',choices:q.choices?.map((v,i)=>({label:q.choice_labels[i],nodes:q.choice_nodes[i],selected:cells['answer:0']===String(v),disabled:solved||busy,className:'btn soft'})),readOnly:solved,disabled:busy,feedback:item.feedback||'',primaryLabel:solved?'Далее':'Проверить',nextReady:solved,hideSkip:solved};
}
