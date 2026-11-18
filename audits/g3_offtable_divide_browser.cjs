const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const variants=[["tens","check"],["decomp","share","groupSize","missingDivisor"],["addBefore","subtractBefore","changeEach","compareShares"]];
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const rows=await page.evaluate(variants=>{
   let count=0;const distinct=[new Set(),new Set(),new Set()],byStage=[];
   for(let d=0;d<3;d++){
    const counts={};
    for(let slot=0;slot<variants[d].length;slot++)for(let trial=0;trial<320;trial++){
     const q=g3OfftableDivideQuestion(d,slot),a=q.audit,v=a.variant;
     if(v!==variants[d][slot])throw Error("Wrong type cycle");
     counts[v]=(counts[v]||0)+1;distinct[d].add(q.text);count++;
     if(!q.text||!q.ex||!q.sig)throw Error("Incomplete question");
     if(d===0){
      if(a.quotient*a.divisor!==a.dividend)throw Error("Tens quotient");
      if(v==="check"){
       if(q.ans!==(a.shown===a.quotient?"Верно":"Неверно"))throw Error("Wrong binary answer");
      }else if(+q.ans!==a.quotient)throw Error("Wrong tens answer");
     }
     if(d===1){
      if(a.tens+a.ones!==a.dividend||a.dividend/a.divisor!==a.quotient)throw Error("Wrong decomposition");
      if(+q.ans!==(v==="missingDivisor"?a.divisor:a.quotient))throw Error("Wrong training");
     }
     if(d===2){
      let answer;
      if(v==="addBefore"||v==="subtractBefore"){
       answer=a.newTotal/a.divisor;
       if(a.newTotal!==a.dividend+(v==="addBefore"?a.change:-a.change))throw Error("Wrong group adjustment");
      }
      if(v==="changeEach")answer=a.quotient+(a.plus?a.delta:-a.delta);
      if(v==="compareShares")answer=Math.abs(a.quotient-a.secondQuotient);
      if(+q.ans!==answer||!Number.isInteger(answer)||answer<0)throw Error("Wrong master");
     }
     if(q.answerMode==="number"&&q.inputHint!=="Введи целое число.")throw Error("Fraction hint for integer");
     if(/между [2-9] предмет/.test(q.text))throw Error("Wrong noun");
    }
    byStage.push(counts);
   }
   for(let x=0;x<3;x++)for(let y=x+1;y<3;y++)for(const q of distinct[x])if(distinct[y].has(q))throw Error("Cross-stage repeat");
   return {count,byStage,unique:distinct.map(x=>x.size)};
  },variants);
  assert.equal(rows.count,3200);
  console.log("PASS",width,JSON.stringify(rows));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
