const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const variants=[["mulOneR","mulOneL","mulZeroR","mulZeroL"],["divOne","selfDiv","zeroDiv","check"],["oneSum","zeroBrackets","twoRule","missing"]];
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(variants=>{
   let count=0;const distinct=[new Set(),new Set(),new Set()],counts=[{},{},{}],choices=new Set();
   for(let d=0;d<3;d++)for(let slot=0;slot<4;slot++)for(let n=0;n<400;n++){
    const q=g3ZeroOneQuestion(d,slot),a=q.audit,v=a.variant;
    if(v!==variants[d][slot])throw Error("Incorrect subtype cycle");
    let expected;
    if(d===0)expected=a.other===1?a.a:0;
    else if(v==="divOne")expected=a.a;
    else if(v==="selfDiv")expected=1;
    else if(v==="zeroDiv")expected=0;
    else if(v==="check"){
     expected=a.shown===a.expected?"Верно":"Неверно";choices.add(expected);
     if((q.choices||[]).length!==2)throw Error("No two-choice control");
    }
    else if(v==="oneSum"||v==="missing")expected=a.a+a.b;
    else if(v==="zeroBrackets")expected=a.c;
    else if(v==="twoRule")expected=a.b+1;
    else throw Error("Unhandled "+v);
    if(String(q.ans)!==String(expected))throw Error("Wrong answer "+v+" "+JSON.stringify(a));
    if(typeof expected==="number"&&(!Number.isInteger(expected)||expected<0||expected>1000))
     throw Error("Not integer or outside 0-1000");
    if(!q.sig||!q.ex||!q.text)throw Error("Incomplete question "+v);
    if(q.answerMode==="number"&&q.inputHint!=="Введи целое число.")throw Error("Decimal-hint leak");
    if(d===1&&(v==="selfDiv"||v==="zeroDiv")&&a.divisor===0)throw Error("Division by zero");
    distinct[d].add(q.text);counts[d][v]=(counts[d][v]||0)+1;count++;
   }
   if(!choices.has("Верно")||!choices.has("Неверно"))throw Error("Both truth values not covered");
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    for(const txt of distinct[a])if(distinct[b].has(txt))throw Error("Cross-stage repeated question");
   for(let d=0;d<3;d++)for(let n=0;n<120;n++){
    const q=makeG3Question("g3:zero_one",d);
    if(!variants[d].includes(q.audit.variant))throw Error("Wrong grade 3 wrapper");
    if(q.answerMode==="number"&&q.inputHint!=="Введи целое число.")throw Error("Wrong input hint");
   }
   return {count,counts,unique:distinct.map(s=>s.size),truthValues:[...choices]};
  },variants);
  assert.equal(result.count,4800);
  console.log("PASS ZERO ONE",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});