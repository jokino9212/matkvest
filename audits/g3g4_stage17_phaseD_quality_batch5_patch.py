#!/usr/bin/env python3
"""Stage17D batch5: SHA-guarded G3 multiplication, division and rectangle-area improvements."""
import pathlib,hashlib,json
from datetime import datetime,timezone
OLD="fcbfe6dc439330704e8865930d1dbf9962fda48039e59b6e467e7fc07bfae55b"
hp=pathlib.Path("index.html");raw=hp.read_bytes();oldhash=hashlib.sha256(raw).hexdigest()
if oldhash!=OLD:raise SystemExit("ABORT: approved candidate changed: "+oldhash)
swp=pathlib.Path("sw.js");sw=swp.read_text("utf8")
if sw.count("matkvest-iphone-v47")!=1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT PWA v47 mismatch")
s=raw.decode("utf8")
def js(t):return t.replace("@B@",chr(96)).replace("@V@",chr(36)+"{")
def cut(start,end,new,guard):
 global s
 if s.count(start)!=1 or s.count(end)!=1:raise SystemExit("ABORT unexpected markers "+start)
 i=s.index(start);j=s.index(end)
 if i>=j:raise SystemExit("ABORT ordering "+start)
 original=s[i:j]
 for key in guard:
  if key not in original:raise SystemExit("ABORT old implementation changed "+key)
 s=s[:i]+js(new)+s[j:]
 return len(original)
