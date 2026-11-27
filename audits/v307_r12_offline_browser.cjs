'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),entry='/integrations/v307/account_review.html',types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
(async()=>{
 let deny=false;
 const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://127.0.0.1').pathname;if(pathname===entry&&deny)return res.writeHead(403,{'Content-Type':'text/plain'}).end('DENIED');const p=resolve(root,'.'+decodeURIComponent(pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(p))}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'allow'}),page=await context.newPage();
  try{
   deny=false;await page.goto(origin+entry);await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
   await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/integrations/v307/account-offline-sw.js'),{},{timeout:30000});
   await page.evaluate(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('matkvest-v307-context-outbox',1);r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});await new Promise((ok,no)=>{const t=db.transaction('blocks','readwrite');t.objectStore('blocks').put({key:'synthetic-r12',owner:'synthetic-private-owner',draft:[{answer:'private-answer'}]});t.oncomplete=ok;t.onerror=()=>no(t.error)});db.close()});
   await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'МатКвест — нет связи'}).waitFor();assert.doesNotMatch(await page.content(),/synthetic-private-owner|private-answer|<script|<input|<form/i);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await context.setOffline(false);deny=true;const denied=await page.reload();assert.equal(denied.status(),403);assert.equal(await page.locator('body').innerText(),'DENIED');
   deny=false;await page.reload();await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
   const row=await page.evaluate(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('matkvest-v307-context-outbox',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});const row=await new Promise((ok,no)=>{const r=db.transaction('blocks').objectStore('blocks').get('synthetic-r12');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});db.close();return row});assert.equal(row.draft[0].answer,'private-answer');
   console.log('PASS_V307_R12_REAL_SW_LOCKED_F5_IDB',width);
  }finally{await context.close()}
 }}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
