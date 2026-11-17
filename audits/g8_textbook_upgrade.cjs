'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const {join}=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
function fingerprint(bytes){
 return createHash('sha256').update(bytes).digest('hex');
}
function release(root){
 const html=readFileSync(join(root,'index.html'));
 const worker=readFileSync(join(root,'sw.js'));
 const source=worker.toString();
 const [,version]=source.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/);
 const [,htmlHash]=source.match(/const APP_BUILD_HASH = "([a-f0-9]{64})";/);
 const scripts=JSON.parse(source.match(/const SCRIPT_HASHES = (\{[^\n]+\});/)[1]);
 const files=new Map(['manifest.webmanifest',...Object.keys(scripts)].map(name=>[name,readFileSync(join(root,name))]));
 assert.equal(fingerprint(html),htmlHash,'HTML does not match its worker');
 for(const [name,digest] of Object.entries(scripts)){
  assert.equal(fingerprint(files.get(name)),digest,'Stale hash for '+name);
  assert(html.includes(Buffer.from(name+'?v='+version)),name+' does not use the release version');
 }
 return {html,worker,files,version:Number(version),htmlHash,scripts};
}
const baseline=process.argv[2];
assert(baseline,'Provide the path to the previous published checkout');
const old=release(baseline), fresh=release('.');
assert(fresh.version>old.version,'The release needs a new cache version');
assert.notEqual(fresh.htmlHash,old.htmlHash,'The releases must use separate cache snapshots');
const knownCounts={192:110,193:133,194:137,195:137};
const oldCount=Number(process.argv[3]??knownCounts[old.version]);
const freshCount=Number(process.argv[4]??knownCounts[fresh.version]);
assert(oldCount>0&&freshCount>0,'Provide the expected old and new Grade 8 topic counts');
const counts=grade8=>[74,75,149,grade8];
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
 const result=await page.evaluate(()=>({counts:[g5AllTopics().length,g6AllTopics().length,g7AllTopics().length,g8AllTopics().length],open:currentGrade}));
 assert.deepEqual(result.counts,expected);
 if(current)assert.equal(result.open,current);
}
async function gradeMenu(page,release,grade8Count){
 await version(page,release.version);
 await catalog(page,counts(grade8Count),8);
 const menu=page.locator('#mk-g8-textbook-nav');
 await menu.waitFor({state:'visible'});
 const paragraphs=await menu.locator('.mk-g5-toc-part').evaluateAll(parts=>
  parts.map(part=>[...part.querySelectorAll('[data-paragraph]')].map(item=>Number(item.dataset.paragraph))));
 assert.deepEqual(paragraphs,[[1,51],[46,83],[32,58]].map(([first,last])=>
  Array.from({length:last-first+1},(_,i)=>first+i)));
 assert.equal(await page.locator('main input[type=search]:visible').count(),1);
 return menu;
}
async function assertInstalledBuild(page,release){
 const result=await page.evaluate(async({version,htmlHash,scriptHash})=>{
  const scope=location.href;
  const key=new URL('__matkvest_snapshot__/'+htmlHash+'/index.html',scope);
  if(!(await caches.has('matkvest-iphone-v'+version)))return false;
  const cache=await caches.open('matkvest-iphone-v'+version);
  const [html,script]=await Promise.all([cache.match(key),fetch('g8-textbook.js?v='+version)]);
  const fingerprint=async response=>{
   if(!response?.ok)return '';
   const digest=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
   return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  };
  return !!navigator.serviceWorker.controller&&await fingerprint(html)===htmlHash&&
   await fingerprint(script)===scriptHash;
 },{version:release.version,htmlHash:release.htmlHash,scriptHash:release.scripts['g8-textbook.js']});
 assert.equal(result,true,'The page and Grade 8 script must be served from the verified release');
}
async function inspectRestoration(page){
 await page.waitForFunction(()=>typeof blockSession!=='undefined'&&blockSession?.kind==='g8quiz');
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
  await version(page,old.version);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await catalog(page,counts(oldCount));
  if(old.version>=193){
   await page.locator('button[onclick="openGrade(8)"]').click();
   await gradeMenu(page,old,oldCount);
  }
  await page.evaluate(()=>{
   progressFor('g5:area_units_g5').best=STAGES.map(stage=>stage.need);
   save();
  });
  await page.evaluate(()=>{
   openG8Topic('g8:pythagorean_applications');
   startG8QuizStage('g8:pythagorean_applications',1);
   if(!skipNormalQuiz())throw Error('Could not start an attempt on the published release');
   nextQ();
   if(!mk872PersistDraft())throw Error('Could not store the published-release attempt');
  });
  const legacy=await inspectRestoration(page);
  active=fresh;
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await version(page,fresh.version);
  await page.getByRole('button',{name:'Продолжить',exact:true}).click();
  assert.deepEqual(await inspectRestoration(page),legacy);
  await catalog(page,counts(freshCount),8);
  await page.evaluate(()=>{
   while(!blockSession.finished){
    if(!skipNormalQuiz())throw Error('Could not continue the restored attempt');
    if(!blockSession.finished)nextQ();
   }
   finishBlock();
  });
  await page.locator('#modal .mtop button.x').click();
  await page.locator('#overlay').waitFor({state:'hidden'});
  await page.evaluate(()=>openGrade(8));
  const menu=await gradeMenu(page,fresh,freshCount);
  await assertInstalledBuild(page,fresh);
  for(let reload=0;reload<3;reload++){
   await page.reload();
   await gradeMenu(page,fresh,freshCount);
   await assertInstalledBuild(page,fresh);
  }
  if(fresh.version>=195){
   const ids=await page.evaluate(()=>{
    const planned=Array.from({length:120},()=>makeG8Question('g8:linear_system_substitution',2));
    return {
     formattedSystems:[...new Set(planned.filter(q=>q.text.includes('g8-substitution-system')).map(q=>q.templateId))].sort(),
     warmup:makeG8Question('g8:square_root_arithmetic',0).audit?.type
    };
   });
   assert.deepEqual(ids.formattedSystems,['qa9_find_expression','qa9_find_sum','qa9_linear_parameter','qa9_unknown_rhs']);
   assert.equal(ids.warmup,'g8Textbook');
  }
  await page.locator('main input[type=search]:visible').fill('геометрия 62');
  await menu.locator('[data-topic-id="g8:heron_formula"]:visible').click();
  await page.evaluate(()=>{
   startG8QuizStage('g8:heron_formula',1);
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
  await version(page,fresh.version);
  await page.getByRole('button',{name:'Продолжить',exact:true}).click();
  assert.deepEqual(await inspectRestoration(page),before);
  await assertInstalledBuild(page,fresh);
  const best=await page.evaluate(()=>({saved:progressFor('g5:area_units_g5').best,required:STAGES.map(stage=>stage.need)}));
  assert.deepEqual(best.saved,best.required);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,upgrade:old.version+'→'+fresh.version,catalog:counts(freshCount),paragraphs:116,grade8Reloads:3,verifiedHtmlAndScript:true,legacyAttemptRestored:true,onlineDraft:before.draft,offlineDraft:before.draft,keptProgress:true}));
 }finally{await context.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const width of [320,390,1280]){
   const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
   try{await run(browser,'http://127.0.0.1:'+server.address().port+'/matkvest/',width);}
   finally{await browser.close();}
  }
 }finally{server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
