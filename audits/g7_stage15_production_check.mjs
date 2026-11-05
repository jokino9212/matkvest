import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// Match whichever fully audited HTML + PWA build is deployed from this commit.
const expected=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const localWorker=fs.readFileSync('sw.js','utf8');
const cacheMatch=localWorker.match(/^const CACHE_NAME = "(matkvest-iphone-v[0-9]+)";/m);
if(!cacheMatch || !localWorker.includes('const APP_BUILD_HASH = "'+expected+'"'))throw Error('Local release HTML and SW fingerprint are inconsistent');
const expectedCache=cacheMatch[1];
const pages=process.env.MATKVEST_PAGES_URL||process.argv[2];
if(!pages||!/^https:\/\//.test(pages))throw Error('Official GitHub Pages URL required; no guessing production hostname');
const base=pages.endsWith('/')?pages:pages+'/';
const url=new URL('index.html',base).href,swUrl=new URL('sw.js',base).href;
const report={checkedAt:new Date().toISOString(),pages:base,expected,expectedCache,attempts:[],browser:[],pageErrors:[],status:'FAIL'};
function hash(buffer){return createHash('sha256').update(buffer).digest('hex')}
async function getBytes(u){const res=await fetch(u,{headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},signal:AbortSignal.timeout(25000),cache:'no-store'});const arr=Buffer.from(await res.arrayBuffer());return {status:res.status,bytes:arr,cacheControl:res.headers.get('cache-control'),type:res.headers.get('content-type')};}
let ready=false;
try{
  for(let i=0;i<42;i++){
    try {
      const [html,sw]=await Promise.all([getBytes(url),getBytes(swUrl)]);
      const real=hash(html.bytes),source=sw.bytes.toString('utf8');
      const ok=html.status===200&&sw.status===200&&real===expected&&source.includes('const CACHE_NAME = "'+expectedCache+'"')&&source.includes('const APP_BUILD_HASH = "'+expected+'"');
      report.attempts.push({attempt:i+1,htmlStatus:html.status,swStatus:sw.status,htmlSha256:real,pwaVersion:expectedCache,cacheControlHtml:html.cacheControl,cacheControlSW:sw.cacheControl,pass:ok});
      console.log('PRODUCTION CHECK',JSON.stringify(report.attempts.at(-1)));
      if(ok){ready=true;break;}
    }catch(err){report.attempts.push({attempt:i+1,error:String(err)});console.warn('Pages propagation',String(err));}
    if(i<41)await delay(10000);
  }
  if(!ready)throw Error('Production never served the exact tested HTML+SW pair');
  const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
  if(!exe)throw Error('Chrome unavailable on runner');
  const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const mode of [{name:'desktop',width:1440,height:900,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
      const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
      page.on('pageerror',err=>report.pageErrors.push({mode:mode.name,error:String(err)}));
      try{
        await page.setViewport({width:mode.width,height:mode.height,isMobile:mode.mobile,hasTouch:mode.mobile,deviceScaleFactor:1});
        const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
        if(!response?.ok())throw Error('Production browser navigation HTTP '+response?.status());
        await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
        const state=await page.evaluate(async()=>{
          const cachesNow=await caches.keys();
          startG7QuizStage('g7:geo_primitives',0);
          if(!mk872PersistDraft())throw Error('Cannot save real-site G7 draft');
          const a={id:blockSession.attemptId,sig:q.sig};
          return {title:document.title,cachesNow,original:a};
        });
        if(!state.cachesNow.includes(expectedCache))throw Error('Real page not using '+expectedCache+' cache '+JSON.stringify(state.cachesNow));
        await page.reload({waitUntil:'domcontentloaded',timeout:120000});
        await page.waitForSelector('.mk872-training-dialog',{timeout:15000});
        const resumed=await page.evaluate(()=>{const b=[...document.querySelectorAll('.mk872-training-dialog button')].find(x=>x.textContent.trim()==='Продолжить');if(!b)throw Error('Resume unavailable on Pages');b.click();return {id:blockSession?.attemptId,sig:q?.sig}});
        if(resumed.id!==state.original.id||resumed.sig!==state.original.sig)throw Error('Production attempted recovery changed G7 state');
        await page.screenshot({path:'audits/g7_stage15_prod_'+mode.name+'.png',fullPage:false});
        report.browser.push({mode:mode.name,result:'PASS',title:state.title,swCache:expectedCache,exactResume:true});
        console.log('PASS PRODUCTION BROWSER',mode.name);
      }catch(err){report.browser.push({mode:mode.name,result:'FAIL',error:String(err)});throw err;}
      finally{await ctx.close();}
    }
  }finally{await browser.close();}
  if(report.pageErrors.length)throw Error('Production browser JavaScript errors '+JSON.stringify(report.pageErrors));
  report.status='PASS';
}catch(error){report.error=String(error);process.exitCode=1;console.error('PRODUCTION RELEASE VALIDATION FAILED',String(error));}
finally{
  fs.writeFileSync('audits/g7_stage15_production_report.json',JSON.stringify(report,null,2)+'\n');
  console.log('STAGE15 PRODUCTION RESULT',JSON.stringify({status:report.status,attempts:report.attempts.length,browsers:report.browser,pageErrors:report.pageErrors.length}));
}
