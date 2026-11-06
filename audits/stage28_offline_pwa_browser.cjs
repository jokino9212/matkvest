'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=process.cwd();
const swText=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const cacheName=swText.match(/const CACHE_NAME\s*=\s*"([^"]+)"/)?.[1];
const buildHash=swText.match(/const APP_BUILD_HASH\s*=\s*"([a-f0-9]{64})"/)?.[1];
assert(cacheName&&buildHash,'Missing PWA cache name or fingerprint');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex'),buildHash,'Service-worker HTML fingerprint mismatch');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!filename.startsWith(root+path.sep)&&filename!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
 fs.readFile(filename,(err,data)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 });
});
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port,origin='http://127.0.0.1:'+port+'/';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const fails=[];
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:750},isMobile:width<500,hasTouch:width<500,serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   const online=await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    const reg=await navigator.serviceWorker.getRegistration();
    // Reload once so this tab becomes controlled by the installed worker.
    const keys=await caches.keys();
    return {controlled:!!navigator.serviceWorker.controller,active:!!reg?.active,
      cacheKeys:keys,online:navigator.onLine,swUrl:reg?.active?.scriptURL};
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
    if(!navigator.serviceWorker.controller)throw Error('Uncontrolled after reload');
    openProfiles();document.getElementById('newProfileName').value='Офлайн ученик';createProfile();
    state.xp=75;state.coins=97;persistSilently();
   });
   const offlineCache=await page.evaluate(async()=>({caches:await caches.keys(),controller:!!navigator.serviceWorker.controller}));
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded',timeout:15000});
   const offline=await page.evaluate(()=>{
     openGrade(6);
     const grade=currentGrade;
     openShop('avatars','all');
     const shop=!!document.querySelector('.shop-tabs');
     const saved={profile:currentProfile,xp:state.xp,coins:state.coins};
     const html=document.documentElement.outerHTML;
     const width=document.documentElement.clientWidth,scroll=document.documentElement.scrollWidth;
     return {grade,shop,saved,width,scroll,cache:navigator.serviceWorker.controller?.scriptURL||null,online:navigator.onLine};
   });
   assert(online.active,'SW not installed');
   assert(offlineCache.controller,'SW not controlling app');
   assert(offlineCache.caches.includes(cacheName),'Missing current SW cache '+cacheName);
   assert.equal(offline.grade,6,'Cannot open grade when offline');
   assert(offline.shop,'Cannot open shop when offline');
   assert.equal(offline.saved.profile,'Офлайн ученик');
   assert.equal(offline.saved.xp,75);
   assert.equal(offline.saved.coins,97);
   assert(offline.scroll<=width+2,'Offline layout overflow');
   assert.equal(offline.online,false,'Offline condition not activated');
   if(errors.length)throw Error('JS errors: '+errors.join(' | '));
   console.log('PASS_STAGE28_OFFLINE',JSON.stringify({width,online,offlineCache,offline}));
  }catch(e){fails.push({width,error:String(e)});console.error('FAIL_STAGE28_OFFLINE',JSON.stringify({width,error:String(e),stack:String(e.stack||'').slice(0,1800)}))}
  await context.close();
 }
 }finally{await browser.close();server.close()}
 console.log('STAGE28_OFFLINE_SUMMARY',JSON.stringify({expected:3,failed:fails.length,details:fails}));
 if(fails.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
