const fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("tools/apply_g7_stage3.js","utf8");
const i=src.indexOf("function g7AlgebraStage3(){");
if(i<0)throw Error("No patch function");
const ctx={
 g7CommonFactorModel:()=>({old:true}),g7GroupingModel:()=>({old:true}),
 makeG7Question:()=>({old:true}),
 rawCourseId:id=>id.replace(/^g7:/,""),activeDifficulty:()=>0,
 ri:(a,b)=>{if(!Number.isInteger(a)||!Number.isInteger(b)||b<a)throw Error("invalid range");return Math.floor(Math.random()*(b-a+1))+a;},
 g7MonomialMul:(a,b)=>({coef:a.coef*b.coef,powers:Object.fromEntries([...new Set([...Object.keys(a.powers),...Object.keys(b.powers)])].map(k=>[k,(a.powers[k]||0)+(b.powers[k]||0)]))}),
 g7PolynomialScale:(poly,m)=>poly.map(t=>({coef:t.coef*m.coef,powers:Object.fromEntries([...new Set([...Object.keys(t.powers),...Object.keys(m.powers)])].map(k=>[k,(t.powers[k]||0)+(m.powers[k]||0)]))})),
 g7PolynomialNormalize:poly=>poly,
 shuffleOptions:a=>a.slice().sort(()=>Math.random()-.5),
 g7PolynomialHtml:a=>JSON.stringify(a),
 g7PolynomialSequenceHtml:a=>JSON.stringify(a),
 g7PolynomialKey:a=>JSON.stringify(a),
 g7FactorizationHtml:a=>JSON.stringify(a),
 g7QuestionSig:(...xs)=>JSON.stringify(xs),
 g7StrictChoice:(text,ans,wrong,ex,sig,audit)=>({text,ans,choices:[ans,...wrong],ex,sig,audit}),
 g7Number:(text,ans,ex,sig,opts)=>({text,ans,ex,sig,audit:opts?.audit}),
 gPolishQuestionObject:q=>q
};
vm.createContext(ctx);
vm.runInContext(src.slice(i)+"\ng7AlgebraStage3();",ctx);
const gcd=(a,b)=>b===0?Math.abs(a):gcd(b,a%b);
const evaluate=(poly,values)=>poly.reduce((sum,m)=>sum+m.coef*Object.entries(m.powers).reduce((p,[variable,degree])=>p*values[variable]**degree,1),0);
let count=0,errors=[];
for(let d=0;d<3;d++){
 for(let i=0;i<4000;i++){
  const m=ctx.g7CommonFactorModel(d),g=m.g,r=m.residual;
  if(!g||r.length!==m.original.length)throw Error("invalid GCF model");
  const primitiveCoeff=r.reduce((a,t)=>gcd(a,t.coef),0);
  const allVariables=new Set(r.flatMap(x=>Object.keys(x.powers)));
  if(primitiveCoeff!==1||[...allVariables].some(key=>Math.min(...r.map(x=>x.powers[key]||0))!==0))throw Error("residual not primitive");
  const scaled=ctx.g7PolynomialScale(r,g);
  if(JSON.stringify(scaled)!==JSON.stringify(m.original))throw Error("GCF expansion mismatch");
  const m2=ctx.g7GroupingModel(d);
  if(m2.expanded.length!==4)throw Error("wrong grouping expansion length");
  const lhs=evaluate(m2.expanded,{a:2,b:-1,x:3,y:-2});
  const rhs=evaluate(m2.left,{a:2,b:-1,x:3,y:-2})*evaluate(m2.right,{a:2,b:-1,x:3,y:-2});
  if(lhs!==rhs)throw Error("Grouping identity failed");
  count+=2;
 }
}
let newQuestions=0,modelAnswerChecks=0,unique=new Set();
for(let i=0;i<6000;i++){
 const q=ctx.makeG7Question("g7:direct_inverse_proportion",0);
 if(q.old||!q.text||!q.ex||!q.sig||q.ans===undefined)throw Error("grade7 #9 malformed");
 if(new Set(q.choices).size!==q.choices.length||!q.choices.includes(q.ans))throw Error("ambiguous #9");
 unique.add(q.text);newQuestions++;
}
if(unique.size<30)throw Error("not enough #9 diversity: "+unique.size);
for(let d=0;d<3;d++)for(let i=0;i<3000;i++){
 const q=ctx.makeG7Question("g7:factorization_grouping",d);
 if(q.old)continue;
 if(!q.text||!q.ex||q.ans===undefined||!q.sig)throw Error("grade7 #39 malformed");
 if(q.choices&&(new Set(q.choices).size!==q.choices.length||!q.choices.includes(q.ans)))throw Error("ambiguous #39");
 if(q.audit?.type==="g7Audit3GroupEval"){
  const m=q.audit.model,v=q.audit.values;
  if(evaluate(m.expanded,v)!==q.ans)throw Error("incorrect #39 group evaluation");
  modelAnswerChecks++;
 }
 newQuestions++;
}
if(modelAnswerChecks<500)throw Error("too few group evaluation tests");
if(!ctx.makeG7Question("g7:geo_triangle_elements",2).old)throw Error("unrelated topic changed");
console.log(JSON.stringify({status:"PASS",testedModels:count,newQuestions,modelAnswerChecks,uniqueEasyProportionPrompts:unique.size}));
