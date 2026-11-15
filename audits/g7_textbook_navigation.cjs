const assert = require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(process.cwd()+'/index.html').href);
 await page.locator('button[onclick="openGrade(7)"]').click();
 const menu=page.locator('#mk-g7-textbook-nav');
 await menu.waitFor();
 const result=await page.evaluate(()=>{
  const root=document.querySelector('#mk-g7-textbook-nav');
  const topics=g7AllTopics();
  const linked=new Set([...root.querySelectorAll('[data-topic-id]')].map(el=>el.dataset.topicId));
  const failures=[], metrics=[];
  for(const topic of topics){
   const stages=[];
   for(let stage=0;stage<3;stage++){
    let variants=new Set(), meanings=new Set();
    for(let trial=0;trial<100;trial++){
     try{
      const q=makeG7Question(topic.id,stage);
      if(!q?.text || !q?.ex || !q?.sig || q.ans===undefined)throw new Error('Question missing required properties');
      const keys=q.choices?.map(item=>item.key)||[];
      if(keys.length&&(new Set(keys).size!==keys.length||!keys.includes(q.ans)))throw new Error('Invalid answer options');
      if(/undefined|NaN|Infinity/.test(q.text+q.ex))throw new Error('Invalid student-facing text: '+q.text);
      variants.add(q.audit?.variant||q.sig.split(':').slice(2,4).join(':'));
      meanings.add(JSON.stringify([q.text,q.visual?.data]));
     }catch(error){failures.push([topic.id,stage,error.message]);break}
    }
    stages.push([variants.size,meanings.size]);
   }
   metrics.push([topic.id,stages]);
  }
  return {total:topics.length,legacy:topics.filter(t=>t.order<=107).length,linked:linked.size,missing:topics.filter(t=>!linked.has(t.id)).map(t=>t.id),
   rows:[...root.querySelectorAll('.mk-g5-toc-part')].map(part=>part.querySelectorAll('[data-paragraph]').length),
   unavailable:root.querySelectorAll('.mk-g6-toc-unavailable').length,failures,metrics};
 });
 console.log(JSON.stringify(result));
 assert.deepEqual(result.rows,[46,45,31]);
 assert.deepEqual([result.total,result.legacy,result.linked,result.unavailable],[149,107,149,0]);
 assert.deepEqual(result.missing,[]);
 assert.deepEqual(result.failures,[]);
 const search=page.locator('main input[type=search]:visible');
 await search.waitFor();
 assert.equal(await search.count(),1);
 await search.fill('геометрия 43');
 assert.equal(await menu.locator('[data-paragraph]:visible').count(),1);
 await menu.locator('[data-topic-id="g7:geo_incircle_triangle"]:visible').click();
 assert.equal(await page.locator('#modal .stage-card').count(),3);
 const pie=await page.evaluate(()=>{
  const chart=makeG7Question('g7:stat_pie_charts',0);
  const host=document.createElement('div');
  host.innerHTML=quizVisualHtml(chart);
  const svg=host.querySelector('svg.g7-pie-svg');
  return {viewBox:svg?.getAttribute('viewBox'),sectors:svg?.querySelectorAll('path').length};
 });
 assert.deepEqual(pie,{viewBox:'65 25 330 330',sectors:4});
 await page.reload();
 await menu.waitFor();
 await page.locator('#modal .stage-card').first().waitFor({state:'visible'});
 assert.equal(await page.locator('#modal .stage-card').count(),3);
 const initial=await page.evaluate(()=>{
  for(let attempt=0;attempt<30;attempt++){
   startG7QuizStage('g7:geo_incircle_triangle',1);
   if(q.answerMode==='number')break;
  }
  if(q.answerMode!=='number')throw Error('Numeric task missing');
  if(!skipNormalQuiz())throw Error('Skip failed');
  for(let attempt=0;attempt<4;attempt++){
   nextQ();
   if(q.answerMode==='number')break;
   if(!skipNormalQuiz())throw Error('Skip failed');
  }
  if(q.answerMode!=='number'||blockSession.finished)throw Error('Unfinished numeric task missing');
  const input=document.getElementById('quizInput');
  input.value='12,5';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  if(!mk872PersistDraft())throw Error('Draft was not saved');
  return {attempt:blockSession.attemptId,sig:q.sig,done:blockSession.done,value:input.value};
 });
 await page.reload();
 await page.getByRole('button',{name:'Продолжить',exact:true}).click();
 const restored=await page.evaluate(()=>({attempt:blockSession.attemptId,sig:q.sig,done:blockSession.done,value:document.getElementById('quizInput')?.value}));
 assert.deepEqual(restored,initial);
 assert.deepEqual(errors,[]);
 console.log('G7_HOME_NAV_AND_GENERATION_PASS');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
