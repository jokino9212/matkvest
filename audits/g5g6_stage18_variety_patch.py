#!/usr/bin/env python3
"""Stage18C: grade5 fraction-type variety and grade6 circle-area variety, plus Russian agreement."""
from pathlib import Path
import hashlib, json
idx=Path("index.html"); swpath=Path("sw.js")
s=idx.read_text("utf8");sw=swpath.read_text("utf8")
before="6a5f32de94787ff1a074f93faa995d0072986b159db0792dea7f08ed1798d207"
sentinel='id="matkvest-stage18c-grade56-variety"'
if sentinel in s:
    assert "matkvest-iphone-v53" in sw
    assert hashlib.sha256(s.encode("utf8")).hexdigest() in sw
    print("STAGE18C already applied")
    raise SystemExit(0)
assert hashlib.sha256(s.encode("utf8")).hexdigest()==before,"Unexpected HTML baseline - refuse patch"
assert "matkvest-iphone-v52" in sw and before in sw
extension=r"""
<script id="matkvest-stage18c-grade56-variety">
/* Stage18C: structural variety for two verified weak topics only. */
(function(){
 function choiceQuestion(base,text,options,correctKey,ex,variant,seedParts){
   const choices=shuffleOptions(options.map(c=>({label:String(c.label),key:String(c.key)})));
   const k=String(correctKey),target=choices.find(c=>c.key===k);
   if(!target||new Set(choices.map(c=>c.key)).size!==choices.length)throw Error('Invalid grade5 fractions classification options');
   return {...base,text,choices,ans:k,ex,answerMode:'choice',correctLabel:target.label,
     correctText:choicePlain(target),templateId:'s18c_types_'+variant,
     sig:'g5:frac_types:s18c:'+activeDifficulty()+':'+variant+':'+seedParts.join(':'),
     audit:{type:'s18cFractionTypes',variant,seedParts}};
 }
 function numberChoice(base,text,answer,ex,variant,parts){
   const choices=g5nums(answer,[answer+1,Math.max(0,answer-1),answer+2,Math.max(0,answer-2)]);
   const a=String(answer),correct=choices.find(x=>String(x.key)===a);
   if(!correct)throw Error('Fraction type target number not present');
   return choiceQuestion(base,text,choices,a,ex,variant,parts);
 }
 function grade5FractionTypes(base){
   const d=activeDifficulty();
   if(d===0)return base;
   const den=ri(4,d===1?12:18),v=ri(0,d===1?4:5);
   if(d===1){
     if(v===0){
       const n=ri(1,den-1),items=[
         {label:frac(n,den),key:'p'},
         {label:frac(den,den),key:'a'},
         {label:frac(den+ri(1,3),den),key:'b'},
         {label:frac(den+ri(4,6),den),key:'c'}
       ];
       return choiceQuestion(base,'Из дробей со знаменателем '+den+' выбери правильную (меньше единицы).',items,'p',
         'У правильной дроби числитель меньше знаменателя.',v,[den,n]);
     }
     if(v===1){
       const n=den+ri(1,5),items=[
         {label:frac(n,den),key:'imp'},
         {label:frac(1,den),key:'a'},
         {label:frac(den-1,den),key:'b'},
         {label:frac(den,den),key:'c'}
       ];
       return choiceQuestion(base,'Из дробей со знаменателем '+den+' найди ту, которая больше единицы.',items,'imp',
         'Дробь больше 1, если числитель больше знаменателя.',v,[den,n]);
     }
     if(v===2){
       const items=[
         {label:frac(den,den),key:'eq'},
         {label:frac(den-1,den),key:'a'},
         {label:frac(den+1,den),key:'b'},
         {label:frac(1,den),key:'c'}
       ];
       return choiceQuestion(base,'Из дробей со знаменателем '+den+' выбери ту, которая равна единице.',items,'eq',
         'Дробь равна 1, когда числитель равен знаменателю.',v,[den]);
     }
     if(v===3)return numberChoice(base,'При знаменателе '+den+' найди наибольший натуральный числитель правильной дроби.',den-1,
       'Числитель должен быть меньше '+den+'. Наибольшее значение: '+(den-1)+'.',v,[den]);
     const n=ri(1,den-2),add=den-n;
     return numberChoice(base,'Дробь '+frac(n,den)+' правильная. На сколько минимум нужно увеличить числитель, чтобы она стала неправильной?',add,
       'Неправильная дробь начинается с числителя '+den+'. Нужно прибавить '+den+' − '+n+' = '+add+'.',v,[den,n]);
   }
   if(v===0||v===1){
     const k=ri(1,3),target=v===0?'правильных':'неправильных',isProper=(i)=>i<k;
     const parts=[];
     for(let i=0;i<4;i++){const b=den+i,n=isProper(i)?ri(1,b-1):b+ri(0,4);parts.push([n,b])}
     const expected=v===0?k:4-k;
     return numberChoice(base,'Сколько '+target+' дробей среди '+parts.map(p=>frac(p[0],p[1])).join(', ')+'?',expected,
       'У правильной дроби числитель меньше знаменателя; у неправильной — не меньше.',v,parts.flat());
   }
   if(v===2){const n=ri(1,den-1),add=den-n;
     return numberChoice(base,'Числитель дроби '+frac(n,den)+' увеличивают на натуральное число. На сколько минимум его нужно увеличить, чтобы дробь стала неправильной?',add,
       'Прибавь '+add+', тогда числитель станет равен знаменателю '+den+'.',v,[den,n]);
   }
   if(v===3)return numberChoice(base,'Если знаменатель дроби равен '+den+', сколько существует правильных дробей с натуральным числителем?',den-1,
     'Числитель можно выбрать от 1 до '+(den-1)+'. Таких чисел '+(den-1)+'.',v,[den]);
   if(v===4){
     const wrongPairs=[
       {label:frac(den-1,den)+' и '+frac(den,den),key:'a'},
       {label:frac(den,den)+' и '+frac(den-1,den),key:'b'},
       {label:frac(1,den)+' и '+frac(den-2,den),key:'c'}
     ];
     const ans={label:frac(den,den)+' и '+frac(den+1,den),key:'both'};
     return choiceQuestion(base,'В какой паре обе дроби неправильные?', [ans,...wrongPairs],'both',
       'Для неправильной дроби числитель больше либо равен знаменателю.',v,[den]);
   }
   const n=ri(den+1,den+5);
   return numberChoice(base,'У неправильной дроби числитель '+n+'. Какой наибольший натуральный знаменатель можно поставить, чтобы дробь осталась неправильной?',n,
     'Дробь неправильная, если знаменатель не больше числителя.',v,[den,n]);
 }
 const make5=makeG5Question;
 makeG5Question=function(id){
   const q=make5.apply(this,arguments);
   return id==='frac_types'?grade5FractionTypes(q):q;
 };
 function countNoun(n){
   const v=Math.abs(Number(n)),t=v%10,h=v%100;
   if(h>=11&&h<=14)return 'деталей';
   if(t===1)return 'деталь';
   if(t>=2&&t<=4)return 'детали';
   return 'деталей';
 }
 function grade6CircleArea(base,id,stage){
   if(String(id).replace(/^g6:/,'')!=='circle_area'||stage>1)return base;
   // Half of generation uses the existing generator to preserve proven visual variants.
   if(Math.random()<0.35)return base;
   const r=ri(2,stage===0?10:12),family=stage===0?ri(0,3):ri(0,4);
   const full=314*r*r; // exact integer in hundredths
   let scaled=full,divisor=100,prompt,reason,tag;
   if(stage===0){
     if(family===0){prompt='Круглая клумба радиуса '+r+' м. Найди её площадь (м²), считая π ≈ 3,14.';tag='flowerbed'}
     else if(family===1){prompt='Диаметр круга равен '+(2*r)+' см. Найди площадь (см²), считая π ≈ 3,14.';tag='diameter'}
     else if(family===2){prompt='Круг вырезан из бумаги, его радиус '+r+' см. Сколько квадратных сантиметров занимает круг при π ≈ 3,14?';tag='paper'}
     else {prompt='Найди площадь круга с радиусом '+r+' см по формуле S = πr². Считай π ≈ 3,14.';tag='formula'}
     reason='Площадь круга S = πr² = 3,14 · '+r+'² = '+(full/100).toFixed(2).replace('.',',')+'.';
   }else{
     if(family===0){divisor=200;prompt='Радиус круглого листа '+r+' см. От него отрезали половину. Найди площадь полукруга (см²) при π ≈ 3,14.';tag='half'}
     else if(family===1){divisor=400;prompt='Радиус круглого сектора, составляющего четверть круга, '+r+' см. Найди площадь сектора (см²) при π ≈ 3,14.';tag='quarter'}
     else if(family===2){prompt='Диаметр круглой площадки '+(2*r)+' м. Найди её площадь (м²), считая π ≈ 3,14.';tag='diameter'}
     else if(family===3){scaled=full*2;prompt='Два одинаковых круглых коврика имеют радиус '+r+' см каждый. Какова их общая площадь (см²) при π ≈ 3,14?';tag='two_discs'}
     else {prompt='Круг имеет радиус '+r+' см. Найди площадь круга (см²), считая π ≈ 3,14.';tag='circle'}
     reason='Один круг: S = 3,14 · '+r+'² = '+(full/100).toFixed(2).replace('.',',')+'. '+(tag==='half'?'Для полукруга делим на 2.':tag==='quarter'?'Для четверти круга делим на 4.':tag==='two_discs'?'Для двух кругов умножаем на 2.':'');
   }
   const ans=rational(scaled,divisor);
   // Keep integer numerator and denominator for half/quarter circle areas.
   const sig='g6:circle_area:s18c:'+stage+':'+tag+':'+r;
   const q=g6NumberInputQuestion(prompt,ans,reason,sig,{audit:{type:'s18cCircleArea',variant:tag,radius:r,stage,areaNumerator:scaled,areaDenominator:divisor}});
   return {...q,sourceTopicId:'g6:circle_area'};
 }
 const make6=makeG6Question;
 makeG6Question=function(id,stage){
   const generated=make6.apply(this,arguments),topic=String(id||'').replace(/^g6:/,'');
   if(topic==='circle_area')return grade6CircleArea(generated,id,Number(stage??activeDifficulty()));
   if(topic==='ratio_value'&&typeof generated?.text==='string'){
     const text=generated.text.replace(/В одной коробке (\d+) одинаковых деталей/g,
       (_match,count)=>'В одной коробке '+count+' '+countNoun(count));
     return text===generated.text?generated:{...generated,text};
   }
   return generated;
 };
})();
</script>
"""
assert s.count("</body>")==1
s=s.replace("</body>",extension+"\n</body>",1)
sha=hashlib.sha256(s.encode("utf8")).hexdigest()
sw=sw.replace("matkvest-iphone-v52","matkvest-iphone-v53").replace(before,sha)
assert "matkvest-iphone-v53" in sw and sha in sw
idx.write_text(s,"utf8");swpath.write_text(sw,"utf8")
r={"previous_sha256":before,"sha256":sha,"new_cache":"matkvest-iphone-v53","scope":"g5 frac_types stage 1,2; g6 circle_area stage 0,1; g6 ratio_value noun agreement"}
Path("audits/g5g6_stage18_variety_patch_report.json").write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(r,ensure_ascii=False))
