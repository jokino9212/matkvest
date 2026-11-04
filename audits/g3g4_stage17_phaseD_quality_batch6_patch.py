#!/usr/bin/env python3
"""MatKvest stage17D batch6: gated changes to area units, tables, bar charts."""
import pathlib,hashlib,json
from datetime import datetime,timezone
OLD="5c079a595763241ee1a816f029543b2383980e9770e27317c5a712260fcad069"
hp=pathlib.Path("index.html");old=hp.read_bytes()
if hashlib.sha256(old).hexdigest()!=OLD:raise SystemExit("ABORT: unexpected approved HTML")
swp=pathlib.Path("sw.js");sw=swp.read_text("utf8")
if sw.count("matkvest-iphone-v48")!=1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT: unexpected PWA")
s=old.decode("utf8")
def js(t):return t.replace("@B@",chr(96)).replace("@V@",chr(36)+"{")
def section(start,end):
 if s.count(start)!=1 or s.count(end)!=1:raise SystemExit("ABORT: marker count "+start)
 a=s.index(start);b=s.index(end)
 if b<=a:raise SystemExit("ABORT: reversed section "+start)
 return s[a:b]
def patch_section(start,end,new,required):
 global s
 prev=section(start,end)
 for r in required:
  if r not in prev:raise SystemExit("ABORT: unexpected source "+r)
 s=s.replace(prev,js(new),1)
 return len(prev)
