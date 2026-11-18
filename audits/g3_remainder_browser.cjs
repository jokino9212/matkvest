const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const variants=[["numeric","check"],["apples","pencils","books"],["giveAway","receive","join"]];
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(variants=>{
   let total=0;const counts=[{},{},{}],texts=[new Set(),new Set(),new Set()],truth=new Set();
   for(let d=0;d<3;d++)for(let slot=0;slot<variants[d].length;slot++)for(let i=0;i<400;i++){
    const q=g3RemainderQuestion(d,slot),a=q.audit,v=a.variant;
    if(v!==variants[d][slot])throw Error("Wrong cyclic variant");
    if(a.divisor<2||a.divisor>9||a.remainder<1||a.remainder>=a.divisor||
       a.dividend!==a.divisor*a.quotient+a.remainder)
      throw Error("Wrong integer division "+JSON.stringify(a));
    if(v==="check"){
     const right=a.shownQ===a.quotient&&a.shownR===a.remainder;
     if(q.ans!==(right?"Верно":"Неверно")||(q.choices||[]).length!==2)
      throw Error("Wrong yes/no evaluation");
     truth.add(q.ans);
    }else if(q.answerMode!=="remainder"||q.answerQuotient!==a.quotient||
       q.answerRemainder!==a.remainder||!q.inputHint.includes("два отдельных поля"))
      throw Error("Wrong two-part answer");
    if(v==="giveAway"&&a.total-a.taken!==a.dividend)throw Error("Incorrect take-away");
    if(v==="receive"&&a.start+a.added!==a.dividend)throw Error("Incorrect addition");
    if(v==="join"&&a.first+a.second!==a.dividend)throw Error("Incorrect joining");
    if(!q.text||!q.ex||!q.sig)throw Error("Missing question information");
    texts[d].add(q.text);counts[d][v]=(counts[d][v]||0)+1;total++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const t of texts[a])
     if(texts[b].has(t))throw Error("Text overlap between levels");
   if(!truth.has("Верно")||!truth.has("Неверно"))throw Error("Truth values missing");
   for(let d=0;d<3;d++)for(let n=0;n<100;n++){
    const q=makeG3Question("g3:division_remainder",d);
    if(!variants[d].includes(q.audit.variant))throw Error("Wrong topic wrapper");
   }
   return {total,counts,unique:texts.map(x=>x.size),truth:[...truth]};
  },variants);
  assert.equal(result.total,3200);
  console.log("PASS REMAINDER GENERATOR",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});