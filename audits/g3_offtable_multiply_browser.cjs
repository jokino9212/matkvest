const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(()=>{
   const expected=[["tens","check"],["decomp","groups","missingPart"],["addBooks","removeBooks","twoBatches","compareBatches"]];
   const seen=[new Set(),new Set(),new Set()],counts=[{},{},{}];let total=0;
   for(let d=0;d<3;d++)for(let slot=0;slot<expected[d].length;slot++)for(let n=0;n<350;n++){
    const q=g3OfftableMultiplyQuestion(d,slot),a=q.audit,v=a.variant;
    if(v!==expected[d][slot])throw Error("Variant cycle incorrect: "+d+":"+slot+" "+v);
    counts[d][v]=(counts[d][v]||0)+1;
    if(!q.text||!q.ex||!q.sig)throw Error("Incomplete question");
    if(d===0){
     if(a.product!==a.tens*a.k)throw Error("Incorrect tens product");
     if(v==="check"){
      if(q.ans!==(a.shown===a.product?"Верно":"Неверно"))throw Error("Incorrect choice");
     }else if(Number(q.ans)!==a.product)throw Error("Incorrect warmup answer");
    }
    if(d===1){
     if(a.product!==a.n*a.k||a.part+a.last!==a.product||a.ones===0)throw Error("Incorrect decomposition");
     if(Number(q.ans)!==(v==="missingPart"?a.last:a.product))throw Error("Incorrect training answer");
    }
    if(d===2){
     let answer;
     if(v==="addBooks")answer=a.product+a.delta;
     if(v==="removeBooks")answer=a.product-a.delta;
     if(v==="twoBatches")answer=a.first+a.second;
     if(v==="compareBatches")answer=Math.abs(a.first-a.second);
     if(v==="twoBatches"||v==="compareBatches"){
      if(a.first!==a.a*a.ka||a.second!==a.b*a.kb)throw Error("Incorrect batches");
     }else if(a.product!==a.n*a.k)throw Error("Incorrect books");
     if(Number(q.ans)!==answer)throw Error("Incorrect master answer");
    }
    if(q.answerMode==="number"&&q.inputHint!=="Введи целое число.")throw Error("Incorrect input hint");
    if(/по [234] (?:карандашей|книг)/.test(q.text))throw Error("Noun agreement");
    seen[d].add(q.text);total++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const txt of seen[a])if(seen[b].has(txt))throw Error("Cross-level repeated text");
   return {total,counts,unique:seen.map(x=>x.size)};
  });
  assert.equal(result.total,3150);
  console.log("PASS",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
