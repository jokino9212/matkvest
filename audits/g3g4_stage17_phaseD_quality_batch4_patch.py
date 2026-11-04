#!/usr/bin/env python3
"""Stage17D batch4. Source-locked progression: compare_order, mass, money."""
import hashlib,json,pathlib
from datetime import datetime,timezone
OLD="4a9a597d34dfe8f7f48abb323e99784f7f0b529ceb5275b2bc1b94d64fe0bd7c"
hp=pathlib.Path("index.html");raw=hp.read_bytes()
actual=hashlib.sha256(raw).hexdigest()
if actual!=OLD:raise SystemExit("ABORT unexpected approved HTML SHA "+actual)
swp=pathlib.Path("sw.js");sw=swp.read_text("utf8")
if sw.count("matkvest-iphone-v46")!=1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT PWA v46 mismatch")
s=raw.decode("utf8")
def js(x):return x.replace("@B@",chr(96)).replace("@V@",chr(36)+"{")
def block(start,end,new,checks):
 global s
 if s.count(start)!=1 or s.count(end)!=1:raise SystemExit("ABORT source marker counts "+start)
 a=s.index(start);b=s.index(end)
 if b<=a:raise SystemExit("ABORT wrong markers order "+start)
 old=s[a:b]
 for token in checks:
  if token not in old:raise SystemExit("ABORT original behavior changed "+start+" "+token)
 s=s[:a]+js(new)+s[b:]
 return len(old)
