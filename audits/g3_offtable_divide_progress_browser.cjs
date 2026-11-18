const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {pathToFileURL}=require("node:url");
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:800}});
  await page.goto(pathToFileURL(process.cwd()+"/index.html").href,{waitUntil:"domcontentloaded"});
  const topic="g3:offtable_divide";
  const run=async stage=>page.evaluate(({topic,stage})=>{
   openGrade(3);
   startG3QuizStage(topic,stage);
   const variants=new Set();let accepted=0,loops=0;
   while(loops++<30){
    const question=q;
    variants.add(question.audit.variant);
    if(!question.answerMode||question.answerMode==="choice"||(question.choices||[]).length){
     const idx=question.choices.findIndex(x=>String(x.key)===String(question.ans));
     if(idx<0)throw Error("Missing correct choice");
     pick(idx);
    }else{
     const input=document.getElementById("quizInput");
     if(!input)throw Error("Missing numeric input");
     input.value=String(question.ans);
     checkQuizInput();
    }
    if(!answered)throw Error("Correct answer rejected");
    accepted++;
    const finished=blockSession?.finished;
    nextQ();
    if(finished)break;
   }
   const progress=progressFor(topic);
   return {accepted,variants:[...variants],best:progress.best.slice(),bonus:progress.bonus.slice(),passed:completedStages(topic),
    history:(state.questionHistory[topic]||[]).length};
  },{topic,stage});
  const a=await run(0);
  assert.equal(a.accepted,5);assert.equal(a.passed,1);assert.ok(a.variants.length>=2);
  await page.reload({waitUntil:"domcontentloaded"});
  let p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),passed:completedStages(topic)}),topic);
  assert.equal(p.passed,1);assert.equal(p.best[0],5);
  const b=await run(1);
  assert.equal(b.accepted,7);assert.equal(b.passed,2);assert.ok(b.variants.length>=4);
  await page.reload({waitUntil:"domcontentloaded"});
  p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),passed:completedStages(topic)}),topic);
  assert.equal(p.passed,2);assert.equal(p.best[1],7);
  const c=await run(2);
  assert.equal(c.accepted,10);assert.equal(c.passed,3);assert.ok(c.variants.length>=4);
  await page.reload({waitUntil:"domcontentloaded"});
  p=await page.evaluate(topic=>({best:progressFor(topic).best.slice(),bonus:progressFor(topic).bonus.slice(),passed:completedStages(topic)}),topic);
  assert.equal(p.passed,3);assert.deepEqual(p.best,[5,7,10]);assert.ok(p.bonus.every(Boolean));
  console.log("PASS",width,JSON.stringify({warmup:a,training:b,master:c,afterRefresh:p}));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
