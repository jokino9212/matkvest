import fs from 'node:fs';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const BASE='https://jokino9212.github.io/matkvest/';
const EXPECT='f3d0639236010fc143b7d3dfcb2d9a7c4805746ed4c06387a89dd719bac42640';
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={url:BASE,expected:EXPECT,checkedAt:new Date().toISOString(),checks:[],errors:[],screens:[],status:'FAIL'};
const check=(name,ok,detail)=>{report.checks.push({name,pass:!!ok,detail});if(!ok)report.errors.push(name+(detail?' '+JSON.stringify(detail):''))};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let downloaded;
for(let i=0;i<35;i++){
  try{
   const r=await fetch(BASE+'index.html?build=v71-check-'+i,{headers:{'cache-control':'no-cache'}});
   if(!r.ok)throw Error('HTTP '+r.status);
   downloaded=Buffer.from(await r.arrayBuffer());
   if(sha(downloaded)===EXPECT)break;
  }catch(e){report.lastFetchError=String(e)}
  if(i<34)await wait(5000);
}
check('actual GitHub Pages serves exact v71 HTML',downloaded&&sha(downloaded)===EXPECT,{actual:downloaded?sha(downloaded):null});
const swResponse=await fetch(BASE+'sw.js?build=v71-check',{headers:{'cache-control':'no-cache'}});
const sw=await swResponse.text();
check('production service worker v71',swResponse.ok&&sw.includes('matkvest-iphone-v71')&&sw.includes(EXPECT),{http:swResponse.status,cache:sw.match(/matkvest-iphone-v\d+/)?.[0]});
if(report.errors.length){
 fs.writeFileSync('audits/v71_production_report.json',JSON.stringify(report,null,2));
 throw Error('Production CDN not yet updated: '+report.errors.join('; '));
}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [390,1280]){
  const ctx=await browser.createBrowserContext(),page=await ctx.newPage();
  try{
   await page.setViewport({width,height:850,deviceScaleFactor:1});
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
   await page.goto(BASE+'?v=71',{waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>typeof mkV71SectionCounts==='function'&&typeof mkV71SortItems==='function',{timeout:60000});
   const info=await page.evaluate(async()=>{
      openGrade(6);
      mkV71RefreshSections();
      const labels=[...document.querySelectorAll('#mainView .v71-progress-count')].map(el=>el.textContent);
      const topicCards=document.querySelectorAll('#mainView .g6-card').length;
      const overflow=document.documentElement.scrollWidth>innerWidth+2;
      const swreg=await navigator.serviceWorker.getRegistration();
      return {labels,topicCards,overflow,sw:!!swreg,hasNewCells:typeof stage18FractionMarkup==='function',hasSort:typeof mkV71SortItems==='function'};
   });
   check('live Chromium section progress '+width,info.labels.some(x=>/Пройдено \d+ из \d+ тем/.test(x))&&info.topicCards>0&&!info.overflow,info);
   openShopIfPossible:
   {
     const shops=await page.evaluate(()=>{
       openShop('pets','all');
       return {sortControls:document.querySelectorAll('#modal .v71-sort-control select').length,petCards:document.querySelectorAll('#modal .shop-grid .shop-card').length};
     });
     check('live Chromium shop '+width,shops.sortControls===1&&shops.petCards>0,shops);
   }
   check('live JS errors '+width,pageErrors.length===0,pageErrors);
   await page.screenshot({path:'audits/v71_live_'+width+'.png'});
   report.screens.push({width});
  } finally {await ctx.close()}
 }
}finally{await browser.close()}
report.status=report.errors.length?'FAIL':'PASS';report.actualSha256=sha(downloaded);
fs.writeFileSync('audits/v71_production_report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:report.checks.length,passed:report.checks.filter(x=>x.pass).length,errors:report.errors,sha:report.actualSha256,version:'v71'},null,2));
if(report.errors.length)process.exitCode=1;
