'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),entry='/integrations/v307/account_review.html',types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
(async()=>{
 let deny=false;
 const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://127.0.0.1').pathname;if(pathname===entry&&deny)return res.writeHead(403,{'Content-Type':'text/plain'}).end('DENIED');if(pathname==='/__r13/guard.html')return res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end('<!doctype html><title>Synthetic guard audit</title>');
 const raw=new Set(['/__r13/integrations/v307/training_queue.mjs','/__r13/integrations/backend95-next/school_block_queue.mjs','/__r13/integrations/v307/curriculum.mjs','/__r13/integrations/v307/visual_nodes.mjs']);
 if(raw.has(pathname)){const source=await readFile(resolve(__dirname,'..',pathname.slice('/__r13/'.length)));return res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(source);}
 const p=resolve(root,'.'+decodeURIComponent(pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(p))}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,origin='http://127.0.0.1:'+port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 // Playwright's offline emulation alone can leave a worker's fetch connected.
 // Close the actual listener as well; do not mock the navigation or worker.
 async function stop(){if(!server.listening)return;const closed=new Promise((ok,no)=>server.close(e=>e?no(e):ok()));server.closeAllConnections();await closed;}
 async function start(){if(server.listening)return;await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',no);ok()})});}
 try{for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'allow'}),page=await context.newPage();
  try{
   deny=false;await page.goto(origin+entry);await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
   await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/integrations/v307/account-offline-sw.js'),{},{timeout:30000});
   await page.evaluate(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('matkvest-v307-context-outbox',1);r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});await new Promise((ok,no)=>{const t=db.transaction('blocks','readwrite');t.objectStore('blocks').put({key:'synthetic-r12',owner:'synthetic-private-owner',draft:[{answer:'private-answer'}]});t.oncomplete=ok;t.onerror=()=>no(t.error)});db.close()});
   await stop();await context.setOffline(true);const locked=await page.reload({waitUntil:'domcontentloaded'});try{await page.getByRole('heading',{name:'МатКвест — нет связи'}).waitFor({timeout:15000});}catch(e){console.error('R12_LOCK_FAILURE',width,locked?.status(),page.url(),(await page.locator('body').innerText()).slice(0,800));throw e;}assert.doesNotMatch(await page.content(),/synthetic-private-owner|private-answer|<script|<input|<form/i);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await start();await context.setOffline(false);deny=true;const denied=await page.reload();assert.equal(denied.status(),403);assert.equal(await page.locator('body').innerText(),'DENIED');
   deny=false;await page.reload();await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
   const row=await page.evaluate(async()=>{const db=await new Promise((ok,no)=>{const r=indexedDB.open('matkvest-v307-context-outbox',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});const row=await new Promise((ok,no)=>{const r=db.transaction('blocks').objectStore('blocks').get('synthetic-r12');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});db.close();return row});assert.equal(row.draft[0].answer,'private-answer');
   console.log('PASS_V307_R12_REAL_SW_LOCKED_F5_IDB',width);
  }finally{await context.close();await start()}
 }
 // Test the actual IndexedDB implementation, not a fake outbox.
 const guardContext=await browser.newContext({serviceWorkers:'block'});
 try{
  const a=await guardContext.newPage(),b=await guardContext.newPage();
  for(const p of [a,b]){
   await p.goto(origin+'/__r13/guard.html');
   await p.evaluate(async()=>{
    const {createV307Queue}=await import('/__r13/integrations/v307/training_queue.mjs');
    const {indexedSchoolOutbox}=await import('/__r13/integrations/backend95-next/school_block_queue.mjs');
    const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),assignment=id('d'),foreignProfile=id('e');
    const home={owner,profile,role:'student',kind:'homework',assignment},practice={owner,profile,role:'student',kind:'practice'};
    let scope={...home,ticket:1};
    const outbox=indexedSchoolOutbox(indexedDB,'matkvest-v307-r13-guard-synthetic');
    const queue=createV307Queue({api:{},scope:()=>scope,outbox,online:()=>false});
    const make=(p,context)=>({key:JSON.stringify([owner,p,pack]),owner,profile:p,context,pack,topic:'g4:table',stage:0,count:5,start:{started_at:'2027-01-01T00:00:00Z'},status:'draft',questions:Array.from({length:5},()=>({a:2,b:3})),index:0,revision:0,draft:Array.from({length:5},()=>({answer:'',cells:{},checks:[],skipped:false,solved:false}))});
    const row=make(profile,home),foreign=make(foreignProfile,{...home,profile:foreignProfile});
    globalThis.r13={outbox,queue,row,foreign,owner,profile,foreignProfile,home,practice,set(s){scope={...s,ticket:scope.ticket+1}}};
   });
  }
  await a.evaluate(async()=>{const x=r13;await x.outbox.insert(x.row);await x.outbox.insert(x.foreign)});
  const denied=await a.evaluate(async()=>{
   const x=r13,errors=[];
   async function reject(row){try{await x.queue.act(row,'input','123');errors.push('UNEXPECTED_WRITE')}catch(e){errors.push(e.message)}}
   await reject({...x.row,key:x.foreign.key});
   x.set(x.practice);await reject({...x.row,context:x.practice});x.set(x.home);
   return {errors,original:(await x.outbox.list(x.owner,x.profile))[0],foreign:(await x.outbox.list(x.owner,x.foreignProfile))[0],expected:x.row,foreignExpected:x.foreign};
  });
  assert.deepEqual(denied.errors,['SCOPE_CHANGED','SCOPE_CHANGED']);
  assert.deepEqual(denied.original,denied.expected);assert.deepEqual(denied.foreign,denied.foreignExpected);
  const writes=await Promise.all([a,b].map((p,i)=>p.evaluate(async value=>{try{const next=await r13.queue.act(r13.row,'input',value);return {ok:true,answer:next.draft[0].answer,revision:next.revision}}catch(e){return {ok:false,error:e.message}}},String(i+6))));
  const wins=writes.filter(x=>x.ok),losses=writes.filter(x=>!x.ok);
  assert.equal(wins.length,1);assert.deepEqual(losses,[{ok:false,error:'DRAFT_CHANGED'}]);
  const final=await b.evaluate(async()=>({row:(await r13.outbox.list(r13.owner,r13.profile))[0],foreign:(await r13.outbox.list(r13.owner,r13.foreignProfile))[0]}));
  assert.equal(final.row.revision,1);assert.equal(final.row.draft[0].answer,wins[0].answer);assert.deepEqual(final.foreign,denied.foreignExpected);
  console.log('PASS_V307_R13_REAL_IDB_SCOPE_GUARD_AND_TWO_TAB_CAS');
 }finally{await guardContext.close()}
 }finally{await browser.close();await stop()}
})().catch(e=>{console.error(e);process.exitCode=1});
