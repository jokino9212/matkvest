const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const topic="g3:written_divide";
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const run=async stage=>page.evaluate(({topic,stage})=>{
   openGrade(3);startG3WrittenStage(topic,stage);
   let accepted=0,tries=0;
   while(tries++<30){
    const fields=[...document.querySelectorAll(".work-in,.div-work-in,.qin")];
    const required=fields.filter(el=>!el.classList.contains("mark-in"));
    if(!required.length)throw Error("No written cells");
    for(const el of required){
     if(!/^\d$/.test(el.dataset.exp||""))throw Error("Invalid required column cell "+el.dataset.exp);
     el.value=el.dataset.exp;
    }
    checkColumn();
    if(!columnSolved)throw Error("Correct column work rejected");
    accepted++;
    const finished=blockSession?.finished;
    newTask();
    if(finished)break;
   }
   const p=progressFor(topic);
   return {accepted,best:p.best.slice(),bonus:p.bonus.slice(),passed:completedStages(topic),
    history:(state.questionHistory[topic]||[]).length};
  },{topic,stage});
  const a=await run(0);
  assert.equal(a.accepted,5);assert.equal(a.passed,1);
  await page.reload({waitUntil:"domcontentloaded"});
  let p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),passed:completedStages(topic)}),topic);
  assert.equal(p.best[0],5);assert.equal(p.passed,1);
  const b=await run(1);
  assert.equal(b.accepted,7);assert.equal(b.passed,2);
  await page.reload({waitUntil:"domcontentloaded"});
  p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),passed:completedStages(topic)}),topic);
  assert.equal(p.best[1],7);assert.equal(p.passed,2);
  const c=await run(2);
  assert.equal(c.accepted,10);assert.equal(c.passed,3);
  await page.reload({waitUntil:"domcontentloaded"});
  p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),bonus:progressFor(topic).bonus.slice(),passed:completedStages(topic)}),topic);
  assert.deepEqual(p.best,[5,7,10]);assert.equal(p.passed,3);assert.ok(p.bonus.every(Boolean));
  const wrongPage=await browser.newPage({viewport:{width,height:800}});
  await wrongPage.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const wrong=await wrongPage.evaluate(topic=>{
   openGrade(3);startG3WrittenStage(topic,0);
   const fields=[...document.querySelectorAll(".work-in,.div-work-in,.qin")].filter(el=>!el.classList.contains("mark-in"));
   if(!fields.length)throw Error("No required work inputs");
   for(const el of fields)el.value=el.dataset.exp;
   fields[0].value=String((Number(fields[0].dataset.exp)+1)%10);
   checkColumn();
   if(columnSolved)throw Error("Wrong digit was accepted");
   fields[0].value=fields[0].dataset.exp;
   checkColumn();
   if(!columnSolved)throw Error("Correction was rejected");
   return {wrongRejected:true,correctionAccepted:true};
  },topic);
  console.log("PASS WRITTEN DIVIDE PROGRESS",width,JSON.stringify({warmup:a,training:b,master:c,afterRefresh:p,wrong}));
  await wrongPage.close();await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});