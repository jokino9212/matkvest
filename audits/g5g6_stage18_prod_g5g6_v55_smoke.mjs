import fs from 'node:fs';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const baseInput=process.env.MATKVEST_PAGES_URL;
if(!baseInput||!/^https:\/\//.test(baseInput))throw Error('Official Pages URL required from gh api, no guessing');
const base=baseInput.endsWith('/')?baseInput:baseInput+'/';
const expected='12e52584246cf5763dc378052b7e134dda3b4d7639576296f3448ab97d638e0d';
const expectedCache='matkvest-iphone-v55';
const hash=x=>createHash('sha256').update(x).digest('hex');
const [htmlResponse,swResponse]=await Promise.all([
 fetch(new URL('index.html',base),{cache:'no-store',headers:{'Cache-Control':'no-cache'}}),
 fetch(new URL('sw.js',base),{cache:'no-store',headers:{'Cache-Control':'no-cache'}})
]);
const htmlBuffer=Buffer.from(await htmlResponse.arrayBuffer()),worker=await swResponse.text();
const report={url:base,checkedAt:new Date().toISOString(),sha256:hash(htmlBuffer),htmlStatus:htmlResponse.status,swStatus:swResponse.status,swCache:expectedCache,tests:[],pageErrors:[],pass:false};
if(htmlResponse.status!==200||swResponse.status!==200||report.sha256!==expected||!worker.includes('const CACHE_NAME = "'+expectedCache+'"')||!worker.includes('const APP_BUILD_HASH = "'+expected+'"'))throw Error('Actual GitHub Pages does not serve exact v55');
const execPath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!execPath)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:execPath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [390,1280]){
   for(const grade of [5,6]){
     const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
     page.on('pageerror',e=>report.pageErrors.push({grade,width,error:String(e)}));
     await page.setViewport({width,height:900,deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
     let result={grade,width,pass:false};
     try{
       const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
       if(!response?.ok())throw Error('Live page navigation not HTTP 200');
       await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
       const before=await page.evaluate(g=>{
         if(g===5)startG5QuizStage('frac_read',0);
         else startG6QuizStage('g6:fraction_add_subtract',0);
         if(q.answerMode!=='fraction')throw Error('Unexpected answer mode: '+q.answerMode);
         const fields=['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id));
         if(fields.some(x=>!x))throw Error('Missing fraction entry boxes');
         const values=g===5?['','4','8']:['2','1','3'];
         fields.forEach((x,i)=>{x.value=values[i];x.dispatchEvent(new Event('input',{bubbles:true}))});
         const root=document.getElementById('qstage').getBoundingClientRect();
         const rects=fields.map(x=>x.getBoundingClientRect());
         const geometry={stacked:rects[1].bottom<rects[2].top,wholeLeft:rects[0].right<rects[1].left,
           fits:rects.every(r=>r.left>=0&&r.right<=innerWidth),inputTexts:fields.map(x=>x.getAttribute('aria-label'))};
         const key='stage18-production-v55-sentinel';
         localStorage.setItem(key,JSON.stringify({coins:250,xp:365,inventory:['demo-cat'],progress:{g5:2,g6:3}}));
         if(!mk872PersistDraft())throw Error('Production draft save failed');
         return {sig:q.sig,attemptId:blockSession.attemptId,values,geometry,sentinel:localStorage.getItem(key),cachePromise:1};
       },grade);
       const screenshot='audits/g5g6_stage18_prod_grade'+grade+'_'+width+'.png';
       await page.screenshot({path:screenshot,fullPage:false});
       await page.reload({waitUntil:'domcontentloaded',timeout:120000});
       await page.waitForSelector('.mk872-training-dialog',{timeout:15000});
       const after=await page.evaluate(()=>{
         const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');
         if(!b)throw Error('Resume action missing');
         b.click();
         return {attemptId:blockSession.attemptId,sig:q.sig,values:['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id)?.value),
           sentinel:localStorage.getItem('stage18-production-v55-sentinel')};
       });
       const caches=await page.evaluate(async()=>await caches.keys());
       if(before.sig!==after.sig||before.attemptId!==after.attemptId)throw Error('Actual production attempt identity changed');
       if(JSON.stringify(before.values)!==JSON.stringify(after.values))throw Error('Actual production fraction boxes did not restore');
       if(before.sentinel!==after.sentinel)throw Error('Local XP/coins/inventory data corrupted during reload');
       if(!before.geometry.stacked||!before.geometry.wholeLeft||!before.geometry.fits||!before.geometry.inputTexts.every(Boolean))throw Error('Actual production fractional inputs misaligned');
       if(!caches.includes(expectedCache))throw Error('Live production cache not '+expectedCache);
       result={grade,width,pass:true,attemptStable:true,inputsRestored:after.values,geometry:before.geometry,cacheNames:caches,screenshot};
       console.log('PASS LIVE G'+grade+' at '+width+'px '+JSON.stringify(result).slice(0,1300));
     }catch(e){result.error=String(e);console.log('FAIL LIVE G'+grade+' at '+width+'px: '+String(e));}
     finally{report.tests.push(result);await ctx.close()}
   }
 }
 report.pass=report.tests.length===4&&report.tests.every(t=>t.pass)&&report.pageErrors.length===0;
}finally{
 await browser.close();
 fs.writeFileSync('audits/g5g6_stage18_prod_g5g6_v55_smoke_report.json',JSON.stringify(report,null,2)+'\n');
 console.log('LIVE PRODUCTION v55 FINAL '+JSON.stringify({pass:report.pass,url:report.url,sha:report.sha256,tests:report.tests.map(t=>({grade:t.grade,width:t.width,pass:t.pass,error:t.error})),pageErrors:report.pageErrors},null,2));
 if(!report.pass)process.exitCode=1;
}
