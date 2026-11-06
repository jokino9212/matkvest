'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=process.cwd();
const counter=new Map();
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/api/')||pathname.startsWith('/matkvest/api/')||pathname==='/user-secret'){
  const n=(counter.get(pathname)||0)+1;counter.set(pathname,n);
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store, private'});
  res.end(JSON.stringify({path:pathname,nonce:n,secret:'test-private-'+n}));
  return;
 }
 const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(target!==path.join(root,'index.html')&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(target,(err,data)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':target.endsWith('.js')?'application/javascript':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(data);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
  const context=await browser.newContext({serviceWorkers:'allow'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>await navigator.serviceWorker.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
   if(!navigator.serviceWorker.controller)throw Error('SW not controlling');
   const request=async(path,headers)=>{const r=await fetch(path,{headers,credentials:'include'});return r.json()};
   const root1=await request('/api/v1/auth/me'),root2=await request('/api/v1/auth/me');
   const scoped1=await request('/matkvest/api/v1/me/entitlements'),scoped2=await request('/matkvest/api/v1/me/entitlements');
   const auth1=await request('/user-secret',{'Authorization':'Bearer TEST_TOKEN'}),auth2=await request('/user-secret',{'Authorization':'Bearer TEST_TOKEN'});
   const cache=await caches.open((await caches.keys()).find(x=>x.startsWith('matkvest-iphone-')));
   const stored=(await cache.keys()).map(req=>new URL(req.url).pathname).filter(p=>/api|user-secret/.test(p));
   return {root:[root1.nonce,root2.nonce],scoped:[scoped1.nonce,scoped2.nonce],auth:[auth1.nonce,auth2.nonce],stored};
  });
  assert.deepEqual(result.root,[1,2],'Root /api/v1 was cached');
  assert.deepEqual(result.scoped,[1,2],'Scoped API path was cached');
  assert.deepEqual(result.auth,[1,2],'Authorization request was cached');
  assert.deepEqual(result.stored,[],'Private data entered CacheStorage');
  await context.setOffline(true);
  const offline=await page.evaluate(async()=>{
   let failed=false;
   try{await fetch('/api/v1/auth/me',{credentials:'include'})}catch(e){failed=true}
   const cacheKeys=await caches.keys();
   return {failed,cacheKeys};
  });
  assert(offline.failed,'Sensitive API JSON was served without network');
  assert.equal(errors.length,0,'JavaScript errors');
  console.log('PASS_STAGE29_API_CACHE',JSON.stringify({result,offline}));
  await context.close();
 }catch(e){failures++;console.error('FAIL_STAGE29_API_CACHE',String(e),String(e.stack||'').slice(0,1500))}
 finally{await browser.close();server.close()}
 console.log('STAGE29_API_CACHE_SUMMARY',JSON.stringify({failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
