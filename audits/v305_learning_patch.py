#!/usr/bin/env python3
"""Materialize only the v305 grade-6 pedagogy candidate from v304."""
from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def once(old,new):
    global s
    if s.count(old)!=1:
        raise SystemExit("Unexpected source anchor: "+old[:100])
    s=s.replace(old,new,1)
once('divisors_multiples:"<b>Делитель</b> делит число без остатка. <b>Кратное</b> можно получить умножением данного числа на натуральное число.",','divisors_multiples:"<b>Делитель</b> делит число без остатка. <b>Парные делители</b> — два натуральных делителя, произведение которых равно данному числу. Чтобы найти второй делитель пары, раздели данное число на известный делитель. <b>Кратное</b> можно получить умножением данного числа на натуральное число.",')
once('"Чтобы найти все делители, выпиши пары множителей. Если множители в паре равны, запиши этот делитель один раз."','"Чтобы найти все делители, выпиши пары множителей: для 24 это 1 · 24, 2 · 12, 3 · 8, 4 · 6. Если множители в паре равны, запиши этот делитель один раз: 36 = 6 · 6.","Чтобы найти парный делитель, раздели исходное число на известный делитель: 24 : 3 = 8. Проверка: 3 · 8 = 24."')
once('"Например, 18 : 6 = 3 без остатка, значит 6 — делитель 18. А 18 = 6 · 3, значит 18 — кратное 6."','"Например, один из делителей числа 24 равен 3. Найдём парный: 24 : 3 = 8. Проверка: 3 · 8 = 24. Значит, 3 и 8 — парные делители числа 24. Число 24 кратно и 3, и 8."')
start='  if(basic||topic==="divisibility_3_9"){' 
end='  if(topic==="fraction_properties"||topic==="fraction_reduction"){'
# Find exact g6BookReview block, not a similarly named legacy generator.
a=s.index(start,s.index('function g6BookReview(topic,level,slot)'))
b=s.index(end,a)
new='''  if(basic||topic==="divisibility_3_9"){
   const prefix=ri([10,100,1000][level],[99,999,9999][level]);
   const divisor=basic?[2,5,10][(family+level)%3]:[3,9][(family+level)%2];
   const ds=n=>String(n).split("").reduce((sum,d)=>sum+Number(d),0);
   const detail=(n,d)=>{
    const value=(d===3||d===9)?ds(n):n%10;
    return (d===3||d===9?"Сумма цифр числа "+n+": "+String(n).split("").join(" + ")+" = "+value+". ":"Последняя цифра числа "+n+" — "+value+". ")+
     (n%d===0?"Число делится на ":"Число не делится на ")+d+".";
   };
   const meta={type:topic,variant:"book"+family,level};
   const choice=(text,answer,options,ex)=>g6ChoiceQuestion(text,answer,options,ex,"g6:"+topic+":"+level+":book"+family+":"+text,meta);
   const yesno=(text,yes,ex)=>choice(text,yes?"ДА":"НЕТ",["ДА","НЕТ"],ex);
   if(family===0){
    const base=10*prefix+ri(0,9), yes=Math.random()<0.5;
    const good=base+(divisor-base%divisor)%divisor;
    const n=yes?good:good+1;
    return yesno("Делится ли число "+n+" на "+divisor+"?",n%divisor===0,detail(n,divisor));
   }
   if(family===1){
    const n=10*prefix+ri(0,9);
    const good=n+(divisor-n%divisor)%divisor;
    const bad1=good-1,bad2=good+1;
    return choice("Какое из чисел "+bad1+", "+good+", "+bad2+" делится на "+divisor+"?",good,[bad1,bad2],
     [bad1,good,bad2].map(x=>detail(x,divisor)).join(" "));
   }
   if(family===2||family===3){
    const known=basic?0:ds(prefix);
    const first=(divisor-known%divisor)%divisor;
    const last=first+Math.floor((9-first)/divisor)*divisor;
    const answer=family===2?first:last;
    const text="Какую "+(family===2?"наименьшую":"наибольшую")+" цифру поставить вместо □ в числе "+prefix+"□, чтобы оно делилось на "+divisor+"?";
    const explanation=(basic?"Применяем признак по последней цифре. ":"Сумма известных цифр: "+known+". Ищем ближайшую подходящую сумму. ")+
     "Подходящие цифры: "+Array.from({length:Math.floor((9-first)/divisor)+1},(_,i)=>first+i*divisor).join(", ")+". Ответ: "+answer+".";
    return out(text,answer,explanation);
   }
   const d1=basic?2:3,d2=basic?5:9;
   const wantYes=Math.random()<0.5,base=10*prefix+ri(0,9);
   const m=basic?10:9,good=base+(m-base%m)%m,n=wantYes?good:good+1;
   return yesno("Делится ли число "+n+" одновременно на "+d1+" и на "+d2+"?",n%d1===0&&n%d2===0,detail(n,d1)+" "+detail(n,d2));
  }
'''
s=s[:a]+new+s[b:]
p.write_text(s,encoding="utf-8")
# Update independent existing browser oracle to solve the new rendered questions.
p=Path("audits/g6_book_01_44_browser.cjs")
s=p.read_text(encoding="utf-8")
a=s.index(" if(topic.startsWith('divisibility_')){",s.index("function solveReview("))
b=s.index(" if(topic.startsWith('fraction_')){",a)
s=s[:a]+''' if(topic.startsWith('divisibility_')){
  if(family===0)return a%b===0?'ДА':'НЕТ';
  if(family===1){
   const valid=[a,b,c].filter(n=>n%d===0);
   assert.equal(valid.length,1,text);
   return String(valid[0]);
  }
  if(family===2||family===3){
   const digits=range(0,9).filter(x=>(10*a+x)%b===0);
   assert(digits.length>0,text);
   return family===2?digits[0]:digits.at(-1);
  }
  return a%b===0&&a%c===0?'ДА':'НЕТ';
 }
'''+s[b:]
p.write_text(s,encoding="utf-8")
print("PASS: v305 grade 6 source and oracle patched")
