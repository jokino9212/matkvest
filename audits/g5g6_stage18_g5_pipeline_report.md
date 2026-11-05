# Grade5 quiz pipeline and conversion sites

- g5UniqChoices line 1617, preview: function g5UniqChoices(arr){  let out=[];  for(const x of arr){    const sameKey=out.some(y=>String(y.key)===String(x.key));    const sameLabel=out.some(y=>String(y.label)===String(x.label));    if(!sameKey&&!sameLabel)out.push(x);  }  return out; }  /* HOTFIX 8.51: semantic single-choice safety.    Финализатор имеет право только удалить эквивалентные дубли и перемешать    уже подготовленные generator-ом варианты. Он НЕ создаёт новые distractors:    универсальный числовой rank-balancer не знает 
- g5q line 1681, preview: function g5q(text,choices,correct,explain,templateId="base"){let u=finalizeChoices(String(correct),g5UniqChoices(choices),Math.max(2,Math.min(4,choices.length||4))),c=u.find(x=>String(x.key)===String(correct));return{text,choices:u,correct:String(correct),correctLabel:c?c.label:"",explain,templateId}} function g5nums(ans,extras=[]){  let arr=[ans,...extras],out=g5UniqChoices(arr.map(v=>({label:String(v).replace(".",","),key:String(v)}))),guard=0;  const n=Number(ans);  while(out.length<4&&guard+
- g5NewFractionQuestion line 1970, preview: function g5NewFractionQuestion(id){  if(id==="frac_shapes"){    const t=ri(0,3);    if(t===0)return g5q("Чем окружность отличается от круга?",[{label:"Окружность — граница, круг — граница вместе с внутренней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");    i
- g5DonorQuestion line 2079, preview: function g5DonorQuestion(id){  if(G5_NEW_FRACTION_THEORY[id])return g5NewFractionQuestion(id);  if(id==="fraction_mix"){id=G5_FRACTIONS[ri(0,G5_FRACTIONS.length-1)].id}   if(id==="frac_parts"){    let d=ri(3,12),n=ri(1,d-1),askNum=Math.random()<.5;    return g5q(`В дроби ${frac(n,d)} чему равен <b>${askNum?"числитель":"знаменатель"}</b>?`,    g5nums(askNum?n:d,[askNum?d:n]),String(askNum?n:d),askNum?`В дроби ${frac(n,d)} верхнее число ${n} — числитель: оно показывает количество взятых частей.`:`
## g5q( count 108
~~~javascript
length-1)],picked=[...lower.slice(0,rank),correct,...higher.slice(0,targetCount-1-rank)];return picked
}
function finalizeChoices(correctKey,rows,targetCount){
 const desired=Math.max(2,Number(targetCount||rows.length||4)),clean=uniqueChoiceRows(String(correctKey),rows);
 return shuffleOptions(clean.slice(0,desired))
}
function g5q(text,choices,correct,explain,templateId="base"){let u=finalizeChoices(String(correct),g5UniqChoices(choices),Math.max(2,Math.min(4,choices.length||4))),c=u.find(x=>String(x.key)===String(correct));return{text,choices:u,correct:String(correct),correctLabel:c?c.label:"",explain,templateId}}
function g5nums(ans,extras=[]){
 let arr=[ans,...extras],out=g5UniqChoices(arr.map(v=>({label:String(v).replace(".",","),key:String(v)}))),guard=0;
 const n=Number(ans);
 while(out.length<4&&guard++<120){
   let v=Number.isFinite(n)?n+ri(-Math.max(12,Math.abs(n)||12),Math.max(12,Math.abs(n)||12)):ri(0,99);
   if(v<0)continue;
   const c={label:String(v).replace(".",","),key:String(v)};
   if(!out.some(x
~~~
~~~javascript
b);
 for(let k=1;items.length<4&&k<40;k++){put(n+k,d);put(Math.max(0,n-k),d);put(n,d+k);put(n+k,d+k)}
 if(items.length!==4)throw Error("Не удалось собрать варианты");
 return items.map(([a,b])=>({label:frac(a,b),key:a+"/"+b}));
}
function g5NewFractionQuestion(id){
 if(id==="frac_shapes"){
   const t=ri(0,3);
   if(t===0)return g5q("Чем окружность отличается от круга?",[{label:"Окружность — граница, круг — граница вместе с внутренней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a
~~~
~~~javascript
нней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="fra
~~~
~~~javascript
,key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="frac_mul_common"||id==="frac_div_common"){
   const diff=activeDifficulty(),bound=diff===0?6:diff===1?10:14;
   const b=ri(2,bound),d=ri(2,bound),a=ri(1,b+(diff?3:0)),c=ri(1
~~~
~~~javascript
 ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="frac_mul_common"||id==="frac_div_common"){
   const diff=activeDifficulty(),bound=diff===0?6:diff===1?10:14;
   const b=ri(2,bound),d=ri(2,bound),a=ri(1,b+(diff?3:0)),c=ri(1,d+(diff?3:0));
   const division=id==="frac_div_common",n=division?a*d:a*c,den=division?b*c:b*d;
   const [rn,rd]=g5NewRat(n,den),bad=[[a+c,b+d],[a*c,b*d],[a*d,b*c],[Math.abs(a-c),Math.max(1,b+d)],[n+1,den],[Math.max(0,n-1),den]];
   const op=division?"÷":"×",second=
~~~
~~~javascript
c=ri(1,d+(diff?3:0));
   const division=id==="frac_div_common",n=division?a*d:a*c,den=division?b*c:b*d;
   const [rn,rd]=g5NewRat(n,den),bad=[[a+c,b+d],[a*c,b*d],[a*d,b*c],[Math.abs(a-c),Math.max(1,b+d)],[n+1,den],[Math.max(0,n-1),den]];
   const op=division?"÷":"×",second=division?` = ${frac(a,b)} × ${frac(d,c)}`:"";
   return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(n,den,bad),rn+"/"+rd,division?`Делитель ${frac(c,d)} заменяем обратной дробью ${frac(d,c)}: ${frac(a,b)} ÷ ${frac(c,d)}${second} = ${frac(n,den)} = ${frac(rn,rd)}.`:`Умножаем числители: ${a} × ${c} = ${n}, знаменатели: ${b} × ${d} = ${den}. Получаем ${frac(n,den)} = ${frac(rn,rd)}.`,division?"fraction_division":"fraction_multiplication");
 }
 const difficulty=activeDifficulty(),type=ri(0,3);
 const pairs=difficulty===0?[[2,4],[3,6],[3,4],[4,6],[5,10],[4,5],[3,5]]:difficulty===1?[[4,6],[5,8],[6,9],[6,10],[8,12],[5,12],[8,9],[7,10]]:[[8,12],[9,15],[10,12],[12,18],[8,15],[7,12],[10,21],[9,14]];
 let [b,d]=pairs[ri(0,pa
~~~
~~~javascript
l/b,k=l/d;
 let a=ri(1,b-1),c=ri(1,d-1);
 if(id==="frac_compare_diff"&&type===2&&gcd(b,d)>1){const g=gcd(b,d);a=b/g;c=d/g}
 let A=a*m,C=c*k;if(id==="frac_sub_diff"&&A<C){[a,c]=[c,a];[b,d]=[d,b];[A,C]=[C,A]}const common=`${frac(a,b)} = ${frac(A,l)}, ${frac(c,d)} = ${frac(C,l)}`;
 if(id==="frac_common_lcm"){
   if(type===0)return g5q(`Для дробей ${frac(a,b)} и ${frac(c,d)} найди <b>наименьший общий знаменатель</b>.`,g5nums(l,[b*d,b+d,Math.max(b,d)]),String(l),`НОК(${b}, ${d}) = ${l}; дополнительные множители ${m} и ${k}.`,"lcm");
   if(type===1||type===2){const first=type===1,orig=first?a:c,den=first?b:d,scale=first?m:k,newNum=orig*scale;return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наи
~~~
~~~javascript
0)return g5q(`Для дробей ${frac(a,b)} и ${frac(c,d)} найди <b>наименьший общий знаменатель</b>.`,g5nums(l,[b*d,b+d,Math.max(b,d)]),String(l),`НОК(${b}, ${d}) = ${l}; дополнительные множители ${m} и ${k}.`,"lcm");
   if(type===1||type===2){const first=type===1,orig=first?a:c,den=first?b:d,scale=first?m:k,newNum=orig*scale;return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наименьшему общему знаменателю. Выбери <b>правильную пару</b>.`,[
   {label:`${frac(A,l)} и ${frac(C,l)}`,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; $
~~~
~~~javascript
return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наименьшему общему знаменателю. Выбери <b>правильную пару</b>.`,[
   {label:`${frac(A,l)} и ${frac(C,l)}`,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; ${common}.`,"both_fractions");

 }
 if(id==="frac_compare_diff"){
   const ans=A===C?"=":A>C?">":"<";
   return g5q(`Сравни ${frac(a,b)} и ${frac(c,d)}. Какой знак нужно поставить между дробями?`,[{label:"<",key:"<"},{label:">",key:">"},{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A=
~~~
~~~javascript
,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; ${common}.`,"both_fractions");

 }
 if(id==="frac_compare_diff"){
   const ans=A===C?"=":A>C?">":"<";
   return g5q(`Сравни ${frac(a,b)} и ${frac(c,d)}. Какой знак нужно поставить между дробями?`,[{label:"<",key:"<"},{label:">",key:">"},{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A===C?"equal":"compare");
 }
 
 const sub=id==="frac_sub_diff",op=sub?"−":"+",top=sub?A-C:A+C,[nn,dd]=g5NewRat(top,l);
 const wrong=[[a+c,b+d],[Math.abs(a-c),Math.abs(b-d)||1],[top+1,l],[Math.max(0,top-1),l],[a+c,l],[Math.abs(A-C),l]];
 return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(top,l,wrong),nn+"/"+dd,`${common}. ${sub?"Вычитаем":"Складываем"} числители: ${A} ${op} ${C} = ${top}. Получаем ${frac(top,l)}${top===nn&&l===dd?"":` = ${frac(nn,dd)}`}.
~~~
~~~javascript
,{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A===C?"equal":"compare");
 }
 
 const sub=id==="frac_sub_diff",op=sub?"−":"+",top=sub?A-C:A+C,[nn,dd]=g5NewRat(top,l);
 const wrong=[[a+c,b+d],[Math.abs(a-c),Math.abs(b-d)||1],[top+1,l],[Math.max(0,top-1),l],[a+c,l],[Math.abs(A-C),l]];
 return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(top,l,wrong),nn+"/"+dd,`${common}. ${sub?"Вычитаем":"Складываем"} числители: ${A} ${op} ${C} = ${top}. Получаем ${frac(top,l)}${top===nn&&l===dd?"":` = ${frac(nn,dd)}`}.`,sub?"subtract_lcm":"add_lcm");
}

function g5Lesson(id){
 const modern=g5NewFractionLesson(id);if(modern)return modern;
 const map={
  "natural":{sense:`Большие числа удобнее понимать по разрядам: каждая цифра имеет своё место и значение.`,term:`Разряд — место цифры в записи числа. При сравнении смотрим слева направо; при округлении смотрим на следующий справа разряд.`,steps:`<ol class="g5-theory-steps"><li>Сравни количество цифр; если оно одинаков
~~~
~~~javascript
-caption">Все части круга равны. Закрашена одна часть.</div></div>`;
}
function g5DonorQuestion(id){
 if(G5_NEW_FRACTION_THEORY[id])return g5NewFractionQuestion(id);
 if(id==="fraction_mix"){id=G5_FRACTIONS[ri(0,G5_FRACTIONS.length-1)].id}

 if(id==="frac_parts"){
   let d=ri(3,12),n=ri(1,d-1),askNum=Math.random()<.5;
   return g5q(`В дроби ${frac(n,d)} чему равен <b>${askNum?"числитель":"знаменатель"}</b>?`,
   g5nums(askNum?n:d,[askNum?d:n]),String(askNum?n:d),askNum?`В дроби ${frac(n,d)} верхнее число ${n} — числитель: оно показывает количество взятых частей.`:`В дроби ${frac(n,d)} нижнее число ${d} — знаменатель: целое разделили на ${d} равных частей.`);
 }
 if(id==="frac_read"){
   const items=[{n:1,d:2,w:"одна вторая"},{n:2,d:3,w:"две третьих"},{n:3,d:4,w:"три четвертых"},{n:4,d:5,w:"четыре пятых"},{n:5,d:8,w:"пять восьмых"}],it=items[ri(0,items.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количеств
~~~
~~~javascript
оби ${frac(n,d)} нижнее число ${d} — знаменатель: целое разделили на ${d} равных частей.`);
 }
 if(id==="frac_read"){
   const items=[{n:1,d:2,w:"одна вторая"},{n:2,d:3,w:"две третьих"},{n:3,d:4,w:"три четвертых"},{n:4,d:5,w:"четыре пятых"},{n:5,d:8,w:"пять восьмых"}],it=items[ri(0,items.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ra
~~~
~~~javascript
ms.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных частей. Запиши координату отмеченной точки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата запис
~~~
~~~javascript
+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных частей. Запиши координату отмеченной точки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата записывается как ${frac(n,d)}.`,"ray_fraction");
 }
 if(id==="frac_types"){
   let proper=Math.random()<.5,d=ri(3,10),n=proper?ri(1,d-1):ri(d,d+6);
   return g5q(`Определи вид дроби ${frac(n,d)}.`,[
     {label:"Правильная",key:"p"},{label:"Неправильная",key:"i"},{label:"Смешанное число",key:"m"},{label:"Десятичная",key:"d"}],
     proper?"p":"i",proper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и являе
~~~
~~~javascript
чки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата записывается как ${frac(n,d)}.`,"ray_fraction");
 }
 if(id==="frac_types"){
   let proper=Math.random()<.5,d=ri(3,10),n=proper?ri(1,d-1):ri(d,d+6);
   return g5q(`Определи вид дроби ${frac(n,d)}.`,[
     {label:"Правильная",key:"p"},{label:"Неправильная",key:"i"},{label:"Смешанное число",key:"m"},{label:"Десятичная",key:"d"}],
     proper?"p":"i",proper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и является правильной дробью.`:`Сравниваем числитель и знаменатель: ${n} ≥ ${d}. Значит ${frac(n,d)} является неправильной дробью.`);
 }
 if(id==="frac_equal"){
   let n=ri(1,6),d=ri(n+1,10),k=ri(2,5),cn=n*k,cd=d*k,v=ri(0,1);
   if(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числител
~~~
~~~javascript
roper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и является правильной дробью.`:`Сравниваем числитель и знаменатель: ${n} ≥ ${d}. Значит ${frac(n,d)} является неправильной дробью.`);
 }
 if(id==="frac_equal"){
   let n=ri(1,6),d=ri(n+1,10),k=ri(2,5),cn=n*k,cd=d*k,v=ri(0,1);
   if(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числитель, и знаменатель на одно число ${k}: ${n}×${k}=${cn}, ${d}×${k}=${cd}. Поэтому ${frac(n,d)} = ${frac(cn,cd)}.`,"choose_equal");
   return g5q(`${frac(n,d)} = ${frac("?",cd)}. Какое число должно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5
~~~
~~~javascript
(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числитель, и знаменатель на одно число ${k}: ${n}×${k}=${cn}, ${d}×${k}=${cd}. Поэтому ${frac(n,d)} = ${frac(cn,cd)}.`,"choose_equal");
   return g5q(`${frac(n,d)} = ${frac("?",cd)}. Какое число должно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разд
~~~
~~~javascript
жно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разделить числитель и знаменатель ${frac(n,d)}, чтобы сразу получить несократимую дробь ${frac(sn,sd)}?`,g5nums(g,[k,2,Math.max(1,g-1)]),String(g),`${n}÷${g}=${sn} и ${d}÷${g}=${sd}; общий делитель ${g} сокращает дробь до ${frac(sn,sd)}.`,"reduction_divisor");
 }
 if(id==="frac_compare_den"){
   let d=ri(4,12),a=ri(1,d-2),b=ri(a+1,d-1);
   return g5q(`Выбери верное сравнение:`,[
    
~~~
~~~javascript
,g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разделить числитель и знаменатель ${frac(n,d)}, чтобы сразу получить несократимую дробь ${frac(sn,sd)}?`,g5nums(g,[k,2,Math.max(1,g-1)]),String(g),`${n}÷${g}=${sn} и ${d}÷${g}=${sd}; общий делитель ${g} сокращает дробь до ${frac(sn,sd)}.`,"reduction_divisor");
 }
 if(id==="frac_compare_den"){
   let d=ri(4,12),a=ri(1,d-2),b=ri(a+1,d-1);
   return g5q(`Выбери верное сравнение:`,[
     {label:frac(b,d)+" > "+frac(a,d),key:"ok"},{label:frac(b,d)+" < "+frac(a,d),key:"a"},{label:frac(b,d)+" = "+frac(a,d),key:"b"},{label:frac(a,d)+" > "+frac(b,d),key:"c"}],
     "ok",`У обеих дробей знаменатель ${d}, то есть части одинакового размера. Сравниваем числители: ${b} > ${a}, по
~~~
## g5Generate count 0
## g5Question count 0
## g5q count 121
~~~javascript
length-1)],picked=[...lower.slice(0,rank),correct,...higher.slice(0,targetCount-1-rank)];return picked
}
function finalizeChoices(correctKey,rows,targetCount){
 const desired=Math.max(2,Number(targetCount||rows.length||4)),clean=uniqueChoiceRows(String(correctKey),rows);
 return shuffleOptions(clean.slice(0,desired))
}
function g5q(text,choices,correct,explain,templateId="base"){let u=finalizeChoices(String(correct),g5UniqChoices(choices),Math.max(2,Math.min(4,choices.length||4))),c=u.find(x=>String(x.key)===String(correct));return{text,choices:u,correct:String(correct),correctLabel:c?c.label:"",explain,templateId}}
function g5nums(ans,extras=[]){
 let arr=[ans,...extras],out=g5UniqChoices(arr.map(v=>({label:String(v).replace(".",","),key:String(v)}))),guard=0;
 const n=Number(ans);
 while(out.length<4&&guard++<120){
   let v=Number.isFinite(n)?n+ri(-Math.max(12,Math.abs(n)||12),Math.max(12,Math.abs(n)||12)):ri(0,99);
   if(v<0)continue;
   const c={label:String(v).replace(".",","),key:String(v)};
   if(!out.some(x
~~~
~~~javascript
b);
 for(let k=1;items.length<4&&k<40;k++){put(n+k,d);put(Math.max(0,n-k),d);put(n,d+k);put(n+k,d+k)}
 if(items.length!==4)throw Error("Не удалось собрать варианты");
 return items.map(([a,b])=>({label:frac(a,b),key:a+"/"+b}));
}
function g5NewFractionQuestion(id){
 if(id==="frac_shapes"){
   const t=ri(0,3);
   if(t===0)return g5q("Чем окружность отличается от круга?",[{label:"Окружность — граница, круг — граница вместе с внутренней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a
~~~
~~~javascript
нней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="fra
~~~
~~~javascript
,key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="frac_mul_common"||id==="frac_div_common"){
   const diff=activeDifficulty(),bound=diff===0?6:diff===1?10:14;
   const b=ri(2,bound),d=ri(2,bound),a=ri(1,b+(diff?3:0)),c=ri(1
~~~
~~~javascript
 ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="frac_mul_common"||id==="frac_div_common"){
   const diff=activeDifficulty(),bound=diff===0?6:diff===1?10:14;
   const b=ri(2,bound),d=ri(2,bound),a=ri(1,b+(diff?3:0)),c=ri(1,d+(diff?3:0));
   const division=id==="frac_div_common",n=division?a*d:a*c,den=division?b*c:b*d;
   const [rn,rd]=g5NewRat(n,den),bad=[[a+c,b+d],[a*c,b*d],[a*d,b*c],[Math.abs(a-c),Math.max(1,b+d)],[n+1,den],[Math.max(0,n-1),den]];
   const op=division?"÷":"×",second=
~~~
~~~javascript
c=ri(1,d+(diff?3:0));
   const division=id==="frac_div_common",n=division?a*d:a*c,den=division?b*c:b*d;
   const [rn,rd]=g5NewRat(n,den),bad=[[a+c,b+d],[a*c,b*d],[a*d,b*c],[Math.abs(a-c),Math.max(1,b+d)],[n+1,den],[Math.max(0,n-1),den]];
   const op=division?"÷":"×",second=division?` = ${frac(a,b)} × ${frac(d,c)}`:"";
   return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(n,den,bad),rn+"/"+rd,division?`Делитель ${frac(c,d)} заменяем обратной дробью ${frac(d,c)}: ${frac(a,b)} ÷ ${frac(c,d)}${second} = ${frac(n,den)} = ${frac(rn,rd)}.`:`Умножаем числители: ${a} × ${c} = ${n}, знаменатели: ${b} × ${d} = ${den}. Получаем ${frac(n,den)} = ${frac(rn,rd)}.`,division?"fraction_division":"fraction_multiplication");
 }
 const difficulty=activeDifficulty(),type=ri(0,3);
 const pairs=difficulty===0?[[2,4],[3,6],[3,4],[4,6],[5,10],[4,5],[3,5]]:difficulty===1?[[4,6],[5,8],[6,9],[6,10],[8,12],[5,12],[8,9],[7,10]]:[[8,12],[9,15],[10,12],[12,18],[8,15],[7,12],[10,21],[9,14]];
 let [b,d]=pairs[ri(0,pa
~~~
~~~javascript
l/b,k=l/d;
 let a=ri(1,b-1),c=ri(1,d-1);
 if(id==="frac_compare_diff"&&type===2&&gcd(b,d)>1){const g=gcd(b,d);a=b/g;c=d/g}
 let A=a*m,C=c*k;if(id==="frac_sub_diff"&&A<C){[a,c]=[c,a];[b,d]=[d,b];[A,C]=[C,A]}const common=`${frac(a,b)} = ${frac(A,l)}, ${frac(c,d)} = ${frac(C,l)}`;
 if(id==="frac_common_lcm"){
   if(type===0)return g5q(`Для дробей ${frac(a,b)} и ${frac(c,d)} найди <b>наименьший общий знаменатель</b>.`,g5nums(l,[b*d,b+d,Math.max(b,d)]),String(l),`НОК(${b}, ${d}) = ${l}; дополнительные множители ${m} и ${k}.`,"lcm");
   if(type===1||type===2){const first=type===1,orig=first?a:c,den=first?b:d,scale=first?m:k,newNum=orig*scale;return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наи
~~~
~~~javascript
0)return g5q(`Для дробей ${frac(a,b)} и ${frac(c,d)} найди <b>наименьший общий знаменатель</b>.`,g5nums(l,[b*d,b+d,Math.max(b,d)]),String(l),`НОК(${b}, ${d}) = ${l}; дополнительные множители ${m} и ${k}.`,"lcm");
   if(type===1||type===2){const first=type===1,orig=first?a:c,den=first?b:d,scale=first?m:k,newNum=orig*scale;return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наименьшему общему знаменателю. Выбери <b>правильную пару</b>.`,[
   {label:`${frac(A,l)} и ${frac(C,l)}`,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; $
~~~
~~~javascript
return g5q(`Приведи ${frac(orig,den)} к знаменателю ${l}. Какой получится <b>числитель</b>?`,g5nums(newNum,[orig,orig+scale,newNum+scale]),String(newNum),`Дополнительный множитель ${l} : ${den} = ${scale}. Числитель ${orig} · ${scale} = ${newNum}; ответ ${frac(newNum,l)}.`,first?"numerator_first":"numerator_second")}

   return g5q(`Приведи обе дроби ${frac(a,b)} и ${frac(c,d)} к наименьшему общему знаменателю. Выбери <b>правильную пару</b>.`,[
   {label:`${frac(A,l)} и ${frac(C,l)}`,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; ${common}.`,"both_fractions");

 }
 if(id==="frac_compare_diff"){
   const ans=A===C?"=":A>C?">":"<";
   return g5q(`Сравни ${frac(a,b)} и ${frac(c,d)}. Какой знак нужно поставить между дробями?`,[{label:"<",key:"<"},{label:">",key:">"},{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A=
~~~
~~~javascript
,key:"ok"},
   {label:`${frac(A+1,l)} и ${frac(C,l)}`,key:"wrong_first"},
   {label:`${frac(A,l)} и ${frac(C+1,l)}`,key:"wrong_second"},
   {label:`${frac(A+1,l)} и ${frac(C+1,l)}`,key:"wrong_both"}],"ok",`НОК = ${l}; ${common}.`,"both_fractions");

 }
 if(id==="frac_compare_diff"){
   const ans=A===C?"=":A>C?">":"<";
   return g5q(`Сравни ${frac(a,b)} и ${frac(c,d)}. Какой знак нужно поставить между дробями?`,[{label:"<",key:"<"},{label:">",key:">"},{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A===C?"equal":"compare");
 }
 
 const sub=id==="frac_sub_diff",op=sub?"−":"+",top=sub?A-C:A+C,[nn,dd]=g5NewRat(top,l);
 const wrong=[[a+c,b+d],[Math.abs(a-c),Math.abs(b-d)||1],[top+1,l],[Math.max(0,top-1),l],[a+c,l],[Math.abs(A-C),l]];
 return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(top,l,wrong),nn+"/"+dd,`${common}. ${sub?"Вычитаем":"Складываем"} числители: ${A} ${op} ${C} = ${top}. Получаем ${frac(top,l)}${top===nn&&l===dd?"":` = ${frac(nn,dd)}`}.
~~~
~~~javascript
,{label:"=",key:"="}],ans,`${common}. Сравниваем ${A} и ${C}, поэтому знак «${ans}».`,A===C?"equal":"compare");
 }
 
 const sub=id==="frac_sub_diff",op=sub?"−":"+",top=sub?A-C:A+C,[nn,dd]=g5NewRat(top,l);
 const wrong=[[a+c,b+d],[Math.abs(a-c),Math.abs(b-d)||1],[top+1,l],[Math.max(0,top-1),l],[a+c,l],[Math.abs(A-C),l]];
 return g5q(`Вычисли ${frac(a,b)} ${op} ${frac(c,d)}. Сократи ответ.`,g5NewChoiceSet(top,l,wrong),nn+"/"+dd,`${common}. ${sub?"Вычитаем":"Складываем"} числители: ${A} ${op} ${C} = ${top}. Получаем ${frac(top,l)}${top===nn&&l===dd?"":` = ${frac(nn,dd)}`}.`,sub?"subtract_lcm":"add_lcm");
}

function g5Lesson(id){
 const modern=g5NewFractionLesson(id);if(modern)return modern;
 const map={
  "natural":{sense:`Большие числа удобнее понимать по разрядам: каждая цифра имеет своё место и значение.`,term:`Разряд — место цифры в записи числа. При сравнении смотрим слева направо; при округлении смотрим на следующий справа разряд.`,steps:`<ol class="g5-theory-steps"><li>Сравни количество цифр; если оно одинаков
~~~
~~~javascript
-caption">Все части круга равны. Закрашена одна часть.</div></div>`;
}
function g5DonorQuestion(id){
 if(G5_NEW_FRACTION_THEORY[id])return g5NewFractionQuestion(id);
 if(id==="fraction_mix"){id=G5_FRACTIONS[ri(0,G5_FRACTIONS.length-1)].id}

 if(id==="frac_parts"){
   let d=ri(3,12),n=ri(1,d-1),askNum=Math.random()<.5;
   return g5q(`В дроби ${frac(n,d)} чему равен <b>${askNum?"числитель":"знаменатель"}</b>?`,
   g5nums(askNum?n:d,[askNum?d:n]),String(askNum?n:d),askNum?`В дроби ${frac(n,d)} верхнее число ${n} — числитель: оно показывает количество взятых частей.`:`В дроби ${frac(n,d)} нижнее число ${d} — знаменатель: целое разделили на ${d} равных частей.`);
 }
 if(id==="frac_read"){
   const items=[{n:1,d:2,w:"одна вторая"},{n:2,d:3,w:"две третьих"},{n:3,d:4,w:"три четвертых"},{n:4,d:5,w:"четыре пятых"},{n:5,d:8,w:"пять восьмых"}],it=items[ri(0,items.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количеств
~~~
~~~javascript
оби ${frac(n,d)} нижнее число ${d} — знаменатель: целое разделили на ${d} равных частей.`);
 }
 if(id==="frac_read"){
   const items=[{n:1,d:2,w:"одна вторая"},{n:2,d:3,w:"две третьих"},{n:3,d:4,w:"три четвертых"},{n:4,d:5,w:"четыре пятых"},{n:5,d:8,w:"пять восьмых"}],it=items[ri(0,items.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ra
~~~
~~~javascript
ms.length-1)],v=ri(0,1);
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных частей. Запиши координату отмеченной точки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата запис
~~~
~~~javascript
+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных частей. Запиши координату отмеченной точки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата записывается как ${frac(n,d)}.`,"ray_fraction");
 }
 if(id==="frac_types"){
   let proper=Math.random()<.5,d=ri(3,10),n=proper?ri(1,d-1):ri(d,d+6);
   return g5q(`Определи вид дроби ${frac(n,d)}.`,[
     {label:"Правильная",key:"p"},{label:"Неправильная",key:"i"},{label:"Смешанное число",key:"m"},{label:"Десятичная",key:"d"}],
     proper?"p":"i",proper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и являе
~~~
~~~javascript
чки дробью <b>со знаменателем ${d}</b>.${ray}`,g5FractionChoices(n,d),n+"/"+d,`От 0 до точки прошло ${n} из ${d} равных частей, поэтому при заданном знаменателе координата записывается как ${frac(n,d)}.`,"ray_fraction");
 }
 if(id==="frac_types"){
   let proper=Math.random()<.5,d=ri(3,10),n=proper?ri(1,d-1):ri(d,d+6);
   return g5q(`Определи вид дроби ${frac(n,d)}.`,[
     {label:"Правильная",key:"p"},{label:"Неправильная",key:"i"},{label:"Смешанное число",key:"m"},{label:"Десятичная",key:"d"}],
     proper?"p":"i",proper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и является правильной дробью.`:`Сравниваем числитель и знаменатель: ${n} ≥ ${d}. Значит ${frac(n,d)} является неправильной дробью.`);
 }
 if(id==="frac_equal"){
   let n=ri(1,6),d=ri(n+1,10),k=ri(2,5),cn=n*k,cd=d*k,v=ri(0,1);
   if(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числител
~~~
~~~javascript
roper?`Сравниваем числитель и знаменатель: ${n} < ${d}. Значит ${frac(n,d)} меньше 1 и является правильной дробью.`:`Сравниваем числитель и знаменатель: ${n} ≥ ${d}. Значит ${frac(n,d)} является неправильной дробью.`);
 }
 if(id==="frac_equal"){
   let n=ri(1,6),d=ri(n+1,10),k=ri(2,5),cn=n*k,cd=d*k,v=ri(0,1);
   if(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числитель, и знаменатель на одно число ${k}: ${n}×${k}=${cn}, ${d}×${k}=${cd}. Поэтому ${frac(n,d)} = ${frac(cn,cd)}.`,"choose_equal");
   return g5q(`${frac(n,d)} = ${frac("?",cd)}. Какое число должно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5
~~~
~~~javascript
(v===0)return g5q(`Какая дробь равна ${frac(n,d)}?`,[{label:frac(cn,cd),key:"ok"},{label:frac(n+k,d+k),key:"a"},{label:frac(cn,d),key:"b"},{label:frac(n,cd),key:"c"}],"ok",`Умножаем и числитель, и знаменатель на одно число ${k}: ${n}×${k}=${cn}, ${d}×${k}=${cd}. Поэтому ${frac(n,d)} = ${frac(cn,cd)}.`,"choose_equal");
   return g5q(`${frac(n,d)} = ${frac("?",cd)}. Какое число должно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разд
~~~
~~~javascript
жно стоять вместо ?`,g5nums(cn,[n+k,k,cd]),String(cn),`Знаменатель увеличили в ${k} раза: ${d}×${k}=${cd}. Значит числитель тоже умножаем на ${k}: ${n}×${k}=${cn}.`,"missing_numerator");
 }
 if(id==="frac_reduce"){
   let bn=ri(1,6),bd=ri(bn+1,9),k=ri(2,6),n=bn*k,d=bd*k,[sn,sd]=simp(n,d),g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разделить числитель и знаменатель ${frac(n,d)}, чтобы сразу получить несократимую дробь ${frac(sn,sd)}?`,g5nums(g,[k,2,Math.max(1,g-1)]),String(g),`${n}÷${g}=${sn} и ${d}÷${g}=${sd}; общий делитель ${g} сокращает дробь до ${frac(sn,sd)}.`,"reduction_divisor");
 }
 if(id==="frac_compare_den"){
   let d=ri(4,12),a=ri(1,d-2),b=ri(a+1,d-1);
   return g5q(`Выбери верное сравнение:`,[
    
~~~
~~~javascript
,g=gcd(n,d),v=ri(0,1);
   if(v===0)return g5q(`Сократи дробь ${frac(n,d)}.`,[{label:frac(sn,sd),key:"ok"},{label:frac(sn+1,sd),key:"a"},{label:frac(sn,sd+1),key:"b"},{label:frac(n,sd),key:"c"}],"ok",`НОД(${n}, ${d}) = ${g}. Делим оба числа на ${g}: ${n}÷${g}=${sn}, ${d}÷${g}=${sd}. Получаем ${frac(sn,sd)}.`,"reduce");
   return g5q(`На какое число нужно разделить числитель и знаменатель ${frac(n,d)}, чтобы сразу получить несократимую дробь ${frac(sn,sd)}?`,g5nums(g,[k,2,Math.max(1,g-1)]),String(g),`${n}÷${g}=${sn} и ${d}÷${g}=${sd}; общий делитель ${g} сокращает дробь до ${frac(sn,sd)}.`,"reduction_divisor");
 }
 if(id==="frac_compare_den"){
   let d=ri(4,12),a=ri(1,d-2),b=ri(a+1,d-1);
   return g5q(`Выбери верное сравнение:`,[
     {label:frac(b,d)+" > "+frac(a,d),key:"ok"},{label:frac(b,d)+" < "+frac(a,d),key:"a"},{label:frac(b,d)+" = "+frac(a,d),key:"b"},{label:frac(a,d)+" > "+frac(b,d),key:"c"}],
     "ok",`У обеих дробей знаменатель ${d}, то есть части одинакового размера. Сравниваем числители: ${b} > ${a}, по
~~~
## g5q5 count 0
## g5Topic count 0
## g5Build count 0
## g5Practice count 0
## g5Answer count 0
## g5Training count 0
## genG5 count 0
## generate5 count 0