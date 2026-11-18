const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(()=>{
   const seen=[new Set(),new Set(),new Set()],totals=[0,0,0];
   const quotientDigits=(steps)=>steps.map(x=>String(x.qd)).join("");
   for(let d=0;d<3;d++)for(let i=0;i<1200;i++){
    const t=generateG3ColumnTask("g3:written_divide",d);
    const q=t.a/t.b;
    if(!Number.isInteger(t.a)||!Number.isInteger(t.b)||t.a<1||t.b<1||t.ans!==q||t.ans<1||t.a>999||t.a%t.b!==0)
     throw Error("Wrong written division "+JSON.stringify(t));
    if((d===0&&(q<11||q>24))||(d===1&&(q<25||q>99))||(d===2&&q<100))
     throw Error("Wrong quotient level at "+d+": "+JSON.stringify(t));
    if(t.audit.quotient!==q||t.audit.remainder!==0||t.audit.quotientDigits!==String(q).length||quotientDigits(t.steps)!==String(q))throw Error("Wrong quotient digit record "+JSON.stringify(t));
    if(t.op!=="÷")throw Error("Wrong operator");
    if(!Array.isArray(t.steps)||!t.steps.length||t.steps.some(x=>x.product!==x.qd*t.b||x.remainder!==x.current-x.product||x.remainder<0||x.remainder>=t.b))throw Error("Incorrect long division steps");
    seen[d].add(t.a+":"+t.b);totals[d]++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    for(const sig of seen[a])if(seen[b].has(sig))throw Error("Cross-level repeated operands "+sig);
   return {totals,unique:seen.map(x=>x.size)};
  });
  assert.deepEqual(result.totals,[1200,1200,1200]);
  console.log("PASS WRITTEN DIVIDE GENERATOR",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});