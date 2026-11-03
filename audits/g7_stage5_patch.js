/* МатКвест G7 этап 5: расширение вариативности 5 тем геометрии */
(function G7Stage5(){
 "use strict";
 const previous=makeG7Question;
 const pick=rows=>rows[ri(0,rows.length-1)];
 const sig=(raw,d,v,parts=[])=>g7QuestionSig(raw,d,"audit5_"+v,parts);
 const audit=(raw,d,v,more={})=>({type:"g7AuditStage5",raw,d,variant:v,...more});
 const number=(raw,d,v,text,ans,ex,parts,data,unit="",caption="")=>
  g7GeoNumber(text,ans,ex,sig(raw,d,v,parts),audit(raw,d,v,{answer:ans}),data,caption,unit);
 const choice=(raw,d,v,text,ans,wrong,ex,parts,data)=>
  data?g7GeoChoice(text,ans,wrong,ex,sig(raw,d,v,parts),audit(raw,d,v,{answer:ans}),data):
       g7StrictChoice(text,ans,wrong,ex,sig(raw,d,v,parts),audit(raw,d,v,{answer:ans}));
 function build(raw,d){
  if(raw==="geo_parallel_perpendicular_intro"){
   const variants=d===0?["between_parallel","point_parallel","identify","perp_angle","two_parallel"]:
    d===1?["between_parallel","point_parallel","identify","two_parallel","perp_parallel","common_perpendicular","perp_angle"]:
           ["between_parallel","point_parallel","identify","two_parallel","perp_parallel","common_perpendicular","perp_angle","notation"];
   const v=pick(variants),par=g7SafeLineRelationModel("parallel"),per=g7SafeLineRelationModel("perpendicular");
   if(v==="between_parallel"){
    const a=ri(3,24);return number(raw,d,v,`Две разные параллельные прямые a и b находятся на расстоянии ${a} см друг от друга. Найди длину перпендикуляра между ними.`,a,`Расстояние между параллельными прямыми измеряют общим перпендикуляром, поэтому оно равно ${a} см.`,[a],par,"см");
   }
   if(v==="point_parallel"){
    const a=ri(2,25);return number(raw,d,v,`Прямая a параллельна прямой b. Точка P лежит на a, а расстояние между прямыми равно ${a} см. Чему равно расстояние от P до b?`,a,`Все точки прямой a находятся на одинаковом перпендикулярном расстоянии ${a} см от параллельной b.`,[a],par,"см");
   }
   if(v==="identify"){
    const v2=pick(["parallel","perpendicular","intersecting"]),labels={parallel:"параллельные",perpendicular:"перпендикулярные",intersecting:"пересекающиеся, но не перпендикулярные"},data=g7SafeLineRelationModel(v2);
    return choice(raw,d,v,"Определи по схеме взаимное расположение прямых a и b.",labels[v2],Object.values(labels).filter(t=>t!==labels[v2]),"Параллельные прямые не пересекаются; перпендикулярные образуют угол 90°; остальные пересекаются под другим углом.",[v2],data);
   }
   if(v==="perp_angle"){
    return number(raw,d,v,"Прямые a и b перпендикулярны. Найди величину одного из углов между ними.",90,"Все четыре угла при пересечении двух перпендикулярных прямых равны 90°.",[],per,"°");
   }
   if(v==="two_parallel"){
    return choice(raw,d,v,"В одной плоскости прямые a и b обе перпендикулярны третьей прямой c и не совпадают. Как расположены a и b?","параллельны",["перпендикулярны","обязательно пересекаются","образуют угол 45°"],"Две разные прямые, перпендикулярные одной и той же прямой, параллельны.",[]);
   }
   if(v==="perp_parallel"){
    return choice(raw,d,v,"Если a ∥ b, а прямая c перпендикулярна a, то как c расположена относительно b?","перпендикулярна b",["параллельна b","совпадает с b","не имеет определённого положения"],"Прямая, перпендикулярная одной из двух параллельных, перпендикулярна и другой.",[]);
   }
   if(v==="common_perpendicular"){
    return choice(raw,d,v,"Прямая c пересекает a под углом 90°. Известно, что a ∥ b. Какой угол между c и b?","90°",["0°","45°","180°"],"c перпендикулярна a, значит при a ∥ b она перпендикулярна и b.",[]);
   }
   return choice(raw,d,v,"Как записывают факт, что прямые a и b не пересекаются и лежат в одной плоскости?","a ∥ b",["a ⟂ b","a = b","a < b"],"Для параллельных прямых используют символ ∥.",[]);
  }
  if(raw==="geo_perpendicular_bisector_locus"){
   const variants=d===0?["other_distance","sum_equal","half_sum","inverse_property"]:
    d===1?["other_distance","sum_equal","half_sum","triangle_perimeter","inverse_property"]:
           ["other_distance","sum_equal","half_sum","triangle_perimeter","inverse_property","definition"];
   const v=pick(variants),data=g7CircleTopicData("g7-perp-bisector",{showDistances:true});
   if(v==="other_distance"){
    const n=ri(3,27);return number(raw,d,v,`Точка M равноудалена от A и B. Если MA = ${n} см, найди MB.`,n,`MA = MB по свойству серединного перпендикуляра, следовательно MB = ${n} см.`,[n],data,"см");
   }
   if(v==="sum_equal"){
    const n=ri(3,25);return number(raw,d,v,`M лежит на серединном перпендикуляре к AB, MA = ${n} см. Найди MA + MB.`,2*n,`MA = MB = ${n} см, поэтому сумма равна ${2*n} см.`,[n],data,"см");
   }
   if(v==="half_sum"){
    const n=ri(4,23);return number(raw,d,v,`M лежит на серединном перпендикуляре к AB. Известно, что MA + MB = ${2*n} см. Найди MB.`,n,`Так как MA = MB, делим сумму на 2: MB = ${2*n} : 2 = ${n} см.`,[n],data,"см");
   }
   if(v==="triangle_perimeter"){
    const n=ri(6,22),c=ri(3,2*n-1);return number(raw,d,v,`M лежит на серединном перпендикуляре к AB. MA = ${n} см, AB = ${c} см. Найди периметр треугольника AMB.`,2*n+c,`MA = MB = ${n} см; P = ${n} + ${n} + ${c} = ${2*n+c} см.`,[n,c],data,"см");
   }
   if(v==="inverse_property"){
    return choice(raw,d,v,"Известно, что точка M удовлетворяет MA = MB. К какому геометрическому месту она принадлежит?","к серединному перпендикуляру к AB",["только к отрезку AB","к окружности с диаметром AB","к лучу AB"],"Точки, равноудалённые от A и B, образуют серединный перпендикуляр к AB.",[],data);
   }
   return choice(raw,d,v,"Какое условие одновременно выполняется у серединного перпендикуляра к отрезку?","он проходит через середину и перпендикулярен отрезку",["он только делит отрезок в отношении 2:1","он параллелен отрезку","он проходит через любой конец отрезка"],"Серединный перпендикуляр должен быть перпендикулярен отрезку и проходить через его середину.",[],data);
  }
  if(raw==="geo_angle_bisector_locus"){
   const variants=d===0?["equal_distance","double_distance","half_sum","angle_half"]:
    d===1?["equal_distance","double_distance","half_sum","angle_half","angle_double"]:
           ["equal_distance","double_distance","half_sum","angle_half","angle_double","inverse_property"];
   const v=pick(variants),data=g7CircleTopicData("g7-angle-locus");
   if(v==="equal_distance"){
    const n=ri(3,24);return number(raw,d,v,`Точка M находится на биссектрисе угла. Перпендикулярное расстояние до одной его стороны равно ${n} см. Найди расстояние до другой стороны.`,n,`Точки биссектрисы равноудалены от обеих сторон угла, поэтому расстояние равно ${n} см.`,[n],data,"см");
   }
   if(v==="double_distance"){
    const n=ri(4,23);return number(raw,d,v,`M находится внутри угла на его биссектрисе. Расстояние MP до одной стороны равно ${n} см, а MQ — до другой. Найди MP + MQ.`,2*n,`Расстояния до сторон угла равны, поэтому ${n} + ${n} = ${2*n} см.`,[n],data,"см");
   }
   if(v==="half_sum"){
    const n=ri(3,22);return number(raw,d,v,`Из точки M на биссектрисе угла опустили перпендикуляры к его сторонам. Сумма длин перпендикуляров равна ${2*n} см. Найди длину одного из них.`,n,`Перпендикуляры равны, значит длина каждого ${2*n} : 2 = ${n} см.`,[n],data,"см");
   }
   if(v==="angle_half"){
    const n=ri(10,68);return number(raw,d,v,`Биссектриса делит угол ${2*n}° на два равных угла. Найди величину каждого угла.`,n,`${2*n}° : 2 = ${n}°.`,[n],data,"°");
   }
   if(v==="angle_double"){
    const n=ri(10,68);return number(raw,d,v,`Известно, что биссектриса образует с одной из сторон исходного угла угол ${n}°. Чему равен весь исходный угол?`,2*n,`Обе части равны по ${n}°, значит угол ${2*n}°.`,[n],data,"°");
   }
   return choice(raw,d,v,"Где лежит точка внутри угла, равноудалённая от его сторон?","на биссектрисе",["на любой прямой через вершину","на одной из сторон","на серединном перпендикуляре к любой стороне"],"Равноудалённость от сторон внутри угла — свойство биссектрисы.",[],data);
  }
  if(raw==="geo_constructions_lines_angles"){
   const variants=d===0?["copy_length","midpoint_half","midpoint_double","angle_half"]:
    d===1?["copy_length","midpoint_half","midpoint_double","angle_half","angle_double","equal_arcs"]:
           ["copy_length","midpoint_half","midpoint_double","angle_half","angle_double","equal_arcs","perpendicular_fact"];
   const v=pick(variants),mid={kind:"g7-construction",subtype:"midpoint",showResult:true,aria:"Построение середины отрезка"},
    bis={kind:"g7-construction",subtype:"bisector",showResult:true,aria:"Построение биссектрисы"},
    copy={kind:"g7-construction",subtype:"copy",showResult:true,aria:"Перенос отрезка циркулем"},
    per={kind:"g7-construction",subtype:"perpendicular",showResult:true,aria:"Построение перпендикуляра"};
   if(v==="copy_length"){
    const n=ri(4,25);return number(raw,d,v,`Отрезок AB длиной ${n} см перенесли циркулем из точки C. Какова длина построенного отрезка CD?`,n,`При переносе циркулем длина не изменяется, поэтому CD = ${n} см.`,[n],copy,"см");
   }
   if(v==="midpoint_half"){
    const n=ri(5,22);return number(raw,d,v,`Построили середину M отрезка AB длиной ${2*n} см. Найди MB.`,n,`Середина делит AB на два равных отрезка по ${n} см.`,[n],mid,"см");
   }
   if(v==="midpoint_double"){
    const n=ri(4,24);return number(raw,d,v,`M — середина построенного отрезка AB. При AM = ${n} см найди AB.`,2*n,`AB состоит из двух равных частей, поэтому AB = 2·${n} = ${2*n} см.`,[n],mid,"см");
   }
   if(v==="angle_half"){
    const n=ri(12,64);return number(raw,d,v,`Биссектриса построенного угла величиной ${2*n}° разделила его пополам. Сколько градусов в каждой части?`,n,`${2*n}° : 2 = ${n}°.`,[n],bis,"°");
   }
   if(v==="angle_double"){
    const n=ri(12,64);return number(raw,d,v,`Построенная биссектриса разделила угол на две части, по ${n}° каждая. Найди исходный угол.`,2*n,`Исходный угол равен ${n}° + ${n}° = ${2*n}°.`,[n],bis,"°");
   }
   if(v==="equal_arcs"){
    const n=ri(5,22);return number(raw,d,v,`При построении середины AB циркуль из A и B провёл дуги одного радиуса. Если AP = ${n} см, то какова длина BP до точки пересечения дуг?`,n,`AP и BP равны радиусу одной настройки циркуля, поэтому BP = ${n} см.`,[n],mid,"см");
   }
   return choice(raw,d,v,"Каков угол между построенным перпендикуляром и исходной прямой?","90°",["45°","180°","0°"],"Перпендикуляр пересекает исходную прямую под прямым углом 90°.",[],per);
  }
  if(raw==="geo_constructions_triangles"){
   const variants=d===0?["sss_exists","sss_min","sss_max","sss_perimeter"]:
    d===1?["sss_exists","sss_min","sss_max","sss_perimeter","asa_third_angle","sas_unique"]:
           ["sss_exists","sss_min","sss_max","sss_perimeter","asa_third_angle","sas_unique","sss_boundary"];
   const v=pick(variants),
    data={kind:"g7-triangle-construction",subtype:"sss",aria:"Построение треугольника по трём сторонам"};
   if(v==="sss_exists"){
    const a=ri(3,16),b=ri(3,16),valid=Math.random()<.5,c=valid?ri(Math.abs(a-b)+1,a+b-1):a+b+ri(0,5);
    return choice(raw,d,v,`Можно ли построить невырожденный треугольник со сторонами ${a}, ${b}, ${c} см?`,valid?"да":"нет",[valid?"нет":"да"],valid?"Наибольшая сторона меньше суммы остальных; треугольник существует.":"Третья сторона не меньше суммы двух других; треугольник невозможен.",[a,b,c,valid?1:0],data);
   }
   if(v==="sss_min"){
    const a=ri(4,16),b=ri(4,16),x=Math.abs(a-b)+1;
    return number(raw,d,v,`У треугольника две стороны равны ${a} см и ${b} см. Найди наименьшую возможную целую длину третьей стороны.`,x,`Третья сторона c должна удовлетворять |${a} − ${b}| < c < ${a+b}; минимальное целое c = ${x} см.`,[a,b],data,"см");
   }
   if(v==="sss_max"){
    const a=ri(4,16),b=ri(4,16),x=a+b-1;
    return number(raw,d,v,`У треугольника две стороны равны ${a} см и ${b} см. Найди наибольшую возможную целую длину третьей стороны.`,x,`По неравенству треугольника c < ${a+b}; наибольшее целое c = ${x} см.`,[a,b],data,"см");
   }
   if(v==="sss_perimeter"){
    const a=ri(4,13),b=ri(4,13),c=ri(Math.abs(a-b)+1,a+b-1);
    return number(raw,d,v,`По трём сторонам построили треугольник со сторонами ${a}, ${b}, ${c} см. Найди его периметр.`,a+b+c,`Периметр равен сумме сторон: ${a} + ${b} + ${c} = ${a+b+c} см.`,[a,b,c],data,"см");
   }
   if(v==="asa_third_angle"){
    const a=ri(23,70),b=ri(23,70),x=180-a-b;
    return number(raw,d,v,`Треугольник строят по стороне AB и двум прилежащим к ней углам: ∠A=${a}°, ∠B=${b}°. Найди ∠C.`,x,`Сумма углов треугольника равна 180°, поэтому ∠C = 180° − ${a}° − ${b}° = ${x}°.`,[a,b],{kind:"g7-triangle-construction",subtype:"asa",aria:"Построение по стороне и двум углам"},"°");
   }
   if(v==="sas_unique"){
    const a=ri(4,16),b=ri(4,16),ang=ri(25,145);
    return choice(raw,d,v,`Заданы две стороны ${a} см и ${b} см, а также угол ${ang}° строго между ними. Можно ли построить треугольник, однозначно определённый с точностью до совмещения?`,"да",["нет"],"Две стороны и угол между ними определяют треугольник (SAS).",[a,b,ang],{kind:"g7-triangle-construction",subtype:"sas",aria:"Построение по двум сторонам и углу между ними"});
   }
   return choice(raw,d,v,"При построении по трём сторонам сумма двух сторон равна третьей. Получится ли невырожденный треугольник?","нет",["да"],"При равенстве сумм окружности касаются в одной точке на прямой, а треугольник вырождается.",[],data);
  }
  return null;
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id);
  if(!["geo_parallel_perpendicular_intro","geo_perpendicular_bisector_locus","geo_angle_bisector_locus","geo_constructions_lines_angles","geo_constructions_triangles"].includes(raw))return previous(id,stageOverride);
  const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  return Math.random()<0.13?previous(id,stageOverride):gPolishQuestionObject(build(raw,d));
 };
})();
