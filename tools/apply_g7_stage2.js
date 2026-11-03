const fs = require("fs"), vm = require("vm");
const file = "index.html";
let source = fs.readFileSync(file,"utf8");
const old = "if(!targeted.has(raw)||Math.random()<0.08)return previousG7(id,stageOverride);";
if(source.includes("function g7Stage2Patch")) throw Error("Already patched; refusing to apply twice");
if(source.split(old).length!==2 || !source.endsWith("</body></html>\n")) throw Error("Baseline mismatch; aborting");
const injected = "<script>\n(" + g7Stage2Patch.toString() + ")();\n</script>\n";
source = source.replace(old,"if(!targeted.has(raw))return previousG7(id,stageOverride);").replace("</body></html>\n",injected+"</body></html>\n");
const blocks = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
for(let i=0;i<blocks.length;i++) {if(blocks[i][1].trim()) new vm.Script(blocks[i][1],{filename:"script_"+(i+1)+".js"});}
if(blocks.length<90)throw Error("Missing scripts");
fs.writeFileSync(file,source,"utf8");
console.log("G7 stage 2 patched. Checked JS scripts:",blocks.length);
function g7Stage2Patch(){
 const prev=makeG7Question;
 const ids=new Set(["geo_triangle_elements","geo_isosceles_equilateral","geo_isosceles_properties_criteria","geo_triangle_inequality","geo_side_angle_relation"]);
 const one=a=>a[ri(0,a.length-1)];
 const pic=(kind="scalene")=>g7TriangleData(kind,kind==="isosceles"?{sideMarks:[{side:"AB",count:1},{side:"AC",count:1}]}:kind==="equilateral"?{sideMarks:[{side:"AB",count:1},{side:"BC",count:1},{side:"AC",count:1}]}:{});
 const N=(id,d,v,t,a,e,nums,p,u="")=>g7GeoNumber(t,a,e,g7QuestionSig(id,d,"audit2_"+v,nums),{type:"g7Stage2",variant:v,id,d,nums,answer:a},p,"Чертёж схематический; длины заданы условием.",u);
 const C=(id,d,v,t,a,wrong,e,nums,p)=>{const sig=g7QuestionSig(id,d,"audit2_"+v,nums),meta={type:"g7Stage2",variant:v,id,d,nums,answer:a};return p?g7GeoChoice(t,a,wrong,e,sig,meta,p):g7StrictChoice(t,a,wrong,e,sig,meta)};
 const bisectorPicture=()=>{const m=g7TriModel("isosceles"),p=g7TriSidePoint(m.points.B,m.points.C,.5);return {kind:"g7-triangle",subtype:"isosceles",points:m.points,sideMarks:[{side:"AB",count:1},{side:"AC",count:1}],cevian:{kind:"bisector",from:"A",point:p,label:"D"},aria:"Равнобедренный треугольник ABC с биссектрисой AD"};};
 const T=d=>{let a,b,c;for(let i=0;i<99;i++){a=ri(5+d*3,12+d*5);b=ri(5+d*3,12+d*5);c=ri(Math.abs(a-b)+1,a+b-1);if(a!==b&&a!==c&&b!==c)break;}return {a,b,c,P:a+b+c}};
 function Q(id,d){
  if(id==="geo_triangle_elements"){
   const v=one(d===0?["perimeter","sum"]:d===1?["missing","other"]:["linked","reverse","chain"]),{a,b,c,P}=T(d),p=pic();
   if(v==="perimeter")return N(id,d,v,`AB=${a} см, BC=${b} см, AC=${c} см. Найди периметр △ABC.`,P,`P=${a}+${b}+${c}=<b>${P}</b>.`,[a,b,c],p,"см");
   if(v==="sum")return N(id,d,v,`В △ABC AB=${a} см, BC=${b} см. Найди AB+BC.`,a+b,`AB+BC=${a}+${b}=<b>${a+b}</b>.`,[a,b],p,"см");
   if(v==="missing")return N(id,d,v,`P(ABC)=${P} см, AB=${a} см, BC=${b} см. Найди AC.`,c,`AC=${P}−${a}−${b}=<b>${c}</b>.`,[P,a,b],p,"см");
   if(v==="other")return N(id,d,v,`P(ABC)=${P} см, AB=${a} см. Найди BC+AC.`,b+c,`BC+AC=${P}−${a}=<b>${b+c}</b>.`,[P,a],p,"см");
   const x=ri(9,19),k=ri(1,5),y=x+k,z=ri(k+3,x+y-1),P2=x+y+z;
   if(v==="linked")return N(id,d,v,`AB=${x} см, BC на ${k} см длиннее AB, AC=${z} см. Найди P(ABC).`,P2,`BC=${x}+${k}=${y}; P=${x}+${y}+${z}=<b>${P2}</b>.`,[x,k,z],p,"см");
   if(v==="reverse")return N(id,d,v,`P(ABC)=${P2} см, AB=${x} см, BC на ${k} см больше AB. Найди AC.`,z,`BC=${y}; AC=${P2}−${x}−${y}=<b>${z}</b>.`,[P2,x,k],p,"см");
   const h=ri(1,4),zz=y+h;
   return N(id,d,v,`AB=${x} см, BC на ${k} см длиннее AB, AC на ${h} см длиннее BC. Найди периметр.`,x+y+zz,`BC=${y}, AC=${zz}; P=${x}+${y}+${zz}=<b>${x+y+zz}</b>.`,[x,k,h],p,"см");
  }
  if(id==="geo_isosceles_equilateral"){
   const v=one(d===0?["eqP","isoP"]:d===1?["eqS","isoBase","isoLeg"]:["isoBase","isoLeg","gap","recover"]);
   const s=ri(5+d,14+3*d),leg=ri(7+d*3,19+d*4),base=ri(3,leg-1),P=2*leg+base,k=ri(1,5),P2=3*leg-k;
   if(v==="eqP")return N(id,d,v,`Равносторонний △ABC имеет сторону ${s} см. Найди периметр.`,3*s,`P=3·${s}=<b>${3*s}</b>.`,[s],pic("equilateral"),"см");
   if(v==="isoP")return N(id,d,v,`В равнобедренном △ABC AB=AC=${leg} см, BC=${base} см. Найди периметр.`,P,`P=2·${leg}+${base}=<b>${P}</b>.`,[leg,base],pic("isosceles"),"см");
   if(v==="eqS")return N(id,d,v,`P равностороннего △ABC равен ${3*s} см. Найди сторону.`,s,`Сторона=${3*s}:3=<b>${s}</b>.`,[3*s],pic("equilateral"),"см");
   if(v==="isoBase")return N(id,d,v,`В равнобедренном △ABC P=${P} см, AB=AC=${leg} см. Найди BC.`,base,`BC=${P}−2·${leg}=<b>${base}</b>.`,[P,leg],pic("isosceles"),"см");
   if(v==="isoLeg")return N(id,d,v,`В равнобедренном △ABC P=${P} см, BC=${base} см. Найди AB.`,leg,`AB=(${P}−${base}):2=<b>${leg}</b>.`,[P,base],pic("isosceles"),"см");
   if(v==="gap")return N(id,d,v,`AB=AC=${leg} см, основание BC на ${k} см короче AB. Найди P(ABC).`,P2,`P=3·${leg}−${k}=<b>${P2}</b>.`,[leg,k],pic("isosceles"),"см");
   return N(id,d,v,`В равнобедренном △ABC P=${P2} см, BC на ${k} см короче AB=AC. Найди AB.`,leg,`3AB−${k}=${P2}; AB=(${P2}+${k}):3=<b>${leg}</b>.`,[P2,k],pic("isosceles"),"см");
  }
  if(id==="geo_isosceles_properties_criteria"){
   const v=one(d===0?["copy","vertex"]:d===1?["vertex","base","half"]:["half","reverse_half","linear"]),b=ri(32,77),A=180-2*b;
   if(v==="copy")return N(id,d,v,`AB=AC и ∠B=${b}°. Найди ∠C.`,b,`Углы при основании равны, ∠C=<b>${b}°</b>.`,[b],pic("isosceles"),"°");
   if(v==="vertex")return N(id,d,v,`AB=AC и ∠B=${b}°. Найди ∠A.`,A,`∠A=180−2·${b}=<b>${A}°</b>.`,[b],pic("isosceles"),"°");
   if(v==="base")return N(id,d,v,`AB=AC и ∠A=${A}°. Найди ∠B.`,b,`∠B=(180−${A}):2=<b>${b}°</b>.`,[A],pic("isosceles"),"°");
   if(v==="half")return N(id,d,v,`AB=AC, ∠B=${b}°, AD — биссектриса ∠A. Найди ∠BAD.`,90-b,`∠A=180−2·${b}=${A}°, значит ∠BAD=${A}:2=<b>${90-b}°</b>.`,[b],bisectorPicture(),"°");
   if(v==="reverse_half"){
    const h=ri(15,55);
    return N(id,d,v,`AB=AC, AD — биссектриса ∠A, ∠BAD=${h}°. Найди ∠B.`,90-h,`∠A=${2*h}°, ∠B=(180−${2*h}):2=<b>${90-h}°</b>.`,[h],bisectorPicture(),"°");
   }
   const base=ri(61,78),delta=3*base-180;
   return N(id,d,v,`В равнобедренном △ABC угол при основании на ${delta}° больше угла при вершине. Найди угол при основании.`,base,`Если искомый угол x, то 2x+(x−${delta})=180, x=(180+${delta}):3=<b>${base}°</b>.`,[delta],pic("isosceles"),"°");
  }
  if(id==="geo_triangle_inequality"){
   const v=one(d===0?["exists","max"]:d===1?["min","max","count"]:["even","multiple3","sum"]),a=ri(4+d*3,12+d*4),b=ri(4+d*3,12+d*4),lo=Math.abs(a-b)+1,hi=a+b-1,total=hi-lo+1;
   if(v==="exists"){
    const valid=Math.random()<.5,x=valid?ri(lo,hi):a+b+ri(0,4),ans=valid?"да":"нет";
    return C(id,d,v,`Могут ли стороны треугольника быть равны ${a}, ${b}, ${x} см?`,ans,[valid?"нет":"да"],valid?`Выполнено |${a}−${b}|<${x}<${a}+${b}.`:`${x}≥${a}+${b}, треугольник не существует.`,[a,b,x,valid?1:0],null);
   }
   if(v==="max")return N(id,d,v,`Стороны треугольника ${a} и ${b} см. Найди наибольшую целую третью сторону.`,hi,`x<${a}+${b}, значит x≤<b>${hi}</b>.`,[a,b],pic(),"см");
   if(v==="min")return N(id,d,v,`Стороны треугольника ${a} и ${b} см. Найди наименьшую целую третью сторону.`,lo,`x>|${a}−${b}|, значит x≥<b>${lo}</b>.`,[a,b],pic(),"см");
   if(v==="count")return N(id,d,v,`Две стороны треугольника ${a} и ${b} см. Сколько целых значений может иметь третья сторона?`,total,`x от ${lo} до ${hi}; вариантов ${hi}−${lo}+1=<b>${total}</b>.`,[a,b],pic());
   if(v==="even"){
    const ans=Math.floor(hi/2)-Math.floor((lo-1)/2);
    return N(id,d,v,`Две стороны ${a} и ${b} см. Сколько чётных целых длин возможно у третьей стороны?`,ans,`x от ${lo} до ${hi}; чётных значений ⌊${hi}/2⌋−⌊${lo-1}/2⌋=<b>${ans}</b>.`,[a,b],pic());
   }
   if(v==="multiple3"){
    const ans=Math.floor(hi/3)-Math.floor((lo-1)/3);
    return N(id,d,v,`Две стороны ${a} и ${b} см. Сколько целых длин третьей стороны кратны 3?`,ans,`x от ${lo} до ${hi}; кратных 3: ⌊${hi}/3⌋−⌊${lo-1}/3⌋=<b>${ans}</b>.`,[a,b],pic());
   }
   const ans=(lo+hi)*total/2;
   return N(id,d,v,`Две стороны ${a} и ${b} см. Найди сумму всех возможных целых длин третьей стороны.`,ans,`Числа от ${lo} до ${hi}; сумма (${lo}+${hi})·${total}:2=<b>${ans}</b>.`,[a,b],pic());
  }
  if(id==="geo_side_angle_relation"){
   const v=one(d===0?["largest","smallest"]:d===1?["largest","smallest","compare"]:["order","from_angles_max","from_angles_min"]);
   if(v==="largest"||v==="smallest"||v==="compare"){
    const {a,b,c}=T(d),rows=[{s:"AB",n:a,ang:"∠C"},{s:"BC",n:b,ang:"∠A"},{s:"AC",n:c,ang:"∠B"}];
    if(v==="compare"){
     const ans=a>c?"∠C > ∠B":"∠B > ∠C";
     return C(id,d,v,`В △ABC AB=${a} см, AC=${c} см. Сравни ∠B и ∠C.`,ans,["∠C > ∠B","∠B > ∠C","∠B = ∠C"].filter(x=>x!==ans),`Большей стороне противолежит больший угол: <b>${ans}</b>.`,[a,c],pic());
    }
    rows.sort((x,y)=>x.n-y.n);const row=v==="largest"?rows[2]:rows[0];
    return C(id,d,v,`AB=${a} см, BC=${b} см, AC=${c} см. Какой угол ${v==="largest"?"наибольший":"наименьший"}?`,row.ang,["∠A","∠B","∠C"].filter(x=>x!==row.ang),`Стороне ${row.s}=${row.n} см противолежит <b>${row.ang}</b>.`,[a,b,c],pic());
   }
   let A=45,B=55,Cc=80;
   for(let i=0;i<100;i++){let a=ri(31,83),b=ri(31,83),c=180-a-b;if(c>12&&a!==b&&a!==c&&b!==c){A=a;B=b;Cc=c;break;}}
   const sorted=[{a:"A",n:A,s:"BC"},{a:"B",n:B,s:"AC"},{a:"C",n:Cc,s:"AB"}].sort((x,y)=>x.n-y.n);
   if(v==="order"){
    const ans=sorted.map(x=>x.s).join(" < "),all=["AB","AC","BC"],wrong=[];
    for(const x of all)for(const y of all)for(const z of all)if(x!==y&&y!==z&&x!==z&&[x,y,z].join(" < ")!==ans)wrong.push([x,y,z].join(" < "));
    return C(id,d,v,`∠A=${A}°, ∠B=${B}°. Расположи стороны △ABC по возрастанию.`,ans,wrong,`∠C=180−${A}−${B}=${Cc}°. По возрастанию углов: <b>${ans}</b>.`,[A,B],pic());
   }
   const row=v==="from_angles_max"?sorted[2]:sorted[0];
   return C(id,d,v,`В △ABC ∠A=${A}°, ∠B=${B}°. Какая сторона ${v==="from_angles_max"?"наибольшая":"наименьшая"}?`,row.s,["AB","AC","BC"].filter(x=>x!==row.s),`∠C=${Cc}°. Углу ${row.a}=${row.n}° противолежит <b>${row.s}</b>.`,[A,B],pic());
  }
  return null;
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id),d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  if(!ids.has(raw))return prev(id,stageOverride);
  const q=Q(raw,d);return q?gPolishQuestionObject(q):prev(id,stageOverride);
 };
}
