'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
function release(root){
 const html=readFileSync(join(root,'index.html'));
 const worker=readFileSync(join(root,'sw.js'));
 const scripts=JSON.parse(worker.toString().match(/const SCRIPT_HASHES = (\{[^\n]+\});/)[1]);
 return {html,worker,files:new Map(['manifest.webmanifest',...Object.keys(scripts)].map(name=>[name,readFileSync(join(root,name))]))};
}
const baseline=process.argv[2];
assert(baseline,'Provide the path to the published v191 checkout');
const old=release(baseline), fresh=release('.');
let active=old;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const name=url.pathname.replace(/^\/matkvest\//,'');
 let body,type;
 if(!name||name==='index.html'){body=active.html;type='text/html';}
 else if(name==='sw.js'){body=active.worker;type='application/javascript';}
 else if(active.files.has(name)){body=active.files.get(name);type=name.endsWith('.js')?'application/javascript':'application/manifest+json';}
 if(!body){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});
 res.end(body);
});
async function version(page,n){
 await page.waitForFunction(v=>document.querySelector('#appVersionBadge')?.textContent==='Сборка v'+v,n);
}
async function catalog(page,expected,current){
 const result=await page.evaluate(()=>({counts:[g5AllTopics().length,g6AllTopics().length,g7AllTopics().length],open:currentGrade}));
 assert.deepEqual(result.counts,expected);
 if(current)assert.equal(result.open,current);
}
async function inspectRestoration(page){
 await page.waitForFunction(()=>typeof blockSession!=='undefined'&&blockSession?.kind==='g7quiz');
 return page.evaluate(()=>({task:q?.sig,position:blockSession.done,id:blockSession.attemptId,draft:document.querySelector('#quizInput')?.value}));
}
async function run(browser,address,width){
 active=old;
 const context=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(address);
  await version(page,191);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await catalog(page,[74,75,107]);
  await page.evaluate(()=>{
   progressFor('g5:area_units_g5').best=STAGES.map(stage=>stage.need);
   save();
   openGrade(6);
  });
  active=fresh;
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await version(page,192);
  await catalog(page,[74,75,149],6);
  await page.reload();
  await version(page,192);
  await catalog(page,[74,75,149],6);
  await page.evaluate(()=>openGrade(7));
  const menu=page.locator('#mk-g7-textbook-nav');
  await menu.waitFor();
  assert.equal(await menu.locator('[data-paragraph]').count(),122);
  assert.equal(await page.locator('main input[type=search]:visible').count(),1);
  await page.locator('main input[type=search]:visible').fill('геометрия 43');
  await menu.locator('[data-topic-id="g7:geo_incircle_triangle"]:visible').click();
  await page.evaluate(()=>{
   startG7QuizStage('g7:geo_incircle_triangle',1);
   for(let i=0;i<5&&(blockSession.done===0||q.answerMode!=='number');i++){
    if(!skipNormalQuiz())throw Error('Skip failed');
    nextQ();
   }
   if(q.answerMode!=='number'||blockSession.finished)throw Error('Numeric task missing');
   const input=document.getElementById('quizInput');
   input.value='12,5';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   if(!mk872PersistDraft())throw Error('Draft was not saved');
  });
  const before=await inspectRestoration(page);
  await page.reload();
  await page.getByRole('button',{name:'Продолжить',exact:true}).click();
  assert.deepEqual(await inspectRestoration(page),before);
  await context.setOffline(true);
  await page.reload();
  await version(page,192);
  await page.getByRole('button',{name:'Продолжить',exact:true}).click();
  assert.deepEqual(await inspectRestoration(page),before);
  const best=await page.evaluate(()=>({saved:progressFor('g5:area_units_g5').best,required:STAGES.map(stage=>stage.need)}));
  assert.deepEqual(best.saved,best.required);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,upgrade:'191→192',catalog:[74,75,149],paragraphs:122,gradeOnUpdate:6,onlineDraft:before.draft,offlineDraft:before.draft,keptProgress:true}));
 }finally{await context.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const width of [390,1280]){
   const browser=await chromium.launch({headless:true});
   try{await run(browser,'http://127.0.0.1:'+server.address().port+'/matkvest/',width);}
   finally{await browser.close();}
  }
 }finally{server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