area=patch_section(' if(raw==="area_units"){',' return null;\n}\n\nfunction makeG6Question',"""
 if(raw==="area_units"){
  if(d===0){
   const variant=Math.random()<.5?"dm2cm2":"m2dm2",value=ri(1,9),
    from=variant==="dm2cm2"?"дм²":"м²",to=variant==="dm2cm2"?"см²":"дм²",answer=value*100;
   return g3UnitNumberQuestion("area",@B@<b>@V@value} @V@from}</b> = ? @V@to}@B@,value,from,to,
     @B@В одном @V@from} — 100 @V@to}. Поэтому @V@value} · 100 = <b>@V@answer} @V@to}</b>.@B@,
     @B@g3:@V@raw}:@V@d}:@V@variant}:@V@value}@B@,{variant});
  }
  if(d===1){
   if(Math.random()<.55){
    const dm=ri(1,7),cm=ri(1,9)*10,answer=dm*100+cm;
    return g6NumberInputQuestion(@B@<b>@V@dm} дм² @V@cm} см²</b> = ? см²@B@,answer,
      @B@@V@dm} дм² = @V@dm*100} см². Складываем: @V@dm*100} + @V@cm} = <b>@V@answer} см²</b>.@B@,
      @B@g3:@V@raw}:@V@d}:mixedDmCm:@V@dm}:@V@cm}@B@,
      {unitSuffix:"см²",audit:{type:"g3UnitMixed",variant:"mixedDmCm",dimension:"area",dm,cm,answer:rational(answer,1)}});
   }
   const answer=ri(1,9),value=answer*100;
   return g3UnitNumberQuestion("area",@B@<b>@V@value} см²</b> = ? дм²@B@,value,"см²","дм²",
     @B@1 дм² = 100 см². @V@value} : 100 = <b>@V@answer} дм²</b>.@B@,
     @B@g3:@V@raw}:@V@d}:cm2dm2:@V@value}@B@,{variant:"cm2dm2"});
  }
  const variant=g6RandomFrom(["mixedCompare","difference","m2cm2"]);
  if(variant==="mixedCompare"){
   const dm=ri(1,7),cm=ri(1,9)*10,right=ri(120,850),left=dm*100+cm,op=left<right?"<":left>right?">":"=";
   return g3CompareQuestion(@B@<b>@V@dm} дм² @V@cm} см²</b> ? <b>@V@right} см²</b>@B@,left,right,
     @B@Первая площадь: @V@dm} · 100 + @V@cm} = @V@left} см². Сравниваем: @V@left} @V@op} @V@right}.@B@,
     @B@g3:@V@raw}:@V@d}:mixedCompare:@V@dm}:@V@cm}:@V@right}@B@,
     {variant,dimension:"area",dm,cm,right,left});
  }
  if(variant==="difference"){
   const dm=ri(2,8),cm=ri(50,dm*100-10),left=dm*100,answer=left-cm;
   return g3StoryNumberQuestion(@B@Площадь первого участка <b>@V@dm} дм²</b>, а второго — <b>@V@cm} см²</b>. На сколько квадратных сантиметров площадь первого больше?@B@,
     answer,@B@@V@dm} дм² = @V@left} см². Вычисляем разность: @V@left} − @V@cm} = <b>@V@answer} см²</b>.@B@,
     @B@g3:@V@raw}:@V@d}:difference:@V@dm}:@V@cm}@B@,
     {variant,dimension:"area",dm,cm,left,answer},"см²");
  }
  const value=ri(1,5),answer=value*10000;
  return g3UnitNumberQuestion("area",@B@<b>@V@value} м²</b> = ? см²@B@,value,"м²","см²",
    @B@1 м² = 10 000 см². @V@value} · 10 000 = <b>@V@answer} см²</b>.@B@,
    @B@g3:@V@raw}:@V@d}:m2cm2:@V@value}@B@,{variant});
 }
""",["g3UnitNumberQuestion","g3CompareQuestion"])
# Tables: retain simple lookup/max/min as introductory literacy; advanced questions require calculations.
tstart="function g3TableQuestion(d){"
tend="function g3UniqueChartValues(){"
tab=section(tstart,tend)
original='["lookup","max","min","sum","difference","missing"]'
if tab.count(original)!=1:raise SystemExit("ABORT: table difficulty changed")
tab=tab.replace(original,'["missing","total","range","sum","difference"]')
marker=' const a=ri(0,2),b=ri(a+1,3);model.target='
if tab.count(marker)!=1:raise SystemExit("ABORT: table pair marker changed")
addition=js("""
 if(variant==="total"){
  const answer=values.reduce((sum,n)=>sum+n,0);
  model.target={rows:[0,1,2,3],column:1};
  return g6AttachTable(g3StoryNumberQuestion("Сколько всего книг прочитали четыре ученика?",answer,
    @B@Складываем значения всех строк: @V@values.join(" + ")} = <b>@V@answer}</b>.@B@,
    @B@g3:tables:@V@d}:total:@V@values.join(",")}@B@,{variant,tableModel:model,answer}),data);
 }
 if(variant==="range"){
  const distinct=g3DistinctNumbers(4,3,20);
  for(let i=0;i<4;i++){values[i]=distinct[i];data.rows[i][1]=distinct[i];model.rows[i][1]=distinct[i]}
  const highest=Math.max(...values),lowest=Math.min(...values),answer=highest-lowest;
  model.target={rows:[values.indexOf(highest),values.indexOf(lowest)],column:1};
  return g6AttachTable(g3StoryNumberQuestion("На сколько книг наибольшее значение в таблице больше наименьшего?",answer,
    @B@Самое большое значение — @V@highest}, самое маленькое — @V@lowest}. Разность: @V@highest} − @V@lowest} = <b>@V@answer}</b>.@B@,
    @B@g3:tables:@V@d}:range:@V@values.join(",")}@B@,{variant,tableModel:model,answer}),data);
 }
 if(variant==="difference"){
  const distinct=g3DistinctNumbers(4,3,20);
  for(let i=0;i<4;i++){values[i]=distinct[i];data.rows[i][1]=distinct[i];model.rows[i][1]=distinct[i]}
 }
""")
tab=tab.replace(marker,addition+marker)
s=s.replace(section(tstart,tend),tab,1)
# Chart: no easy lookup/max/min in hard mode; include extrema-range and combined top two.
cstart="function g3BarChartsQuestion(d){"
cend="function g3ApplyAlgorithm(start,operations){"
chart=section(cstart,cend)
before='["lookup","difference","sum","total","equal","max","min"]'
if chart.count(before)!=1:raise SystemExit("ABORT: chart difficulty changed")
chart=chart.replace(before,'["total","equal","range","topTwo"]')
old_values='variant==="max"||variant==="min"?g3UniqueChartValues()'
if chart.count(old_values)!=1:raise SystemExit("ABORT: chart values selector")
chart=chart.replace(old_values,'["max","min","range","topTwo"].includes(variant)?g3UniqueChartValues()')
marker=' const a=ri(0,2),b=ri(a+1,3);audit.chartModel.target='
if chart.count(marker)!=1:raise SystemExit("ABORT: chart pair marker")
chart_extra=js("""
 if(variant==="range"){
  const max=Math.max(...values),min=Math.min(...values),answer=max-min;
  audit.chartModel.target={indices:[values.indexOf(max),values.indexOf(min)]};
  audit.answer=answer;
  return g6AttachBarChart(g3StoryNumberQuestion("На сколько наибольший столбец выше наименьшего?",answer,
    @B@Самое большое значение — @V@max}, самое маленькое — @V@min}. Находим разницу: @V@max} − @V@min} = <b>@V@answer}</b>.@B@,
    @B@g3:bar_charts:@V@d}:range:@V@labels.join(",")}:@V@values.join(",")}@B@,audit),data);
 }
 if(variant==="topTwo"){
  const indices=[0,1,2,3].sort((a,b)=>values[b]-values[a]).slice(0,2),answer=values[indices[0]]+values[indices[1]];
  audit.chartModel.target={indices:[...indices]};
  audit.answer=answer;
  return g6AttachBarChart(g3StoryNumberQuestion("Найди сумму двух самых высоких столбцов диаграммы.",answer,
    @B@Два наибольших значения: @V@values[indices[0]]} и @V@values[indices[1]]}. Сумма: @V@values[indices[0]]} + @V@values[indices[1]]} = <b>@V@answer}</b>.@B@,
    @B@g3:bar_charts:@V@d}:topTwo:@V@labels.join(",")}:@V@values.join(",")}@B@,audit),data);
 }
""")
chart=chart.replace(marker,chart_extra+marker)
s=s.replace(section(cstart,cend),chart,1)
nb=s.encode("utf8");NEW=hashlib.sha256(nb).hexdigest()
chk=pathlib.Path("audits/g7_stage12_sync_pwa.py");ct=chk.read_text("utf8")
if ct.count("matkvest-iphone-v48")!=1:raise SystemExit("ABORT PWA guard")
nsw=sw.replace("matkvest-iphone-v48","matkvest-iphone-v49").replace(OLD,NEW)
if nsw.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT SW fingerprint")
hp.write_bytes(nb);swp.write_text(nsw,"utf8");chk.write_text(ct.replace("matkvest-iphone-v48","matkvest-iphone-v49"),"utf8")
report={"phase":"17D-quality-batch6","timestamp":datetime.now(timezone.utc).isoformat(),"originalSha256":OLD,"newSha256":NEW,"bytes":len(nb),"cache":"matkvest-iphone-v49","topics":["area_units","tables","bar_charts"],"oldAreaBlockBytes":area,"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch6_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
