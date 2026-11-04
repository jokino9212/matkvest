#!/usr/bin/env python3
"""Stage 17D batch 2: pedagogical visual fractions and broken-line progression."""
import hashlib,json,pathlib
from datetime import datetime,timezone
OLD="409381a4c087d9118f9334505ad3ae2b5662fa6570d8e244d97579e35adca046"
hp=pathlib.Path("index.html");sp=pathlib.Path("sw.js")
raw=hp.read_bytes();actual=hashlib.sha256(raw).hexdigest()
if actual!=OLD:raise SystemExit("ABORT: changed approved HTML "+actual)
sw=sp.read_text("utf8")
if sw.count("matkvest-iphone-v44")!=1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT: PWA v44 source mismatch")
s=raw.decode("utf8")
def js(t):return t.replace("@BT@",chr(96)).replace("@DL@",chr(36))
part_start="function g3PartsIntroQuestion(d){"
part_end="function g3PartOfQuantityQuestion(d){"
geo_start="function g3BrokenLineQuestion(d){"
geo_end="function g3PerimeterQuestion(d){"
for marker in (part_start,part_end,geo_start,geo_end):
 if s.count(marker)!=1:raise SystemExit(f"ABORT: expected unique {marker}, got {s.count(marker)}")
old_parts=s[s.index(part_start):s.index(part_end)]
old_geo=s[s.index(geo_start):s.index(geo_end)]
for x in ('visualFraction','visualName','g3AttachPartsVisual','g3PartsCompareQuestion'):
 if x not in old_parts:raise SystemExit("ABORT: old fraction behavior changed "+x)
for x in ('g3GeoNumber','g3BrokenLength','measures'):
 if x not in old_geo:raise SystemExit("ABORT: old broken-line behavior changed "+x)
