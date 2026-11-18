const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const variants=[["commAdd","commMul"],["assocAdd","assocMul"],["addGroup","mulGroup","pairGroups"]];
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const result=await page.evaluate(variants=>{
   let total=0;const counts=[{},{},{}],seen=[new Set(),new Set(),new Set()];
   for(let d=0;d<3;d++)for(let slot=0;slot<variants[d].length;slot++)for(let i=0;i<400;i++){
    const q=g3PropertiesQuestion(d,slot),a=q.audit,v=a.variant;
    if(v!==variants[d][slot])throw Error("Wrong level type");
    let expected;
    if(v==="commAdd"||v==="commMul")expected=a.a;
    else if(v==="assocAdd")expected=a.a+a.b+a.c;
    else if(v==="assocMul")expected=a.a*a.b*a.c;
    else if(v==="addGroup")expected=a.a+a.b+a.c-a.d;
    else if(v==="mulGroup")expected=a.a*a.b*a.c+a.d;
    else if(v==="pairGroups")expected=10*a.a+10*a.b;
    else throw Error("Unknown question type");
    if(Number(q.ans)!==expected||a.answer.n!==expected||a.answer.d!==1||
       !Number.isInteger(expected)||expected<=0||expected>1000)
     throw Error("Incorrect expression "+v+":"+JSON.stringify(a));
    if((v==="assocAdd"||v==="addGroup")&&a.b+a.c!==100)throw Error("Not a friendly hundred");
    if((v==="assocMul"||v==="mulGroup")&&a.a*a.c!==10)throw Error("Not a friendly ten");
    if(q.answerMode!=="number"||q.inputHint!=="Введи целое число.")
     throw Error("Wrong input mode");
    if(!q.text||!q.ex||!q.sig)throw Error("Incomplete question");
    counts[d][v]=(counts[d][v]||0)+1;seen[d].add(q.text);total++;
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    for(const t of seen[a])if(seen[b].has(t))throw Error("Cross-level reused question");
   for(let d=0;d<3;d++)for(let i=0;i<100;i++){
    const q=makeG3Question("g3:properties",d);
    if(!variants[d].includes(q.audit.variant))throw Error("Wrong wrapper stage");
   }
   return {total,counts,unique:seen.map(s=>s.size)};
  },variants);
  assert.equal(result.total,2800);
  console.log("PASS PROPERTIES",width,JSON.stringify(result));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});