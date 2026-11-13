/* Curriculum sections §2–§3: separate Grade 5 natural-number skills. */
(function(){
'use strict';
const newTopics=[
{id:'natural_add',ico:'➕',title:'Сложение натуральных чисел и его свойства',sub:'сумма, переместительное и сочетательное свойства'},
{id:'natural_subtract',ico:'➖',title:'Вычитание натуральных чисел',sub:'разность, компоненты вычитания и проверка'},
{id:'natural_multiply',ico:'✖️',title:'Умножение натуральных чисел и его свойства',sub:'произведение и свойства умножения'},
{id:'natural_divide',ico:'➗',title:'Деление натуральных чисел',sub:'частное, неизвестные компоненты и проверка'},
{id:'numeric_literal_expressions',ico:'🔤',title:'Числовые и буквенные выражения',sub:'составление, чтение и вычисление значений выражений'}
];
if(typeof G5_CORE==='undefined'||typeof g5DonorQuestion!=='function')throw Error('Grade five curriculum source unavailable');
for(const topic of newTopics){if(G5_CORE.some(t=>t.id===topic.id))throw Error('Duplicate textbook topic '+topic.id)}
const pivot=G5_CORE.findIndex(t=>t.id==='operations');G5_CORE.splice(pivot<0?G5_CORE.length:pivot,0,...newTopics);
const oldDonor=g5DonorQuestion,oldLesson=g5Lesson;
const rnd=(a,b)=>ri(a,b);
const stage=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const pos=()=>Math.max(0,Number(blockSession?.done)||0)%5;
function question(text,value,ex,family,wrong=[]){
 const answer=Number(value),opts=g5nums(answer,wrong.filter(Number.isFinite));
 if(!Number.isSafeInteger(answer)||opts.length<3)throw Error('Invalid arithmetic '+family);
 const q=g5q(text,opts,String(answer),ex,family);q.mk5Audit={type:'numeric',expected:answer};
 return q;
}
function choose(text,value,wrong,ex,family){
 const options=[{label:value,key:'yes'}];
 for(const item of wrong){if(item!==value&&!options.some(x=>x.label===item))options.push({label:item,key:'no'+options.length})}
 if(options.length<3)throw Error('Invalid expression options '+family);
 return g5q(text,options,'yes',ex,family);
}
function make(id){
 const t=stage(),p=pos(),a=rnd(12,90+80*t),b=rnd(4,25+20*t),c=rnd(2,10+8*t);
 if(id==='natural_add'){
  if(p===0)return question('Найди сумму: '+a+' + '+b+'.',a+b,a+' + '+b+' = '+(a+b)+'.','add_pair',[a-b,a+b+10]);
  if(p===1)return question('Найди неизвестное слагаемое: x + '+b+' = '+(a+b)+'.',a,'Из суммы '+(a+b)+' вычтем известное слагаемое '+b+': x = '+a+'.','add_missing',[b,a+b]);
  if(p===2)return question('Вычисли удобным способом: '+a+' + '+b+' + '+c+'.',a+b+c,'По сочетательному свойству можно сгруппировать слагаемые. Сумма '+(a+b+c)+'.','add_three',[a+b,a+b+c+1]);
  if(p===3)return question('В библиотеку привезли '+a+' книг утром и '+b+' книг днём. Сколько книг привезли?',a+b,'Всего '+a+' + '+b+' = '+(a+b)+' книг.','add_story',[a-b,a+b+1]);
  return question('Число увеличили сначала на '+b+', затем ещё на '+c+' и получили '+(a+b+c)+'. Найди первоначальное число.',a,'Вычтем обе прибавки: '+(a+b+c)+' − '+b+' − '+c+' = '+a+'.','add_reverse',[a+b,a+c]);
 }
 if(id==='natural_subtract'){
  if(p===0)return question('Найди разность: '+(a+b)+' − '+b+'.',a,'Вычитаем '+b+' из '+(a+b)+' и получаем '+a+'.','sub_pair',[b,a+b]);
  if(p===1)return question('Найди вычитаемое: '+(a+b)+' − x = '+a+'.',b,'Вычитаемое равно разности уменьшаемого '+(a+b)+' и результата '+a+': x = '+b+'.','sub_missing',[a,a+b]);
  if(p===2)return question('Вычисли: '+(a+b+c)+' − '+b+' − '+c+'.',a,'Из '+(a+b+c)+' последовательно вычитаем '+b+' и '+c+'. Получаем '+a+'.','sub_two',[a+b,a+c]);
  if(p===3)return question('Было '+(a+b)+' карандашей, '+b+' раздали. Сколько осталось?',a,'Осталось '+(a+b)+' − '+b+' = '+a+' карандашей.','sub_story',[b,a+b]);
  return question('Вычисли удобным способом: '+(a+b+c)+' − ('+b+' + '+c+').',a,'Сначала сумма в скобках '+(b+c)+'. Затем '+(a+b+c)+' − '+(b+c)+' = '+a+'.','sub_bracket',[a+b,a+c]);
 }
 if(id==='natural_multiply'){
  if(p===0)return question('Найди произведение: '+b+' · '+c+'.',b*c,b+' · '+c+' = '+(b*c)+'.','mul_pair',[b+c,b*c+c]);
  if(p===1)return question('Найди неизвестный множитель: x · '+c+' = '+(b*c)+'.',b,'Неизвестный множитель равен '+(b*c)+' : '+c+' = '+b+'.','mul_missing',[c,b*c]);
  if(p===2)return question('Вычисли: '+b+' · '+c+' · '+(t+2)+'.',b*c*(t+2),'По сочетательному свойству ('+b+' · '+c+') · '+(t+2)+' = '+(b*c*(t+2))+'.','mul_three',[b*c,b*c*(t+2)+c]);
  if(p===3)return question('В каждой коробке '+b+' карандашей. Сколько карандашей в '+c+' одинаковых коробках?',b*c,'Умножаем '+b+' на '+c+': '+(b*c)+' карандашей.','mul_story',[b+c,b*c+c]);
  return question('Вычисли, используя распределительное свойство: '+c+' · ('+b+' + '+(t+3)+').',c*(b+t+3),c+' · '+b+' + '+c+' · '+(t+3)+' = '+(c*(b+t+3))+'.','mul_distributive',[b+c*(t+3),c*b+t+3]);
 }
 if(id==='natural_divide'){
  const d=c,quot=b,dividend=d*quot;
  if(p===0)return question('Найди частное: '+dividend+' : '+d+'.',quot,'Так как '+d+' · '+quot+' = '+dividend+', то частное '+quot+'.','div_pair',[d,quot+d]);
  if(p===1)return question('Найди делитель: '+dividend+' : x = '+quot+'.',d,'Делитель равен '+dividend+' : '+quot+' = '+d+'.','div_missing',[quot,quot+d]);
  if(p===2)return question('Найди делимое: x : '+d+' = '+quot+'.',dividend,'Делимое равно произведению '+d+' · '+quot+' = '+dividend+'.','div_dividend',[quot,d+quot]);
  if(p===3)return question('Разложили '+dividend+' листов поровну в '+d+' папок. Сколько листов в каждой папке?',quot,'В каждой папке '+dividend+' : '+d+' = '+quot+' листов.','div_story',[d,quot+d]);
  return question('Вычисли: ('+dividend+' + '+(d*(t+3))+') : '+d+'.',quot+t+3,'Делим каждое слагаемое на '+d+': '+quot+' + '+(t+3)+' = '+(quot+t+3)+'.','div_sum',[quot,quot+t+4]);
 }
 if(id==='numeric_literal_expressions'){
  const x=rnd(2,8+t*5),y=rnd(2,8+t*5);
  if(p===0)return question('Найди значение выражения '+b+' + x при x = '+x+'.',b+x,'Подставляем вместо x число '+x+': '+b+' + '+x+' = '+(b+x)+'.','expr_value_sum',[b,x]);
  if(p===1)return choose('Как записать сумму числа a и числа '+b+'?','a + '+b,['a · '+b,'a − '+b,'a : '+b],'Сумму записывают знаком +: a + '+b+'.','expr_sum_words');
  if(p===2)return question('Найди значение выражения '+c+'a при a = '+x+'.',c*x,'Умножаем '+c+' на '+x+': '+(c*x)+'.','expr_value_product',[c+x,c*x+c]);
  if(p===3)return choose('Как записать разность удвоенного числа a и числа '+b+'?','2a − '+b,['2a + '+b,'2(a − '+b+')','a − 2'+b],'Сначала удваиваем a, затем вычитаем '+b+': 2a − '+b+'.','expr_words_multistep');
  return question('При a = '+x+' и b = '+y+' найди значение выражения '+c+'a + '+(t+2)+'b.',c*x+(t+2)*y,'Подставляем: '+c+' · '+x+' + '+(t+2)+' · '+y+' = '+(c*x+(t+2)*y)+'.','expr_two_variables',[c*(x+y),(c+t+2)*(x+y)]);
 }
 throw Error('Unexpected Grade 5 topic '+id);
}
g5DonorQuestion=function(id){return newTopics.some(t=>t.id===id)?make(id):oldDonor(id)};
const lessons={
natural_add:'Слагаемые складывают и получают сумму. Переместительное свойство: a + b = b + a. Сочетательное свойство: (a + b) + c = a + (b + c). Можно менять порядок слагаемых и группировать их, чтобы получать круглые числа: 37 + 64 + 63 = (37 + 63) + 64 = 100 + 64 = 164. При прибавлении нуля число не меняется: a + 0 = a. Чтобы найти неизвестное слагаемое, из суммы вычти известные слагаемые. Например, x + 36 + 64 = 150, значит x + 100 = 150 и x = 50.',
natural_subtract:'Вычитание — действие, обратное сложению. Уменьшаемое − вычитаемое = разность. Неизвестное вычитаемое находят вычитанием разности из уменьшаемого.',
natural_multiply:'Произведение — результат умножения. a · b = b · a; (a · b) · c = a · (b · c). При умножении суммы на число каждое слагаемое умножают на это число.',
natural_divide:'Деление — действие, обратное умножению. Делимое : делитель = частное. Проверка: частное · делитель = делимое. Делить на 0 нельзя.',
numeric_literal_expressions:'Числовые выражения содержат числа и знаки действий. В буквенных выражениях вместо букв можно подставлять числа. Например, при a = 4 выражение 3a + 2 равно 3 · 4 + 2 = 14.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:oldLesson(id)};
window.mkG5CurriculumCoreIds=newTopics.map(t=>t.id);
})();