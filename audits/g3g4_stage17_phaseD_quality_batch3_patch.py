#!/usr/bin/env python3
"""Stage17D batch3: SHA-guarded G3 visual geometry and area quality patch."""
import pathlib,hashlib,json
from datetime import datetime,timezone
OLD="fa3810ac65800b14dfaf5b041598c1a3c21a93e92c71fccc9b00899b3dabf741"
p=pathlib.Path("index.html");b=p.read_bytes()
if hashlib.sha256(b).hexdigest()!=OLD:raise SystemExit("ABORT: unexpected HTML")
swp=pathlib.Path("sw.js");sw=swp.read_text("utf8")
if sw.count("matkvest-iphone-v45")!=1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT: unexpected PWA")
s=b.decode("utf8")
def js(x):return x.replace("@B@",chr(96)).replace("@V@",chr(36)+"{")
def once(old,new,label):
 global s
 if s.count(old)!=1:raise SystemExit("ABORT: "+label+" count "+str(s.count(old)))
 s=s.replace(old,new)
def section(start,end):
 if s.count(start)!=1 or s.count(end)!=1:raise SystemExit("ABORT: markers "+start)
 i=s.index(start);j=s.index(end)
 if j<=i:raise SystemExit("ABORT: ordering "+start)
 return s[i:j]
def replace_section(start,end,new):
 old=section(start,end)
 once(old,new,start)
 return old
# Figure recognition: randomize genuinely distinct, valid diagrams on the basic level.
a="function g3GeometryFiguresQuestion(d){"
e="function g3GeometryConstructionQuestion(d){"
fig=section(a,e)
lines=[x for x in fig.splitlines() if x.strip().startswith('const kinds=["point","line","segment","broken","polygon"]')]
if len(lines)!=1:raise SystemExit("ABORT: figure model changed")
fig=fig.replace(lines[0],js("""  const kinds=["point","line","segment","broken","polygon"],kind=g6RandomFrom(kinds),labels={point:"точка",line:"прямая",segment:"отрезок",broken:"ломаная",polygon:"многоугольник"},
    variation=ri(0,2),polygons=[
      [{x:4,y:6},{x:6,y:2},{x:10,y:6}],
      [{x:3,y:2},{x:9,y:2},{x:9,y:6},{x:3,y:6}],
      [{x:6,y:1},{x:10,y:3},{x:9,y:6},{x:4,y:7},{x:2,y:4}]
    ],broken=[
      [{x:2,y:5},{x:5,y:2},{x:8,y:5},{x:11,y:3}],
      [{x:2,y:2},{x:5,y:6},{x:8,y:3},{x:11,y:5}],
      [{x:2,y:6},{x:5,y:3},{x:8,y:6},{x:11,y:2}]
    ],
    pts=kind==="point"?[{x:ri(3,10),y:ri(2,6)}]:
      kind==="line"?[variation===0?{x:3,y:4}:variation===1?{x:3,y:6}:{x:4,y:2},variation===0?{x:10,y:4}:variation===1?{x:10,y:2}:{x:9,y:6}]:
      kind==="segment"?[variation===0?{x:3,y:3}:variation===1?{x:6,y:2}:{x:3,y:5},variation===0?{x:10,y:3}:variation===1?{x:6,y:7}:{x:10,y:3}]:
      kind==="broken"?broken[variation]:polygons[variation],
    data={kind,points:pts,labels:kind==="point"?["A"]:kind==="segment"?["A","B"]:[],aria:"Геометрический рисунок"};"""))
