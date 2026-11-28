'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path'),{randomBytes}=require('node:crypto');
const root=resolve(__dirname,'../dist-v307-encrypted-audit'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),assignment=id('e');
(async()=>{
 const server=createServer(async(req,res)=>{try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
  if(!path.startsWith(root+sep))return res.writeHead(404).end();
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(path));
 }catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],puts=[];
  let logged=false,lost=true,receipts=0,accepted=null;
  try{
   await context.addInitScript({content:'Object.defineProperty(window,"__mkR13SyntheticKey",{value:'+JSON.stringify(Array.from(randomBytes(32)))+',configurable:true})'});
   page.on('pageerror',e=>errors.push(String(e)));
   await context.route('**/api/v1/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data;
    if(path==='/auth/login'){logged=true;data={user:{id:owner,role:'student'},csrf_token:'synthetic-csrf'}}
    else if(path==='/auth/csrf'&&logged)data={csrf_token:'synthetic-csrf'};
    else if(path==='/auth/me'&&logged)data={id:owner,role:'student'};
    else if(path==='/student/profiles'&&logged)data=[{id:profile,display_name:'Пробный ученик'}];
    else if(path==='/student/profiles/'+profile+'/homework/'+assignment+'/prepare'&&m==='POST'&&logged)data={server_time:'2027-01-01T00:00:00Z',assignment_id:assignment,permits:[],pack:{id:pack,topic_id:'g4:table',stage:0,full:true,expires_at:'2027-01-02T00:00:00Z',questions:Array.from({length:5},()=>({a:2,b:3}))}};
    else if(path==='/student/profiles/'+profile+'/offline-school/'+pack&&m==='PUT'&&logged){
     assert.equal(req.headers()['x-csrf-token'],'synthetic-csrf');puts.push({path,body});
     if(accepted)assert.deepEqual(body,accepted);else{accepted=structuredClone(body);receipts++}
     data={id:pack,status:'finished',summary:{correct:5,corrected:0,skipped:0,passed:true,xp:20,coins:25}};
     if(lost){lost=false;await route.abort('failed');return}
    }else{code=404;data={error:{code:'NOT_FOUND'}}}
    await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
   });
   const button=n=>page.getByRole('button',{name:n,exact:true});
   const ready=async()=>{await page.getByText('TEST READY',{exact:true}).waitFor();await page.getByText('Домашнее задание',{exact:true}).waitFor()};
   const next=()=>page.waitForFunction(()=>{const e=document.getElementById('fin');return e&&!e.readOnly&&!e.disabled&&e.value===''});
   const persisted=()=>page.evaluate(async()=>{
    const db=await new Promise((ok,no)=>{const r=indexedDB.open('mk307-synthetic-vue-audit',2);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
    try{const rows=await new Promise((ok,no)=>{const t=db.transaction('blocks','readonly'),r=t.objectStore('blocks').getAll();t.oncomplete=()=>ok(r.result);t.onabort=()=>no(t.error)});
     return rows.map(e=>({keyId:e.keyId,revision:e.revision,ciphertext:e.ciphertext instanceof Uint8Array&&e.ciphertext.length>16,noPlain:['draft','questions','body','receipt','answer'].every(k=>!Object.hasOwn(e,k))}));
    }finally{db.close()}
   });
   await page.goto(origin+'/audits/fixtures/v307_encrypted_vue.html');await ready();
   await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await button('Далее').waitFor();
   const afterCheck=await persisted();assert.equal(afterCheck.length,1);assert(afterCheck[0].revision>=1&&afterCheck[0].ciphertext&&afterCheck[0].noPlain);
   // Reissue synthetic fixture key after F5. Real server reauthorization remains a separate gate.
   await page.reload();await ready();await button('Далее').waitFor();assert.equal(await page.getByLabel('Ответ',{exact:true}).inputValue(),'6');
   assert.equal(await page.getByLabel('Ответ',{exact:true}).evaluate(e=>e.readOnly),true);await button('Далее').click();await next();
   await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});dispatchEvent(new Event('offline'))});
   for(let i=1;i<5;i++){await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await button('Далее').click();if(i<4)await next()}
   await button('Повторить синхронизацию').waitFor();assert.equal(puts.length,0);
   const beforeSend=await persisted();assert.equal(beforeSend.length,1);assert(beforeSend[0].noPlain&&beforeSend[0].revision>afterCheck[0].revision);
   const failure=page.waitForEvent('requestfailed',{predicate:req=>req.method()==='PUT'&&req.url().includes('/offline-school/')});
   await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});dispatchEvent(new Event('online'))});
   await failure;await page.waitForFunction(()=>!document.querySelector('.v307-training button[disabled]'));
   await button('Повторить синхронизацию').click();await page.getByText(/Начислено 20 XP и 25 монет/).waitFor();
   assert.equal(puts.length,2);assert.deepEqual(puts[0],puts[1]);assert.equal(receipts,1);
   const final=await persisted();assert.equal(final.length,1);assert(final[0].noPlain&&final[0].revision>beforeSend[0].revision);
   await page.reload();await ready();await page.getByText(/Начислено 20 XP и 25 монет/).waitFor();assert.equal(puts.length,2);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
   console.log('PASS_V307_R13_ENCRYPTED_VUE_F5_OFFLINE_REPLAY',width);
  }finally{await context.close()}
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
