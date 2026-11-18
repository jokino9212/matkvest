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
   const borrows=(aa,bb)=>{
    let a=aa,b=bb,n=0,borrow=0;
    while(a||b){
     const atop=(a%10)-borrow,bbot=b%10;
     borrow=atop<bbot?1:0;
     n+=borrow;
     a=Math.floor(a/10);b=Math.floor(b/10);
    }
    return n;
   };
   for(let d=0;d<3;d++)for(let i=0;i<1200;i++){
    const t=generateG3ColumnTask("g3:written_subtract",d);
    const c=borrows(t.a,t.b);
    if(!Number.isInteger(t.a)||!Number.isInteger(t.b)||t.a<1||t.b<1||t.ans!==t.a-t.b||t.ans<0||t.ans>1000)
     throw Error("Wrong written subtraction "+JSON.stringify(t));
    if((d===0&&c!==0)||(d===1&&c!==1)||(d===2&&c<2))
     throw Error("Wrong difficulty at "+d+": "+JSON.stringify({a:t.a,b:t.b,c,marked:t.audit?.borrows}));
    if(t.audit.borrows!==c)throw Error("Wrong marked carry count");
    if(t.op!=="−")throw Error("Wrong operator");
    if(!Array.isArray(t.marks))throw Error("No carry display");
    seen[d].add(t.a+":"+t.b);totals[d]++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    for(const sig of seen[a])if(seen[b].has(sig))throw Error("Cross-level repeated operands "+sig);
   return {totals,unique:seen.map(x=>x.size)};
  });
  assert.deepEqual(result.totals,[1200,1200,1200]);
  console.log("PASS WRITTEN SUBTRACT GENERATOR",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});