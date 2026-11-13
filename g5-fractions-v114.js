/* Grade 5 v114: conceptual fraction diversity and current two-part Vilenkin §5 sequence. */
(function(){
'use strict';
const IDs=['frac_parts','frac_read','frac_ray','frac_types'];
if(typeof G5_FRACTIONS==='undefined'||typeof g5DonorQuestion!=='function'||typeof g5q!=='function'||typeof g5nums!=='function'||typeof g5FractionChoices!=='function'||typeof g5Lesson!=='function')throw Error('G5 v114 prerequisites unavailable');
const oldDonor=g5DonorQuestion,oldLesson=g5Lesson;
const oldTitles={
 frac_parts:'Числитель и знаменатель',
 frac_read:'Чтение и запись дробей',
 frac_ray:'Дробь на числовом луче',
 frac_types:'Правильные и неправильные'
};
const updated={
 frac_parts:['Доли и дроби','Деление целого на равные части'],
 frac_read:['Чтение и запись обыкновенных дробей','Словесная запись и чтение дроби'],
 frac_ray:['Изображение дробей на координатной прямой','Доли единичного отрезка, отметки на прямой'],
 frac_types:['Правильные и неправильные дроби','Числитель меньше, равен или больше знаменателя']
};
for(const [id,[title,sub]] of Object.entries(updated)){
 const t=G5_FRACTIONS.find(x=>x.id===id);if(!t)throw Error('Missing fraction topic '+id);
 t.sub=sub+'; '+oldTitles[id];t.title=title;
}
const circleTopic=G5_FRACTIONS.find(topic=>topic.id==='frac_shapes');
if(!circleTopic)throw Error('Missing §25 circle, disk, sphere and cylinder topic');
circleTopic.title='Окружность, круг, шар, цилиндр';
circleTopic.sub='Различие плоских фигур и тел; радиус, диаметр и круглые основания цилиндра';
// Existing topic IDs and learned progress remain untouched. Textbook paragraph order only.
const ordered=[
 'frac_shapes','frac_parts','frac_read','frac_ray','frac_compare_den','frac_compare_num',
 'frac_types','frac_add','frac_sub','frac_division','frac_to_mixed','mixed_to_frac',
 'mixed_compare','mixed_add','mixed_sub','frac_equal','frac_reduce',
 'frac_common_lcm','frac_compare_diff','frac_add_diff','frac_sub_diff',
 'frac_mul_common','frac_part_number','frac_div_common','frac_restore','frac_word'
];
if(new Set(ordered).size!==G5_FRACTIONS.length||ordered.some(id=>!G5_FRACTIONS.some(x=>x.id===id)))throw Error('Fraction textbook inventory drift');
const byId=new Map(G5_FRACTIONS.map(x=>[x.id,x]));G5_FRACTIONS.splice(0,G5_FRACTIONS.length,...ordered.map(id=>byId.get(id)));
const ri5=(a,b)=>ri(a,b),level=()=>Math.max(0,Math.min(2,Number(activeDifficulty())||0));
const position=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const denoms=[3,5,7,11], dPick=()=>denoms[ri5(0,denoms.length-1)];
const family=(id,t,p)=>'v114_'+id+'_L'+t+'_F'+p;
function nQ(text,answer,ex,id,t,p,wrong=[]){
 if(!Number.isSafeInteger(answer)||answer<0)throw Error('Invalid natural answer '+id+': '+answer);
 const q=g5q(text,g5nums(answer,wrong.filter(Number.isSafeInteger)),String(answer),ex,family(id,t,p));
 q.mk5Audit={type:'numeric',expected:answer};return q;
}
function fQ(text,n,d,ex,id,t,p){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<2||n<0)throw Error('Invalid rational answer '+id+': '+n+'/'+d);
 const q=g5q(text,g5FractionChoices(n,d),n+'/'+d,ex,family(id,t,p));
 q.mk5Audit={type:'fraction',expected:n+'/'+d};return q;
}
function cQ(text,correct,others,ex,id,t,p){
 const opts=[correct,...others.filter(x=>x!==correct)],distinct=[...new Set(opts)];
 if(distinct.length<3)throw Error('Insufficient distinct options '+id+'/'+t+'/'+p);
 const q=g5q(text,distinct.map((label,i)=>({label,key:i===0?'ok':'wrong'+i})),'ok',ex,family(id,t,p));
 return q;
}
function strip(n,d){
 const x=String(n);return frac(n,d); // fraction HTML is the existing classroom renderer
}
function partPicture(d,n){
 const w=34,gap=3,total=d*(w+gap),size=Math.min(620,total);
 const boxes=Array.from({length:d},(_,i)=>'<rect x="'+(4+i*(w+gap))+'" y="6" width="'+w+'" height="34" rx="3" fill="'+(i<n?'#5d9cdc':'#edf3fc')+'" stroke="#52617a"/>').join('');
 return '<div class="mk-v114-graphic" style="width:100%;max-width:620px;overflow:hidden"><svg role="img" aria-label="Равные части целого, некоторые закрашены" viewBox="0 0 '+(total+8)+' 52" width="100%" height="54" preserveAspectRatio="xMinYMid meet">'+boxes+'</svg></div>';
}
const nouns=['ноль','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
const tails={
 2:['вторая','вторых'],3:['третья','третьих'],4:['четвёртая','четвёртых'],5:['пятая','пятых'],6:['шестая','шестых'],
 7:['седьмая','седьмых'],8:['восьмая','восьмых'],9:['девятая','девятых'],10:['десятая','десятых'],11:['одиннадцатая','одиннадцатых']
};
function words(n,d){
 if(!Number.isSafeInteger(n)||n<1||n>9||!tails[d])throw Error('Word form unavailable '+n+'/'+d);
 return nouns[n]+' '+tails[d][n===1?0:1];
}
function line(d,marks,maxUnits=2){
 const n=d*maxUnits,left=38,right=578,step=(right-left)/n;
 let svg='<svg class="mk-v114-ray" role="img" aria-label="Координатная прямая с равными делениями и отмеченными точками" viewBox="0 0 620 118" width="100%" style="display:block;max-width:680px;height:auto;margin:9px auto" preserveAspectRatio="xMidYMid meet"><line x1="32" y1="54" x2="600" y2="54" stroke="currentColor" stroke-width="2"/><path d="M600 54 L590 48 L590 60 Z" fill="currentColor"/>';
 for(let i=0;i<=n;i++){
  const x=left+i*step;svg+='<line x1="'+x+'" y1="'+(i%d===0?43:48)+'" x2="'+x+'" y2="61" stroke="currentColor" stroke-width="'+(i%d===0?2:1)+'"/>';
  if(i%d===0)svg+='<text x="'+x+'" y="84" font-size="17" fill="currentColor" text-anchor="middle">'+(i/d)+'</text>';
 }
 for(const mark of marks){
  if(mark.index<0||mark.index>n)throw Error('Ray point outside grid '+mark.index+'/'+n);
  const x=left+mark.index*step;svg+='<circle cx="'+x+'" cy="54" r="6" fill="#e94d65" stroke="#fff" stroke-width="1.5"/><text x="'+x+'" y="26" font-size="18" font-weight="700" text-anchor="middle" fill="currentColor">'+mark.label+'</text>';
 }
 return '<div style="width:100%;max-width:680px;overflow:hidden">'+svg+'</svg></div>';
}
function parts(t,p){
 const id='frac_parts',d=dPick(),a=ri5(1,d-2),b=ri5(1,d-a-1),total=a+b;
 if(t===0){
  if(p===0)return nQ('В записи '+strip(a,d)+' какое число является числителем?',a,'Числитель стоит над дробной чертой: '+a+'.',id,t,p,[d,a+1]);
  if(p===1)return nQ('В записи '+strip(a,d)+' какое число является знаменателем?',d,'Знаменатель под чертой: целое делят на '+d+' равных частей.',id,t,p,[a,d+1]);
  if(p===2)return nQ('Круг разделили на '+d+' равных долей. Сколько долей составляет целое?',d,'Все '+d+' долей составляют целое.',id,t,p,[a,1]);
  if(p===3)return nQ('Сколько частей закрашено на рисунке?'+partPicture(d,a),a,'Закрашено '+a+' из '+d+' равных частей.',id,t,p,[d,d-a]);
  return nQ('Закрашено '+strip(a,d)+' целого. Сколько долей из '+d+' осталось незакрашенными?',d-a,'В целой единице '+d+' долей, закрасили '+a+', осталось '+(d-a)+'.',id,t,p,[a,d]);
 }
 if(t===1){
  if(p===0)return nQ('На рисунке закрасили ещё '+b+' частей. Сколько всего теперь закрашено?'+partPicture(d,a),total,'Было '+a+' закрашенных частей, добавили '+b+': '+a+' + '+b+' = '+total+'.',id,t,p,[a,b]);
  if(p===1)return nQ('В целой полоске '+d+' равных частей. Не закрашено '+(d-a)+'. Сколько закрашено?',a,'Вычтем незакрашенные: '+d+' − '+(d-a)+' = '+a+'.',id,t,p,[d-a,d]);
  if(p===2)return nQ('К дроби '+strip(a,d)+' прибавили '+strip(b,d)+'. Какой будет числитель суммы, если знаменатель не менять?',total,'Одинаковые знаменатели: складываем числители '+a+' + '+b+' = '+total+'.',id,t,p,[a,b]);
  if(p===3)return nQ('На рисунке закрашено '+strip(a,d)+' целого. Сколько частей нужно закрасить ещё, чтобы получить '+strip(total,d)+'?'+partPicture(d,a),b,'Новый числитель '+total+', прежний '+a+', значит добавить '+total+' − '+a+' = '+b+' частей.',id,t,p,[a,total]);
  return fQ('Целое разделили на '+d+' частей: '+a+' части закрасили синим и '+b+' — красным. Какую долю всего целого закрасили?',total,d,'Всего закрашено '+a+' + '+b+' = '+total+' из '+d+' долей: '+strip(total,d)+'.',id,t,p);
 }
 // Advanced tasks require several separate operations on equal shares.
 if(p===0){const erase=ri5(1,a);return nQ('В полоске '+d+' частей. Сначала закрасили '+a+', затем ещё '+b+', после чего стёрли '+erase+' частей. Сколько осталось закрашенных?',a+b-erase,'Закрасили '+a+' + '+b+' = '+total+', убрали '+erase+', осталось '+(total-erase)+'.',id,t,p,[total,a,b]);}
 if(p===1){const erase=ri5(1,a);return nQ('Из '+d+' долей сначала закрасили '+a+', потом стёрли '+erase+', затем закрасили '+b+'. Сколько закрашено?',a-erase+b,''+a+' − '+erase+' + '+b+' = '+(a-erase+b)+' долей.',id,t,p,[total,a]);
 }
 if(p===2)return fQ('Из '+d+' долей целого сначала заняли '+a+', затем ещё '+b+', после чего освободили '+a+'. Какую долю целого занимают теперь?',b,d,'Заняли '+total+', освободили '+a+'. Осталось '+b+' долей из '+d+': '+strip(b,d)+'.',id,t,p);
 if(p===3)return nQ('Нужно закрасить '+strip(total,d)+' полоски. Уже закрасили '+strip(a,d)+', затем закрасили ещё '+strip(1,d)+'. Сколько долей осталось закрасить?',Math.max(0,b-1),'Цель '+total+' долей, уже '+(a+1)+'. Осталось '+Math.max(0,b-1)+' долей.',id,t,p,[a,b,total]);
 const boxes=ri5(2,5);return nQ('Было '+boxes+' целых шоколадки, каждую поделили на '+d+' одинаковых долек. Из первой взяли '+a+' дольки, из второй '+b+'. Сколько долек осталось всего?',boxes*d-total,'Всего '+boxes+' · '+d+' = '+(boxes*d)+' долек. Взяли '+a+' + '+b+' = '+total+'. Осталось '+(boxes*d-total)+'.',id,t,p,[total,boxes*d]);
}
function reading(t,p){
 const id='frac_read',d=[5,7,8,9,11][ri5(0,4)],a=ri5(1,Math.min(4,d-2)),b=ri5(1,Math.min(3,d-a-1)),total=a+b;
 const nextD=d===11?9:11;
 if(t===0){
  if(p===0)return fQ('Запиши обыкновенной дробью выражение «'+words(a,d)+'».',a,d,'Сначала записываем количество долей '+a+' в числитель, число всех долей '+d+' в знаменатель.',id,t,p);
  if(p===1)return cQ('Как правильно прочитать дробь '+strip(a,d)+'?',words(a,d),[words(a+1,d),words(a,nextD),words(a+2,d)],'Числитель '+a+' называется первым, затем название долей '+tails[d][a===1?0:1]+'.',id,t,p);
  if(p===2)return nQ('Сколько долей обозначает числитель в выражении «'+words(a,d)+'»?',a,'Первое слово — числитель, здесь '+a+'.',id,t,p,[d,a+1]);
  if(p===3)return nQ('Чему равен знаменатель дроби, которая читается «'+words(a,d)+'»?',d,'Название долей '+tails[d][a===1?0:1]+' означает знаменатель '+d+'.',id,t,p,[a,nextD]);
  return cQ('Какое слово в записи «'+words(a,d)+'» обозначает вид долей, то есть знаменатель?',tails[d][a===1?0:1],[tails[nextD][0],nouns[a],tails[d][a===1?1:0]],'Название вида долей указывает знаменатель '+d+'.',id,t,p);
 }
 if(t===1){
  if(p===0)return fQ('В коробке '+d+' одинаковых печений. Взяли '+a+'. Запиши долю, которую взяли.',a,d,'Взяли '+a+' из '+d+' равных частей: '+strip(a,d)+'.',id,t,p);
  if(p===1)return cQ('Дробь '+strip(total,d)+' получилась при сложении '+strip(a,d)+' и '+strip(b,d)+'. Как её прочитать?',words(total,d),[words(a,d),words(b,d),words(total,nextD)],'Сложим числители: '+a+' + '+b+' = '+total+'. Читаем «'+words(total,d)+'».',id,t,p);
  if(p===2)return nQ('К дроби «'+words(a,d)+'» прибавили «'+words(b,d)+'». Какой числитель у результата?',total,'Числители суммируются: '+a+' + '+b+' = '+total+'.',id,t,p,[a,b]);
  if(p===3)return fQ('Дробь «'+words(total,d)+'» уменьшили на «'+words(b,d)+'». Запиши получившуюся дробь.',a,d,'Вычитаем числители '+total+' − '+b+' = '+a+', знаменатель '+d+' сохраняем.',id,t,p);
  return nQ('Записали «'+words(a,d)+'», затем увеличили числитель на '+b+'. Чему стал равен числитель?',total,'Новый числитель '+a+' + '+b+' = '+total+'.',id,t,p,[a,b]);
 }
 if(p===0)return fQ('Из '+d+' одинаковых частей сначала взяли '+a+', затем ещё '+b+', а потом одну вернули. Какую часть целого оставили себе?',total-1,d,'Взяли '+total+' частей, вернули 1, осталось '+(total-1)+' из '+d+'.',id,t,p);
 if(p===1)return nQ('К дроби «'+words(total,d)+'» прибавили '+strip(1,d)+', а затем вычли «'+words(b,d)+'». Какой числитель получится?',a+1,''+total+' + 1 − '+b+' = '+(a+1)+'.',id,t,p,[total,a,b]);
 if(p===2)return cQ('Дробь «'+words(a,d)+'» увеличили на '+strip(b,d)+', а затем убрали '+strip(1,d)+'. Как прочитать результат?',words(total-1,d),[words(total,d),words(a,d),words(total-1,nextD)],'Числитель '+a+' + '+b+' − 1 = '+(total-1)+'. Итог «'+words(total-1,d)+'».',id,t,p);
 if(p===3){const half=ri5(1,Math.floor((d-1)/2)),totalEven=2*half;return fQ('От целого, разделённого на '+d+' долей, сначала взяли 1 долю, затем ещё '+(totalEven-1)+' долей. Все взятые доли поделили поровну на две группы. Какую долю целого составляет одна группа?',half,d,'Всего взяли 1 + '+(totalEven-1)+' = '+totalEven+' долей, разделили на две группы: '+half+' долей из '+d+'.',id,t,p);}
 return fQ('Из целого сначала взяли неизвестное число долей, потом добавили ещё '+b+' долей. Вернули одну взятую долю — осталось '+(total-1)+' из '+d+'. Какую долю целого взяли сначала?',a,d,'Вернём одну долю: было '+total+', из них позже добавили '+b+'. Первоначально взяли '+total+' − '+b+' = '+a+' из '+d+'.',id,t,p);
}
function ray(t,p){
 const id='frac_ray',d=dPick(),a=ri5(1,Math.max(1,d-3)),b=ri5(a+1,d-1),k=ri5(1,Math.min(3,d-b));
 const A=()=>line(d,[{index:a,label:'A'}]), AB=()=>line(d,[{index:a,label:'A'},{index:b,label:'B'}]), B=()=>line(d,[{index:b,label:'B'}]);
 if(t===0){
  if(p===0)return fQ('Единица разделена на '+d+' равных отрезков. Запиши координату точки A дробью со знаменателем '+d+'.'+A(),a,d,'От нуля до точки A '+a+' единичных долей из '+d+'.',id,t,p);
  if(p===1)return nQ('Единица разделена на '+d+' частей. Какой числитель у координаты A, если знаменатель равен '+d+'?'+A(),a,'До A '+a+' равных делений. Числитель '+a+'.',id,t,p,[d,b]);
  if(p===2)return nQ('Сколько маленьких отрезков от 0 до A на прямой?'+A(),a,'Считаем '+a+' делений от 0 до точки A.',id,t,p,[b,d]);
  if(p===3)return nQ('На сколько равных отрезков поделили интервал от 0 до 1?'+A(),d,'От 0 до 1 всего '+d+' равных частей.',id,t,p,[a,d+1]);
  return nQ('Сколько маленьких делений между точкой A и числом 1?'+A(),d-a,'От 0 до 1 '+d+' делений, до A '+a+', осталось '+(d-a)+'.',id,t,p,[a,d]);
 }
 if(t===1){
  if(p===0)return nQ('Сколько маленьких делений находится от A до B на координатной прямой?'+AB(),b-a,'Координаты на рисках '+a+' и '+b+'; между ними '+(b-a)+' делений.',id,t,p,[a,b]);
  if(p===1)return nQ('От точки A сделали '+k+' маленьких шагов вправо. Какой числитель у новой координаты со знаменателем '+d+'?'+A(),a+k,'Новая точка на риске '+a+' + '+k+' = '+(a+k)+'.',id,t,p,[a,k]);
  if(p===2)return fQ('Точка A находится правее 1. Запиши её координату дробью со знаменателем '+d+'.'+line(d,[{index:d+a,label:'A'}]),d+a,d,'Один целый отрезок — '+d+' долей; затем ещё '+a+'. Итого '+(d+a)+'/'+d+'.',id,t,p);
  if(p===3)return nQ('Найди, сколько делений от 0 до точки A, лежащей правее 1.'+line(d,[{index:d+a,label:'A'}]),d+a,'От 0 до 1 '+d+' делений, после 1 ещё '+a+'. Всего '+(d+a)+'.',id,t,p,[d,a]);
  return nQ('Точка B отмечена между 0 и 1. Сколько маленьких делений осталось от B до единицы?'+AB(),d-b,'От 0 до 1 '+d+' делений, до B '+b+'. Осталось '+(d-b)+'.',id,t,p,[a,b]);
 }
 const move=ri5(1,Math.min(3,d-b)),ret=ri5(1,Math.min(a,move));
 if(p===0)return fQ('По координатной прямой из точки A сдвинулись вправо на '+move+' деления, затем влево на '+ret+'. Запиши новую координату дробью со знаменателем '+d+'.'+A(),a+move-ret,d,'Номер конечной риски: '+a+' + '+move+' − '+ret+' = '+(a+move-ret)+'.',id,t,p);
 if(p===1)return fQ('От A дошли до B, а затем прошли ещё '+move+' деления вправо. Какую дробь с знаменателем '+d+' показывает конечная точка?'+AB(),b+move,d,'Точка B на '+b+'-й риске, потом '+move+' вправо: '+(b+move)+'/'+d+'.',id,t,p);
 if(p===2)return fQ('Какую часть единичного отрезка составляет расстояние AB? Запиши дробью со знаменателем '+d+'.'+AB(),b-a,d,'Делений между A и B: '+b+' − '+a+' = '+(b-a)+'. Это '+(b-a)+'/'+d+'.',id,t,p);
 if(p===3)return nQ('От A дошли до B, затем вернулись на '+ret+' делений. На какой по счёту риске от нуля остановились?'+AB(),b-ret,'Точка B на '+b+'-й риске; после возврата на '+ret+' получаем '+(b-ret)+'.',id,t,p,[a,b]);
 return nQ('Сначала прошли от 0 до A, потом от A до B и ещё '+move+' деления вправо. Сколько всего маленьких делений прошли?'+AB(),b+move,'От 0 до B прошли '+b+' делений, затем ещё '+move+': '+(b+move)+'.',id,t,p,[a,b]);
}
function properImproperModel(d,n){
 if(!Number.isSafeInteger(d)||d<2||!Number.isSafeInteger(n)||n<=0||n>4*d)throw Error('Invalid fraction bar diagram '+n+'/'+d);
 const bars=Math.max(1,Math.ceil(n/d)),cw=480/d,content=[];
 for(let row=0;row<bars;row++){
  const cells=Math.min(d,Math.max(0,n-row*d));
  const elements=Array.from({length:d},(_,i)=>'<rect x="'+(74+i*cw).toFixed(2)+'" y="'+(9+row*42)+'" width="'+(cw-2).toFixed(2)+'" height="30" rx="2" fill="'+(i<cells?'#67a5e6':'#f0f4fb')+'" stroke="#49658b" stroke-width="1"/>').join('');
  content.push('<text x="15" y="'+(30+row*42)+'" font-size="17" fill="currentColor">'+(row+1)+'</text>'+elements);
 }
 const height=bars*42+7;
 return '<div style="width:100%;max-width:600px;overflow:hidden;margin:7px auto"><svg viewBox="0 0 570 '+height+'" width="100%" role="img" aria-label="Дробь '+n+'/'+d+': '+bars+' полосок по '+d+' равных частей, всего закрашено '+n+' частей" style="height:auto">'+content.join('')+'</svg></div>';
}
function types(t,p){
 const id='frac_types',d=dPick(),a=ri5(1,d-2),whole=ri5(1,3),imp=whole*d+a,k=ri5(1,Math.min(3,d-a));
 if(t===0){
  if(p===0)return cQ('Какой вид имеет дробь '+strip(a,d)+'?'+properImproperModel(d,a),'Правильная',['Неправильная','Смешанное число','Десятичная дробь'],'Числитель '+a+' меньше знаменателя '+d+', дробь правильная.',id,t,p);
  if(p===1)return cQ('Какой вид имеет дробь '+strip(imp,d)+'?'+properImproperModel(d,imp),'Неправильная',['Правильная','Смешанное число','Десятичная дробь'],'Числитель '+imp+' больше знаменателя '+d+', дробь неправильная.',id,t,p);
  if(p===2)return cQ('Сравни дробь '+strip(a,d)+' с единицей.','Меньше 1',['Равно 1','Больше 1','Сравнить нельзя'],''+a+' < '+d+', поэтому дробь меньше единицы.',id,t,p);
  if(p===3)return nQ('Какой наименьший числитель при знаменателе '+d+' делает дробь неправильной?',d,'Неправильная дробь удовлетворяет условию числитель ≥ знаменателя; минимум '+d+'.',id,t,p,[d-1,d+1]);
  return nQ('На сколько числитель '+a+' меньше знаменателя '+d+' у правильной дроби?',d-a,'Разность '+d+' − '+a+' = '+(d-a)+'.',id,t,p,[a,d]);
 }
 if(t===1){
  if(p===0)return cQ('К правильной дроби '+strip(a,d)+' прибавили '+strip(d,d)+'. Какая дробь получится по виду?','Неправильная',['Правильная','Десятичная','Смешанное число'],'Новый числитель '+(a+d)+' больше '+d+', дробь неправильная.',id,t,p);
  if(p===1)return cQ('От неправильной дроби '+strip(imp,d)+' отняли '+strip(whole*d,d)+'. Какой вид имеет результат?','Правильная',['Неправильная','Десятичная','Смешанное число'],'Получится '+strip(a,d)+': числитель меньше знаменателя.',id,t,p);
  if(p===2)return fQ('Среди дробей '+strip(a,d)+', '+strip(d,d)+' и '+strip(imp,d)+' найди единственную правильную.',a,d,'Только у '+strip(a,d)+' числитель меньше знаменателя.',id,t,p);
  if(p===3)return nQ('В неправильной дроби '+strip(imp,d)+' сколько полных единиц содержится?'+properImproperModel(d,imp),whole,'Делим '+imp+' на '+d+': неполное частное '+whole+', остаток '+a+'.',id,t,p,[a,d]);
  return nQ('Сколько нужно прибавить к числителю '+a+' дроби со знаменателем '+d+', чтобы она впервые стала неправильной?',d-a,'Требуется достичь числителя '+d+', добавляем '+(d-a)+'.',id,t,p,[a,d]);
 }
 if(p===0)return nQ('У дроби со знаменателем '+d+' числитель '+imp+'. Сколько минимально надо вычесть из числителя, чтобы дробь стала правильной?',imp-d+1,'Для правильной дроби числитель не выше '+(d-1)+'. Вычитаем '+imp+' − '+(d-1)+' = '+(imp-d+1)+'.',id,t,p,[whole,imp-d]);
 if(p===1)return nQ('У правильной дроби '+strip(a,d)+' за шаг прибавляют '+strip(1,d)+'. Сколько шагов нужно до первой неправильной дроби?',d-a,'Нужен числитель '+d+', сейчас '+a+'. Число шагов '+(d-a)+'.',id,t,p,[a,d]);
 if(p===2)return cQ('Сначала к дроби '+strip(a,d)+' прибавили целую единицу, затем вычли '+strip(a,d)+'. Какой вид имеет результат '+strip(d,d)+'?'+properImproperModel(d,d),'Неправильная',['Правильная','Смешанное число','Десятичная дробь'],'После действий '+a+'/'+d+' + '+d+'/'+d+' − '+a+'/'+d+' = '+d+'/'+d+'. Равенство 1 записано неправильной дробью.',id,t,p);
 if(p===3)return nQ('Из неправильной дроби '+strip(imp,d)+' надо вычесть целые доли так, чтобы осталась ровно 1 целая. На сколько единиц нужно уменьшить числитель?',imp-d,'Чтобы получить '+strip(d,d)+', уменьшаем числитель '+imp+' до '+d+'. Разность '+(imp-d)+'.',id,t,p,[whole,a]);
 return nQ('Сколько нужно прибавить к числителю '+a+' дроби со знаменателем '+d+', чтобы результат был строго больше 1?',d+1-a,'Требуемый минимальный числитель '+(d+1)+'. Прибавляем '+(d+1)+' − '+a+' = '+(d+1-a)+'.',id,t,p,[d-a,a]);
}
function make(id){
 const t=level(),p=position();
 if(id==='frac_parts')return parts(t,p);
 if(id==='frac_read')return reading(t,p);
 if(id==='frac_ray')return ray(t,p);
 if(id==='frac_types')return types(t,p);
 return oldDonor(id);
}
g5DonorQuestion=function(id){return IDs.includes(id)?make(id):oldDonor(id)};
const lessons={
frac_shapes:'Окружность — линия границы круга. Круг — плоская фигура вместе с внутренней областью. Шар — объёмное тело. Цилиндр имеет два круглых основания. Радиус соединяет центр окружности с её точкой, диаметр проходит через центр и соединяет две точки окружности. Диаметр равен двум радиусам: d = 2r. Дуга — часть окружности между двумя точками. Сектор — часть круга, ограниченная двумя радиусами и дугой.',
frac_parts:'Обыкновенная дробь показывает равные доли целого. Знаменатель — сколько равных частей в целой единице, числитель — сколько таких долей взято. Если доли прибавили или убрали, следи за числителем, а знаменатель сохраняй.',
frac_read:'Читать дробь начинаем с числителя: одна, две, три, четыре и т. д. Знаменатель называем видом частей: одна третья, две пятых, семь восьмых. Запись и чтение дроби должны означать одни и те же доли.',
frac_ray:'Координатная прямая показывает единицу, разделённую на равные части. Чтобы узнать координату точки, считаем деления от нуля: сколько делений прошли — числитель, сколько делений в единице — знаменатель. При сдвигах учитывай направление.',
frac_types:'Правильная дробь имеет числитель меньше знаменателя; неправильная — больше либо равен знаменателю. Правильная дробь меньше 1. Неправильная может быть равна 1 или больше 1. Для сложных задач сначала выполни изменение числителя.'
};
g5Lesson=function(id){return Object.prototype.hasOwnProperty.call(lessons,id)?lessons[id]:oldLesson(id)};
window.mkG5V114Fractions=IDs.slice();
})();
