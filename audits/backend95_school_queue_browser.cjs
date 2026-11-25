'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext();
  const source=fs.readFileSync(path.join(__dirname,'../integrations/backend95-next/school_block_queue.mjs'),'utf8');
  await ctx.route('http://127.0.0.1:18796/**',r=>r.fulfill(r.request().url().endsWith('.mjs')?{contentType:'text/javascript',body:source}:{contentType:'text/html',body:'<!doctype html><title>outbox test</title>'}));
  const p=await ctx.newPage(),q=await ctx.newPage();
  const start=async page=>{await page.goto('http://127.0.0.1:18796/');await page.evaluate(async()=>{
    const {createSchoolBlockQueue,indexedSchoolOutbox}=await import('/queue.mjs');
    window.outbox=indexedSchoolOutbox();window.owner='a1436d1d-0123-4f25-8ae9-df61e8a85370';window.profile='b1436d1d-0123-4f25-8ae9-df61e8a85370';
    window.actor=owner;window.status='ready';window.pendingLogout=false;window.puts=0;
    const store={read:()=>({status:window.status,user:{id:owner,role:'student'},selectedId:profile,snapshot:{profile:{id:profile}}}),logoutPending:()=>pendingLogout};
    const api={resumeSession:async()=>({id:actor,role:'student'}),request:async(method,url,options)=>{puts++;if(window.failOnce){window.failOnce=false;throw Object.assign(Error('lost response'),{status:0});}return {id:url.split('/').pop(),status:'finished'};}};
    window.queue=createSchoolBlockQueue({api,store,outbox});
  })};
  await start(p);await start(q);
  const key=await p.evaluate(async()=>{const startedAt=new Date().toISOString();return (await queue.begin({pack:{id:'c1436d1d-0123-4f25-8ae9-df61e8a85370',topic_id:'g4:table',questions:[{},{}],full:true,expires_at:new Date(Date.now()+86400000).toISOString()},startedAt})).key});
  await p.reload();await start(p);
  const answers=[{checks:[{'answer:0':'6'}],skipped:false},{checks:[],skipped:true}];
  await p.evaluate(async({key,answers})=>{window.status='offline';await queue.complete(key,answers);},{key,answers});
  assert.deepEqual(await p.evaluate(()=>queue.flush()),[]);
  assert.equal(await q.evaluate(async()=> (await outbox.list(owner,profile))[0].status),'pending');
  await assert.rejects(q.evaluate(({key,answers})=>queue.complete(key,[...answers.slice(0,1),{checks:[{'answer:0':'9'}],skipped:false}]),{key,answers}),/BLOCK_BODY_CONFLICT/);
  assert.deepEqual(await q.evaluate(()=>{window.actor='d1436d1d-0123-4f25-8ae9-df61e8a85370';return queue.flush()}),[]);
  assert.equal(await q.evaluate(()=>puts),0);
  await q.evaluate(()=>{window.actor=owner;window.failOnce=true;});
  assert.deepEqual(await q.evaluate(()=>queue.flush()),[]);
  assert.equal(await q.evaluate(async()=> (await outbox.list(owner,profile))[0].status),'pending');
  assert.deepEqual(await q.evaluate(()=>queue.flush()),[key]);
  assert.equal(await p.evaluate(async()=> (await outbox.list(owner,profile))[0].status),'confirmed');
  assert.deepEqual(await q.evaluate(()=>queue.flush()),[]);
  assert.equal(await q.evaluate(()=>puts),2);
  console.log('PASS_SCHOOL_QUEUE_INDEXEDDB reload, cross-tab, offline completion, immutable journal, owner gate, retry');
  await ctx.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
