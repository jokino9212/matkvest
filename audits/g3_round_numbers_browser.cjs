const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const variants=[["tAdd","tSub","hAdd","hSub"],["tMul","tDiv","hMul","hDiv"],["hChain","mixed","dualMul","missing"]];
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(variants=>{
   let count=0;const distinct=[new Set(),new Set(),new Set()],counts=[{},{},{}];
   for(let d=0;d<3;d++)for(let slot=0;slot<4;slot++)for(let n=0;n<400;n++){
    const q=g3RoundNumberQuestionData(d,slot),a=q.audit,v=a.variant;
    if(v!==variants[d][slot])throw Error("Stage variant cycle: "+d+":"+slot+" "+v);
    let expected;
    if(v==="tAdd"||v==="hAdd")expected=a.a+a.b;
    else if(v==="tSub"||v==="hSub")expected=a.a-a.b;
    else if(v==="tMul"||v==="hMul")expected=a.a*a.k;
    else if(v==="tDiv"||v==="hDiv")expected=a.a/a.k;
    else if(v==="hChain"||v==="mixed")expected=a.a-a.b+a.c;
    else if(v==="dualMul")expected=a.a*a.k+a.b*a.h;
    else if(v==="missing")expected=a.a-a.b-a.c;
    else throw Error("Unknown variant "+v);
    if(v==="mixed")expected=a.a+a.b-a.c;
    if(q.answer!==expected||!Number.isInteger(expected)||expected<=0||expected>1000)
      throw Error("Wrong result/range "+v+":"+JSON.stringify(a));
    if(!q.text||!q.ex||!q.text.includes("b>")||!q.ex.includes(String(expected)))
      throw Error("Incomplete question "+v);
    if(d===0&&v[0]==="t"&&(a.a%10||a.b%10))throw Error("Not complete tens");
    if(d===0&&v[0]==="h"&&(a.a%100||a.b%100))throw Error("Not complete hundreds");
    if(d===1&&v[0]==="h"&&a.a%100)throw Error("Not hundreds");
    distinct[d].add(q.text);
    counts[d][v]=(counts[d][v]||0)+1;
    count++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    for(const txt of distinct[a])if(distinct[b].has(txt))throw Error("Cross-stage duplicate "+txt);
   for(let d=0;d<3;d++)for(let n=0;n<120;n++){
    const question=makeG3Question("g3:round_numbers",d);
    if(question.inputHint!=="Введи целое число."||question.answerMode!=="number")
      throw Error("Wrong input format");
    if(!question.audit||!variants[d].includes(question.audit.variant))
      throw Error("Wrong wrapper stage");
    if(question.answerRat.d!==1)throw Error("Fractional answer");
   }
   return {count,counts,unique:distinct.map(s=>s.size)};
  },variants);
  assert.equal(result.count,4800);
  console.log("PASS",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});