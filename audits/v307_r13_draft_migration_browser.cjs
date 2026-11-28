'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve}=require('node:path');
const allowed=new Set(['/integrations/v307/draft_key_session.mjs','/integrations/v307/encrypted_school_outbox.mjs','/integrations/v307/draft_cipher.mjs','/integrations/v307/draft_migration.mjs','/integrations/v307/training_queue.mjs','/integrations/backend95-next/school_block_queue.mjs','/integrations/v307/curriculum.mjs','/integrations/v307/visual_nodes.mjs']);
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
  const queueResult=await page.evaluate(async()=>{
   const {migrateDraftStore}=await import('/integrations/v307/draft_migration.mjs');
   const {encryptedSchoolOutbox}=await import('/integrations/v307/encrypted_school_outbox.mjs');
   const {createV307Queue}=await import('/integrations/v307/training_queue.mjs');
   const {createDraftKeySession}=await import('/integrations/v307/draft_key_session.mjs');
   const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),device=id('d'),assignment=id('e');
   const context={owner,profile,role:'student',kind:'homework',assignment},key=JSON.stringify([owner,profile,pack]);
   const databaseName='r13-encrypted-queue',initial={key,owner,profile,context,pack,topic:'g4:table',stage:0,count:5,start:{started_at:'2027-01-01T00:00:00Z'},status:'draft',questions:Array.from({length:5},()=>({a:2,b:3})),index:0,revision:0,draft:Array.from({length:5},()=>({answer:'',cells:{},checks:[],skipped:false,solved:false}))};
   const open=v=>new Promise((yes,no)=>{const r=indexedDB.open(databaseName,v);r.onupgradeneeded=()=>r.result.createObjectStore('blocks',{keyPath:'key'});r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
   const raw=async()=>{const db=await open(2);try{return await new Promise((yes,no)=>{const t=db.transaction('blocks','readonly'),r=t.objectStore('blocks').get(key);t.oncomplete=()=>yes(r.result);t.onabort=()=>no(t.error)})}finally{db.close()}};
   const db=await open(1);await new Promise((yes,no)=>{const t=db.transaction('blocks','readwrite');t.objectStore('blocks').put(initial);t.oncomplete=yes;t.onabort=()=>no(t.error)});db.close();
   const credentials=async keyId=>({keyId,key:await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])});
   const first=await credentials('k1'),second=await credentials('k2'),keys=new Map([[first.keyId,first],[second.keyId,second]]);
   let current=first,minimum=0,unavailable=false,online=true,scope={...context,ticket:1},changeScopeOnSeal=false,lost=true;
   const requests=[];
   await migrateDraftStore({databaseName,keyFor:async()=>first});
   const config={databaseName,keyFor:async(s,request)=>{
    if(unavailable||s.owner!==owner||s.profile!==profile||s.kind!=='homework'||s.assignment!==assignment)throw Error('KEY_UNAVAILABLE');
    if(request.operation==='seal'&&changeScopeOnSeal){scope={...context,ticket:scope.ticket+1};changeScopeOnSeal=false}
    const k=request.operation==='seal'?current:keys.get(request.keyId);if(!k)throw Error('KEY_UNAVAILABLE');return k;
   },floorFor:async()=>minimum};
   const outbox=encryptedSchoolOutbox(config),other=encryptedSchoolOutbox(config);
   const api={resumeSession:async()=>({id:owner,role:'student'}),profiles:async()=>[{id:profile}],submitBlock:async(p,b,body,lesson)=>{requests.push({p,b,body:structuredClone(body),lesson});if(lost)throw Object.assign(Error('lost receipt'),{status:0});return {id:pack,status:'finished',summary:{xp:20,coins:25}}}};
   const queue=createV307Queue({api,scope:()=>scope,outbox,online:()=>online});
   const rejects=async p=>{try{await p;return 'UNEXPECTED_SUCCESS'}catch(e){return e.message}};
   let r=await queue.prepare('g4:table',0,device);online=false;
   const before=await raw();changeScopeOnSeal=true;
   const scopeError=await rejects(queue.act(r,'input','6'));
   const unchanged=(await raw()).revision===before.revision;
   unavailable=true;const keyError=await rejects(queue.list());unavailable=false;
   const races=await Promise.all([outbox,other].map((o,i)=>o.act(key,0,'input',String(i+6),()=>true).then(v=>({ok:true,rev:v.revision}),e=>({ok:false,error:e.message}))));
   r=(await queue.list())[0];
   for(let i=0;i<5;i++){r=await queue.act(r,'check','6');r=await queue.act(r,'advance','6')}
   const pending=r.status,offlineSent=(await queue.flush()).length,offlineRequests=requests.length;
   current=second;await outbox.rotate(key,()=>true);keys.delete('k1');
   const afterRotate=await raw(),restored=(await queue.list())[0];
   // Real session adapter, not a bypassing fixture provider. Revoke precisely at
   // the second seal guard check, inside the actual IndexedDB write transaction.
   const session=createDraftKeySession({scope:()=>scope,online:()=>true,fetchKey:async(s,req)=>({credential:current,offlineForMs:0}),fetchFloor:async()=>({minimum:0,offlineForMs:0})});
   const guarded=encryptedSchoolOutbox({databaseName,...session,guardFor:(ctx,requirements)=>{
    const g=session.guardFor(ctx,requirements);let calls=0;
    return ()=>{if(requirements.requests[0].operation==='seal'&&++calls===2)session.invalidate();return g()};
   }});
   const beforeRevocation=await raw();
   const revokedSettle=await rejects(guarded.settle(key,'confirmed',{id:pack,status:'finished',summary:{xp:20,coins:25}}));
   const afterRevocation=await raw();
   if(revokedSettle!=='SCOPE_CHANGED'||beforeRevocation.revision!==afterRevocation.revision||String(beforeRevocation.ciphertext)!==String(afterRevocation.ciphertext))throw Error('REVOCATION_WRITE_LEAK');
   console.log('PASS_V307_R13_REVOKED_KEY_SETTLE_CAS');
   minimum=restored.revision+1;const rollback=await rejects(queue.list());minimum=0;
   online=true;const lostSent=(await queue.flush()).length;lost=false;const sent=await queue.flush(),confirmed=(await queue.list())[0],repeat=(await queue.flush()).length;
   const final=await raw(),noPlain=!Object.hasOwn(final,'draft')&&!Object.hasOwn(final,'body')&&!Object.hasOwn(final,'receipt')&&!Object.hasOwn(final,'questions');
   return {scopeError,unchanged,keyError,winners:races.filter(x=>x.ok).length,losers:races.filter(x=>!x.ok).map(x=>x.error),pending,offlineSent,offlineRequests,rotated:afterRotate.keyId,restoredStatus:restored.status,rollback,lostSent,sent:sent.length,confirmed:confirmed.status,repeat,requests:requests.length,sameBody:JSON.stringify(requests[0])===JSON.stringify(requests[1]),noPlain,finalKey:final.keyId};
  });
  assert.deepEqual(queueResult,{scopeError:'SCOPE_CHANGED',unchanged:true,keyError:'KEY_UNAVAILABLE',winners:1,losers:['DRAFT_CHANGED'],pending:'pending',offlineSent:0,offlineRequests:0,rotated:'k2',restoredStatus:'pending',rollback:'DRAFT_REVISION_FLOOR',lostSent:0,sent:1,confirmed:'confirmed',repeat:0,requests:2,sameBody:true,noPlain:true,finalKey:'k2'});
  console.log('PASS_V307_R13_ENCRYPTED_QUEUE_OFFLINE_REPLAY_ROTATION',JSON.stringify(queueResult));
  console.log('PASS_V307_R13_KEY_SESSION_SCHOOL_CAS');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
