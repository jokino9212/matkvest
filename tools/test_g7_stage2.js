const fs=require("fs"),vm=require("vm");
const code=fs.readFileSync("tools/apply_g7_stage2.js","utf8");
const start=code.indexOf("function g7Stage2Patch(){");
if(start<0)throw Error("Patch function not found");
const ctx={
 makeG7Question:(id,d)=>({old:true}),
 rawCourseId:id=>String(id).replace(/^g7:/,""),
 activeDifficulty:()=>0,
 ri:(a,b)=>{if(!Number.isInteger(a)||!Number.isInteger(b)||b<a)throw Error("Bad random "+a+".."+b);return a+Math.floor(Math.random()*(b-a+1));},
 g7QuestionSig:(raw,d,v,nums)=>[raw,d,v,...nums].join(":"),
 g7GeoNumber:(text,ans,ex,sig,audit,pic)=>({text,ans,ex,sig,audit,visual:pic}),
 g7GeoChoice:(text,ans,wrong,ex,sig,audit,pic)=>({text,ans,ex,sig,audit,choices:[ans,...wrong],visual:pic}),
 g7StrictChoice:(text,ans,wrong,ex,sig,audit)=>({text,ans,ex,sig,audit,choices:[ans,...wrong]}),
 g7TriangleData:(kind,opts={})=>({kind,...opts}),
 gPolishQuestionObject:q=>q
};
vm.createContext(ctx);
vm.runInContext(code.slice(start)+"\ng7Stage2Patch();",ctx);
const topics=["geo_triangle_elements","geo_isosceles_equilateral","geo_isosceles_properties_criteria","geo_triangle_inequality","geo_side_angle_relation"];
let total=0;const coverage={};
for(const id of topics)for(let d=0;d<3;d++){
 const seen=new Set(),signatures=new Set();
 for(let i=0;i<1000;i++){
  const q=ctx.makeG7Question("g7:"+id,d);
  if(q.old||q.ans===undefined||!q.text||!q.ex||!q.sig||!q.audit)throw Error(id+" "+d+": invalid question");
  if(q.choices&&(new Set(q.choices).size!==q.choices.length||!q.choices.includes(q.ans)))throw Error(id+" "+d+": ambiguous choices");
  if(typeof q.ans==="number"&&!Number.isFinite(q.ans))throw Error(id+" "+d+": invalid numeric answer");
  seen.add(q.audit.variant);signatures.add(q.sig);total++;
 }
 if(seen.size<2)throw Error(id+" "+d+": insufficient templates "+seen.size);
 if(signatures.size<25)throw Error(id+" "+d+": insufficient question diversity "+signatures.size);
 coverage[id+":"+d]={templates:seen.size,uniqueSignatures:signatures.size};
}
if(!ctx.makeG7Question("g7:geo_circumcircle_triangle",1).old)throw Error("Unexpected change to other topics");
console.log(JSON.stringify({status:"PASS",total,coverage},null,2));