compare=block(' if(raw==="compare_order"){',' if(raw==="increase_decrease_times"){',"""
 if(raw==="compare_order"){
  if(d===2){
   if(Math.random()<.65){
    const set=new Set();while(set.size<4)set.add(ri(100,999));
    const values=shuffleOptions([...set]),ascending=Math.random()<.5;
    return g3OrderChoiceQuestion(values,ascending,@B@g3:@V@raw}:@V@d}:order:@V@ascending?"asc":"desc"}:@V@[...set].sort((a,b)=>a-b).join(":")}@B@);
   }
   const a=ri(120,800),b=ri(180,900),plus=ri(1,7)*10,minus=ri(1,6)*10,
     leftBase=a+plus,rightBase=b-minus;
   return g3CompareQuestion(@B@Сравните результаты: <b>@V@a} + @V@plus}</b> ? <b>@V@b} − @V@minus}</b>.@B@,
     leftBase,rightBase,
     @B@Вычисляем оба выражения: @V@a} + @V@plus} = @V@leftBase}; @V@b} − @V@minus} = @V@rightBase}.<br>Сравниваем: <b>@V@leftBase} @V@leftBase<rightBase?"<":leftBase>rightBase?">":"="} @V@rightBase}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:expressions:@V@a}:@V@plus}:@V@b}:@V@minus}@B@,
     {variant:"expressions",a,b,plus,minus,leftBase,rightBase});
  }
  if(d===1&&Math.random()<.45){
   const a=ri(130,820),delta=ri(1,7)*10,add=Math.random()<.5,
     leftBase=add?a+delta:a-delta,b=ri(100,899),rightBase=b;
   return g3CompareQuestion(@B@Сравните: <b>@V@a} @V@add?"+":"−"} @V@delta}</b> ? <b>@V@b}</b>.@B@,
     leftBase,rightBase,
     @B@Сначала вычислим: @V@a} @V@add?"+":"−"} @V@delta} = @V@leftBase}.<br>Затем сравним @V@leftBase} @V@leftBase<rightBase?"<":leftBase>rightBase?">":"="} @V@rightBase}.@B@,
     @B@g3:@V@raw}:@V@d}:changeTens:@V@a}:@V@add?1:0}:@V@delta}:@V@b}@B@,
     {variant:"changeTens",a,b,delta,add,leftBase,rightBase});
  }
  let a,b;
  if(d===0){a=ri(10,99);b=Math.random()<.18?a:ri(10,99)}
  else{const h=ri(1,9);a=h*100+ri(0,99);b=Math.random()<.18?a:h*100+ri(0,99);if(a===b&&Math.random()>.5)b=Math.min(999,a+1)}
  const correct=a<b?"<":a>b?">":"=";
  return g3CompareQuestion(@B@<b>@V@a}</b> ? <b>@V@b}</b>@B@,a,b,
    @B@Сравниваем числа по разрядам: <b>@V@a} @V@correct} @V@b}</b>.@B@,
    @B@g3:@V@raw}:@V@d}:direct:@V@a}:@V@b}@B@,
    {variant:"direct",a,b});
 }
""",["g3OrderChoiceQuestion","g3CompareQuestion","if(d===0)"])
mass=block(' if(raw==="mass"){',' if(raw==="money"){',"""
 if(raw==="mass"){
  if(d===0){
   const kg=Math.random()<.5,amount=kg?ri(1,8):ri(1,8)*1000,from=kg?"кг":"г",to=kg?"г":"кг",answer=g3UnitInteger("mass",amount,from,to);
   return g3UnitNumberQuestion("mass",@B@<b>@V@amount} @V@from}</b> = ? @V@to}@B@,amount,from,to,
     @B@1 кг = 1000 г. Получаем <b>@V@answer} @V@to}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:convert:@V@amount}:@V@from}:@V@to}@B@);
  }
  if(d===1){
   if(Math.random()<.55){
    const kg=ri(1,6),g=ri(5,65)*100,left=kg*1000,right=g;
    return g3CompareQuestion(@B@<b>@V@kg} кг</b> ? <b>@V@g} г</b>@B@,left,right,
      @B@@V@kg} кг = @V@left} г.<br>@V@left} г @V@left<right?"<":left>right?">":"="} @V@right} г.@B@,
      @B@g3:@V@raw}:@V@d}:compare:@V@kg}:@V@g}@B@,{variant:"compare",dimension:"mass",kg,g,left,right});
   }
   const kg=ri(1,5),g=ri(1,9)*100,answer=kg*1000+g;
   return g6NumberInputQuestion(@B@<b>@V@kg} кг @V@g} г</b> = ? г@B@,answer,
     @B@1 кг = 1000 г.<br>@V@kg} кг = @V@kg*1000} г; @V@kg*1000} + @V@g} = <b>@V@answer} г</b>.@B@,
     @B@g3:@V@raw}:@V@d}:mixed:@V@kg}:@V@g}@B@,
     {unitSuffix:"г",audit:{type:"g3UnitMixed",variant:"mixed",dimension:"mass",kg,g,answer:rational(answer,1)}});
  }
  if(Math.random()<.5){
   const kg=ri(2,6),g=ri(1,8)*100,taken=ri(1,15)*100,starting=kg*1000+g,answer=starting-taken;
   return g3StoryNumberQuestion(@B@В мешке было <b>@V@kg} кг @V@g} г</b> крупы. Отсыпали <b>@V@taken} г</b>. Сколько граммов осталось?@B@,
     answer,@B@Переведём массу в граммы: @V@kg} · 1000 + @V@g} = @V@starting} г.<br>Вычтем отсыпанное: @V@starting} − @V@taken} = <b>@V@answer} г</b>.@B@,
     @B@g3:@V@raw}:@V@d}:afterTaking:@V@kg}:@V@g}:@V@taken}@B@,
     {variant:"afterTaking",dimension:"mass",kg,g,taken,starting,answer},"г");
  }
  const kgA=ri(2,6),gA=ri(1,8)*100,kgB=ri(1,kgA-1),gB=ri(1,8)*100,
    gramsA=kgA*1000+gA,gramsB=kgB*1000+gB,answer=gramsA-gramsB;
  return g3StoryNumberQuestion(@B@Первый мешок весит <b>@V@kgA} кг @V@gA} г</b>, а второй — <b>@V@kgB} кг @V@gB} г</b>. На сколько граммов первый мешок тяжелее второго?@B@,
    answer,@B@Первый: @V@kgA} · 1000 + @V@gA} = @V@gramsA} г.<br>Второй: @V@kgB} · 1000 + @V@gB} = @V@gramsB} г.<br>Разница: @V@gramsA} − @V@gramsB} = <b>@V@answer} г</b>.@B@,
    @B@g3:@V@raw}:@V@d}:twoBags:@V@kgA}:@V@gA}:@V@kgB}:@V@gB}@B@,
    {variant:"twoBags",dimension:"mass",kgA,gA,kgB,gB,gramsA,gramsB,answer},"г");
 }
""",["g3UnitNumberQuestion","g3CompareQuestion","g3UnitMixed"])
money=block(' if(raw==="money"){',' if(raw==="time"){',"""
 if(raw==="money"){
  if(d===0){
   const rub=Math.random()<.5,amount=rub?ri(1,20):ri(1,20)*100,from=rub?"руб.":"коп.",to=rub?"коп.":"руб.",answer=g3UnitInteger("money",amount,from,to);
   return g3UnitNumberQuestion("money",@B@<b>@V@amount} @V@from}</b> = ? @V@to}@B@,amount,from,to,
     @B@1 руб. = 100 коп. Получаем <b>@V@answer} @V@to}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:convert:@V@amount}:@V@from}:@V@to}@B@);
  }
  if(d===1){
   if(Math.random()<.55){
    const rub=ri(1,20),kop=ri(1,99),answer=rub*100+kop;
    return g6NumberInputQuestion(@B@<b>@V@rub} руб. @V@kop} коп.</b> = ? коп.@B@,answer,
      @B@@V@rub} руб. = @V@rub*100} коп.<br>@V@rub*100} + @V@kop} = <b>@V@answer} коп.</b>.@B@,
      @B@g3:@V@raw}:@V@d}:mixed:@V@rub}:@V@kop}@B@,
      {unitSuffix:"коп.",audit:{type:"g3UnitMixed",variant:"mixed",dimension:"money",rub,kop,answer:rational(answer,1)}});
   }
   const rub=ri(1,15),kop=ri(100,1700),left=rub*100,right=kop;
   return g3CompareQuestion(@B@<b>@V@rub} руб.</b> ? <b>@V@kop} коп.</b>@B@,left,right,
     @B@@V@rub} руб. = @V@left} коп.<br>@V@left} коп. @V@left<right?"<":left>right?">":"="} @V@right} коп.@B@,
     @B@g3:@V@raw}:@V@d}:compare:@V@rub}:@V@kop}@B@,
     {variant:"compare",dimension:"money",rub,kop,left,right});
  }
  if(Math.random()<.5){
   const costRub=ri(2,18),costKop=ri(1,99),paidRub=costRub+ri(1,5),
     cost=costRub*100+costKop,paid=paidRub*100,answer=paid-cost;
   return g3StoryNumberQuestion(@B@Покупка стоит <b>@V@costRub} руб. @V@costKop} коп.</b>. Заплатили <b>@V@paidRub} руб.</b> Сколько копеек сдачи должны дать?@B@,
     answer,@B@Стоимость: @V@costRub} · 100 + @V@costKop} = @V@cost} коп.<br>Оплата: @V@paidRub} · 100 = @V@paid} коп.<br>Сдача: @V@paid} − @V@cost} = <b>@V@answer} коп.</b>.@B@,
     @B@g3:@V@raw}:@V@d}:change:@V@costRub}:@V@costKop}:@V@paidRub}@B@,
     {variant:"change",dimension:"money",costRub,costKop,paidRub,cost,paid,answer},"коп.");
  }
  const balanceRub=ri(3,15),balanceKop=ri(10,95),spentRub=ri(1,Math.min(5,balanceRub-1)),
    spentKop=ri(1,90),balance=balanceRub*100+balanceKop,spent=spentRub*100+spentKop,answer=balance-spent;
  return g3StoryNumberQuestion(@B@В кошельке было <b>@V@balanceRub} руб. @V@balanceKop} коп.</b>. Купили карандаш за <b>@V@spentRub} руб. @V@spentKop} коп.</b> Сколько копеек осталось?@B@,
    answer,@B@Было: @V@balanceRub} · 100 + @V@balanceKop} = @V@balance} коп.<br>Потратили: @V@spentRub} · 100 + @V@spentKop} = @V@spent} коп.<br>Осталось: @V@balance} − @V@spent} = <b>@V@answer} коп.</b>.@B@,
    @B@g3:@V@raw}:@V@d}:wallet:@V@balanceRub}:@V@balanceKop}:@V@spentRub}:@V@spentKop}@B@,
    {variant:"wallet",dimension:"money",balanceRub,balanceKop,spentRub,spentKop,balance,spent,answer},"коп.");
 }
""",["g3UnitNumberQuestion","g3CompareQuestion","g3UnitMixed"])
b=s.encode("utf8");NEW=hashlib.sha256(b).hexdigest()
guard=pathlib.Path("audits/g7_stage12_sync_pwa.py");guardText=guard.read_text("utf8")
if guardText.count("matkvest-iphone-v46")!=1:raise SystemExit("ABORT unexpected PWA guard")
newSw=sw.replace("matkvest-iphone-v46","matkvest-iphone-v47").replace(OLD,NEW)
if newSw.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT SW replacement failed")
hp.write_bytes(b);swp.write_text(newSw,"utf8")
guard.write_text(guardText.replace("matkvest-iphone-v46","matkvest-iphone-v47"),"utf8")
report={"stage":"17D-quality-batch4","at":datetime.now(timezone.utc).isoformat(),"oldSha256":OLD,"newSha256":NEW,"bytes":len(b),"cache":"matkvest-iphone-v47","topics":["compare_order","mass","money"],"oldBlocksBytes":{"compare":compare,"mass":mass,"money":money},"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch4_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
