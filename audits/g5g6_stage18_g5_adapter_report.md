# Grade 5 adapter usage details
## g5DonorQuestion( total 2
~~~javascript
{cy}" r="4" class="g5-protractor-center"/><line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="g5-protractor-ray"/></svg><div class="g5-visual-caption">Начинай отсчёт от 0° справа и найди отметку, через которую проходит зелёный луч.</div></div>`;
}
function g5CircleSectorSvg(parts){
 const cx=110,cy=110,r=86,a=-Math.PI/2,b=a+2*Math.PI/parts,x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b),large=(2*Math.PI/parts)>Math.PI?1:0;let rays="";for(let i=0;i<parts;i++){const t=a+2*Math.PI*i/parts,x=cx+r*Math.cos(t),y=cy+r*Math.sin(t);rays+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="g5-circle-ray"/>`}
 return `<div class="g5-visual-wrap g5-circle-wrap"><svg class="g5-circle-svg" viewBox="0 0 220 220" role="img" aria-label="Круг разделён на ${parts} равных частей, одна часть закрашена"><path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" class="g5-circle-sector"/><circle cx="${cx}" cy="${cy}" r="${r}" class="g5-circle-outline"/>${rays}</svg><div class="g5-visual-caption">Все части круга равны. Закрашена одна часть.</div></div>`;
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
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных часте
~~~
~~~javascript
dTags.has(child.tagName)){
         child.replaceWith(document.createTextNode(child.textContent||""));
         return;
       }
       const cls=[...child.classList].filter(c=>allowedClasses.has(c));
       [...child.attributes].forEach(a=>child.removeAttribute(a.name));
       if(cls.length)child.className=cls.join(" ");
       walk(child);
     }
   });
 };
 walk(tpl.content);return tpl.innerHTML;
}
function academicHtmlPlain(html){
 let s=String(html??"");
 s=s.replace(/<span class="mixed">\s*<span class="whole">([^<]*)<\/span>\s*<span class="frac">\s*<span class="num">([^<]*)<\/span>\s*<span class="den">([^<]*)<\/span>\s*<\/span>\s*<\/span>/g,"$1 $2/$3");
 s=s.replace(/<span class="frac">\s*<span class="num">([^<]*)<\/span>\s*<span class="den">([^<]*)<\/span>\s*<\/span>/g,"$1/$2");
 s=s.replace(/&nbsp;/g," ");
 return stripHtmlText(s).replace(/\s+/g," ").trim();
}
function choicePlain(choice){
 if(!choice)return "";
 const label=String(choice.label??"");
 if(label.includes("<"))return academicHtmlPlain(label);
 return label;
}
function makeG5Question(id){
 const requestedId=id;
 const sourceTopicId=id==="fraction_mix"?G5_FRACTIONS[ri(0,G5_FRACTIONS.length-1)].id:id;
 const qq=g5DonorQuestion(sourceTopicId);
 const correctChoice=qq.choices.find(c=>String(c.key)===String(qq.correct));
 const correctLabel=correctChoice?.label??qq.correctLabel??qq.correct;
 return {
   text:qq.text,
   ans:String(qq.correct),
   choices:qq.choices.map(c=>({label:c.label,key:String(c.key)})),
   ex:qq.explain,
   correctLabel,
   correctText:choicePlain({label:correctLabel,key:qq.correct}),
   sourceTopicId,
   templateId:qq.templateId||"base",
   // Подпись включает существенные данные задания, а не только постоянный текст вопроса.
   // Это позволяет anti-repeat различать, например, разные пары сравниваемых дробей.
   sig:`g5:${requestedId}:${sourceTopicId}:${qq.templateId||"base"}:${activeDifficulty()}:${stripHtmlText(qq.text)}:${String(qq.correct)}:${qq.choices.map(c=>academicHtmlPlain(c.label)).sort().join("~")}`
 };
}


/* =========================================================
   6 КЛАСС — ЭТАПЫ 6.2–6.6: делимость, дроби, отношения/проценты, рациональные числа, выражения и уравнения.
   Реализованные темы используют общий quiz/block/journal engine.
   ========================================================= */
