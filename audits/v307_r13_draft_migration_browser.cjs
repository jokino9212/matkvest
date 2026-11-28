'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve}=require('node:path');
const allowed=new Set(['/integrations/v307/draft_cipher.mjs','/integrations/v307/draft_migration.mjs','/integrations/v307/training_queue.mjs','/integrations/backend95-next/school_block_queue.mjs','/integrations/v307/curriculum.mjs','/integrations/v307/visual_nodes.mjs']);
(async()=>{
 const server=createServer(async(req,res)=>{try{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  if(p==='/')return res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><title>Synthetic migration test</title>');
  if(!allowed.has(p))return res.writeHead(404).end();
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'}).end(await readFile(resolve(__dirname,'..','.'+p)));
 }catch(e){if(!res.headersSent)res.writeHead(500);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  const result=await page.evaluate(async()=>{
   const {migrateDraftStore}=await import('/integrations/v307/draft_migration.mjs');
   const {openDraft,canonicalDraftJSON}=await import('/integrations/v307/draft_cipher.mjs');
   const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b');
   const make=(pack,revision)=>({key:JSON.stringify([owner,profile,pack]),owner,profile,context:{owner,profile,role:'student',kind:'practice'},pack,revision,draft:[{answer:'synthetic-secret'}]});
   const initial=[make(id('c'),2),make(id('d'),3)];
   const credential={keyId:'synthetic-key',key:await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])};
   const open=(name,v)=>new Promise((yes,no)=>{const r=indexedDB.open(name,v);r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
   const write=(db,rows)=>new Promise((yes,no)=>{const t=db.transaction('blocks','readwrite');for(const r of rows)t.objectStore('blocks').put(r);t.oncomplete=yes;t.onabort=()=>no(t.error)});
   const read=(db)=>new Promise((yes,no)=>{const t=db.transaction('blocks','readonly'),r=t.objectStore('blocks').getAll();t.oncomplete=()=>yes(r.result);t.onabort=()=>no(t.error)});
   const seed=async name=>{const db=await open(name,1);await write(db,initial);db.close()};
   const migrate=(databaseName,keyFor=async()=>credential)=>migrateDraftStore({databaseName,keyFor});
   const error=async p=>{try{await p;return 'UNEXPECTED_SUCCESS'}catch(e){return e.message}};
   const eq=(a,b)=>canonicalDraftJSON(a)===canonicalDraftJSON(b);
   await seed('r13-success');const first=await migrate('r13-success'),again=await migrate('r13-success');
   const v2=await open('r13-success',2),sealed=await read(v2);v2.close();
   const decoded=await Promise.all(sealed.map(e=>openDraft(e,credential,e.context,e.revision,e.pack)));
   const oldVersion=await (async()=>{try{const d=await open('r13-success',1);d.close();return 'UNEXPECTED_SUCCESS'}catch(e){return e.name}})();
   await seed('r13-key-failure');let count=0;
   const keyFailure=await error(migrate('r13-key-failure',async()=>{if(++count===2)throw Error('KEY_UNAVAILABLE');return credential}));
   let db=await open('r13-key-failure',1);const keyRows=await read(db);db.close();
   await seed('r13-race');let changed=false;const updated={...initial[0],revision:3,draft:[{answer:'newer-answer'}]};
   const race=await error(migrate('r13-race',async()=>{if(!changed){changed=true;const x=await open('r13-race',1);await write(x,[updated]);x.close()}return credential}));
   db=await open('r13-race',1);const raceRows=await read(db);db.close();
   await seed('r13-blocked');const oldTab=await open('r13-blocked',1);
   const blocked=await error(migrate('r13-blocked'));oldTab.close();
   // A previously blocked request must abort even after the old connection closes.
   db=await open('r13-blocked',1);const blockedRows=await read(db);db.close();
   return {first,again,roundtrip:eq(decoded,initial),noPlain:sealed.every(e=>!Object.hasOwn(e,'draft')&&!JSON.stringify(e).includes('synthetic-secret')),oldVersion,keyFailure,keyUnchanged:eq(keyRows,initial),race,raceUnchanged:eq(raceRows,[updated,initial[1]]),blocked,blockedUnchanged:eq(blockedRows,initial)};
  });
  assert.deepEqual(result,{first:{already:false,count:2},again:{already:true,count:2},roundtrip:true,noPlain:true,oldVersion:'VersionError',keyFailure:'KEY_UNAVAILABLE',keyUnchanged:true,race:'DRAFT_MIGRATION_CONFLICT',raceUnchanged:true,blocked:'DRAFT_MIGRATION_BLOCKED',blockedUnchanged:true});
  console.log('PASS_V307_R13_REAL_IDB_ATOMIC_ENCRYPTION_MIGRATION',JSON.stringify(result));
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
