/* Grade 5 textbook topics: independent catalog entries, no migration of existing IDs. */
(function(){
'use strict';
const topics=[
 {id:'division_remainder',ico:'➗',title:'Деление с остатком',sub:'неполное частное, остаток, проверка деления'},
 {id:'expand_brackets',ico:'🧩',title:'Раскрытие скобок',sub:'распределительное свойство умножения'},
 {id:'simplify_expressions',ico:'✏️',title:'Упрощение выражений',sub:'свойства действий, буквенные выражения'}
];
if(typeof G5_CORE==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5Lesson!=='function'||typeof g5q!=='function')throw Error('Grade 5 textbook dependencies unavailable');
for(const topic of topics){
 if(G5_CORE.some(t=>t.id===topic.id))throw Error('Duplicate Grade 5 textbook topic '+topic.id);
}
const point=G5_CORE.findIndex(t=>t.id==='order');
G5_CORE.splice(point<0?G5_CORE.length:point,0,...topics);
const previousDonor=g5DonorQuestion,previousLesson=g5Lesson;
function int(a,b){return ri(a,b)}
function position(){return Math.max(0,Number(blockSession&&blockSession.done)||0)%5}
function difficulty(){return Math.max(0,Math.min(2,Number(activeDifficulty())||0))}
function mk5Num(text,correct,why,family,extras=[]){
 const n=Number(correct);
 const q=g5q(text,g5nums(n,extras.filter(x=>Number.isFinite(Number(x))).map(Number)),String(n),why,family);
 q.mk5Audit={type:'numeric',expected:n};
 return q;
}
function multiple(text,correct,incorrect,why,family){
 const choices=[{label:correct,key:'ok'}];
 incorrect.filter(x=>x!==correct).forEach((v,i)=>{if(!choices.some(c=>c.label===v))choices.push({label:v,key:'bad'+i})});
 if(choices.length<3)throw Error('Insufficient distinct distractors '+family);
 return g5q(text,choices,'ok',why,family);
}
function division(){
 const tier=difficulty(),pos=position(),d=int(3,9+tier*6),quot=int(4+tier*3,17+tier*30),r=int(1,d-1),n=d*quot+r;
 if(pos===0)return mk5Num('Найди остаток при делении '+n+' на '+d+'.',r,n+' = '+d+' · '+quot+' + '+r+'. Остаток '+r+' меньше делителя '+d+'.','rem_find',[quot,d,r+1]);
 if(pos===1)return mk5Num('Найди неполное частное при делении '+n+' на '+d+'.',quot,n+' = '+d+' · '+quot+' + '+r+'. Неполное частное '+quot+'.','rem_quotient',[r,n,quot+1]);
 if(pos===2){const x=int(1,3+tier*5);return mk5Num('Число разделили на '+d+'. Получили неполное частное '+quot+' и остаток '+r+'. Найди делимое.',n,'Делимое = делитель · неполное частное + остаток = '+d+' · '+quot+' + '+r+' = '+n+'.','rem_dividend',[n+r,d*quot,quot+r]);}
 if(pos===3){const packs=quot,objects=n;return mk5Num('В '+objects+' тетрадях составили стопки по '+d+' тетрадей. Сколько тетрадей осталось после составления '+packs+' полных стопок?',r,objects+' − '+packs+' · '+d+' = '+r+'.','rem_story',[d,quot,r+1]);}
 const extra=tier===0?1:tier===1?2:3;const total=n+extra*d;
 return mk5Num('К числу '+n+' прибавили '+extra+' · '+d+'. Какой остаток получится при делении суммы на '+d+'?',r,total+' = '+d+' · '+(quot+extra)+' + '+r+'. Добавление целого числа делителей не меняет остаток.','rem_invariant',[quot+extra,extra*d,r+1]);
}
function expand(){
 const tier=difficulty(),p=position(),k=int(2,5+tier*4),a='a',b='b',m=int(2,5+tier*4);
 if(p===0)return multiple('Раскрой скобки: '+k+'(a + b).',k+'a + '+k+'b',[k+'a + b','a + '+k+'b',k+'(a + b) + a'],'Умножаем '+k+' на каждое слагаемое: '+k+'(a + b) = '+k+'a + '+k+'b.','expand_plus');
 if(p===1)return multiple('Раскрой скобки: '+k+'(a − b).',k+'a − '+k+'b',[k+'a − b','a − '+k+'b',k+'a + '+k+'b'],'Умножаем '+k+' на оба члена, знак вычитания сохраняется.','expand_minus');
 if(p===2){const x=int(2,9+tier*5),y=int(2,9+tier*5);return mk5Num('Вычисли удобным способом: '+k+' · ('+x+' + '+y+').',k*(x+y),k+' · ('+x+' + '+y+') = '+k+' · '+x+' + '+k+' · '+y+' = '+(k*x)+' + '+(k*y)+' = '+(k*(x+y))+'.','expand_numeric',[k*x+y,x+y+k,k*x+k]);}
 if(p===3){const v=tier>0?m:1;return multiple('Раскрой скобки: '+k+'(a + '+v+').',k+'a + '+(k*v),[k+'a + '+v,k+'a + '+(v+k),k+' + a + '+v],'Распределительное свойство: '+k+'a + '+k+' · '+v+' = '+k+'a + '+(k*v)+'.','expand_constant');}
 return multiple('Упрости после раскрытия скобок: '+k+'(a + b) + '+m+'a.',(k+m)+'a + '+k+'b',[k+'a + '+(k+m)+'b',(k+m)+'a + b',k+'a + '+(k+m)+'b'],'Раскрываем скобки: '+k+'a + '+k+'b + '+m+'a. Собираем слагаемые с a: '+(k+m)+'a + '+k+'b.','expand_multistep');
}
function simplify(){
 const tier=difficulty(),p=position(),k=int(2,6+tier*5),m=int(2,5+tier*5);
 if(p===0)return multiple('Упрости выражение: a + a + a.','3a',['a³','a + 3','3 + a'],'Три одинаковых слагаемых a составляют 3a.','simplify_repeated');
 if(p===1)return multiple('Приведи подобные слагаемые: '+k+'a + '+m+'a.',(k+m)+'a',[k*m+'a',k+'a + '+m,(k+m)+'a²'],'Складываем коэффициенты: ('+k+' + '+m+')a = '+(k+m)+'a.','simplify_like');
 if(p===2)return multiple('Вынеси общий множитель за скобки: '+k+'a + '+k+'b.',k+'(a + b)',[k+'(a · b)','a + '+k+'b',k+'a + b'],'Общий множитель '+k+': '+k+'a + '+k+'b = '+k+'(a + b).','simplify_factor');
 if(p===3){const x=int(2,8+tier*5);return mk5Num('Упрости '+k+'a + '+m+'a и найди значение при a = '+x+'.',(k+m)*x,'('+k+' + '+m+')a = '+(k+m)+'a; при a = '+x+': '+(k+m)+' · '+x+' = '+((k+m)*x)+'.','simplify_evaluate',[k*m*x,(k+m)+x,k*x+m]);}
 const n=int(2,5+tier*5);
 return multiple('Упрости выражение: '+k+'(a + b) + '+m+'a − '+n+'b.',(k+m)+'a'+(k-n===0?'':k-n>0?' + '+(k-n)+'b':' − '+(n-k)+'b'),[(k+m)+'a + '+(k+n)+'b',k+'a + '+(m-n)+'b',(k+m+n)+'ab'],'Раскрываем скобки: '+k+'a + '+k+'b + '+m+'a − '+n+'b = '+(k+m)+'a + '+(k-n)+'b.','simplify_multistep');
}
g5DonorQuestion=function(id){
 if(id==='division_remainder')return division();
 if(id==='expand_brackets')return expand();
 if(id==='simplify_expressions')return simplify();
 return previousDonor(id);
};
const lessons={
 division_remainder:'Деление с остатком: делимое = делитель · неполное частное + остаток. Остаток неотрицателен и всегда меньше делителя. Например, 26 = 9 · 2 + 8, значит 26 : 9 = 2 (ост. 8). Проверяем умножением и сложением.',
 expand_brackets:'Распределительное свойство: k(a + b) = ka + kb; k(a − b) = ka − kb. Множитель перед скобкой нужно умножить на каждый член. Пример: 3(a + 4) = 3a + 12.',
 simplify_expressions:'Упрощать — значит записать равное выражение короче. Подобные слагаемые имеют одинаковую буквенную часть: 3a + 2a = 5a. Общий множитель можно вынести: 4a + 4b = 4(a + b).'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:previousLesson(id)};
/* A topic title is not enough for textbook search: include common school formulations. */
const aliases={
 division_remainder:['остаток от деления','неполное частное','деление натуральных чисел с остатком'],
 expand_brackets:['раскрыть скобки','умножение суммы на число','распределительное свойство','распределительный закон'],
 simplify_expressions:['упростить выражение','приведение подобных слагаемых','буквенные выражения','вынести общий множитель'],
 'g6:brackets':['раскрыть скобки','распределительное свойство'],
 'g6:like_terms':['приведение подобных','собрать подобные слагаемые','упрощение буквенных выражений'],
 'g6:expression_simplify':['упростить выражение','буквенные выражения'],
 'g6:expression_value':['подстановка в буквенное выражение','значение выражения']
};
const oldGrade5=renderGrade5,oldGrade6=renderGrade6;
function normalizeSearch(value){return String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function enableTextbookSearch(grade){
 const catalog=grade===5?g5AllTopics():g6AllTopics(),selector=grade===5?'.g5-card':'.g6-card';
 const cards=[...mainView.querySelectorAll(selector)],hero=mainView.querySelector('.grade-hero');
 if(!hero||cards.length!==catalog.length)return;
 if(!document.getElementById('mk-textbook-search-styles')){
  const style=document.createElement('style');style.id='mk-textbook-search-styles';
  style.textContent='.mk-textbook-search{margin:16px 0 24px;padding:15px;border:1px solid var(--border,#cbd5e1);border-radius:14px;background:var(--card,#fff)}.mk-textbook-search label{display:block;font-weight:700;margin-bottom:8px}.mk-textbook-search input{display:block;width:100%;box-sizing:border-box;min-height:44px;padding:10px 12px;border:1px solid #9aa8b9;border-radius:10px;font:inherit;background:var(--bg,#fff);color:inherit}.mk-textbook-search input:focus-visible{outline:3px solid #3274d9;outline-offset:2px}.mk-textbook-search .mk-search-status{margin:8px 0 0;min-height:1.4em;font-size:.9em}';
  document.head.appendChild(style);
 }
 const wrap=document.createElement('div');wrap.className='mk-textbook-search';
 const label=document.createElement('label');label.textContent='Найти тему по учебнику';label.htmlFor='mk-textbook-search-input-'+grade;
 const input=document.createElement('input');input.type='search';input.id=label.htmlFor;input.placeholder='Например: деление с остатком, раскрытие скобок';input.autocomplete='off';
 const status=document.createElement('div');status.className='mk-search-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 wrap.append(label,input,status);hero.insertAdjacentElement('afterend',wrap);
 const rows=cards.map((card,i)=>{const topic=catalog[i],words=[topic.title,topic.sub,topic.shortTitle,topic.group,topic.section,...(aliases[topic.id]||[])];return {card,text:normalizeSearch(words.filter(Boolean).join(' '))}});
 function update(){
  const value=normalizeSearch(input.value),terms=value.split(' ').filter(Boolean);
  let count=0;
  for(const row of rows){const visible=terms.every(term=>row.text.includes(term));row.card.hidden=!visible;row.card.style.display=visible?'':'none';if(visible)count++}
  for(const group of mainView.querySelectorAll(grade===5?'.g5-group':'.g6-group')){
   const shown=[...group.querySelectorAll(selector)].some(card=>!card.hidden);
   group.hidden=!shown;group.style.display=shown?'':'none';
  }
  status.textContent=value?'Найдено тем: '+count+(count===0?'. Попробуйте другое название.':''):'Все темы: '+catalog.length;
 }
 input.addEventListener('input',update);update();
}
renderGrade5=function(...args){const result=oldGrade5(...args);enableTextbookSearch(5);return result};
renderGrade6=function(...args){const result=oldGrade6(...args);enableTextbookSearch(6);return result};

window.mkG5TextbookTopics={ids:topics.map(t=>t.id)};
})();