new_parts=js("""
function g3PartsIntroQuestion(d){
 const denoms=[2,3,4,5,10],n=g6RandomFrom(denoms),name=g3UnitFractionName(n),other=shuffleOptions(denoms.filter(x=>x!==n)).slice(0,3);let q;
 if(d===0){
   q=g3ChoiceQuestion(@BT@Целое разделили на <b>@DL@{g3EqualPartsPhrase(n)}</b>. Как называется одна часть?@BT@,String(n),[{key:String(n),label:name},...other.map(x=>({key:String(x),label:g3UnitFractionName(x)}))],@BT@Одна из @DL@{n} равных частей — <b>@DL@{name}</b>.@BT@,@BT@g3:parts_intro:@DL@{d}:name:@DL@{n}@BT@,{variant:"name",denom:n},true);
 }else if(d===1){
   const variant=Math.random()<.5?"wordToFraction":"fractionToWord";
   if(variant==="wordToFraction")q=g3ChoiceQuestion(@BT@Какая запись означает «<b>@DL@{name}</b>»?@BT@,String(n),[{key:String(n),label:g3UnitFractionHtml(n)},...other.map(x=>({key:String(x),label:g3UnitFractionHtml(x)}))],@BT@@DL@{name[0].toUpperCase()+name.slice(1)} записывается как @DL@{g3UnitFractionHtml(n)}.@BT@,@BT@g3:parts_intro:@DL@{d}:@DL@{variant}:@DL@{n}@BT@,{variant,denom:n},true);
   else q=g3ChoiceQuestion(@BT@Как называется доля @DL@{g3UnitFractionHtml(n)}?@BT@,String(n),[{key:String(n),label:name},...other.map(x=>({key:String(x),label:g3UnitFractionName(x)}))],@BT@@DL@{g3UnitFractionHtml(n)} — это <b>@DL@{name}</b>.@BT@,@BT@g3:parts_intro:@DL@{d}:@DL@{variant}:@DL@{n}@BT@,{variant,denom:n},true);
 }else{
   const variant=g6RandomFrom(["visualFraction","visualName","visualCount"]);
   if(variant==="visualFraction")q=g3ChoiceQuestion("Какая доля выделена на рисунке?",String(n),[{key:String(n),label:g3UnitFractionHtml(n)},...other.map(x=>({key:String(x),label:g3UnitFractionHtml(x)}))],@BT@Целое разделено на @DL@{g3EqualPartsPhrase(n)} и выделена одна: @DL@{g3UnitFractionHtml(n)}.@BT@,@BT@g3:parts_intro:@DL@{d}:@DL@{variant}:@DL@{n}@BT@,{variant,denom:n},true);
   else if(variant==="visualName")q=g3ChoiceQuestion("Как называется выделенная на рисунке доля?",String(n),[{key:String(n),label:name},...other.map(x=>({key:String(x),label:g3UnitFractionName(x)}))],@BT@Выделена одна из @DL@{n} равных частей — <b>@DL@{name}</b>.@BT@,@BT@g3:parts_intro:@DL@{d}:@DL@{variant}:@DL@{n}@BT@,{variant,denom:n},true);
   else q=g3ChoiceQuestion("Сколько частей размером с выделенную нужно, чтобы составить всё целое?",String(n),[{key:String(n),label:String(n)},...other.map(x=>({key:String(x),label:String(x)}))],@BT@Целое разделено на @DL@{n} равных частей. Одна уже выделена: потребуется @DL@{n} таких частей, чтобы собрать целое.@BT@,@BT@g3:parts_intro:@DL@{d}:@DL@{variant}:@DL@{n}@BT@,{variant,denom:n},true);
   g3AttachPartsVisual(q,[n],["Выделенная часть"]);
 }
 return q;
}
function g3PartsCompareQuestion(d){
 const denoms=[2,3,4,5,10],a=g6RandomFrom(denoms),equal=d>0&&Math.random()<.14,b=equal?a:g6RandomFrom(denoms.filter(x=>x!==a)),correct=a===b?"=":a<b?">":"<",other=[{key:"<",label:"<"},{key:"=",label:"="},{key:">",label:">"}];
 const symbolic=@BT@@DL@{g3UnitFractionHtml(a)} <b>?</b> @DL@{g3UnitFractionHtml(b)}@BT@;
 let text,ex,variant,whole=null,first=null,second=null;
 if(d===0){
  variant="symbolic";
  text=@BT@Сравните доли одного и того же целого: @DL@{symbolic}.@BT@;
  ex=@BT@У частей одного целого меньший знаменатель означает большую долю. Поэтому @DL@{g3UnitFractionHtml(a)} <b>@DL@{correct}</b> @DL@{g3UnitFractionHtml(b)}.@BT@;
 }else if(d===1){
  variant=Math.random()<.55?"diagram":"fractionWords";
  text=variant==="diagram"?"Сравните выделенные части двух одинаковых целых. Выберите знак: первая ? вторая.":@BT@Два одинаковых целых разделили на равные части. Сравните: @DL@{g3UnitFractionName(a)} <b>?</b> @DL@{g3UnitFractionName(b)}.@BT@;
  ex=a===b?@BT@В обеих одинаковых полосках выделена @DL@{g3UnitFractionHtml(a)} — части равны.@BT@:@BT@Сравниваем доли одинаковых целых: у @DL@{g3UnitFractionHtml(a)} и @DL@{g3UnitFractionHtml(b)} меньший знаменатель даёт большую часть. Знак <b>@DL@{correct}</b>.@BT@;
 }else{
  variant=Math.random()<.5?"ribbons":"ropes";
  const gcd=(x,y)=>y?gcd(y,x%y):x,base=a*b/gcd(a,b);
  whole=base*ri(1,Math.max(1,Math.floor(180/base)));
  first=whole/a;second=whole/b;
  text=variant==="ribbons"?@BT@Две ленты одинаковой длины, по <b>@DL@{whole} см</b> каждая. От первой отрезали @DL@{g3UnitFractionHtml(a)}, от второй — @DL@{g3UnitFractionHtml(b)}. Сравните длины отрезанных частей: первая <b>?</b> вторая.@BT@:@BT@Два одинаковых шнура длиной по <b>@DL@{whole} см</b>. От первого взяли @DL@{g3UnitFractionHtml(a)}, от второго — @DL@{g3UnitFractionHtml(b)}. Сравните полученные куски: первый <b>?</b> второй.@BT@;
  ex=@BT@Найдём длины: @DL@{whole} : @DL@{a} = @DL@{first} см; @DL@{whole} : @DL@{b} = @DL@{second} см.<br>Сравним: @DL@{first} <b>@DL@{correct}</b> @DL@{second}. Ленты одинаковые, поэтому сравнение долей корректно.@BT@;
 }
 const q=g3ChoiceQuestion(text,correct,other,ex,@BT@g3:parts_compare:@DL@{d}:@DL@{variant}:@DL@{a}:@DL@{b}:@DL@{whole??0}@BT@,{variant,a,b,relation:correct,equalWhole:true,whole,first,second});
 if(variant==="diagram")g3AttachPartsVisual(q,[a,b],["Первая доля","Вторая доля"]);
 return q;
}
""")
new_geo=js("""
function g3BrokenLineQuestion(d){
 const count=d===0?ri(2,3):d===1?ri(3,4):ri(4,5),lengths=[],pts=[{x:2,y:6}];let x=2,y=6;
 for(let i=0;i<count;i++){
  let len;
  if(i%2===0){len=ri(1,Math.min(3,11-x));x+=len}
  else{const goUp=i%4===1,room=goUp?y-1:7-y;len=ri(1,Math.max(1,Math.min(3,room)));y+=goUp?-len:len}
  lengths.push(len);pts.push({x,y});
 }
 const total=lengths.reduce((a,b)=>a+b,0);
 let variant,text,answer,ex,unknownIndex=null,delta=null,otherLength=null;
 if(d===0){
  variant="sum";
  answer=total;text="Найдите длину ломаной.";
  ex=@BT@Складываем длины всех звеньев:<br>@DL@{lengths.join(" + ")} = <b>@DL@{answer} см</b>.@BT@;
 }else if(d===1){
  variant="missing";
  unknownIndex=ri(0,count-1);
  const known=lengths.filter((_,i)=>i!==unknownIndex),knownSum=known.reduce((a,b)=>a+b,0);
  answer=lengths[unknownIndex];
  text=@BT@Вся ломаная имеет длину <b>@DL@{total} см</b>. Найдите длину звена, отмеченного знаком «?».@BT@;
  ex=@BT@Длина всей ломаной @DL@{total} см. Известные звенья: @DL@{known.join(" + ")} = @DL@{knownSum} см.<br>Неизвестное звено: @DL@{total} − @DL@{knownSum} = <b>@DL@{answer} см</b>.@BT@;
 }else{
  delta=ri(2,6);
  const extend=Math.random()<.5;
  variant=extend?"extend":"compare";
  if(extend){
   answer=total+delta;
   text=@BT@Найдите длину ломаной, если одно из её звеньев удлинить ещё на <b>@DL@{delta} см</b>. На рисунке показаны исходные длины.@BT@;
   ex=@BT@Сначала исходная длина: @DL@{lengths.join(" + ")} = @DL@{total} см.<br>Удлиняем одно звено: @DL@{total} + @DL@{delta} = <b>@DL@{answer} см</b>.@BT@;
  }else{
   otherLength=Math.max(1,total-delta);
   answer=total-otherLength;
   text=@BT@На сколько длина показанной ломаной больше длины отрезка <b>@DL@{otherLength} см</b>?@BT@;
   ex=@BT@Сначала считаем длину ломаной: @DL@{lengths.join(" + ")} = @DL@{total} см.<br>Сравниваем с отрезком: @DL@{total} − @DL@{otherLength} = <b>@DL@{answer} см</b>.@BT@;
  }
 }
 const measures=lengths.map((v,i)=>({a:i,b:i+1,text:d===1&&i===unknownIndex?"? см":@BT@@DL@{v} см@BT@,offset:i%2?18:-18}));
 const data={kind:"broken",points:pts,measures,aria:d===1?"Ломаная с одним неизвестным звеном":"Ломаная с подписанными длинами звеньев"};
 const audit={type:"g3BrokenLength",variant,lengths,total,answer,points:pts,unknownIndex,delta,otherLength,journalText:d===1?@BT@Известные звенья: @DL@{measures.filter(m=>!m.text.startsWith("?")).map(m=>m.text).join(", ")}; общая длина: @DL@{total} см.@BT@:@BT@Звенья: @DL@{lengths.join(", ")} см.@BT@};
 return g3GeoNumber(text,answer,ex,@BT@g3:broken_line_length:@DL@{d}:@DL@{variant}:@DL@{lengths.join("-")}:@DL@{unknownIndex??"x"}:@DL@{delta??0}@BT@,audit,data,"см");
}
""")
updated=s.replace(old_parts,new_parts).replace(old_geo,new_geo)
if updated==s or updated.count('function g3BrokenLineQuestion(')!=1 or updated.count('function g3PartsCompareQuestion(')!=1:raise SystemExit("ABORT: malformed patch")
nb=updated.encode("utf8");NEW=hashlib.sha256(nb).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py");check=checker.read_text("utf8")
if check.count("matkvest-iphone-v44")!=1:raise SystemExit("ABORT: unexpected PWA guard")
new_sw=sw.replace("matkvest-iphone-v44","matkvest-iphone-v45").replace(OLD,NEW)
if new_sw.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT: bad new SW fingerprint")
hp.write_bytes(nb);sp.write_text(new_sw,"utf8")
checker.write_text(check.replace("matkvest-iphone-v44","matkvest-iphone-v45"),"utf8")
report={"stage":"17D-quality-batch2","at":datetime.now(timezone.utc).isoformat(),"baseSha256":OLD,"newSha256":NEW,"bytes":len(nb),"cache":"matkvest-iphone-v45","topics":["parts_compare","broken_line_length","parts_intro"],"notes":["Same-whole comparison now progresses from symbolic fractions through visual/verbal interpretations to lengths requiring independent division","Broken-line tasks now progress from summing lengths to inferring a missing segment to two-step hypothetical/relative length comparisons","Unit-part visual already encoded denominators; retained valid variants, added reconstruct-the-whole reasoning"],"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch2_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
