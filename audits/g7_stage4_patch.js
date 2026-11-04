/* МатКвест G7 этап 4: вариативность 4 геометрических тем, отдельная ветка */
(function G7Stage4(){
 "use strict";
 const beforeStage4=makeG7Question;
 const pick=a=>a[ri(0,a.length-1)];
 const sig=(raw,d,v,parts=[])=>g7QuestionSig(raw,d,"audit4_"+v,parts);
 const audit=(raw,d,v,more={})=>({type:"g7AuditStage4",raw,d,variant:v,...more});
 const num=(raw,d,v,txt,ans,exp,parts,data,unit="",caption="")=>
   g7GeoNumber(txt,ans,exp,sig(raw,d,v,parts),audit(raw,d,v,{answer:ans}),data,caption,unit);
 const choice=(raw,d,v,txt,ans,wrong,exp,parts,data)=>
   g7GeoChoice(txt,ans,wrong,exp,sig(raw,d,v,parts),audit(raw,d,v,{answer:ans}),data);
 function generated(raw,d){
  if(raw==="geo_basic_constructions"){
   const variants=d===0?["midpoint_half","midpoint_double","bisector_half","bisector_double","copy_length","arc_equidistance"]:
    d===1?["midpoint_half","midpoint_double","bisector_half","bisector_double","copy_length","arc_equidistance","bisector_property"]:
    ["midpoint_half","midpoint_double","bisector_half","bisector_double","copy_length","arc_equidistance","bisector_property","midpoint_intersection"];
   const v=pick(variants),mid={kind:"g7-construction",subtype:"midpoint",showResult:true,aria:"Середина отрезка при построении серединного перпендикуляра"},
    bis={kind:"g7-construction",subtype:"bisector",showResult:true,aria:"Биссектриса построенного угла"},
    copy={kind:"g7-construction",subtype:"copy",showResult:true,aria:"Перенос отрезка циркулем"};
   if(v==="midpoint_half"){
    const n=ri(3,18);return num(raw,d,v,`С помощью циркуля и линейки построили середину M отрезка AB длиной ${2*n} см. Найди AM.`,n,`Середина делит отрезок на две равные части: AM = ${2*n} : 2 = ${n} см.`,[n],mid,"см");
   }
   if(v==="midpoint_double"){
    const n=ri(3,17);return num(raw,d,v,`M — середина отрезка AB. Известно, что MB = ${n} см. Найди длину AB.`,2*n,`AM = MB = ${n} см, поэтому AB = ${n} + ${n} = ${2*n} см.`,[n],mid,"см");
   }
   if(v==="bisector_half"){
    const a=ri(12,70);return num(raw,d,v,`Биссектриса делит угол величиной ${2*a}° пополам. Найди величину каждого получившегося угла.`,a,`Обе части равны: ${2*a}° : 2 = ${a}°.`,[a],bis,"°");
   }
   if(v==="bisector_double"){
    const a=ri(9,68);return num(raw,d,v,`После построения биссектрисы одна из двух равных частей угла оказалась ${a}°. Найди исходный угол.`,2*a,`Биссектриса делит угол пополам; исходный угол ${a}° · 2 = ${2*a}°.`,[a],bis,"°");
   }
   if(v==="copy_length"){
    const n=ri(4,26);return num(raw,d,v,`Циркулем перенесли длину AB = ${n} см и отложили равный отрезок CD. Сколько сантиметров в CD?`,n,`Перенос раствора циркуля сохраняет длину: CD = AB = ${n} см.`,[n],copy,"см");
   }
   if(v==="arc_equidistance"){
    const n=ri(5,23);return num(raw,d,v,`В построении середины AB точка P — пересечение дуг с центрами A и B, проведённых одним радиусом. AP = ${n} см. Найди BP.`,n,`Дуги проведены одинаковым радиусом, значит AP = BP = ${n} см.`,[n],mid,"см");
   }
   if(v==="bisector_property"){
    return choice(raw,d,v,"Какое условие проверяет правильность построенной биссектрисы угла B?","∠ABM = ∠MBC",["BM перпендикулярен BA","BM равен длине BA","AM = BC"],"Биссектриса делит угол B на два равных угла.",[],bis);
   }
   return choice(raw,d,v,"Почему прямая через две точки пересечения равных дуг из A и B проходит через середину AB?","каждая из этих точек равноудалена от A и B",["прямая параллельна AB","радиусы дуг всегда равны AB","их пересечение обязательно совпадает с A"],"Геометрическое место точек, равноудалённых от концов отрезка, — серединный перпендикуляр.",[],mid);
  }
  if(raw==="geo_right_triangle_congruence"){
   const variants=d===0?["both_legs","hyp_and_leg","hyp_and_angle","angles_only"]:
    d===1?["both_legs","hyp_and_leg","hyp_and_angle","angles_only","leg_and_angle","single_hyp"]:
    ["both_legs","hyp_and_leg","hyp_and_angle","angles_only","leg_and_angle","single_hyp","criterion_inverse"];
   const v=pick(variants),h=g7TrianglePairData("R-hyp-leg"),l=g7TrianglePairData("R-leg-leg"),a=g7TrianglePairData("R-leg-angle");
   if(v==="both_legs"){
    const x=ri(3,11),y=ri(3,11);return choice(raw,d,v,`Два прямоугольных треугольника имеют соответствующие катеты длиной ${x} см и ${y} см. Обязательно ли они равны?`,"да",["нет"],"Два прямоугольных треугольника равны по двум катетам.",[x,y],l);
   }
   if(v==="hyp_and_leg"){
    const x=ri(10,25),y=ri(3,x-1);return choice(raw,d,v,`У двух прямоугольных треугольников гипотенузы равны ${x} см, а один соответствующий катет равен ${y} см. Достаточно ли этого для их равенства?`,"да",["нет"],"Равенство гипотенузы и соответствующего катета — признак равенства прямоугольных треугольников.",[x,y],h);
   }
   if(v==="hyp_and_angle"){
    const x=ri(9,22),angle=ri(20,65);return choice(raw,d,v,`Гипотенузы двух прямоугольных треугольников равны ${x} см. В каждом из них равен один и тот же соответствующий острый угол ${angle}°. Будут ли треугольники равны?`,"да",["нет"],"Гипотенуза вместе с соответствующим острым углом однозначно задаёт прямоугольный треугольник.",[x,angle],h);
   }
   if(v==="angles_only"){
    const x=ri(20,68);return choice(raw,d,v,`У двух прямоугольных треугольников равны острые углы: ${x}° и ${90-x}°. Достаточно ли этого, чтобы утверждать, что сами треугольники равны?`,"нет",["да"],"Равные углы ещё не определяют длины сторон; треугольники могут иметь разные размеры.",[x],a);
   }
   if(v==="leg_and_angle"){
    const x=ri(4,17),angle=ri(15,70);return choice(raw,d,v,`В двух прямоугольных треугольниках равны катеты длиной ${x} см и соответствующие острые углы ${angle}°, лежащие напротив этих катетов. Достаточно ли условий для равенства?`,"да",["нет"],"Катет и соответствующий острый угол — признак равенства прямоугольных треугольников.",[x,angle],a);
   }
   if(v==="single_hyp"){
    const x=ri(8,22);return choice(raw,d,v,`Известно лишь, что у двух прямоугольных треугольников гипотенузы равны ${x} см. Достаточно ли этого для равенства треугольников?`,"нет",["да"],"Одинаковой гипотенузы недостаточно: катеты и острые углы могут различаться.",[x],h);
   }
   return choice(raw,d,v,"Какие дополнительные данные вместе с равными прямыми углами и равными гипотенузами позволят доказать равенство двух прямоугольных треугольников?","равные соответствующие катеты",["только равенство площадей","равенство любых двух острых углов в одном треугольнике","одинаковая запись названий вершин"],"Достаточно равенства гипотенузы и соответствующего катета.",[],h);
  }
  if(raw==="geo_circle_inscribed_in_angle"){
   const variants=d===0?["radius_from_side","equal_distances","half_angle","double_angle"]:
    d===1?["radius_from_side","equal_distances","half_angle","double_angle","two_distances"]:
    ["radius_from_side","equal_distances","half_angle","double_angle","two_distances","center_position"];
   const v=pick(variants),data=g7CircleTopicData("g7-circle-angle");
   if(v==="radius_from_side"){const r=ri(3,18);return num(raw,d,v,`Окружность касается обеих сторон угла. Расстояние от её центра до одной стороны равно ${r} см. Найди радиус.`,r,`Радиус к точке касания перпендикулярен стороне угла и равен ${r} см.`,[r],data,"см");}
   if(v==="equal_distances"){const r=ri(3,18);return num(raw,d,v,`Центр O вписанной в угол окружности равноудалён от его сторон. Расстояние до первой стороны ${r} см. Найди расстояние до второй.`,r,`Центр находится на биссектрисе и расстояния до сторон равны: ${r} см.`,[r],data,"см");}
   if(v==="half_angle"){const a=ri(15,70);return num(raw,d,v,`Центр O окружности, вписанной в угол величиной ${2*a}°, лежит на биссектрисе. Какой угол образует биссектриса с каждой стороной?`,a,`Биссектриса делит ${2*a}° пополам, получается ${a}°.`,[a],data,"°");}
   if(v==="double_angle"){const a=ri(10,65);return num(raw,d,v,`Биссектриса проходит через центр окружности, вписанной в угол, и образует с одной из сторон угол ${a}°. Найди величину исходного угла.`,2*a,`Угол из двух равных частей: 2 · ${a}° = ${2*a}°.`,[a],data,"°");}
   if(v==="two_distances"){const a=ri(3,18);return num(raw,d,v,`Из центра окружности, вписанной в угол, опущены перпендикуляры к обеим сторонам. Каждый равен ${a} см. Найди сумму их длин.`,2*a,`Оба перпендикуляра — радиусы длиной ${a} см; их сумма ${2*a} см.`,[a],data,"см");}
   return choice(raw,d,v,"На какой прямой расположен центр окружности, касающейся обеих сторон одного угла?","на биссектрисе угла",["на любой прямой через его вершину","на продолжении только одной стороны","на перпендикуляре к одной стороне, проведённом из вершины"],"Центр равноудалён от сторон, следовательно лежит на внутренней биссектрисе.",[],data);
  }
  if(raw==="geo_incircle_triangle"){
   const variants=d===0?["from_one_side","given_radius","angle_half","angle_double"]:
    d===1?["from_one_side","given_radius","angle_half","angle_double","sum_distances"]:
    ["from_one_side","given_radius","angle_half","angle_double","sum_distances","tangent_count"];
   const v=pick(variants),data=g7CircleTopicData("g7-incircle",{points:g7TriModel("scalene").points,showBisectors:true});
   if(v==="from_one_side"){const r=ri(2,17);return num(raw,d,v,`В треугольник вписана окружность с центром I. Расстояние от I до стороны AB равно ${r} см. Найди расстояние до стороны BC.`,r,`Инцентр равноудалён от всех сторон треугольника, поэтому искомое расстояние ${r} см.`,[r],data,"см");}
   if(v==="given_radius"){const r=ri(2,17);return num(raw,d,v,`Радиус вписанной в треугольник окружности равен ${r} см. Найди расстояние от её центра до стороны AC.`,r,`Расстояние от центра окружности до стороны касания равно радиусу ${r} см.`,[r],data,"см");}
   if(v==="angle_half"){const a=ri(12,68);return num(raw,d,v,`Биссектриса угла A треугольника проходит через центр вписанной окружности I. Если ∠A = ${2*a}°, найди ∠BAI.`,a,`AI — биссектриса угла A: ${2*a}° : 2 = ${a}°.`,[a],data,"°");}
   if(v==="angle_double"){const a=ri(12,68);return num(raw,d,v,`Центр I вписанной окружности лежит на биссектрисе угла A треугольника. Если ∠BAI = ${a}°, найди ∠A.`,2*a,`Биссектриса делит угол A пополам, значит ∠A = 2 · ${a}° = ${2*a}°.`,[a],data,"°");}
   if(v==="sum_distances"){const r=ri(2,14);return num(raw,d,v,`Расстояние от инцентра до каждой из трёх сторон треугольника равно ${r} см. Чему равна сумма этих трёх расстояний?`,3*r,`Каждое расстояние равно ${r} см, поэтому сумма 3 · ${r} = ${3*r} см.`,[r],data,"см");}
   return choice(raw,d,v,"Сколько сторон невырожденного треугольника касается его вписанная окружность?","3",["1","2","0"],"Вписанная окружность касается всех трёх сторон треугольника.",[],data);
  }
  return null;
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id);
  if(!["geo_basic_constructions","geo_right_triangle_congruence","geo_circle_inscribed_in_angle","geo_incircle_triangle"].includes(raw))return beforeStage4(id,stageOverride);
  const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  if(Math.random()<0.14)return beforeStage4(id,stageOverride);
  return gPolishQuestionObject(generated(raw,d));
 };
})();
