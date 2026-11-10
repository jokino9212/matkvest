const fs=require("fs"),vm=require("vm");
let html=fs.readFileSync("index.html","utf8");
const baseline="function g7Stage2Patch()";
if(!html.includes(baseline)||!html.endsWith("</body></html>\n"))throw Error("Stage2 baseline mismatch");
if(html.includes("function g7AlgebraStage3"))throw Error("Already patched");
const addon="<script>\n("+g7AlgebraStage3.toString()+")();\n</script>\n";
html=html.replace("</body></html>\n",addon+"</body></html>\n");
for(const [i,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){if(match[1].trim())new vm.Script(match[1],{filename:"inline_"+i+".js"});}
fs.writeFileSync("index.html",html,"utf8");
console.log("Stage3 G7 algebra patch OK; bytes "+Buffer.byteLength(html));
function g7AlgebraStage3(){
 const originalModel=g7CommonFactorModel,originalGrouping=g7GroupingModel,originalQuestion=makeG7Question;
 const pick=a=>a[ri(0,a.length-1)];
 g7CommonFactorModel=function(level=0){
  const d=Math.max(0,Math.min(2,level)),coef=pick(d===0?[2,3,4,5,6,7]:[4,6,8,9,10,12,15]),gx=d===0?ri(0,1):ri(1,3),gy=d===2?ri(0,2):0;
  const g={coef,powers:{...(gx?{x:gx}:{}),...(gy?{y:gy}:{})}};
  const primitive=pick([[2,3,5],[3,-4,5],[4,5,-7],[2,-5,7],[3,5,8],[5,-6,7],[7,8,-9]]);
  let residual;
  if(d===0){
   const power=ri(1,2);
   residual=[{coef:primitive[0],powers:{x:power}},{coef:primitive[1],powers:{}}];
  }else if(d===1){
   const top=ri(2,3);
   residual=[{coef:primitive[0],powers:{x:top}},{coef:primitive[1],powers:{x:1}},{coef:primitive[2],powers:{}}];
  }else{
   const xPow=ri(1,3),yPow=ri(1,3);
   residual=[{coef:primitive[0],powers:{x:xPow,y:yPow}},{coef:primitive[1],powers:{x:ri(1,3)}},{coef:primitive[2],powers:{y:ri(1,3)}}];
  }
  return {g,residual,original:g7PolynomialScale(residual,g)};
 };
 g7GroupingModel=function(level=0){
  const d=Math.max(0,Math.min(2,level));
  const ca=pick(d===0?[1,2]:[1,2,3,4]),cb=pick(d===0?[1,2,-1]:[-4,-3,-2,1,2,3,4]);
  const cx=pick(d===0?[1,2]:[1,2,3,4]),cy=pick(d===0?[1,2,-1]:[-4,-3,-2,-1,1,2,3]);
  const left=[{coef:ca,powers:{a:1}},{coef:cb,powers:{b:1}}],right=[{coef:cx,powers:{x:1}},{coef:cy,powers:{y:1}}];
  const expanded=[];for(const a of left)for(const b of right)expanded.push(g7MonomialMul(a,b));
  const sum=g7PolynomialNormalize(expanded);
  return {left,right,expanded:sum,displayTerms:d===2?shuffleOptions(sum):sum};
 };
 function recDirect(raw,d){
  const ratio=ri(2,4),rword=ratio===2?"2 раза":ratio===3?"3 раза":"4 раза",up=Math.random()<.5;
  const scenario=pick([
   {a:"При неизменной цене число купленных тетрадей",b:"общая стоимость покупки",desc:"При неизменной цене стоимость прямо пропорциональна количеству."},
   {a:"При неизменной цене количество билетов",b:"стоимость билетов",desc:"Стоимость прямо пропорциональна количеству билетов."},
   {a:"При одинаковой цене за метр длину купленной ткани",b:"стоимость ткани",desc:"Цена одного метра постоянна, стоимость прямо пропорциональна длине."},
   {a:"При одной цене за коробку количество купленных коробок",b:"сумма покупки",desc:"Стоимость прямо пропорциональна числу коробок."}
  ]);
  const answer=(up?"увеличится":"уменьшится")+" в "+rword,opposite=(up?"уменьшится":"увеличится")+" в "+rword;
  return g7StrictChoice(`${scenario.a} ${up?"увеличили":"уменьшили"} в ${rword}. Как изменится ${scenario.b}?`,answer,[opposite,"не изменится",up?"увеличится в 8 раз":"уменьшится в 8 раз"],`${scenario.desc} Следовательно, ${scenario.b} ${up?"увеличится":"уменьшится"} в ${rword}.`,g7QuestionSig(raw,d,"audit3_direct",[ratio,up?1:0,scenario.a]),{type:"g7Audit3Direct",ratio,up,expected:answer});
 }
 function recInverse(raw,d){
  const ratio=ri(2,4),rword=ratio===2?"2 раза":ratio===3?"3 раза":"4 раза",up=Math.random()<.5;
  const context=pick([
   {a:"число рабочих",b:"время выполнения того же заказа",what:"одинаковая производительность каждого рабочего"},
   {a:"число одинаковых насосов",b:"время перекачивания того же объёма воды",what:"одинаковая производительность каждого насоса"},
   {a:"скорость движения",b:"время прохождения того же пути",what:"постоянное расстояние"}
  ]);
  const answer=(up?"уменьшится":"увеличится")+" в "+rword,opposite=(up?"увеличится":"уменьшится")+" в "+rword;
  return g7StrictChoice(`Если ${context.a} ${up?"увеличить":"уменьшить"} в ${rword}, как изменится ${context.b}? Условия: ${context.what}.`,answer,[opposite,"не изменится",up?"уменьшится в 8 раз":"увеличится в 8 раз"],`При постоянном объёме работы или пути величины обратно пропорциональны: ${context.b} ${up?"уменьшится":"увеличится"} в ${rword}.`,g7QuestionSig(raw,d,"audit3_inverse",[ratio,up?1:0,context.a]),{type:"g7Audit3Inverse",ratio,up,expected:answer});
 }
 function groupChoice(raw,d){
  const m=g7GroupingModel(d),right=m.right,correct=g7PolynomialHtml(right);
  const swapped=[right[0],{coef:-right[1].coef,powers:{...right[1].powers}}],wrong=[
   g7PolynomialHtml(m.left),
   g7PolynomialHtml(swapped),
   g7PolynomialHtml([{coef:right[0].coef+1,powers:{...right[0].powers}},{...right[1]}])
  ];
  return g7StrictChoice(`Разложение способом группировки: ${g7PolynomialSequenceHtml(m.displayTerms)}. Какая общая скобка получается при группировке?`,correct,wrong,`Записываем многочлен как ${g7FactorizationHtml([m.left,m.right])}. Общая скобка: ${correct}.`,g7QuestionSig(raw,d,"audit3_group_common",[g7PolynomialKey(m.expanded)]),{type:"g7Audit3Grouping",variant:"group_common",model:m,expected:correct});
 }
 function groupEvaluate(raw,d){
  const m=g7GroupingModel(d),vals={a:ri(-3,3),b:ri(-3,3),x:ri(-3,3),y:ri(-3,3)};
  const evaluate=poly=>(poly||[]).reduce((sum,term)=>sum+term.coef*Object.entries(term.powers||{}).reduce((p,[key,power])=>p*vals[key]**power,1),0);
  const left=evaluate(m.left),right=evaluate(m.right),expected=left*right;
  return g7Number(`Многочлен ${g7PolynomialSequenceHtml(m.displayTerms)} разложи группировкой и найди его значение при a=${vals.a}, b=${vals.b}, x=${vals.x}, y=${vals.y}.`,expected,`После группировки: ${g7FactorizationHtml([m.left,m.right])}. Значения скобок: ${left} и ${right}. Их произведение <b>${expected}</b>.`,g7QuestionSig(raw,d,"audit3_group_evaluate",[g7PolynomialKey(m.expanded),...Object.values(vals)]),{audit:{type:"g7Audit3GroupEval",variant:"group_evaluate",model:m,values:vals,expected}});
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id),d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  if(raw==="direct_inverse_proportion"&&d===0)return pick([0,1,2,3])<2?recDirect(raw,d):recInverse(raw,d);
  if(raw==="factorization_grouping"&&d===0&&Math.random()<.33)return gPolishQuestionObject(groupChoice(raw,d));
  if(raw==="factorization_grouping"&&d===1&&Math.random()<.28)return gPolishQuestionObject(groupChoice(raw,d));
  if(raw==="factorization_grouping"&&d===2&&Math.random()<.35)return gPolishQuestionObject(groupEvaluate(raw,d));
  return originalQuestion(id,stageOverride);
 };
}