const G6_IMPLEMENTED_TOPICS=new Set([
 "g6:divisors_multiples","g6:divisibility_2_5_10","g6:divisibility_3_9","g6:prime_composite",
 "g6:prime_factorization","g6:gcd","g6:lcm","g6:coprime",
 "g6:fraction_properties","g6:fraction_reduction","g6:fraction_common_denominator","g6:fraction_compare",
 "g6:fraction_add_subtract","g6:mixed_add_subtract","g6:fraction_multiply","g6:fraction_divide",
 "g6:mixed_multiply_divide","g6:fraction_expressions",
 "g6:ra
~~~
## g5NewFractionQuestion( total 2
~~~javascript
; не забывай умножать числитель на дополнительный множитель."}
};
function g5NewFractionLesson(id){const x=G5_NEW_FRACTION_THEORY[id];if(!x)return null;return `<div class="g5-theory"><p>${x.sense}</p><p><b>Школьное правило.</b> ${x.term}</p><ol class="g5-theory-steps">${x.steps.map(t=>`<li>${t}</li>`).join("")}</ol><p><b>Пример.</b> ${x.example}</p><p class="g5-theory-tip"><b>Типичная ошибка.</b> ${x.tip}</p></div>`}
function g5Lcm(a,b){return a/gcd(a,b)*b}
function g5NewRat(n,d){if(!Number.isInteger(n)||!Number.isInteger(d)||d<=0)throw Error("Некорректная дробь");const v=gcd(Math.abs(n),d);return [n/v,d/v]}
function g5NewChoiceSet(n,d,extras=[]){
 const [cn,cd]=g5NewRat(n,d),items=[[cn,cd]],seen=new Set([cn+"/"+cd]);
 function put(a,b){if(items.length>=4)return;if(!Number.isInteger(a)||!Number.isInteger(b)||b<=0||a<0)return;const [x,y]=g5NewRat(a,b),key=x+"/"+y;if(!seen.has(key)){seen.add(key);items.push([x,y])}}
 for(const [a,b] of extras)put(a,b);
 for(let k=1;items.length<4&&k<40;k++){put(n+k,d);put(Math.max(0,n-k),d);put(n,d+k);put(n+k,d+k)}
 if(items.length!==4)throw Error("Не удалось собрать варианты");
 return items.map(([a,b])=>({label:frac(a,b),key:a+"/"+b}));
}
function g5NewFractionQuestion(id){
 if(id==="frac_shapes"){
   const t=ri(0,3);
   if(t===0)return g5q("Чем окружность отличается от круга?",[{label:"Окружность — граница, круг — граница вместе с внутренней областью",key:"ok"},{label:"Это две объёмные фигуры",key:"a"},{label:"Круг — только линия, окружность — вся область",key:"b"},{label:"Окружность всегда больше круга",key:"c"}],"ok","Окружность — линия, ограничивающая круг. Круг включает и эту линию, и внутренние точки.","shape_circle");
   if(t===1){const r=ri(2,16);return g5q(`Радиус круга ${r} см. Найди диаметр.`,g5nums(2*r,[r,r+2,4*r]),String(2*r),`Диаметр равен двум радиусам: ${r} × 2 = ${2*r} см.`,"shape_diameter")}
   if(t===2)return g5q("У какого тела два равных круглых основания?",[{label:"Цилиндр",key:"ok"},{label:"Шар",key:"a"},{label:"Конус",key:"b"},{label:"Куб",key:"c"}],"ok","Цилиндр имеет два равных круглых основания, расположенных в параллельных плоскостях.","shape_cylinder");
   return g5q("Какая из фигур является объёмным телом?",[{label:"Шар",key:"ok"},{label:"Окружность",key:"a"},{label:"Круг",key:"b"},{label:"Отрезок",key:"c"}],"ok","Шар — объёмное тело. Круг и окружность — плоские геометрические объекты.","shape_sphere");
 }
 if(id==="frac_mul_common"||id==="frac_div_common"){
   const diff=activeDifficulty(),bound=diff===0?6:diff===1?10:14;
   const b=ri(2,bound),d=ri(2,bound),a=ri(1,b+(diff?3:0)),c=ri(1,d+(diff?3:0));
   const division=id==="frac_div_common",n=division?a*d:a*c,den=division?b*c:b*d;
   const [rn,rd]=g5NewRat(n,den),bad=[[a+c,b+d],[a*c,b*d],[a*d,b*c],[Math.abs(a-c),Math.max(1,b+d)],[n+1,den
~~~
~~~javascript
y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="g5-protractor-ray"/></svg><div class="g5-visual-caption">Начинай отсчёт от 0° справа и найди отметку, через которую проходит зелёный луч.</div></div>`;
}
function g5CircleSectorSvg(parts){
 const cx=110,cy=110,r=86,a=-Math.PI/2,b=a+2*Math.PI/parts,x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b),large=(2*Math.PI/parts)>Math.PI?1:0;let rays="";for(let i=0;i<parts;i++){const t=a+2*Math.PI*i/parts,x=cx+r*Math.cos(t),y=cy+r*Math.sin(t);rays+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="g5-circle-ray"/>`}
 return `<div class="g5-visual-wrap g5-circle-wrap"><svg class="g5-circle-svg" viewBox="0 0 220 220" role="img" aria-label="Круг разделён на ${parts} равных частей, одна часть закрашена"><path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" class="g5-circle-sector"/><circle cx="${cx}" cy="${cy}" r="${r}" class="g5-circle-outline"/>${rays}</svg><div class="g5-visual-caption">Все части круга равны. Закрашена одна часть.</div></div>`;
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
   if(v===0)return g5q(`Какая дробь читается как <b>${it.w}</b>?`,g5FractionChoices(it.n,it.d),it.n+"/"+it.d,`В словах сначала названо количество частей ${it.n}, затем вид долей ${it.d}. Поэтому ${it.w} = ${frac(it.n,it.d)}.`,"words_to_fraction");
   const wrong=items.filter(x=>x!==it).slice(0,3);return g5q(`Как читается дробь ${frac(it.n,it.d)}?`,[{label:it.w,key:"ok"},...wrong.map((x,j)=>({label:x.w,key:"w"+j}))],"ok",`Числитель ${it.n} читаем первым, знаменатель ${it.d} — названием долей: «${it.w}».`,"fraction_to_words");
 }
 if(id==="frac_ray"){
   let d=ri(3,8),n=ri(1,d-1);
   let ray='<div class="ray">';
   for(let i=0;i<d;i++)ray+=`<div class="seg">${i===n?'<span class="point"></span>':''}</div>`;
   ray+='</div>';
   return g5q(`Единичный отрезок разделён на ${d} равных частей. Запиши координату отмеченной точки дробью <b>со знаменат
~~~
## g5q( total 108
~~~javascript
`Какую часть круга закрасили?${g5CircleSectorSvg(d)}`,g5FractionChoices(1,d),`1/${d}`,`Круг разделён на ${d} равных частей и закрашена одна из них. Значит закрашено ${frac(1,d)} круга.`,"diagram_fraction");
 }
 if(id==="units"){
   const v=ri(0,5);
   if(v===0){let m=ri(2,25),ans=m*100;return g5q(`${m} м = ? см`,g5nums(ans,[m*10,m*1000,m+100]),String(ans),`1 м = 100 см, поэтому ${m} × 100 = ${ans} см.`,"m_cm");}
   if(v===1){let km=ri(2,18),ans=km*1000;return g5q(`${km} км = ? м`,g5nums(ans,[km*100,km*10,ans+1000]),String(ans),`1 км = 1000 м, поэтому ${km} × 1000 = ${ans} м.`,"km_m");}
   if(v===2){let kg=ri(2,25),ans=kg*1000;return g5q(`${kg} кг = ? г`,g5nums(ans,[kg*100,kg*10,ans+1000]),String(ans),`1 кг = 1000 г, поэтому ${kg} × 1000 = ${ans} г.`,"kg_g");}
   if(v===3){let h=ri(2,12),ans=h*60;return g5q(`${h} ч = ? мин`,g5nums(ans,[h*100,h*10,ans+60]),String(ans),`1 ч = 60 мин, поэтому ${h} × 60 = ${ans} мин.`,"h_min");}
   if(v===4){let m2=ri(1,9),ans=m2*10000;return g5q(`${m2} м² = ? см²`,g5nums(ans,[m2*100,m2*1000,ans+10000]),String(ans),`1 м = 100 см, значит 1 м² = 100 × 100 = 10 000 см². Поэтому ${m2} м² = ${ans} см².`,"m2_cm2");}
   const cm=ri(2,25)*100,ans=cm/100;return g5q(`${cm} см = ? м`,g5nums(ans,[cm,cm/10,ans+1]),String(ans),`100 см = 1 м, поэтому ${cm} ÷ 100 = ${ans} м.`,"cm_m");
 }
 if(id==="word"){
   const v=ri(0,4);
   if(v===0){let price=ri(3,12)*10,count=ri(2,8),paid=(Math.ceil(price*count/100)+2)*100,ans=paid-price*count;return g5q(`${count} ${ruCount(count,"тетрадь","тетради","тетрадей")} по ${price} ₽. Дали ${paid} ₽. Сколько сдачи?`,g5nums(ans,[price*count,paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-sec
~~~
~~~javascript
ans=m*100;return g5q(`${m} м = ? см`,g5nums(ans,[m*10,m*1000,m+100]),String(ans),`1 м = 100 см, поэтому ${m} × 100 = ${ans} см.`,"m_cm");}
   if(v===1){let km=ri(2,18),ans=km*1000;return g5q(`${km} км = ? м`,g5nums(ans,[km*100,km*10,ans+1000]),String(ans),`1 км = 1000 м, поэтому ${km} × 1000 = ${ans} м.`,"km_m");}
   if(v===2){let kg=ri(2,25),ans=kg*1000;return g5q(`${kg} кг = ? г`,g5nums(ans,[kg*100,kg*10,ans+1000]),String(ans),`1 кг = 1000 г, поэтому ${kg} × 1000 = ${ans} г.`,"kg_g");}
   if(v===3){let h=ri(2,12),ans=h*60;return g5q(`${h} ч = ? мин`,g5nums(ans,[h*100,h*10,ans+60]),String(ans),`1 ч = 60 мин, поэтому ${h} × 60 = ${ans} мин.`,"h_min");}
   if(v===4){let m2=ri(1,9),ans=m2*10000;return g5q(`${m2} м² = ? см²`,g5nums(ans,[m2*100,m2*1000,ans+10000]),String(ans),`1 м = 100 см, значит 1 м² = 100 × 100 = 10 000 см². Поэтому ${m2} м² = ${ans} см².`,"m2_cm2");}
   const cm=ri(2,25)*100,ans=cm/100;return g5q(`${cm} см = ? м`,g5nums(ans,[cm,cm/10,ans+1]),String(ans),`100 см = 1 м, поэтому ${cm} ÷ 100 = ${ans} м.`,"cm_m");
 }
 if(id==="word"){
   const v=ri(0,4);
   if(v===0){let price=ri(3,12)*10,count=ri(2,8),paid=(Math.ceil(price*count/100)+2)*100,ans=paid-price*count;return g5q(`${count} ${ruCount(count,"тетрадь","тетради","тетрадей")} по ${price} ₽. Дали ${paid} ₽. Сколько сдачи?`,g5nums(ans,[price*count,paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${t
~~~
~~~javascript
 г`,g5nums(ans,[kg*100,kg*10,ans+1000]),String(ans),`1 кг = 1000 г, поэтому ${kg} × 1000 = ${ans} г.`,"kg_g");}
   if(v===3){let h=ri(2,12),ans=h*60;return g5q(`${h} ч = ? мин`,g5nums(ans,[h*100,h*10,ans+60]),String(ans),`1 ч = 60 мин, поэтому ${h} × 60 = ${ans} мин.`,"h_min");}
   if(v===4){let m2=ri(1,9),ans=m2*10000;return g5q(`${m2} м² = ? см²`,g5nums(ans,[m2*100,m2*1000,ans+10000]),String(ans),`1 м = 100 см, значит 1 м² = 100 × 100 = 10 000 см². Поэтому ${m2} м² = ${ans} см².`,"m2_cm2");}
   const cm=ri(2,25)*100,ans=cm/100;return g5q(`${cm} см = ? м`,g5nums(ans,[cm,cm/10,ans+1]),String(ans),`100 см = 1 м, поэтому ${cm} ÷ 100 = ${ans} м.`,"cm_m");
 }
 if(id==="word"){
   const v=ri(0,4);
   if(v===0){let price=ri(3,12)*10,count=ri(2,8),paid=(Math.ceil(price*count/100)+2)*100,ans=paid-price*count;return g5q(`${count} ${ruCount(count,"тетрадь","тетради","тетрадей")} по ${price} ₽. Дали ${paid} ₽. Сколько сдачи?`,g5nums(ans,[price*count,paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${total-first}−${second}=${ans} книг.`,"two_step_remainder");
 }
 return g5q("2 + 2 = ?",g5nums(4,[3,5,6]),"4","Запасной вопрос.");
}

function g5InfoById(id){return [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id===id)}
function stripHtmlText(s){
 // <template> разбирает HTML в инертном DocumentFragment: даже данные из
 // повреждённого/подменённого backup не выполняют on
~~~
~~~javascript
;}
   if(v===4){let m2=ri(1,9),ans=m2*10000;return g5q(`${m2} м² = ? см²`,g5nums(ans,[m2*100,m2*1000,ans+10000]),String(ans),`1 м = 100 см, значит 1 м² = 100 × 100 = 10 000 см². Поэтому ${m2} м² = ${ans} см².`,"m2_cm2");}
   const cm=ri(2,25)*100,ans=cm/100;return g5q(`${cm} см = ? м`,g5nums(ans,[cm,cm/10,ans+1]),String(ans),`100 см = 1 м, поэтому ${cm} ÷ 100 = ${ans} м.`,"cm_m");
 }
 if(id==="word"){
   const v=ri(0,4);
   if(v===0){let price=ri(3,12)*10,count=ri(2,8),paid=(Math.ceil(price*count/100)+2)*100,ans=paid-price*count;return g5q(`${count} ${ruCount(count,"тетрадь","тетради","тетрадей")} по ${price} ₽. Дали ${paid} ₽. Сколько сдачи?`,g5nums(ans,[price*count,paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${total-first}−${second}=${ans} книг.`,"two_step_remainder");
 }
 return g5q("2 + 2 = ?",g5nums(4,[3,5,6]),"4","Запасной вопрос.");
}

function g5InfoById(id){return [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id===id)}
function stripHtmlText(s){
 // <template> разбирает HTML в инертном DocumentFragment: даже данные из
 // повреждённого/подменённого backup не выполняют onerror/script при нормализации.
 const tpl=document.createElement("template");tpl.innerHTML=String(s??"");const root=tpl.content;
 root.querySelectorAll(".mixed").forEach(m=>{
   const w=m.querySelector(".whole")?.textContent?.trim()||"";
   const f=m.querySelector(".frac");
  
~~~
~~~javascript
s),`100 см = 1 м, поэтому ${cm} ÷ 100 = ${ans} м.`,"cm_m");
 }
 if(id==="word"){
   const v=ri(0,4);
   if(v===0){let price=ri(3,12)*10,count=ri(2,8),paid=(Math.ceil(price*count/100)+2)*100,ans=paid-price*count;return g5q(`${count} ${ruCount(count,"тетрадь","тетради","тетрадей")} по ${price} ₽. Дали ${paid} ₽. Сколько сдачи?`,g5nums(ans,[price*count,paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${total-first}−${second}=${ans} книг.`,"two_step_remainder");
 }
 return g5q("2 + 2 = ?",g5nums(4,[3,5,6]),"4","Запасной вопрос.");
}

function g5InfoById(id){return [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id===id)}
function stripHtmlText(s){
 // <template> разбирает HTML в инертном DocumentFragment: даже данные из
 // повреждённого/подменённого backup не выполняют onerror/script при нормализации.
 const tpl=document.createElement("template");tpl.innerHTML=String(s??"");const root=tpl.content;
 root.querySelectorAll(".mixed").forEach(m=>{
   const w=m.querySelector(".whole")?.textContent?.trim()||"";
   const f=m.querySelector(".frac");
   const n=f?.querySelector(".num")?.textContent?.trim()||"";
   const d=f?.querySelector(".den")?.textContent?.trim()||"";
   m.replaceWith(document.createTextNode(`${w} ${n}/${d}`.trim()));
 });
root.querySelectorAll(".frac").forEach(f=>{
const n=f.querySelector(".num")?.textContent?.trim()||"";
   const d=f.querySelector(
~~~
~~~javascript
paid-price,Math.max(0,paid-count)]),String(ans),`Сначала стоимость: ${price} × ${count} = ${price*count} ₽. Затем сдача: ${paid} − ${price*count} = ${ans} ₽.`,"cost_change");}
   if(v===1){const speed=ri(3,12)*5,time=ri(2,6),ans=speed*time;return g5q(`Турист шёл со скоростью ${speed} км/ч ${time} ч. Какой путь он прошёл?`,g5nums(ans,[speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${total-first}−${second}=${ans} книг.`,"two_step_remainder");
 }
 return g5q("2 + 2 = ?",g5nums(4,[3,5,6]),"4","Запасной вопрос.");
}

function g5InfoById(id){return [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id===id)}
function stripHtmlText(s){
 // <template> разбирает HTML в инертном DocumentFragment: даже данные из
 // повреждённого/подменённого backup не выполняют onerror/script при нормализации.
 const tpl=document.createElement("template");tpl.innerHTML=String(s??"");const root=tpl.content;
 root.querySelectorAll(".mixed").forEach(m=>{
   const w=m.querySelector(".whole")?.textContent?.trim()||"";
   const f=m.querySelector(".frac");
   const n=f?.querySelector(".num")?.textContent?.trim()||"";
   const d=f?.querySelector(".den")?.textContent?.trim()||"";
   m.replaceWith(document.createTextNode(`${w} ${n}/${d}`.trim()));
 });
root.querySelectorAll(".frac").forEach(f=>{
const n=f.querySelector(".num")?.textContent?.trim()||"";
   const d=f.querySelector(".den")?.textContent?.trim()||"";
   f.replaceWith(document.createTextNode(`${n}/${d}`));
 });
 return (root.textContent||"").replace(/\s+/g," ").trim();
}
function safeAcademicHtml(value){
 // В журнале разрешаем только разметку, которую генерирует сам МатКвест
 // для дробей/геометрии. Любые IMG/SCRIPT/event-атрибуты из backup удаляются.
 const tpl
~~~
~~~javascript
speed+time,speed,ans+time]),String(ans),`Путь = скорость × время: ${speed} × ${time} = ${ans} км.`,"distance");}
   if(v===2){const price=ri(2,10)*10,count=ri(3,9),cost=price*count;return g5q(`За ${count} одинаковых блокнотов заплатили ${cost} ₽. Сколько стоит один блокнот?`,g5nums(price,[count,cost,price+10]),String(price),`Цена одного предмета = стоимость ÷ количество: ${cost} ÷ ${count} = ${price} ₽.`,"unit_price");}
   if(v===3){const a=ri(3,8),b=ri(2,7),pa=ri(2,8)*10,pb=ri(2,8)*10,ans=a*pa+b*pb;return g5q(`Купили ${a} ручек по ${pa} ₽ и ${b} карандаша по ${pb} ₽. Сколько заплатили всего?`,g5nums(ans,[a*pa,b*pb,ans+pa]),String(ans),`Ручки стоят ${a}×${pa}=${a*pa} ₽, карандаши ${b}×${pb}=${b*pb} ₽. Всего ${a*pa}+${b*pb}=${ans} ₽.`,"two_goods");}
   const total=ri(40,120),first=ri(10,total-20),second=ri(5,total-first-5),ans=total-first-second;return g5q(`В библиотеку привезли ${total} книг. В первый класс выдали ${first}, во второй — ${second}. Сколько книг осталось?`,g5nums(ans,[total-first,total-second,first+second]),String(ans),`После первой выдачи осталось ${total}−${first}=${total-first}. После второй: ${total-first}−${second}=${ans} книг.`,"two_step_remainder");
 }
 return g5q("2 + 2 = ?",g5nums(4,[3,5,6]),"4","Запасной вопрос.");
}

function g5InfoById(id){return [...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS].find(x=>x.id===id)}
function stripHtmlText(s){
 // <template> разбирает HTML в инертном DocumentFragment: даже данные из
 // повреждённого/подменённого backup не выполняют onerror/script при нормализации.
 const tpl=document.createElement("template");tpl.innerHTML=String(s??"");const root=tpl.content;
 root.querySelectorAll(".mixed").forEach(m=>{
   const w=m.querySelector(".whole")?.textContent?.trim()||"";
   const f=m.querySelector(".frac");
   const n=f?.querySelector(".num")?.textContent?.trim()||"";
   const d=f?.querySelector(".den")?.textContent?.trim()||"";
   m.replaceWith(document.createTextNode(`${w} ${n}/${d}`.trim()));
 });
root.querySelectorAll(".frac").forEach(f=>{
const n=f.querySelector(".num")?.textContent?.trim()||"";
   const d=f.querySelector(".den")?.textContent?.trim()||"";
   f.replaceWith(document.createTextNode(`${n}/${d}`));
 });
 return (root.textContent||"").replace(/\s+/g," ").trim();
}
function safeAcademicHtml(value){
 // В журнале разрешаем только разметку, которую генерирует сам МатКвест
 // для дробей/геометрии. Любые IMG/SCRIPT/event-атрибуты из backup удаляются.
 const tpl=document.createElement("template");tpl.innerHTML=String(value??"");
 const allowedTags=new Set(["B","STRONG","EM","I","SPAN","DIV","BR","SUP","SUB"]);
 const allowedClasses=new Set(["frac","num","den","mixed","whole","math","ray","seg","point"]);
 const walk=node=>{
   [...node.childNodes].forEach(child=>{
     if(child.nodeType===1)
~~~
~~~javascript
 patchCard(prevElementary.apply(this,arguments),topic)};
 const prev3=g3TopicCard,prev6=g6TopicCard,prev7=g7TopicCard,prev8=g8TopicCard;
 g3TopicCard=function(topic){return patchCard(prev3.apply(this,arguments),topic)};
 g6TopicCard=function(topic){return patchCard(prev6.apply(this,arguments),topic)};
 g7TopicCard=function(topic){return patchCard(prev7.apply(this,arguments),topic)};
 g8TopicCard=function(topic){return patchCard(prev8.apply(this,arguments),topic)};
})();
</script>

<script id="mk876-grade5-quality">
/* МатКвест 8.76: локальный hotfix качества 53 генераторов 5 класса.
   Никаких изменений сохранённых вопросов, профилей, XP, монет и структуры стадий. */
(()=>{
'use strict';
const MK5_ORIGINAL_MAKE=makeG5Question;
const MK5_ORIGINAL_FRESH=freshQuiz;
const mk5Gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const mk5Lcm=(a,b)=>a/mk5Gcd(a,b)*b;
const mk5Pick=x=>x[ri(0,x.length-1)];
const mk5Number=(x,d=7)=>Number(Number(x).toFixed(d));
const mk5Comma=x=>String(x).replace('.',',');
const mk5Frac=(n,d)=>frac(n,d);
function mk5Num(text,ans,why,variant,extras=[]){
 ans=mk5Number(ans);const choices=g5nums(ans,extras.map(x=>mk5Number(x)));
 const q=g5q(text,choices,String(ans),why,variant);
 q.mk5Audit={type:'numeric',expected:ans};return q;
}
function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d),q=g5q(text,g5NewChoiceSet(n,d,errors),`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}
function mk5Sign(text,leftN,leftD,rightN,rightD,why,variant){
 const a=leftN*rightD,b=rightN*leftD,correct=a===b?'=':a>b?'>':'<';
 const q=g5q(text,[{label:'<',key:'<'},{label:'>',key:'>'},{label:'=',key:'='}],correct,why,variant);
 q.mk5Audit={type:'relation',left:[leftN,leftD],right:[rightN,rightD],expected:correct};return q;
}
function mk5Choose(text,correct,other,why,variant){
 const choices=[{label:String(correct),key:'ok'},...other.map((label,i)=>({label:String(label),key:`w${i}`}))];
 const q=g5q(text,choices,'ok',why,variant);q.mk5Audit={type:'choice',expected:String(correct)};return q;
}
function mk5Bounds(tier,low,high,inc=1){return ri(low,high+Math.max(0,tier)*inc)}
const mk5FracDen=(tier)=>mk5Pick(tier===0?[3,4,5,6,8]:tier===1?[5,6,7,8,9,10,12]:[7,8,9,10,11,12,15,16]);
function mk5DistinctDigits(n){return [...new Set(String(Math.abs(n)).split('').map(Number))]}
function mk5FractionWord(n,d){
 const numer=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
 const single={2:'вторая',3:'третья',4:'четвёртая',5:'пятая',6:'шестая',7:'седьмая',8:'восьмая',9:'девятая',10:'десятая'};
 const multi={2:'вторых',3:'третьих',4:'четвёртых',5:'пятых',6:'шестых',7:'седьмых',8:'восьмых',9:'девятых',10:'десятых'};
 return numer[n]+' 
~~~
~~~javascript
rd(prev3.apply(this,arguments),topic)};
 g6TopicCard=function(topic){return patchCard(prev6.apply(this,arguments),topic)};
 g7TopicCard=function(topic){return patchCard(prev7.apply(this,arguments),topic)};
 g8TopicCard=function(topic){return patchCard(prev8.apply(this,arguments),topic)};
})();
</script>

<script id="mk876-grade5-quality">
/* МатКвест 8.76: локальный hotfix качества 53 генераторов 5 класса.
   Никаких изменений сохранённых вопросов, профилей, XP, монет и структуры стадий. */
(()=>{
'use strict';
const MK5_ORIGINAL_MAKE=makeG5Question;
const MK5_ORIGINAL_FRESH=freshQuiz;
const mk5Gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const mk5Lcm=(a,b)=>a/mk5Gcd(a,b)*b;
const mk5Pick=x=>x[ri(0,x.length-1)];
const mk5Number=(x,d=7)=>Number(Number(x).toFixed(d));
const mk5Comma=x=>String(x).replace('.',',');
const mk5Frac=(n,d)=>frac(n,d);
function mk5Num(text,ans,why,variant,extras=[]){
 ans=mk5Number(ans);const choices=g5nums(ans,extras.map(x=>mk5Number(x)));
 const q=g5q(text,choices,String(ans),why,variant);
 q.mk5Audit={type:'numeric',expected:ans};return q;
}
function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d),q=g5q(text,g5NewChoiceSet(n,d,errors),`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}
function mk5Sign(text,leftN,leftD,rightN,rightD,why,variant){
 const a=leftN*rightD,b=rightN*leftD,correct=a===b?'=':a>b?'>':'<';
 const q=g5q(text,[{label:'<',key:'<'},{label:'>',key:'>'},{label:'=',key:'='}],correct,why,variant);
 q.mk5Audit={type:'relation',left:[leftN,leftD],right:[rightN,rightD],expected:correct};return q;
}
function mk5Choose(text,correct,other,why,variant){
 const choices=[{label:String(correct),key:'ok'},...other.map((label,i)=>({label:String(label),key:`w${i}`}))];
 const q=g5q(text,choices,'ok',why,variant);q.mk5Audit={type:'choice',expected:String(correct)};return q;
}
function mk5Bounds(tier,low,high,inc=1){return ri(low,high+Math.max(0,tier)*inc)}
const mk5FracDen=(tier)=>mk5Pick(tier===0?[3,4,5,6,8]:tier===1?[5,6,7,8,9,10,12]:[7,8,9,10,11,12,15,16]);
function mk5DistinctDigits(n){return [...new Set(String(Math.abs(n)).split('').map(Number))]}
function mk5FractionWord(n,d){
 const numer=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
 const single={2:'вторая',3:'третья',4:'четвёртая',5:'пятая',6:'шестая',7:'седьмая',8:'восьмая',9:'девятая',10:'десятая'};
 const multi={2:'вторых',3:'третьих',4:'четвёртых',5:'пятых',6:'шестых',7:'седьмых',8:'восьмых',9:'девятых',10:'десятых'};
 return numer[n]+' '+(n===1?single[d]:multi[d]);
}
function mk5Mixed(w,n,d){return mixed(w,n,d)}
function mk5FromMixed(w,n,d){return w*d+n}
function mk5ScoreVariant(id,level,mode){
 if(G5_CORE.some(t
~~~
~~~javascript
)();
</script>

<script id="mk876-grade5-quality">
/* МатКвест 8.76: локальный hotfix качества 53 генераторов 5 класса.
   Никаких изменений сохранённых вопросов, профилей, XP, монет и структуры стадий. */
(()=>{
'use strict';
const MK5_ORIGINAL_MAKE=makeG5Question;
const MK5_ORIGINAL_FRESH=freshQuiz;
const mk5Gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const mk5Lcm=(a,b)=>a/mk5Gcd(a,b)*b;
const mk5Pick=x=>x[ri(0,x.length-1)];
const mk5Number=(x,d=7)=>Number(Number(x).toFixed(d));
const mk5Comma=x=>String(x).replace('.',',');
const mk5Frac=(n,d)=>frac(n,d);
function mk5Num(text,ans,why,variant,extras=[]){
 ans=mk5Number(ans);const choices=g5nums(ans,extras.map(x=>mk5Number(x)));
 const q=g5q(text,choices,String(ans),why,variant);
 q.mk5Audit={type:'numeric',expected:ans};return q;
}
function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d),q=g5q(text,g5NewChoiceSet(n,d,errors),`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}
function mk5Sign(text,leftN,leftD,rightN,rightD,why,variant){
 const a=leftN*rightD,b=rightN*leftD,correct=a===b?'=':a>b?'>':'<';
 const q=g5q(text,[{label:'<',key:'<'},{label:'>',key:'>'},{label:'=',key:'='}],correct,why,variant);
 q.mk5Audit={type:'relation',left:[leftN,leftD],right:[rightN,rightD],expected:correct};return q;
}
function mk5Choose(text,correct,other,why,variant){
 const choices=[{label:String(correct),key:'ok'},...other.map((label,i)=>({label:String(label),key:`w${i}`}))];
 const q=g5q(text,choices,'ok',why,variant);q.mk5Audit={type:'choice',expected:String(correct)};return q;
}
function mk5Bounds(tier,low,high,inc=1){return ri(low,high+Math.max(0,tier)*inc)}
const mk5FracDen=(tier)=>mk5Pick(tier===0?[3,4,5,6,8]:tier===1?[5,6,7,8,9,10,12]:[7,8,9,10,11,12,15,16]);
function mk5DistinctDigits(n){return [...new Set(String(Math.abs(n)).split('').map(Number))]}
function mk5FractionWord(n,d){
 const numer=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
 const single={2:'вторая',3:'третья',4:'четвёртая',5:'пятая',6:'шестая',7:'седьмая',8:'восьмая',9:'девятая',10:'десятая'};
 const multi={2:'вторых',3:'третьих',4:'четвёртых',5:'пятых',6:'шестых',7:'седьмых',8:'восьмых',9:'девятых',10:'десятых'};
 return numer[n]+' '+(n===1?single[d]:multi[d]);
}
function mk5Mixed(w,n,d){return mixed(w,n,d)}
function mk5FromMixed(w,n,d){return w*d+n}
function mk5ScoreVariant(id,level,mode){
 if(G5_CORE.some(t=>t.id===id))return mk5Core(id,level,mode);
 if(G5_FRACTIONS.some(t=>t.id===id))return mk5Fractions(id,level,mode);
 if(G5_DECIMALS.some(t=>t.id===id))return mk5Decimals(id,level,mode);
 return null;
}

function mk5Core(id,tier,mode){
 let a,b,c,n,ans,why;
 switch(id){
 case 'natural':{
  
~~~
~~~javascript
=[b,a%b]}return a||1};
const mk5Lcm=(a,b)=>a/mk5Gcd(a,b)*b;
const mk5Pick=x=>x[ri(0,x.length-1)];
const mk5Number=(x,d=7)=>Number(Number(x).toFixed(d));
const mk5Comma=x=>String(x).replace('.',',');
const mk5Frac=(n,d)=>frac(n,d);
function mk5Num(text,ans,why,variant,extras=[]){
 ans=mk5Number(ans);const choices=g5nums(ans,extras.map(x=>mk5Number(x)));
 const q=g5q(text,choices,String(ans),why,variant);
 q.mk5Audit={type:'numeric',expected:ans};return q;
}
function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d),q=g5q(text,g5NewChoiceSet(n,d,errors),`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}
function mk5Sign(text,leftN,leftD,rightN,rightD,why,variant){
 const a=leftN*rightD,b=rightN*leftD,correct=a===b?'=':a>b?'>':'<';
 const q=g5q(text,[{label:'<',key:'<'},{label:'>',key:'>'},{label:'=',key:'='}],correct,why,variant);
 q.mk5Audit={type:'relation',left:[leftN,leftD],right:[rightN,rightD],expected:correct};return q;
}
function mk5Choose(text,correct,other,why,variant){
 const choices=[{label:String(correct),key:'ok'},...other.map((label,i)=>({label:String(label),key:`w${i}`}))];
 const q=g5q(text,choices,'ok',why,variant);q.mk5Audit={type:'choice',expected:String(correct)};return q;
}
function mk5Bounds(tier,low,high,inc=1){return ri(low,high+Math.max(0,tier)*inc)}
const mk5FracDen=(tier)=>mk5Pick(tier===0?[3,4,5,6,8]:tier===1?[5,6,7,8,9,10,12]:[7,8,9,10,11,12,15,16]);
function mk5DistinctDigits(n){return [...new Set(String(Math.abs(n)).split('').map(Number))]}
function mk5FractionWord(n,d){
 const numer=['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
 const single={2:'вторая',3:'третья',4:'четвёртая',5:'пятая',6:'шестая',7:'седьмая',8:'восьмая',9:'девятая',10:'десятая'};
 const multi={2:'вторых',3:'третьих',4:'четвёртых',5:'пятых',6:'шестых',7:'седьмых',8:'восьмых',9:'девятых',10:'десятых'};
 return numer[n]+' '+(n===1?single[d]:multi[d]);
}
function mk5Mixed(w,n,d){return mixed(w,n,d)}
function mk5FromMixed(w,n,d){return w*d+n}
function mk5ScoreVariant(id,level,mode){
 if(G5_CORE.some(t=>t.id===id))return mk5Core(id,level,mode);
 if(G5_FRACTIONS.some(t=>t.id===id))return mk5Fractions(id,level,mode);
 if(G5_DECIMALS.some(t=>t.id===id))return mk5Decimals(id,level,mode);
 return null;
}

function mk5Core(id,tier,mode){
 let a,b,c,n,ans,why;
 switch(id){
 case 'natural':{
  if(mode===0){a=ri(100,10000*(tier+1)),b=a+ri(1,100*(tier+1));if(Math.random()<.5)[a,b]=[b,a];ans=Math.max(a,b);return mk5Num(`Какое из чисел больше: ${a} или ${b}?`,ans,`Сравниваем числа по разрядам, начиная с самого старшего: больше ${ans}.`,'natural_compare',[Math.min(a,b),ans+1])}
  if(mode===1){n=ri(1000,99999*(tier+1));const step=mk5Pick([10,100,1000,10000]);
~~~
~~~javascript
 со скоростью ${speed} км/ч. Сколько километров он проехал?`,ans,`S=vt=${speed}·${time}=${ans} км.`,'word_distance',[speed+time,speed])}
  const p1=a*10,q1=b,p2=ri(2,9)*10,q2=ri(2,6),paid=(Math.ceil((p1*q1+p2*q2)/100)+2)*100;ans=paid-p1*q1-p2*q2;
  return mk5Num(`Купили ${q1} ${ruCount(q1,'блокнот','блокнота','блокнотов')} по ${p1} ₽ и ${q2} ${ruCount(q2,'ручку','ручки','ручек')} по ${p2} ₽. Заплатили ${paid} ₽. Сколько сдачи (₽)?`,ans,`Стоимость ${p1}·${q1}+${p2}·${q2}=${p1*q1+p2*q2} ₽. Сдача ${paid}−${p1*q1+p2*q2}=${ans} ₽.`,'word_three_steps',[paid,p1*q1,p2*q2]);
 }
 }
 return null;
}

function mk5MixedResult(total,d){const w=Math.floor(total/d),r=total%d;if(r===0)return String(w);const [n,den]=g5NewRat(r,d);return mixed(w,n,den)}
function mk5MixedAnswer(text,total,d,why,variant,errors=[]){
 const correct=mk5MixedResult(total,d),variants=[{label:correct,key:'ok'}];
 for(const [numer,den] of errors){const label=mk5MixedResult(numer,den);if(!variants.some(x=>x.label===label))variants.push({label,key:'w'+variants.length})}
 for(let k=1;variants.length<4&&k<20;k++){const label=mk5MixedResult(total+k,d);if(!variants.some(x=>x.label===label))variants.push({label,key:'x'+k})}
 const q=g5q(text,variants,'ok',why,variant);q.mk5Audit={type:'mixed',numerator:total,denominator:d,expected:correct};return q;
}
function mk5Fractions(id,tier,mode){
 const d=mk5FracDen(tier),a=ri(1,d-1),b=ri(1,d-1),n=ri(2,8+tier*3),k=ri(2,4+tier*2);
 let den,numer,ans,c,e,ex;
 switch(id){
 case 'frac_shapes':{
  if(mode===0){
   const facts=[
    ['Чем круг отличается от окружности?','Круг содержит внутреннюю область, а окружность — его граница',['Окружность содержит внутреннюю область, круг — только линия','Оба являются объёмными телами','Круг и окружность всегда имеют разные центры']],
    ['Как называется линия, ограничивающая круг?','Окружность',['Диаметр','Радиус','Шар']],
    ['Какая фигура имеет внутреннюю область?','Круг',['Окружность','Дуга','Отрезок']],
    ['Что соединяет центр окружности с её точкой?','Радиус',['Хорда через центр обязательно','Дуга','Сектор']],
    ['Как называется отрезок через центр между двумя точками окружности?','Диаметр',['Радиус','Дуга','Сектор']],
    ['Какое тело имеет поверхность с точками на одинаковом расстоянии от центра?','Шар',['Цилиндр','Куб','Прямоугольник']],
    ['Что является плоской фигурой?','Круг',['Шар','Цилиндр','Куб']],
    ['Какие основания у цилиндра?','Два равных круга',['Два треугольника','Один квадрат','Две окружности без внутренней области']]
   ];
   const chosen=mk5Pick(facts);return mk5Choose(chosen[0],chosen[1],chosen[2],`Верно: ${chosen[1]}.`,'shape_concept_'+facts.indexOf(chosen));
  }
  if(mode===1){const r=ri(2,18+tier*8);return mk5Num(`Радиус круга равен ${r} см. Найди диаметр (см).`,2*r,`Диаметр в два раза длин
~~~
## keyGrade(qid)===5 total 5
~~~javascript
.answerMode==="coordinate"?"Введите обе координаты. Пустая проверка не считается ошибкой.":q.answerMode==="remainder"?"Введите частное и остаток. Пустая проверка не считается ошибкой.":"Введите ответ. Пустая проверка не считается ошибкой.";
   if(q.answerMode==="coordinate"){
     const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY");
     (!String(x?.value||"").trim()?x:y)?.focus();
   }else if(q.answerMode==="remainder"){
     const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR");
     (!String(qq?.value||"").trim()?qq:rr)?.focus();
   }else inputs[0]?.focus();
   return;
 }
 const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!String(x.value||"").trim())?.focus();return}
 const ok=!!ev.ok,correctText=ev.correctText,correctHtml=ev.correctHtml;
 addAttemptCheck({answer:ev.studentText,correct:ok,details:ok?[]:[ev.detail]});
 if(!ok){
   award(false,"normal");
   quizPenalty=true;
   inputs.forEach(input=>input.classList.add("bad"));
   const retryText=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:ev.retryMessage;
   fb.innerHTML=isErrorWork()?`${retryText} Даже после исправления эта старая ошибка останется на повторение.`:retryText;
   inputs[0]?.focus();inputs[0]?.select?.();
   return;
 }
 answered=true;
 const firstTry=!quizPenalty,source=isErrorWork()?blockSession.errorCurrentSource:null;
 let ew=null,wp=null,cp=null;
 if(isErrorWork())ew=completeErrorWorkOutcome(source,{correct:true,firstTry});
 else if(isWeakPractice())wp=weakPracticeAward();
 else if(isControlReview())cp=controlReviewAward();
 finishAttemptItem(true,firstTry,{studentAnswer:ev.studentText,studentAnswerHtml:ev.studentHtml,correctAnswer:correctText,correctAnswerHtml:correctHtml,explanation:q.ex,...(isErrorWork()?{remediationOutcome:ew?.outcome||"repeat"}:{})});
 if(blockSession)recordBlockItem(isControlReview()?true:firstTry);
 let reward={xp:0,coins:0,bonus:""};
 if(!isErrorWork()&&!isWeakPractice()&&!isControlReview())reward=award(true,"normal");
 else if(isErrorWork())reward={xp:ew?.xp||0,coins:ew?.coins||0,bonus:""};
 else if(isWeakPractice())reward={xp:wp?.xp||0,coins:wp?.coins||0,bonus:""};
 else reward={xp:cp?.xp||0,coins:cp?.coins||0,bonus:""};
 inputs.forEach(input=>{input.disabled=true;input.classList.remove("bad");input.classList.add("good")});
 const check=document.getElementById("quizCheck");if(check)check.style.display="none";
 if(isErrorWork())fb.inne
~~~
~~~javascript
rkup("nextQ","skipNormalQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function pick(i){
 if(answered)return;
 let bs=[...document.querySelectorAll(".answer")],picked=q.choices[i],ok=String(picked.key)===String(q.ans);
 const studentText=choicePlain(picked),correctChoice=q.choices.find(c=>String(c.key)===String(q.ans)),correctText=correctChoice?choicePlain(correctChoice):String(q.ans);
 addAttemptCheck({answer:studentText,correct:ok,details:ok?[]:[`Выбрано: ${studentText}; правильный ответ: ${correctText}`]});
 // В работе над ошибками тестовый вопрос можно исправить в рамках того же задания.
 // Первый неверный выбор сбрасывает серию один раз, но сам item завершается только
 // после правильного ответа или пропуска. Так «ошибся → исправил» честно остаётся 🟡.
 if(isErrorWork()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");
   qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание. Даже после исправления эта старая ошибка останется на повторение.`;
   return;
 }
 if(isWeakPractice()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 if(isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:key
~~~
~~~javascript
.add("bad");
   qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание. Даже после исправления эта старая ошибка останется на повторение.`;
   return;
 }
 if(isWeakPractice()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 if(isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Можно исправить ответ или пропустить задание.`;return;
 }
 if(!isErrorWork()&&!isWeakPractice()&&!isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 answered=true;
 const source=isErrorWork()?blockSession.errorCurrentSource:null;
 const firstTry=!quiz
~~~
~~~javascript
ongHint851(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)} Даже после исправления эта старая ошибка останется на повторение.`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание. Даже после исправления эта старая ошибка останется на повторение.`;
   return;
 }
 if(isWeakPractice()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 if(isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Можно исправить ответ или пропустить задание.`;return;
 }
 if(!isErrorWork()&&!isWeakPractice()&&!isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 answered=true;
 const source=isErrorWork()?blockSession.errorCurrentSource:null;
 const firstTry=!quizPenalty;
 let ew=null;if(isErrorWork())ew=completeErrorWorkOutcome(source,{correct:true,firstTry});
 let wp=null;if(isWeakPractice())wp=weakPracticeAward();
 let cp=null;if(isControlReview())cp=controlReviewAward();
 finishAttemptItem(ok,firstTry,{studentAnswer:studentText,studentAnswerHtml:String(picked?.label||"").includes("<")?picked.label:null,correctAnswer:correctText,correctAnswerHtml:String(correctChoice?.label||"").includes("<")?correctChoice.label:null,explanation:q.ex,...(isErrorWork()?{remediationOutcome:ew.outcome}:{})});
 bs.forEach((b,j)=>{if(String(q.choi
~~~
~~~javascript
d)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 if(isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Можно исправить ответ или пропустить задание.`;return;
 }
 if(!isErrorWork()&&!isWeakPractice()&&!isControlReview()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");if(bs[i])bs[i].disabled=true;qfb.innerHTML=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:`🟡 Пока неверно. Попробуй ещё раз или пропусти задание.`;return;
 }
 answered=true;
 const source=isErrorWork()?blockSession.errorCurrentSource:null;
 const firstTry=!quizPenalty;
 let ew=null;if(isErrorWork())ew=completeErrorWorkOutcome(source,{correct:true,firstTry});
 let wp=null;if(isWeakPractice())wp=weakPracticeAward();
 let cp=null;if(isControlReview())cp=controlReviewAward();
 finishAttemptItem(ok,firstTry,{studentAnswer:studentText,studentAnswerHtml:String(picked?.label||"").includes("<")?picked.label:null,correctAnswer:correctText,correctAnswerHtml:String(correctChoice?.label||"").includes("<")?correctChoice.label:null,explanation:q.ex,...(isErrorWork()?{remediationOutcome:ew.outcome}:{})});
 bs.forEach((b,j)=>{if(String(q.choices[j].key)===String(q.ans))b.classList.add("good")});if(!ok)bs[i].classList.add("bad");
 const r=isErrorWork()?{xp:ew.xp,coins:ew.coins,bonus:""}:isWeakPractice()?{xp:wp.xp,coins:wp.coins,bonus:""}:isControlReview()?{xp:cp.xp,coins:cp.coins,bonus:""}:award(ok,"normal");if(blockSession)recordBlockItem(isControlReview()?true:firstTry);
 const correctHtml=correctChoice?.label??q.correctLabel??q.ans;
 qfb.innerHTML=isErrorWork()?(ew.outcome==="resolved"?`✅ Ошибка отработана. <span style="color:var(--muted)">+${r.xp} XP, +${r.coins} 🪙</span> ${q.ex}`:`🟡 Верно после исправления — ошибка останется на повторение. ${q.e
~~~
## grade===5 total 16
~~~javascript
werCase()}
function originalTableSig(prompt){const m=String(prompt||"").match(/(\d+)\s*[×x*]\s*(\d+)/i);if(!m)return "";const a=Math.min(+m[1],+m[2]),b=Math.max(+m[1],+m[2]);return `table:${a}x${b}`}
function originalColumnSig(source){const m=String(source?.prompt||"").match(/(\d+)\s*([+−×:÷-])\s*(\d+)/);if(!m)return "";return `${source.taskMode||""}:${m[1]}:${m[3]}`}
function freshErrorQuiz(source){
 const maker=()=>{if((source.grade===3||source.grade===7)&&source.questionSubtype){let cand=null;for(let i=0;i<120;i++){cand=source.grade===3?makeG3Question(source.topicId,source.stageIndex):makeG7Question(source.topicId,source.stageIndex);if(g3QuestionSubtype(cand)===source.questionSubtype)return cand}return cand}return source.grade===1?makeG1Question(`g1:${String(source.topicId).replace(/^g1:/,"")}`,source.stageIndex):source.grade===2?makeG2Question(`g2:${String(source.topicId).replace(/^g2:/,"")}`,source.stageIndex):source.grade===3?makeG3Question(source.topicId,source.stageIndex):source.grade===8?makeG8Question(source.topicId,source.stageIndex):source.grade===7?makeG7Question(source.topicId,source.stageIndex):source.grade===6?makeG6Question(source.topicId,source.stageIndex):source.grade===5?makeG5Question(source.topicId):makeQ(source.topicId)};
 const original=normalizePromptForCompare(source.prompt),originalSig=String(source.questionSignature||"");
 return freshCandidate(()=>{let cand=maker();for(let i=0;i<120&&(originalSig?String(cand.sig||"")===originalSig:normalizePromptForCompare(cand.text)===original);i++)cand=maker();return cand},q=>`errorwork:g${source.grade}:${source.topicId}:${q.sig||normalizePromptForCompare(q.text)}`,220);
}
function freshErrorColumn(source){
 mode=source.taskMode||String(source.topicId).split(":")[1]||"add";const oldSig=originalColumnSig(source);
 return freshCandidate(()=>{let cand=generateColumnTask();for(let i=0;i<100&&columnSignature(cand)===oldSig;i++)cand=generateColumnTask();return cand},t=>`errorwork:g4:column:${mode}:${columnSignature(t)}`,200);
}
function freshErrorG3Column(source){mode=source.taskMode||g3WrittenMode(source.topicId)||"add";const old=String(source.questionSignature||"");return freshCandidate(()=>{let cand=generateG3ColumnTask(source.topicId,source.stageIndex);for(let i=0;i<120&&old&&g3ColumnSignature(source.topicId,cand)===old;i++)cand=generateG3ColumnTask(source.topicId,source.stageIndex);return cand},t=>`errorwork:g3:${source.topicId}:${g3ColumnSignature(source.topicId,t)}`,220)}
function freshErrorTable(source){
 const oldSig=originalTableSig(source.prompt);
 return freshCandidate(()=>{let cand=tableCandidate();for(let i=0;i<100&&tableSignature(cand)===oldSig;i++)cand=tableCandidate();return cand},t=>`errorwork:g4:table:${tableSignature(t)}`,180);
}
function errorSourceBanner(source){
 const 
~~~
~~~javascript
umn(source);beginAttemptItem(remediationItemMeta(source,{kind:"g3column",label:source.sourceTitle,prompt:columnPrompt(task),correctAnswer:String(task.ans),taskMode:mode,grade:3,topicId:source.topicId,questionSignature:task._signature||"",explanation:g3ColumnExplanation(task,mode)}));renderTask();return}
 if(source.kind==="column"){
   mode=source.taskMode||String(source.topicId).split(":")[1]||"add";columnSolved=false;columnPenalty=false;task=freshErrorColumn(source);
   beginAttemptItem(remediationItemMeta(source,{kind:"column",label:source.sourceTitle,prompt:columnPrompt(task),correctAnswer:String(task.ans),taskMode:mode}));renderTask();return;
 }
 if(source.kind==="table"){
   tableSolved=false;tablePenalty=false;const fact=freshErrorTable(source);ta=fact.a;tb=fact.b;
   beginAttemptItem(remediationItemMeta(source,{kind:"table",label:"Таблица умножения",prompt:`${ta} × ${tb} = ?`,correctAnswer:String(ta*tb)}));renderErrorWorkTable();return;
 }
 qid=source.grade===2?`g2:${String(source.topicId).replace(/^g2:/,"")}`:source.grade===3?`g3:${source.topicId}`:source.grade===8?`g8:${source.topicId}`:source.grade===7?`g7:${source.topicId}`:source.grade===6?`g6:${source.topicId}`:source.grade===5?`g5:${source.topicId}`:source.topicId;answered=false;quizPenalty=false;q=freshErrorQuiz(source);
 beginAttemptItem(remediationItemMeta(source,{kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:source.grade,topicId:source.topicId,sourceTopicId:q.sourceTopicId||source.topicId,questionSignature:q._signature||q.sig||""}));renderErrorWorkQuiz();
}
function renderErrorWorkTable(){
 tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>document.getElementById("fin")?.focus(),0);
}
function renderErrorWorkQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextErrorWorkTask","skipErrorWorkQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function findSourceError(source){
 const rec=(state.attemptHistory||[]).find(r=>r.id===source?.sourceAttemptId);if(!rec)return null;
 const item=(rec.items||[]).find(x=>x.itemId===source?.sourceItemId);return item?{record:rec,item}:null;
}
function markErrorOutcome(source,result,resolved=false){
 const hit=findSourceError(source);if(!hit)return false;const rem=normalizeRe
~~~
~~~javascript
числяется из attemptHistory + courseProgress + remediation.
   Отдельной базы статистики нет.
   ========================================================= */
let weakGradeFilter="all",weakStatusFilter="all";
function isWeakPractice(){return blockSession?.kind==="weaktopic"}
function analyticsTopicMeta(key){
 key=String(key||"");const grade=keyGrade(key),raw=rawCourseId(key);
 if(grade===3){const x=g3InfoById(key),wm=g3WrittenMode(raw);return x?{key:x.id,grade:3,topicId:raw,title:x.title,group:x.group,kind:wm?"g3column":"quiz",taskMode:wm||null,implemented:x.implemented!==false,rendererType:x.rendererType||"pending",order:x.order}:null}
 if(grade===4&&raw.startsWith("column:")){const m=raw.split(":")[1],title={add:"Сложение столбиком",sub:"Вычитание столбиком",mul:"Умножение столбиком",div:"Деление уголком"}[m]||"Письменные вычисления";return {key,grade:4,topicId:raw,title,group:"Письменные вычисления",kind:"column",taskMode:m}}
 if(grade===4&&raw==="table")return {key,grade:4,topicId:raw,title:"Таблица умножения",group:"Вычисления",kind:"table"};
 if(grade===4){const x=TOPICS.find(t=>t.id===raw);return x?{key,grade:4,topicId:raw,title:x.title,group:"4 класс",kind:"quiz"}:null}
 if(grade===5&&raw==="fraction_mix")return {key,grade:5,topicId:raw,title:"Микс по дробям",group:"Обыкновенные дроби",kind:"quiz",virtual:true};
 if(grade===5){const x=g5InfoById(raw);if(!x)return null;const group=G5_FRACTIONS.some(t=>t.id===raw)?"Обыкновенные дроби":G5_DECIMALS.some(t=>t.id===raw)?"Десятичные дроби и проценты":"Основы";return {key,grade:5,topicId:raw,title:x.title,group,kind:"quiz"}}
 if(grade===6){const x=g6InfoById(key);return x?{key:x.id,grade:6,topicId:raw,title:x.title,group:x.group,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",order:x.order}:null}
 if(grade===7){const x=g7InfoById(key),c=x?g7CourseById(x.course):null;return x?{key:x.id,grade:7,topicId:raw,title:x.title,group:`${c?.title||x.course} • ${x.section||x.group}`,course:x.course,courseTitle:c?.title||x.course,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",plannedRendererType:x.plannedRendererType,order:x.order}:null}
 if(grade===8){const x=g8InfoById(key),c=x?g8CourseById(x.course):null;return x?{key:x.id,grade:8,topicId:raw,title:x.title,group:`${c?.title||x.course} • ${x.section||x.group}`,course:x.course,courseTitle:c?.title||x.course,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",plannedRendererType:x.plannedRendererType,order:x.order}:null}
 return null;
}
function analyticsCoreKeys(){
 const g4=["g4:column:add","g4:column:sub","g4:column:mul","g4:column:div","g4:table",...TOPICS.filter(t=>!["column","table"].includes(t.id)).map(t=>`g4:${t.id}`)];
 return [...g3AllTopics().map(
~~~
~~~javascript
========= */
let weakGradeFilter="all",weakStatusFilter="all";
function isWeakPractice(){return blockSession?.kind==="weaktopic"}
function analyticsTopicMeta(key){
 key=String(key||"");const grade=keyGrade(key),raw=rawCourseId(key);
 if(grade===3){const x=g3InfoById(key),wm=g3WrittenMode(raw);return x?{key:x.id,grade:3,topicId:raw,title:x.title,group:x.group,kind:wm?"g3column":"quiz",taskMode:wm||null,implemented:x.implemented!==false,rendererType:x.rendererType||"pending",order:x.order}:null}
 if(grade===4&&raw.startsWith("column:")){const m=raw.split(":")[1],title={add:"Сложение столбиком",sub:"Вычитание столбиком",mul:"Умножение столбиком",div:"Деление уголком"}[m]||"Письменные вычисления";return {key,grade:4,topicId:raw,title,group:"Письменные вычисления",kind:"column",taskMode:m}}
 if(grade===4&&raw==="table")return {key,grade:4,topicId:raw,title:"Таблица умножения",group:"Вычисления",kind:"table"};
 if(grade===4){const x=TOPICS.find(t=>t.id===raw);return x?{key,grade:4,topicId:raw,title:x.title,group:"4 класс",kind:"quiz"}:null}
 if(grade===5&&raw==="fraction_mix")return {key,grade:5,topicId:raw,title:"Микс по дробям",group:"Обыкновенные дроби",kind:"quiz",virtual:true};
 if(grade===5){const x=g5InfoById(raw);if(!x)return null;const group=G5_FRACTIONS.some(t=>t.id===raw)?"Обыкновенные дроби":G5_DECIMALS.some(t=>t.id===raw)?"Десятичные дроби и проценты":"Основы";return {key,grade:5,topicId:raw,title:x.title,group,kind:"quiz"}}
 if(grade===6){const x=g6InfoById(key);return x?{key:x.id,grade:6,topicId:raw,title:x.title,group:x.group,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",order:x.order}:null}
 if(grade===7){const x=g7InfoById(key),c=x?g7CourseById(x.course):null;return x?{key:x.id,grade:7,topicId:raw,title:x.title,group:`${c?.title||x.course} • ${x.section||x.group}`,course:x.course,courseTitle:c?.title||x.course,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",plannedRendererType:x.plannedRendererType,order:x.order}:null}
 if(grade===8){const x=g8InfoById(key),c=x?g8CourseById(x.course):null;return x?{key:x.id,grade:8,topicId:raw,title:x.title,group:`${c?.title||x.course} • ${x.section||x.group}`,course:x.course,courseTitle:c?.title||x.course,kind:"quiz",implemented:x.implemented!==false,rendererType:x.rendererType||"pending",plannedRendererType:x.plannedRendererType,order:x.order}:null}
 return null;
}
function analyticsCoreKeys(){
 const g4=["g4:column:add","g4:column:sub","g4:column:mul","g4:column:div","g4:table",...TOPICS.filter(t=>!["column","table"].includes(t.id)).map(t=>`g4:${t.id}`)];
 return [...g3AllTopics().map(t=>t.id),...g4,...g5AllTopics().map(t=>`g5:${t.id}`),...g6AllTopics().map(t=>t.id),...g7AllTopics().map(t=>t.id),...g8AllTopics().map(t=>t.id)];

~~~
~~~javascript
Type:x.rendererType||"pending",plannedRendererType:x.plannedRendererType,order:x.order}:null}
 return null;
}
function analyticsCoreKeys(){
 const g4=["g4:column:add","g4:column:sub","g4:column:mul","g4:column:div","g4:table",...TOPICS.filter(t=>!["column","table"].includes(t.id)).map(t=>`g4:${t.id}`)];
 return [...g3AllTopics().map(t=>t.id),...g4,...g5AllTopics().map(t=>`g5:${t.id}`),...g6AllTopics().map(t=>t.id),...g7AllTopics().map(t=>t.id),...g8AllTopics().map(t=>t.id)];
}
function topicKeyFromAttemptItem(record,item){
 if(!record||!item)return null;
 const rawGrade=Number(item.grade||item.sourceGrade||record.grade||keyGrade(record.key));
 const grade=[3,4,5,6,7,8].includes(rawGrade)?rawGrade:keyGrade(record.key);
 let topicId=item.topicId||record.topicId||rawCourseId(record.key||"");
 const kind=item.kind||record.kind||"quiz";
 if(grade===3&&kind==="g3column")topicId=String(topicId).replace(/^g3:/,"");
 else if(kind==="column"||String(topicId).startsWith("column:")){const m=item.taskMode||String(topicId).split(":")[1]||String(rawCourseId(record.key||"")).split(":")[1];if(!m)return null;topicId=`column:${m}`}
 else if(kind==="table"||topicId==="table")topicId="table";
 else if(grade===5&&item.sourceTopicId){
   const st=String(item.sourceTopicId).replace(/^g5:/,"");if(g5InfoById(st))topicId=st;
 }
 if(!topicId||topicId==="errorwork"||topicId==="weakpractice"||topicId==="controlreview")return null;
 const key=`g${grade}:${String(topicId).replace(/^g[345678]:/,"")}`;return analyticsTopicMeta(key)?key:null;
}
function profileProgressData(profile,key){
 const cp=profile?.courseProgress||{};const raw=rawCourseId(key);return cp[key]||((keyGrade(key)===4)?cp[raw]:null)||{best:[0,0,0],bonus:[false,false,false]};
}
function profileCompletedStages(profile,key){
 const p=profileProgressData(profile,key),best=Array.isArray(p.best)?p.best:[0,0,0],needs=[4,5,8];return [0,1,2].filter(i=>Number(best[i]||0)>=needs[i]).length;
}
function highestOpenStageForProfile(profile,key){const done=profileCompletedStages(profile,key);return done>=2?2:done>=1?1:0}
function createTopicAnalyticsBucket(meta){return {...meta,total:0,meaningful:0,firstTry:0,corrected:0,wrong:0,skipped:0,activeErrors:0,resolvedErrors:0,lastActivityAt:0,lastStageIndex:null,recent:[],completedStages:0,masteryPercent:null,status:"nodata",preliminary:false}}
function profileErrorStats(profile){
 const map=new Map(),dupes=new Map();
 for(const record of (profile?.attemptHistory||[]))for(const item of (record?.items||[])){
   if(!isErrorItem(record,item))continue;const d=errorSourceDescriptor(record,item),key=d.key;if(!analyticsTopicMeta(key))continue;
   const fp=errorDuplicateFingerprint(record,item,d),resolved=isErrorResolved(item),prev=dupes.get(fp);
   if(!prev||(!prev.resolved&&resolved)||((prev.at
~~~
~~~javascript
enderHome()">← Главный экран</button></div><section class="weak-hero"><h1>🎯 Слабые темы</h1><p>Свежие ответы важнее старых. Аналитика пересчитывается из реального журнала при каждом открытии и не хранится отдельной базой.</p></section><div class="weak-summary"><div><b>${sum.weak}</b><small>слабые</small></div><div><b>${sum.unstable}</b><small>нестабильные</small></div><div><b>${sum.good+sum.mastered}</b><small>хорошо / освоено</small></div><div><b>${sum.nodata}</b><small>мало данных</small></div><div><b>${sum.activeErrors}</b><small>активные ошибки</small></div></div><div class="error-filter-row"><button class="error-filter ${grade==="all"?"active":""}" onclick="setWeakGradeFilter('all')">Все</button><button class="error-filter ${grade===1||grade==="1"?"active":""}" onclick="setWeakGradeFilter(1)">1 класс</button><button class="error-filter ${grade===2||grade==="2"?"active":""}" onclick="setWeakGradeFilter(2)">2 класс</button><button class="error-filter ${grade===3||grade==="3"?"active":""}" onclick="setWeakGradeFilter(3)">3 класс</button><button class="error-filter ${grade===4||grade==="4"?"active":""}" onclick="setWeakGradeFilter(4)">4 класс</button><button class="error-filter ${grade===5||grade==="5"?"active":""}" onclick="setWeakGradeFilter(5)">5 класс</button><button class="error-filter ${grade===6||grade==="6"?"active":""}" onclick="setWeakGradeFilter(6)">6 класс</button><button class="error-filter ${grade===7||grade==="7"?"active":""}" onclick="setWeakGradeFilter(7)">7 класс</button><button class="error-filter ${grade===8||grade==="8"?"active":""}" onclick="setWeakGradeFilter(8)">8 класс</button></div><div class="error-filter-row"><button class="error-filter ${status==="all"?"active":""}" onclick="setWeakStatusFilter('all')">Все состояния</button><button class="error-filter ${status==="weak"?"active":""}" onclick="setWeakStatusFilter('weak')">🔴 Слабые</button><button class="error-filter ${status==="unstable"?"active":""}" onclick="setWeakStatusFilter('unstable')">🟡 Нестабильные</button><button class="error-filter ${status==="good"||status==="mastered"?"active":""}" onclick="setWeakStatusFilter('good')">🟢 Хорошие</button><button class="error-filter ${status==="nodata"?"active":""}" onclick="setWeakStatusFilter('nodata')">⚪ Мало данных</button></div>${start}<div class="weak-grid">${cards||'<div class="report-empty">По выбранному фильтру тем нет.</div>'}</div>`;
}
function practiceStageFor(profile,key,stats=null){if(stats&&Number.isInteger(stats.lastStageIndex))return Math.max(0,Math.min(2,stats.lastStageIndex));return highestOpenStageForProfile(profile,key)}
function weakTargetFromStats(s){const m=analyticsTopicMeta(s.key);return {...m,stageIndex:practiceStageFor(state,s.key,s),masteryPercent:s.masteryPercent,status:s.status}}
function buildWeak
~~~
~~~javascript
ActiveAttempt();
 show(`<div class="mtop"><h2>🎯 ${modeName==="mixed"?"Слабые темы":"Тренировка темы"}</h2><button class="x" onclick="closeModal()">×</button></div>${blockHead()}<div class="lesson">Новые задания из существующих генераторов. Эта тренировка <b>не открывает ступени и не меняет звёзды</b>, но результаты попадут в журнал и повлияют на будущую аналитику.</div><div id="weakSourceBanner" class="weak-source-banner"></div><div id="stage"></div><div id="tstage"></div><div id="qstage"></div>`);modal.classList.add("column-modal");startNextWeakPracticeTask();
}
function currentWeakTarget(){return isWeakPractice()?blockSession.weakTargets?.[blockSession.done]||null:null}
function weakQuestion(target){const maker=()=>target.grade===1?makeG1Question(`g1:${String(target.topicId).replace(/^g1:/,"")}`,target.stageIndex):target.grade===2?makeG2Question(`g2:${String(target.topicId).replace(/^g2:/,"")}`,target.stageIndex):target.grade===3?makeG3Question(target.topicId,target.stageIndex):target.grade===8?makeG8Question(target.topicId,target.stageIndex):target.grade===7?makeG7Question(target.topicId,target.stageIndex):target.grade===6?makeG6Question(target.topicId,target.stageIndex):target.grade===5?makeG5Question(target.topicId):makeQ(target.topicId);return freshCandidate(maker,q=>`weaktopic:${target.key}:quiz:${q.sig||normalizePromptForCompare(q.text)}`,180)}
function weakColumn(target){mode=target.taskMode||String(target.topicId).split(":")[1]||"add";return freshCandidate(generateColumnTask,t=>`weaktopic:${target.key}:column:${columnSignature(t)}`,200)}
function weakG3Column(target){mode=target.taskMode||g3WrittenMode(target.topicId)||"add";return freshCandidate(()=>generateG3ColumnTask(target.topicId,target.stageIndex),t=>`weaktopic:${target.key}:g3column:${g3ColumnSignature(target.topicId,t)}`,220)}
function weakTable(target){return freshCandidate(tableCandidate,t=>`weaktopic:${target.key}:table:${tableSignature(t)}`,180)}
function weakSourceBanner(target){const el=document.getElementById("weakSourceBanner");if(!el)return;el.innerHTML=`Тема: <b>${esc(attemptTitle(target.key))}</b> • сложность: <b>${esc(STAGES[target.stageIndex]?.name||"Разминка")}</b>`}
function startNextWeakPracticeTask(){
 if(!isWeakPractice())return;if(blockSession.finished||blockSession.done>=blockSession.total){blockSession.finished=true;return finishWeakPractice()}const target=currentWeakTarget();if(!target)return finishWeakPractice();blockSession.weakCurrentStageIndex=target.stageIndex;blockSession.weakCurrentTarget=target;refreshBlockHead();weakSourceBanner(target);const s=document.getElementById("stage"),tt=document.getElementById("tstage"),qq=document.getElementById("qstage");if(s)s.innerHTML="";if(tt)tt.innerHTML="";if(qq)qq.innerHTML="";
 if(target.kind==="g3column"){mode=tar
~~~
~~~javascript
(task),correctAnswer:String(task.ans),taskMode:mode,grade:3,topicId:target.topicId,questionSignature:task._signature||"",explanation:g3ColumnExplanation(task,mode),practiceStageIndex:target.stageIndex});renderTask();return}
 if(target.kind==="column"){mode=target.taskMode;columnSolved=false;columnPenalty=false;task=weakColumn(target);beginAttemptItem({kind:"column",label:attemptTitle(target.key),prompt:columnPrompt(task),correctAnswer:String(task.ans),taskMode:mode,grade:target.grade,topicId:target.topicId,practiceStageIndex:target.stageIndex});renderTask();return}
 if(target.kind==="table"){tableSolved=false;tablePenalty=false;const fact=weakTable(target);ta=fact.a;tb=fact.b;beginAttemptItem({kind:"table",label:"Таблица умножения",prompt:`${ta} × ${tb} = ?`,correctAnswer:String(ta*tb),grade:4,topicId:"table",practiceStageIndex:target.stageIndex});renderWeakPracticeTable();return}
 qid=target.grade===1?`g1:${String(target.topicId).replace(/^g1:/,"")}`:target.grade===2?`g2:${String(target.topicId).replace(/^g2:/,"")}`:target.grade===3?`g3:${target.topicId}`:target.grade===8?`g8:${target.topicId}`:target.grade===7?`g7:${target.topicId}`:target.grade===6?`g6:${target.topicId}`:target.grade===5?`g5:${target.topicId}`:target.topicId;answered=false;quizPenalty=false;q=weakQuestion(target);beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:target.grade,topicId:target.topicId,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",practiceStageIndex:target.stageIndex});renderWeakPracticeQuiz();
}
function renderWeakPracticeTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderWeakPracticeQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextWeakPracticeTask","skipWeakPracticeQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function weakPracticeWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function weakPracticeAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.practiceXpEarned=(blockSession.practiceXpEarned||0)+5;blockSession.pr
~~~
~~~javascript
]:[]}
function freshControlCandidate(generator,rawSigFn,target,maxTries=180){
 const recent=controlNormalHistory(target);
 const preferUnseen=()=>{
let candidate=null,raw="";
  for(let i=0;i<60;i++){
   candidate=generator();raw=rawSigFn(candidate);
   if(!recent.includes(raw)){candidate._controlRawSignature=raw;return candidate}
  }
  candidate=generator();candidate._controlRawSignature=rawSigFn(candidate);return candidate;
 };
 const candidate=freshCandidate(preferUnseen,c=>`control:${target.key}:${c._controlRawSignature||rawSigFn(c)}`,maxTries);
 candidate._signature=`control:${target.key}:${candidate._controlRawSignature||rawSigFn(candidate)}`;
 return candidate;
}
function controlQuestion(target){const maker=()=>target.grade===1?makeG1Question(`g1:${String(target.topicId).replace(/^g1:/,"")}`,target.stageIndex):target.grade===2?makeG2Question(`g2:${String(target.topicId).replace(/^g2:/,"")}`,target.stageIndex):target.grade===3?makeG3Question(target.topicId,target.stageIndex):target.grade===8?makeG8Question(target.topicId,target.stageIndex):target.grade===7?makeG7Question(target.topicId,target.stageIndex):target.grade===6?makeG6Question(target.topicId,target.stageIndex):target.grade===5?makeG5Question(target.topicId):makeQ(target.topicId);return freshControlCandidate(maker,q=>q.sig||normalizePromptForCompare(q.text),target,200)}
function controlColumn(target){mode=target.taskMode||String(target.topicId).split(":")[1]||"add";return freshControlCandidate(generateColumnTask,t=>columnSignature(t),target,220)}
function controlG3Column(target){mode=target.taskMode||g3WrittenMode(target.topicId)||"add";return freshControlCandidate(()=>generateG3ColumnTask(target.topicId,target.stageIndex),t=>g3ColumnSignature(target.topicId,t),target,220)}
function controlTable(target){return freshControlCandidate(tableCandidate,t=>tableSignature(t),target,180)}
function controlSourceBanner(target){const el=document.getElementById("controlSourceBanner");if(!el)return;el.innerHTML=`Тема: <b>${esc(attemptTitle(target.key))}</b> • сложность: <b>${esc(STAGES[target.stageIndex]?.name||"Разминка")}</b>`}
function startNextControlReviewTask(){
 if(!isControlReview())return;if(blockSession.finished||blockSession.done>=blockSession.total){blockSession.finished=true;return finishControlReview()}const target=currentControlTarget();if(!target)return finishControlReview();blockSession.controlCurrentStageIndex=target.stageIndex;blockSession.controlCurrentTarget=target;refreshBlockHead();controlSourceBanner(target);const s=document.getElementById("stage"),tt=document.getElementById("tstage"),qq=document.getElementById("qstage");if(s)s.innerHTML="";if(tt)tt.innerHTML="";if(qq)qq.innerHTML="";
 const common={grade:target.grade,topicId:target.topicId,topicKey:target.key,topicTitle:target
~~~
~~~javascript
n"){mode=target.taskMode;columnSolved=false;columnPenalty=false;task=controlG3Column(target);beginAttemptItem({kind:"g3column",label:attemptTitle(target.key),prompt:columnPrompt(task),correctAnswer:String(task.ans),taskMode:mode,questionSignature:task._signature||"",explanation:g3ColumnExplanation(task,mode),...common});renderTask();return}
 if(target.kind==="column"){mode=target.taskMode;columnSolved=false;columnPenalty=false;task=controlColumn(target);beginAttemptItem({kind:"column",label:attemptTitle(target.key),prompt:columnPrompt(task),correctAnswer:String(task.ans),taskMode:mode,...common});renderTask();return}
 if(target.kind==="table"){tableSolved=false;tablePenalty=false;const fact=controlTable(target);ta=fact.a;tb=fact.b;beginAttemptItem({kind:"table",label:"Таблица умножения",prompt:`${ta} × ${tb} = ?`,correctAnswer:String(ta*tb),...common});renderControlTable();return}
 qid=target.grade===1?`g1:${String(target.topicId).replace(/^g1:/,"")}`:target.grade===2?`g2:${String(target.topicId).replace(/^g2:/,"")}`:target.grade===3?`g3:${target.topicId}`:target.grade===8?`g8:${target.topicId}`:target.grade===7?`g7:${target.topicId}`:target.grade===6?`g6:${target.topicId}`:target.grade===5?`g5:${target.topicId}`:target.topicId;answered=false;quizPenalty=false;q=controlQuestion(target);beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",...common});renderControlQuiz();
}
function renderControlTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderControlQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextControlReviewTask","skipControlReviewQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function controlReviewWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function controlReviewAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.controlXpEarned=(blockSession.controlXpEarned||0)+5;blockSession.controlCoinsEarned=(blockSession.controlCoinsEarned||0)+1;save();return {xp:5,coi
~~~
~~~javascript
.length;if(brandLogo)brandLogo.textContent="🧠";if(brandTitle)brandTitle.textContent=`Ошибки — ${hit.name}`;
 const rows=groups.map(g=>{const a=g.items.filter(x=>!x.resolved).length,r=g.items.filter(x=>x.resolved).length;return `<div class="error-group"><div><h3>${esc(g.title)}</h3><small>${a?`Активных: ${a}`:"Активных нет"}${r?` • отработано: ${r}`:""}</small>${a?'<span class="error-state red">🔴 Требует отработки</span>':'<span class="error-state green">✅ Отработано</span>'}</div></div>`}).join("");
 mainView.innerHTML=`<div class="home-back-row"><button class="home-back-btn" onclick="openTeacherStudentDetailById('${profileId}')">← ${esc(hit.name)}</button></div><section class="errorwork-hero"><h1>🧠 Работа над ошибками — ${esc(hit.name)}</h1><p>Это данные существующего ЭТАПА 1. Исторические ошибки не переписываются после отработки.</p></section><div class="error-summary"><div><b>${active}</b><small>нужно отработать</small></div><div><b>${resolved}</b><small>отработано</small></div><div><b>${all.filter(x=>x.grade===3&&!x.resolved).length}</b><small>3 класс</small></div><div><b>${all.filter(x=>x.grade===4&&!x.resolved).length}</b><small>4 класс</small></div><div><b>${all.filter(x=>x.grade===5&&!x.resolved).length}</b><small>5 класс</small></div><div><b>${all.filter(x=>x.grade===6&&!x.resolved).length}</b><small>6 класс</small></div><div><b>${all.filter(x=>x.grade===7&&!x.resolved).length}</b><small>7 класс</small></div><div><b>${all.filter(x=>x.grade===8&&!x.resolved).length}</b><small>8 класс</small></div></div><div class="error-groups">${rows||'<div class="teacher-empty">🎉 Ошибок в сохранённой истории нет.</div>'}</div><div class="lesson">Teacher mode — просмотр. Чтобы реально запускать тренировку ошибок для этого ученика, используй «Открыть как ученик».</div><div class="actions"><button class="btn primary" onclick="openProfileAsStudent('${profileId}')">Открыть как ученик</button></div>`;
}
function openTeacherJournal(profileId){const hit=teacherProfileById(profileId);if(!hit)return;openAttemptJournal(hit.profile,hit.name,`closeModal();openTeacherStudentDetailById('${profileId}')`)}
function openProfileAsStudent(profileId){
 const hit=teacherProfileById(profileId);if(!hit)return;currentProfile=hit.name;state={...EMPTY_STATE,...hit.profile};state.courseProgress=state.courseProgress||{};state.questionHistory=state.questionHistory||{};normalizeReports();teacherUnlocked=false;teacherViewingProfileId=null;try{localStorage.setItem("mq4_current_profile",currentProfile);localStorage.setItem("mq4",JSON.stringify(state));localStorage.setItem("mq4_profiles",JSON.stringify(profiles))}catch(e){reportStorageError(e,true)}closeModal();stats();renderHome();
}




/* =========================================================
   ЭТАП 6 — ОТЧЁТ ПРЕПОДАВАТЕЛЮ / РОДИТЕЛЮ

~~~
~~~javascript
r:not([disabled]),#quizNext:not([style*="display: none"]),button:not([disabled])');
  focusTarget?.focus({preventScroll:true});
 }catch(e){console.error('МатКвест: ошибка восстановления',e);mk872LearningDialog('Не удалось восстановить тренировку','Нельзя безопасно восстановить исходные задания. Черновик сохранён для проверки; новая задача автоматически не создаётся.',[{label:'Закрыть',run:()=>mk872CloseDialog()},{label:'Начать заново',run:()=>mk872StartOver(d)}])}
 finally{mk872Restoring=false}
}
function mk872StartOver(d){
 mk872CloseDialog();mk872DeleteDraft();
 if(d.mode==='quick'){
  const old=(state.attemptHistory||[]).find(r=>String(r.id)===String(d.attemptId));
  if(old&&old.status==='active'){old.status='abandoned';old.endedAt=Date.now();persistSilently()}
  quickSession=null;quickQuestion=null;quickMode=null;openQuickTrainer(d.key);return
 }
 blockSession=null;state.activeAttempt=null;persistSilently();
 const grade=keyGrade(d.key),topic=String(d.key||'');
 if(grade===1&&typeof openG1Topic==='function')openG1Topic(topic);
 else if(grade===2&&typeof openG2Topic==='function')openG2Topic(topic);
 else if(grade===3&&typeof openG3Topic==='function')openG3Topic(topic);
 else if(grade===5&&typeof openG5Topic==='function')openG5Topic(rawCourseId(topic));
 else if(grade===6&&typeof openG6Topic==='function')openG6Topic(topic);
 else if(grade===7&&typeof openG7Topic==='function')openG7Topic(topic);
 else if(grade===8&&typeof openG8Topic==='function')openG8Topic(topic);
 else if(grade===4&&topic.startsWith('column:'))openColumnPath();
 else if(grade===4&&topic==='table')openTablePath();
 else if(grade===4&&typeof openTopic==='function')openTopic(rawCourseId(topic));
 else renderHome();
}
function mk872OfferResume(){
 if(mk872Dialog||mk872HasActiveLearning())return;
 const d=mk872ReadDraft();if(!d)return;
 if(mk872HasFinishedRecord(d.attemptId)){mk872DeleteDraft();return}
 const msg=mk872DraftUsable(d)?'У тебя осталась незавершённая тренировка. '+d.title+'. Можно продолжить с того же задания.':'Не удалось проверить сохранённую тренировку. Автоматически подменять задания нельзя.';
 mk872LearningDialog('У тебя осталась незавершённая тренировка',msg,[
  {label:'Продолжить',run:()=>mk872RestoreDraft(d)},
  {label:'Начать заново',run:()=>mk872StartOver(d)},
  {label:'Позже',run:()=>mk872CloseDialog()}
 ]);
}
// Snapshot is written after actual answer evaluation/DOM repaint, plus immediately on pagehide.
document.addEventListener('input',()=>mk872ScheduleSave(),true);
document.addEventListener('change',()=>mk872ScheduleSave(),true);
document.addEventListener('click',event=>{
 if(mk872Dialog)return;
 if(!mk872HasActiveLearning())return;
 if(event.target===overlay)return;
 if(mk872BlockActive()&&overlay.contains(event.target)){
  mk872ScheduleSave();return;
 }
 
~~~
## grade === 5 total 0
## g5Generate total 0
## g5Question total 0
## function makeQuestion total 2
~~~javascript
вующее y по вертикальной. По нескольким точкам определяют, растёт ли y, убывает или направление меняется. Отдельно стоящая точка называется выбросом. <b>Важно:</b> связь между двумя величинами не доказывает причину изменений.`;
 if(raw==='sets_elements_subsets')return `<b>Множество</b> — совокупность различных объектов (элементов). Запись 3 ∈ A означает, что 3 принадлежит A; 3 ∉ A — не принадлежит. Если каждый элемент B принадлежит A, то B ⊆ A. У собственного подмножества есть хотя бы один элемент A, не входящий в B. Порядок и повторение элементов множества значения не имеют. <b>Пример:</b> {1; 2} ⊂ {1; 2; 3}.`;
 if(raw==='set_union_intersection')return `<b>Объединение A ∪ B</b> включает каждый элемент, принадлежащий хотя бы одному из множеств. <b>Пересечение A ∩ B</b> содержит только общие элементы. Повторяющиеся элементы записывают один раз. <b>Формула:</b> |A ∪ B| = |A| + |B| − |A ∩ B|. <b>Пример:</b> для A = {1; 2; 3} и B = {2; 3; 4} объединение {1; 2; 3; 4}, пересечение {2; 3}.`;
 return PRE_LESSON(id);
};
for(const raw of TARGET){const t=g8InfoById('g8:'+raw);if(!t)throw Error('Missing grade8 stat topic '+raw);t.implemented=true;t.rendererType=t.plannedRendererType||'quiz';}
function makeQuestion(raw,d,v){if(raw==='scatter_plot')return scatterQ(d,v);if(raw==='sets_elements_subsets')return setsQ(d,v);if(raw==='set_union_intersection')return operationsQ(d,v);throw Error('unknown '+raw)}
const PRE_MAKE=makeG8Question;
makeG8Question=function(id,stageOverride=null){const raw=rawCourseId(id);if(!TARGET.has(raw))return PRE_MAKE(id,stageOverride);const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));return makeQuestion(raw,d,choose(PLANS[raw][d]));};
const PRE_FRESH=freshQuiz;
freshQuiz=function(id){const raw=rawCourseId(id);if(!TARGET.has(raw))return PRE_FRESH(id);
 const d=Math.max(0,Math.min(2,activeDifficulty())),plan=PLANS[raw][d];
 if(!blockSession||blockSession.kind!=='g8quiz')return makeG8Question(id,d);
 const pos=Number(blockSession.done);
 if(!Number.isInteger(pos)||pos<0||pos>=COUNTS[d])return PRE_FRESH(id);
 const v=plan[pos];
 if(!blockSession._stat2||blockSession._stat2.raw!==raw||blockSession._stat2.d!==d||pos===0)blockSession._stat2={raw,d,used:[]};
 const used=blockSession._stat2.used;
 for(let i=0;i<250;i++){
  let q; if(raw==='sets_elements_subsets'&&d===2){forcedBinaryTruth=(pos%2===0);}try{q=makeQuestion(raw,d,v);}finally{forcedBinaryTruth=null;}const tx=norm(q);
  if(used.includes(tx))continue;
  used.push(tx);if(q.sig)registerSignature(q.sig);q._signature=q.sig;return q;
 }
 throw Error('Unable to find unique question for '+raw+'/'+v);
};
})();

</script>
<script id="g8-stat-stage3-93-95">
/* МатКвест — Grade 8 statistics; №93–95. Standalone additive patch. */
(function(){'use strict';
~~~
~~~javascript
ludes(v))shape=pick(['binary','star','fork']);
 if(['leaf_after_attachment','leaf_change'].includes(v))shape=pick(['star','binary','fork']);
 if(['path_contains','path_through_root'].includes(v))n=Math.max(n,7);
 let m=createTree(n,shape);let modelKind='tree';
 if(raw===RAW[0]&&['is_tree','tree_test'].includes(v)){
  modelKind=pick(['tree','cycle','disconnected']);
  if(modelKind==='cycle'){
   const adj=graphInfo(m).adj,missing=m.vertices.flatMap((x,i)=>m.vertices.slice(i+1).filter(y=>!adj[x].includes(y)).map(y=>[x,y]));
   const [x,y]=pick(missing);m.edges.push({from:x,to:y});
  }else if(modelKind==='disconnected')m.edges.splice(randint(0,m.edges.length-1),1);
 }
 return {m,info:graphInfo(m),modelKind};
}
function noDupChoice(correct,alts){const c=String(correct),out=[];for(const w of alts.map(String)){if(w!==c&&!out.includes(w))out.push(w)}
 // Валидные неверные варианты для числовых ответов.
 if(Number.isFinite(Number(c))&&c.trim()!==''){
  const n=Number(c);for(const delta of [-2,1,-1,2,3,-3]){const val=n+delta;if(val>=0&&String(val)!==c&&!out.includes(String(val)))out.push(String(val))}
 }
 if(out.length===0)throw Error('Отсутствуют неверные варианты');return out.slice(0,3)}
function makeQuestion(raw,d,v){
 const {m,info:I,modelKind}=makeGraph(raw,d,v);const n=m.vertices.length,e=m.edges.length;
 const [a,b]=pick([[m.vertices[0],m.vertices[n-1]],[m.vertices[1],m.vertices[n-2]],[m.vertices[0],m.vertices[Math.max(2,n-3)]]]);
 const u=pick(m.vertices),deg=I.deg[u],allPairs=n*(n-1)/2;
 let text='',ans=null,ex='',wrong=null,mode='number',meta={};
 const SET=(question,answer,explanation,alternatives=null,extra={})=>{text=question;ans=String(answer);ex=explanation;wrong=alternatives;mode=alternatives===null?'number':'choice';meta=extra;};
 if(raw===RAW[0]){
  switch(v){
   case 'count_vertices':SET('Сколько вершин изображено в дереве?',n,`Вершины: ${I.vs.join(', ')}. Их ${n}.`);break;
   case 'count_edges':SET('Сколько рёбер у изображённого дерева?',e,`Связный граф без циклов с ${n} вершинами имеет ${n-1} рёбер.`);break;
   case 'count_degree':SET(`Найди степень вершины ${u} (число рёбер, выходящих из неё).`,deg,`У вершины ${u} ${deg} соседей.`);break;
   case 'is_tree':SET('Является ли граф на рисунке деревом?',modelKind==='tree'?'ДА':'НЕТ',modelKind==='tree'?'Граф связный и не содержит циклов.':modelKind==='cycle'?'На рисунке есть цикл.':'Граф несвязный.',[modelKind==='tree'?'НЕТ':'ДА']);break;
   case 'list_neighbors':{const corr=sortList(I.adj[u]);const others=I.vs.filter(x=>x!==u),fake=[sortList(others),sortList(others.filter(x=>x!==I.adj[u][0])),sortList([u,...I.adj[u]])];SET(`Перечисли соседей вершины ${u}.`,corr,`Соседние вершины соединены с ${u} одним ребром: ${corr}.`,noDupChoice(corr,fake));break;}
   case 'count_leaves':SET('Сколько в этом
~~~
## function genQ total 0
## function nextQ total 1
~~~javascript
ed)">+${reward.xp} XP, +${reward.coins} 🪙</span> ${q.ex}`;
 else fb.innerHTML=`${firstTry?"✅ Верно!":"🟡 Исправлено!"} <span style="color:var(--muted)">+${reward.xp} XP, +${reward.coins} 🪙${reward.bonus}</span> ${q.ex}`;
 const nb=document.getElementById("quizNext"),skip=document.getElementById("quizSkip");if(skip)skip.style.display="none";
 if(nb){
   nb.style.display="inline-block";nb.classList.add("next-ready");
   if(blockSession?.finished){nb.textContent="Посмотреть результат →";nb.onclick=finishBlock}
   else{nb.textContent=`Следующий пример ${blockSession?blockSession.done+1:""}${blockSession?"/"+blockSession.total:""} →`;nb.onclick=isErrorWork()?startNextErrorWorkTask:isWeakPractice()?startNextWeakPracticeTask:isControlReview()?startNextControlReviewTask:nextQ}
   setTimeout(()=>nb.focus(),0);
 }
}

function skipNormalQuiz(){
 if(!blockSession||!(["quiz","g1quiz","g2quiz","g3quiz","g5quiz","g6quiz","g7quiz","g8quiz"].includes(blockSession.kind))||answered||!blockSession.currentItem)return false;
 finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});
 recordBlockItem(false);answered=true;save();
 if(blockSession.finished)finishBlock();else nextQ();
 return true;
}
function nextQ(){
 if(blockSession?.finished){finishBlock();return}
 if(isErrorWork()){startNextErrorWorkTask();return}
 if(isWeakPractice()){startNextWeakPracticeTask();return}
 if(isControlReview()){startNextControlReviewTask();return}
 refreshBlockHead();
 answered=false;quizPenalty=false;q=freshQuiz(qid);
 beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:keyGrade(qid),topicId:rawCourseId(qid),sourceTopicId:q.sourceTopicId||rawCourseId(qid),questionSignature:q.sig||q._signature||"",questionSubtype:g3QuestionSubtype(q)});
 qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("nextQ","skipNormalQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function pick(i){
 if(answered)return;
 let bs=[...document.querySelectorAll(".answer")],picked=q.choices[i],ok=String(picked.key)===String(q.ans);
 const studentText=choicePlain(picked),correctChoice=q.choices.find(c=>String(c.key)===String(q.ans)),correctText=correctChoice?choicePlain(correctChoice):String(q.ans);
 addAttemptCheck({answer:studentText,correct:ok,details:ok?[]:[`Выбрано: ${studentText}; правильный ответ: ${correctText}`]});
 // В работе над ошибками тестовый вопрос можно исправить в рамках того же задания.
 // Первый неверный выбор сбрасывает серию один раз, но сам item завершается только
 // после правильного ответа или пропуска. Так «ошибся → исправил» честно остаётся 🟡.
 if(isErrorWork()&&!ok){
   
~~~