old_sig=js('@B@g3:geometry_figures:@V@d}:identify:@V@kind}@B@')
new_sig=js('@B@g3:geometry_figures:@V@d}:identify:@V@kind}:@V@pts.map(p=>p.x+"-"+p.y).join("_")}@B@')
if fig.count(old_sig)!=1:raise SystemExit("ABORT: signature changed")
fig=fig.replace(old_sig,new_sig)
if fig.count('const variant=g6RandomFrom(["links","vertices","right"]);')!=1:raise SystemExit("ABORT: advanced figure variants changed")
fig=fig.replace('const variant=g6RandomFrom(["links","vertices","right"]);','const variant=g6RandomFrom(["links","vertices","right","features"]);')
branch=js(""" if(variant==="features"){
  const shapes=[
    [{x:4,y:6},{x:6,y:2},{x:10,y:6}],
    [{x:3,y:2},{x:9,y:2},{x:9,y:6},{x:3,y:6}],
    [{x:6,y:1},{x:10,y:3},{x:9,y:6},{x:4,y:7},{x:2,y:4}],
    [{x:4,y:1},{x:9,y:1},{x:11,y:4},{x:9,y:7},{x:4,y:7},{x:2,y:4}]
  ],pts=g6RandomFrom(shapes),vertices=pts.length,sides=pts.length,answer=vertices+sides;
  return g3GeoNumber("Сколько всего сторон и вершин у изображённого многоугольника?",answer,
    @B@У многоугольника @V@vertices} вершин и @V@sides} сторон. Всего: @V@vertices} + @V@sides} = <b>@V@answer}</b>.@B@,
    @B@g3:geometry_figures:@V@d}:features:@V@vertices}@B@,
    {type:"g3GeoFigures",variant:"features",count:answer,vertices,sides,points:pts},
    {kind:"polygon",points:pts,aria:"Многоугольник с вершинами и сторонами"});
 }
""")
if fig.count(' if(variant==="links"){')!=1:raise SystemExit("ABORT: links branch changed")
fig=fig.replace(' if(variant==="links"){',branch+' if(variant==="links"){')
replace_section(a,e,fig)
# Constructing a square: harder level never falls back to elementary segment measurement.
a="function g3GeometryConstructionQuestion(d){"
e="function g3BrokenLineQuestion(d){"
cons=section(a,e)
old='d===0?"segment":d===1?g6RandomFrom(["rectangle","square"]):g6RandomFrom(["segment","rectangle","square"])'
if cons.count(old)!=1:raise SystemExit("ABORT: construction stage split changed")
cons=cons.replace(old,'d===0?"segment":d===1?g6RandomFrom(["rectangle","square"]):g6RandomFrom(["rectangle","square","squareExtension"])')
if cons.count(' const w=ri(2,6)')!=1:raise SystemExit("ABORT: construction rectangle branch changed")
extra=js(""" if(variant==="squareExtension"){
  const w=ri(3,7),h=g6RandomFrom([2,3,4,5,6].filter(v=>v!==w)),x=3,y=2,pts=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],answer=Math.abs(w-h),
    data={kind:"polygon",points:pts,labels:["A","B","C","D"],aria:"Прямоугольник на клетчатой бумаге"};
  return g3GeoNumber("Сколько клеток нужно добавить к короткой стороне прямоугольника, чтобы его можно было достроить до квадрата?",answer,
    @B@Стороны имеют длины @V@w} и @V@h} клеток. У квадрата они равны, значит короткую сторону нужно увеличить на @V@Math.max(w,h)} − @V@Math.min(w,h)} = <b>@V@answer}</b>.@B@,
    @B@g3:geometry_construction:@V@d}:squareExtension:@V@w}:@V@h}@B@,
    {type:"g3Construction",variant:"squareExtension",w,h,answer,isSquare:false,points:pts},data,"клеток");
 }
""")
cons=cons.replace(' const w=ri(2,6)',extra+' const w=ri(2,6)')
replace_section(a,e,cons)
# Area: levels 0 and 1 remain meaningful. Level 2 adds two-operation modes.
a="function g3AreaCellsShape(d){"
e="function g3AreaMeasureQuestion(d){"
sh=section(a,e)
if sh.count('function g3AreaCellsShape(d){if(d===0||Math.random()<.55)')!=1:raise SystemExit("ABORT: area shape selector changed")
sh=sh.replace('function g3AreaCellsShape(d){if(d===0||Math.random()<.55)','function g3AreaCellsShape(d,forceL=false){if(!forceL&&(d===0||Math.random()<.55))')
replace_section(a,e,sh)
a="function g3AreaMeasureQuestion(d){"
e="function g3RectangleSquareAreaQuestion(d){"
area=section(a,e)
if area.count(' if(d>0&&Math.random()<.28){')!=1:raise SystemExit("ABORT: area base branch changed")
advanced=js(""" if(d===2){
  const variant=Math.random()<.5?"complete":"difference";
  if(variant==="complete"){
   const m=g3AreaCellsShape(2,true),outer=m.w*m.h,answer=outer-m.area,data={kind:"cells",cells:m.cells,aria:"Фигура из клеток с пустым прямоугольным углом"};
   return g3GeoNumber("Сколько квадратных единиц нужно добавить в пустом углу, чтобы получился полный прямоугольник?",answer,
      @B@Внешний прямоугольник: @V@m.w} · @V@m.h} = @V@outer} клеток. Сейчас заполнено @V@m.area}. Нужно добавить @V@outer} − @V@m.area} = <b>@V@answer}</b>.@B@,
      @B@g3:area_measure:@V@d}:complete:@V@m.w}:@V@m.h}:@V@m.cutW}:@V@m.cutH}@B@,
      {type:"g3AreaMeasure",variant:"complete",w:m.w,h:m.h,cutW:m.cutW,cutH:m.cutH,area:m.area,outer,answer,cells:m.cells,journalText:@B@Дополните фигуру до прямоугольника @V@m.w} × @V@m.h}.@B@},
      data,"кв. ед.");
  }
  let wA,hA,wB,hB,areaA,areaB;
  do{wA=ri(2,4);hA=ri(2,5);wB=ri(2,4);hB=ri(2,5);areaA=wA*hA;areaB=wB*hB}while(areaA===areaB);
  const cellsA=[],cellsB=[];
  for(let y=0;y<hA;y++)for(let x=0;x<wA;x++)cellsA.push({x:1+x,y:2+y});
  for(let y=0;y<hB;y++)for(let x=0;x<wB;x++)cellsB.push({x:8+x,y:2+y,alt:true});
  const answer=Math.abs(areaA-areaB),data={kind:"cells",cells:[...cellsA,...cellsB],aria:"Две фигуры из одинаковых клеток"};
  return g3GeoNumber("На сколько квадратных единиц площадь большей фигуры больше площади меньшей?",answer,
    @B@Площади: @V@wA} · @V@hA} = @V@areaA}; @V@wB} · @V@hB} = @V@areaB}. Разность: @V@Math.max(areaA,areaB)} − @V@Math.min(areaA,areaB)} = <b>@V@answer}</b>.@B@,
    @B@g3:area_measure:@V@d}:difference:@V@wA}:@V@hA}:@V@wB}:@V@hB}@B@,
    {type:"g3AreaMeasure",variant:"difference",wA,hA,wB,hB,areaA,areaB,answer,cellsA,cellsB},data,"кв. ед.");
 }
""")
area=area.replace(' if(d>0&&Math.random()<.28){',advanced+' if(d>0&&Math.random()<.28){')
replace_section(a,e,area)
nb=s.encode("utf8");NEW=hashlib.sha256(nb).hexdigest()
guard=pathlib.Path("audits/g7_stage12_sync_pwa.py");g=guard.read_text("utf8")
if g.count("matkvest-iphone-v45")!=1:raise SystemExit("ABORT: unexpected PWA checker")
newsw=sw.replace("matkvest-iphone-v45","matkvest-iphone-v46").replace(OLD,NEW)
if newsw.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT: new SW hash")
p.write_bytes(nb);swp.write_text(newsw,"utf8");guard.write_text(g.replace("matkvest-iphone-v45","matkvest-iphone-v46"),"utf8")
report={"stage":"17D-quality-batch3","at":datetime.now(timezone.utc).isoformat(),"oldSha256":OLD,"newSha256":NEW,"cache":"matkvest-iphone-v46","bytes":len(nb),"topics":["geometry_figures","geometry_construction","area_measure"],"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch3_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
