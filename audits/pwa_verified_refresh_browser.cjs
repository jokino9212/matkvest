'use strict';
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {readFileSync}=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const digest=body=>createHash('sha256').update(body).digest('hex');
const worker=readFileSync('sw.js','utf8');
const html=readFileSync('index.html','utf8');
const hashes=JSON.parse(worker.match(/const SCRIPT_HASHES = (\{[^\n]+\});/)[1]);
const latest=Number(worker.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/)[1]);
const first=latest-1;
const marker='g5-decimals-v116.js';

function release(version){
 const script=new Map(Object.keys(hashes).map(name=>[name,readFileSync(name,'utf8')]));
 script.set(marker,script.get(marker)+'\nwindow.testBuild='+version+';\n');
 const all=Object.fromEntries([...script].map(([name,body])=>[name,digest(body)]));
 const document=html.replace(/\?v=\d+(?="><\/script>)/g,'?v='+version);
 const sw=worker.replace(/const CACHE_NAME = "[^"]+"/,'const CACHE_NAME = "matkvest-iphone-v'+version+'"')
  .replace(/const APP_BUILD_HASH = "[^"]+"/,'const APP_BUILD_HASH = "'+digest(document)+'"')
  .replace(/const SCRIPT_HASHES = \{[^\n]*\};/,'const SCRIPT_HASHES = '+JSON.stringify(all)+';');
 return {document,sw,script};
}

const old=release(first),fresh=release(latest);
let active=old,stale='none',retries=new Set();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=url.pathname.slice('/matkvest/'.length);
 const isHTML=!file||file==='index.html';
 const versioned=url.searchParams.has('mk-build');
 if(versioned)retries.add(file);
 const responseRelease=stale==='all'||stale==='unversioned'&&!versioned?old:active;
 let body,type;
 if(file==='sw.js'){body=active.sw;type='application/javascript';}
 else if(isHTML){body=responseRelease.document;type='text/html; charset=utf-8';}
 else if(responseRelease.script.has(file)){body=responseRelease.script.get(file);type='application/javascript; charset=utf-8';}
 else if(file==='manifest.webmanifest'){body=readFileSync(file);type='application/manifest+json';}
 else{res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
 res.end(body);
});

async function check(page,version){
 await page.waitForFunction(v=>window.testBuild===v&&
  document.querySelector('#appVersionBadge')?.textContent==='Сборка v'+v,version);
 const result=await page.evaluate(()=>{
  openGrade(5);
  return {grade:currentGrade,topics:g5AllTopics().length,
   builds:[...document.querySelectorAll('script[src^="g5-"]')].map(s=>new URL(s.src).searchParams.get('v')),
   saved:localStorage.getItem('verifiedRefreshProbe')};
 });
 assert.equal(result.grade,5);assert.equal(result.topics,74);
 assert.deepEqual(result.builds,Array(19).fill(String(version)));
 return result.saved;
}
async function idle(page){
 await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active&&!r.installing&&!r.waiting;});
}
async function run(browser,address,viewport){
 active=old;stale='none';retries=new Set();
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(address);
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>null));
  await page.reload();
  await check(page,first);
  await page.evaluate(()=>localStorage.setItem('verifiedRefreshProbe','saved'));
  active=fresh;stale='all';
  const rejected=await page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration();
   const installed=new Promise(resolve=>registration.addEventListener('updatefound',()=>{
    const candidate=registration.installing;
    candidate.addEventListener('statechange',()=>{
     if(candidate.state==='redundant'||candidate.state==='activated')resolve(candidate.state);
    });
   },{once:true}));
   await registration.update();
   return installed;
  });
  assert.equal(rejected,'redundant');
  await idle(page);
  await page.reload();
  assert.equal(await check(page,first),'saved');
  stale='unversioned';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await check(page,latest);
  assert(retries.has('index.html')&&retries.has(marker),'Build-specific retry did not verify stale CDN resources');
  stale='all';
  await page.keyboard.press('F5');
  // Headless Chromium may leave browser shortcuts to the host. Navigate the same
  // route with a browser reload even on hosts that do not forward F5.
  await page.reload();
  assert.equal(await check(page,latest),'saved');
  await page.goto(address+'index.html');
  assert.equal(await check(page,latest),'saved');
  await ctx.setOffline(true);
  await page.reload();
  assert.equal(await check(page,latest),'saved');
  assert.deepEqual(errors,[]);
  console.log('PASS_VERIFIED_REFRESH',JSON.stringify({width:viewport.width,first,latest,online:true,offline:true,storedProgress:true}));
 }finally{await ctx.close();}
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const origin='http://127.0.0.1:'+server.address().port+'/matkvest/';
  assert.equal(digest(html),worker.match(/const APP_BUILD_HASH = "([^"]+)";/)[1]);
  assert.equal(Object.keys(hashes).length,19);
  for(const width of [390,1280])await run(browser,origin,{width,height:850});
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