mul=cut(' if(raw==="multiplication_table"){',' if(raw==="division_table"){',"""
 if(raw==="multiplication_table"){
  const max=d===0?5:9,fact=multiplicationFactCandidate(2,max),a=fact.a,b=fact.b,product=a*b;
  if(d===0){
   return g6NumberInputQuestion(@B@<b>@V@a} · @V@b}</b> = ?@B@,product,
     @B@По таблице умножения: @V@a} · @V@b} = <b>@V@product}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:product:@V@a}:@V@b}@B@,{audit:{type:"g3MulTable",variant:"product",a,b,product,answer:rational(product,1)}});
  }
  if(d===1){
   if(Math.random()<.48)return g6NumberInputQuestion(@B@<b>@V@a} · @V@b}</b> = ?@B@,product,
     @B@Табличное умножение: @V@a} · @V@b} = <b>@V@product}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:product:@V@a}:@V@b}@B@,{audit:{type:"g3MulTable",variant:"product",a,b,product,answer:rational(product,1)}});
   const variant=Math.random()<.5?"pencils":"books";
   const text=variant==="pencils"?@B@В @V@a} коробках лежит по @V@b} карандашей. Сколько карандашей всего?@B@:@B@На @V@a} полках стоит по @V@b} книг. Сколько книг всего?@B@;
   return g3StoryNumberQuestion(text,product,
     @B@Есть @V@a} одинаковых групп по @V@b} предметов. Значит, @V@a} · @V@b} = <b>@V@product}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:@V@variant}:@V@a}:@V@b}@B@,
     {type:"g3MulTable",variant,a,b,product,answer:rational(product,1)});
  }
  if(Math.random()<.54){
   const variant=Math.random()<.5?"unknownA":"unknownB";
   if(variant==="unknownA")return g6NumberInputQuestion(@B@<b>? · @V@b} = @V@product}</b>@B@,a,
     @B@Так как @V@product} : @V@b} = @V@a}, неизвестный множитель — <b>@V@a}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:unknownA:@V@a}:@V@b}@B@,{audit:{type:"g3MulTable",variant,a,b,product,answer:rational(a,1)}});
   return g6NumberInputQuestion(@B@<b>@V@a} · ? = @V@product}</b>@B@,b,
     @B@Так как @V@product} : @V@a} = @V@b}, неизвестный множитель — <b>@V@b}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:unknownB:@V@a}:@V@b}@B@,{audit:{type:"g3MulTable",variant,a,b,product,answer:rational(b,1)}});
  }
  const variant=Math.random()<.5?"extra":"taken",change=ri(2,Math.min(9,product-1)),
   answer=variant==="extra"?product+change:product-change,
   text=variant==="extra"?@B@В @V@a} коробках по @V@b} карандашей. Положили ещё @V@change} карандашей. Сколько карандашей теперь?@B@:@B@На @V@a} полках стояло по @V@b} книг. @V@change} книг взяли. Сколько книг осталось?@B@;
  return g3StoryNumberQuestion(text,answer,
    @B@Сначала @V@a} · @V@b} = @V@product}. Затем @V@product} @V@variant==="extra"?"+":"−"} @V@change} = <b>@V@answer}</b>.@B@,
    @B@g3:@V@raw}:@V@d}:@V@variant}:@V@a}:@V@b}:@V@change}@B@,
    {type:"g3MulTable",variant,a,b,product,change,answer:rational(answer,1)});
 }
""",["multiplicationFactCandidate","unknownA","unknownB"])
# Explicit second marker avoids accidentally consuming any unrelated topic.
div=cut(' if(raw==="division_table"){',' if(raw==="offtable_multiply"){',"""
 if(raw==="division_table"){
  const max=d===0?6:9,fact=multiplicationFactCandidate(2,max),a=fact.a,b=fact.b,product=a*b,
   byA=Math.random()<.5,divisor=byA?a:b,quotient=byA?b:a;
  if(d===0||d===1&&Math.random()<.5){
   return g6NumberInputQuestion(@B@<b>@V@product} : @V@divisor}</b> = ?@B@,quotient,
     @B@@V@product} : @V@divisor} = <b>@V@quotient}</b>, ведь @V@quotient} · @V@divisor} = @V@product}.@B@,
     @B@g3:@V@raw}:@V@d}:quotient:@V@product}:@V@divisor}@B@,
     {audit:{type:"g3DivTable",variant:"quotient",product,divisor,quotient,answer:rational(quotient,1)}});
  }
  if(d===1){
   const variant=Math.random()<.5?"equalBoxes":"equalGroups",
    text=variant==="equalBoxes"?@B@@V@product} карандашей разложили поровну в @V@divisor} коробок. Сколько карандашей в каждой коробке?@B@:@B@@V@product} тетрадей разложили по @V@divisor} в стопку. Сколько стопок получилось?@B@,
    answer=variant==="equalBoxes"?quotient:product/divisor;
   return g3StoryNumberQuestion(text,answer,
     @B@Делим поровну: @V@product} : @V@divisor} = <b>@V@answer}</b>. Проверка: @V@divisor} · @V@answer} = @V@product}.@B@,
     @B@g3:@V@raw}:@V@d}:@V@variant}:@V@product}:@V@divisor}@B@,
     {type:"g3DivTable",variant,product,divisor,quotient,answer:rational(answer,1)});
  }
  if(Math.random()<.53){
   const variant=Math.random()<.5?"unknownDividend":"unknownDivisor";
   if(variant==="unknownDividend")return g6NumberInputQuestion(@B@<b>? : @V@divisor} = @V@quotient}</b>@B@,product,
     @B@Чтобы найти делимое, умножаем делитель на частное.<br>@V@divisor} · @V@quotient} = <b>@V@product}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:unknownDividend:@V@product}:@V@divisor}@B@,
     {audit:{type:"g3DivTable",variant,product,divisor,quotient,answer:rational(product,1)}});
   return g6NumberInputQuestion(@B@<b>@V@product} : ? = @V@quotient}</b>@B@,divisor,
     @B@Неизвестный делитель: @V@product} : @V@quotient} = <b>@V@divisor}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:unknownDivisor:@V@product}:@V@quotient}@B@,
     {audit:{type:"g3DivTable",variant,product,divisor,quotient,answer:rational(divisor,1)}});
  }
  const variant=Math.random()<.5?"moreEach":"takeEach",change=ri(1,Math.max(1,Math.min(4,quotient-1))),
   answer=variant==="moreEach"?quotient+change:quotient-change,
   text=variant==="moreEach"?@B@@V@product} яблок разложили поровну в @V@divisor} корзин, затем в каждую добавили по @V@change} яблок. Сколько яблок стало в одной корзине?@B@:@B@@V@product} карандашей разложили поровну в @V@divisor} пеналов, затем из каждого взяли по @V@change} карандашей. Сколько карандашей осталось в одном пенале?@B@;
  return g3StoryNumberQuestion(text,answer,
    @B@Сначала в одной группе @V@product} : @V@divisor} = @V@quotient}. Затем @V@quotient} @V@variant==="moreEach"?"+":"−"} @V@change} = <b>@V@answer}</b>.@B@,
    @B@g3:@V@raw}:@V@d}:@V@variant}:@V@product}:@V@divisor}:@V@change}@B@,
    {type:"g3DivTable",variant,product,divisor,quotient,change,answer:rational(answer,1)});
 }
""",["multiplicationFactCandidate","unknownDividend","unknownDivisor"])
# Area: retain original grid drawing as warm-up; advanced stages cannot regress to a grid-only multiplication.
area=cut("function g3RectangleSquareAreaQuestion(d){","/* =========================================================\n   ЭТАП 3.7", """
function g3RectangleSquareAreaQuestion(d){
 const variant=d===0?"gridRect":d===1?g6RandomFrom(["rect","square"]):g6RandomFrom(["missingSide","extendedSide"]),
   unit=variant==="gridRect"?"кв. ед.":g6RandomFrom(["см²","дм²","м²"]),
   baseUnit=unit.replace("²",""),u=(x)=>@B@@V@x} @V@unit}@B@;
 let a,b,answer,text,ex,pts,data,details={};
 if(variant==="square"){
  a=ri(2,5);b=a;answer=a*a;
  text=@B@Найдите площадь квадрата со стороной <b>@V@a} @V@baseUnit}</b>.@B@;
  ex=@B@Площадь квадрата: S = a · a = @V@a} · @V@a} = <b>@V@answer} @V@unit}</b>.@B@;
 }else{
  a=ri(2,7);
  b=g6RandomFrom([2,3,4,5,6].filter(v=>v!==a));
  answer=a*b;
  if(variant==="gridRect"){
   text="Найдите площадь прямоугольника по клетчатому рисунку.";
   ex=@B@На рисунке @V@a} клеток в каждом ряду и @V@b} рядов. S = @V@a} · @V@b} = <b>@V@answer} @V@unit}</b>.@B@;
  }else if(variant==="missingSide"){
   const originalArea=answer,knownSide=a;answer=b;
   text=@B@Площадь прямоугольника <b>@V@originalArea} @V@unit}</b>, одна сторона — <b>@V@knownSide} @V@baseUnit}</b>. Найдите длину другой стороны.@B@;
   ex=@B@Площадь прямоугольника S = a · b. Поэтому неизвестная сторона: @V@originalArea} : @V@knownSide} = <b>@V@answer} @V@baseUnit}</b>.@B@;
   details={originalArea,knownSide};
  }else if(variant==="extendedSide"){
   const delta=ri(1,3),newSide=a+delta;answer=newSide*b;
   text=@B@Прямоугольник имеет стороны <b>@V@a} @V@baseUnit}</b> и <b>@V@b} @V@baseUnit}</b>. Первую сторону увеличили на <b>@V@delta} @V@baseUnit}</b>. Найдите новую площадь.@B@;
   ex=@B@Новая сторона: @V@a} + @V@delta} = @V@newSide} @V@baseUnit}. Новая площадь: @V@newSide} · @V@b} = <b>@V@answer} @V@unit}</b>.@B@;
   details={delta,newSide,originalArea:a*b};
  }else{
   text=@B@Найдите площадь прямоугольника со сторонами <b>@V@a} @V@baseUnit}</b> и <b>@V@b} @V@baseUnit}</b>.@B@;
   ex=@B@Площадь прямоугольника S = a · b = @V@a} · @V@b} = <b>@V@answer} @V@unit}</b>.@B@;
  }
 }
 pts=[{x:3,y:2},{x:3+a,y:2},{x:3+a,y:2+b},{x:3,y:2+b}];
 data={kind:"polygon",points:pts,aria:variant==="square"?"Квадрат":"Прямоугольник на клетчатой сетке"};
 const audit={type:"g3RectArea",variant,a,b,answer,unit,isSquare:a===b,points:pts,...details,
   journalText:variant==="missingSide"?@B@Площадь: @V@details.originalArea} @V@unit}, известная сторона: @V@a} @V@baseUnit}.@B@:
    variant==="extendedSide"?@B@Начальные стороны: @V@a} и @V@b} @V@baseUnit}; увеличить первую на @V@details.delta} @V@baseUnit}.@B@:
    variant==="gridRect"?@B@По клеткам: @V@a} × @V@b}.@B@:@B@Стороны: @V@a} и @V@b} @V@baseUnit}.@B@};
 return g3GeoNumber(text,answer,ex,
  @B@g3:rectangle_square_area:@V@d}:@V@variant}:@V@a}:@V@b}:@V@details.delta??0}:@V@unit}@B@,
  audit,data,variant==="missingSide"?baseUnit:unit);
}

""",["g3GeoNumber","g3RectArea","gridRect"])
nb=s.encode("utf8");NEW=hashlib.sha256(nb).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py");guard=checker.read_text("utf8")
if guard.count("matkvest-iphone-v47")!=1:raise SystemExit("ABORT PWA checker mismatch")
newSw=sw.replace("matkvest-iphone-v47","matkvest-iphone-v48").replace(OLD,NEW)
if newSw.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT SW hash mismatch")
hp.write_bytes(nb);swp.write_text(newSw,"utf8");checker.write_text(guard.replace("matkvest-iphone-v47","matkvest-iphone-v48"),"utf8")
report={"phase":"17D-quality-batch5","at":datetime.now(timezone.utc).isoformat(),"oldSha256":OLD,"newSha256":NEW,"bytes":len(nb),"cache":"matkvest-iphone-v48","topics":["multiplication_table","division_table","rectangle_square_area"],"originalBlocks":{"mul":mul,"div":div,"area":area},"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch5_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
