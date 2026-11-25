'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,extname,sep}=require('node:path');
const site=resolve(process.argv[2]);
const owner='ea436d1d-0123-4f25-8ae9-df61e8a85370',foreign='ea436d1d-0123-4f25-8ae9-df61e8a85371';
const A='a1436d1d-0123-4f25-8ae9-df61e8a85370',B='b1436d1d-0123-4f25-8ae9-df61e8a85370',C='c1436d1d-0123-4f25-8ae9-df61e8a85370';
const profiles=[{id:A,user_id:owner,display_name:'Сервер А',xp_total:115},{id:B,user_id:owner,display_name:'Сервер Б',xp_total:250},{id:C,user_id:foreign,display_name:'Чужой ученик',xp_total:999}];
const balance={[A]:41,[B]:82,[C]:999};
const mutations=[],apiTrace=[],receipts=new Map();let tablePuts=0,tableRewards=0,tablePackNo=0;
const questions=[{a:2,b:3},{a:3,b:4},{a:4,b:5},{a:5,b:6},{a:6,b:7}];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'};
const json=(res,status,data,headers={})=>{apiTrace.push({method:res.req.method,path:new URL(res.req.url,'http://localhost').pathname,status});return res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers}).end(JSON.stringify(data))};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  if(u.pathname.startsWith('/api/v1/')){
   const path=u.pathname.slice(7),session=/mq_session=(student|other)/.exec(req.headers.cookie||'')?.[1];
   const uid=session==='student'?owner:session==='other'?foreign:null;
   if(req.method!=='GET')mutations.push(path);
   if(path==='/auth/login'&&req.method==='POST'){
    let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
    if(body.password!=='test-password'||!['student@example.test','other@example.test'].includes(body.email))return json(res,401,{error:{code:'INVALID_CREDENTIALS'}});
    const type=body.email.startsWith('student')?'student':'other';
    return json(res,200,{user:{id:type==='student'?owner:foreign,role:'student'},csrf_token:'test-csrf'},{'Set-Cookie':'mq_session='+type+'; Path=/; HttpOnly; SameSite=Lax'});
   }
   if(!uid)return json(res,401,{error:{code:'UNAUTHORIZED'}});
   if(path==='/auth/logout'&&req.method==='POST'){assert.equal(req.headers['x-csrf-token'],'test-csrf');return json(res,200,{ok:true},{'Set-Cookie':'mq_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'})}
   if(path==='/auth/csrf')return json(res,200,{csrf_token:'test-csrf'});
   if(path==='/auth/me')return json(res,200,{id:uid,role:'student'});
   if(path==='/student/profiles')return json(res,200,profiles.filter(p=>p.user_id===uid));
   const training=/^\/student\/profiles\/([^/]+)\/offline-school(?:\/([^/]+))?$/.exec(path);
   if(training){
    const [,id,packId]=training;if(!profiles.some(p=>p.id===id&&p.user_id===uid))return json(res,404,{error:{code:'PROFILE_NOT_FOUND'}});
    let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
    assert.equal(req.headers['x-csrf-token'],'test-csrf');
    if(req.method==='POST'&&!packId){assert.equal(body.topic,'g4:table');assert.equal(body.grade,4);const pack='f1436d1d-0123-4f25-8ae9-'+String(++tablePackNo).padStart(12,'0');const now=new Date().toISOString(),expires=new Date(Date.now()+86400000).toISOString();return json(res,200,{full:false,server_time:now,permits:[{id:pack.replace(/^f/,'e'),expires_at:expires}],topics:{'g4:table':{packs:[{id:pack,topic_id:'g4:table',stage:0,questions,full:false,expires_at:expires}],best:[0,0,0]}}});}
    if(req.method==='PUT'&&packId){tablePuts++;const old=receipts.get(packId);if(old){assert.deepEqual(body,old.body);return json(res,200,old.receipt);}assert.equal(body.permit,packId.replace(/^f/,'e'));assert.equal(body.items.length,5);assert(body.items.every((x,i)=>!x.skipped&&Number(x.checks.at(-1)['answer:0'])===questions[i].a*questions[i].b));const receipt={id:packId,status:'finished',summary:{correct:5,corrected:0,skipped:0,passed:true,xp:80,coins:25}};receipts.set(packId,{body,receipt,profile:id});balance[id]+=25;profiles.find(p=>p.id===id).xp_total+=80;tableRewards++;return json(res,200,receipt);}
    return json(res,405,{});
   }
   const match=/^\/student(?:-profiles|\/profiles)\/([^/]+)\/(wallet|progress|history|entitlements)$/.exec(path);
   if(match){const [,id,kind]=match,p=profiles.find(p=>p.id===id&&p.user_id===uid);if(!p)return json(res,404,{error:{code:'PROFILE_NOT_FOUND'}});
    if(kind==='wallet')return json(res,200,{profile_id:id,balance:balance[id],revision:1});
    if(kind==='progress')return json(res,200,{course_progress:[{course_key:id===A?'g4:table':'g5:natural',stage_index:0,best_score:id===A?5:9}],topic_mastery:[]});
    if(kind==='history')return json(res,200,{attempts:[{id:'server.'+id,title:'Попытка '+p.display_name,source:'server',status:'finished',correct:id===A?5:9,total:10,date:'2026-11-20T12:00:00Z'}],next_offset:null});
    return json(res,200,{profile_id:id});
   }
   return json(res,404,{error:{code:'NOT_FOUND'}});
  }
  const file=resolve(site,decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html');
  if(!file.startsWith(site+sep))return res.writeHead(403).end();
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
 }catch(e){res.writeHead(500).end(String(e))}
});
async function run(browser,url,width){
 const ctx=await browser.newContext({viewport:{width,height:850}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const expectText=async(page,selector,expected)=>{await page.waitForFunction(({selector,expected})=>document.querySelector(selector)?.textContent.trim()===expected,{selector,expected})};
 const ready=async(page)=>{await page.goto(url);await page.locator('#appHeader[data-v-app]').waitFor({state:'attached'});await page.locator('#homeDashboard[data-v-app]').waitFor({state:'attached'});await page.waitForFunction(()=>!!window.MK95Account)};
 const account=page=>page.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click();
 const dialog=page=>page.getByRole('dialog',{name:'Аккаунт МатКвест'});
 const select=async(page,id)=>{await dialog(page).getByRole('combobox',{name:'Серверный ученик'}).selectOption(id);await page.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,id);await dialog(page).getByRole('button',{name:'Закрыть',exact:true}).click()};
 const local=page=>page.evaluate(()=>({id:state.profileId,xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0}));
 try{
  await ready(p);const before=await local(p);
  await account(p);await dialog(p).getByRole('textbox',{name:'Электронная почта'}).fill('student@example.test');await dialog(p).getByLabel('Пароль',{exact:true}).fill('test-password');await dialog(p).getByRole('button',{name:'Войти',exact:true}).click();
  await select(p,B);await expectText(p,'[data-mk95-name]','Сервер Б');await expectText(p,'[data-mk95-coins]','82');
  await p.locator('[data-mk95-progress]').click();await p.locator('#modal .vue-report[data-v-app] [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/g5:natural/);assert.doesNotMatch(await p.locator('#modal').innerText(),/g4:table/);
  await p.locator('#modal button.x').click();await p.locator('[data-mk95-journal]').click();await p.locator('#modal .vue-report[data-v-app] [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/Попытка Сервер Б/);assert.doesNotMatch(await p.locator('#modal').innerText(),/Попытка Сервер А/);
  await p.locator('#modal button.x').click();await p.waitForFunction(()=>!document.getElementById('modal').textContent.includes('Попытка Сервер Б'));assert.deepEqual(await local(p),before);
  assert.equal(await p.evaluate(async id=>(await fetch('/api/v1/student/profiles/'+id+'/history')).status,C),404);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await p.reload();await expectText(p,'[data-mk95-name]','Сервер Б');assert.deepEqual(await local(p),before);
  await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');await expectText(p,'[data-mk95-coins]','—');
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().status==='offline');await expectText(p,'[data-mk95-coins]','—');assert.equal(await p.locator('#mainView .grade-grid').count(),0);
  const apiKeys=await p.evaluate(async()=>{const result=[];for(const name of await caches.keys()){const c=await caches.open(name);for(const k of await c.keys())if(new URL(k.url).pathname.startsWith('/api/'))result.push(k.url)}return result});assert.deepEqual(apiKeys,[]);
  await ctx.setOffline(false);await expectText(p,'[data-mk95-name]','Сервер Б');
  const p2=await ctx.newPage();p2.on('pageerror',e=>errors.push(e.message));await ready(p2);await account(p2);await select(p2,A);await expectText(p2,'[data-mk95-coins]','41');await expectText(p,'[data-mk95-coins]','82');
  await account(p2);await dialog(p2).getByRole('button',{name:'Выйти',exact:true}).click();await p.waitForFunction(()=>window.MK95Account.read().status==='session-changed');await expectText(p,'[data-mk95-coins]','—');
  await p.locator('#mainView').getByRole('button',{name:'Локальный режим',exact:true}).click();await p.locator('#mainView .grade-grid').waitFor();assert.deepEqual(await local(p),before);
  // Login under the first account, then request logout while disconnected.
  await account(p);await dialog(p).getByRole('textbox',{name:'Электронная почта'}).fill('student@example.test');await dialog(p).getByLabel('Пароль',{exact:true}).fill('test-password');await dialog(p).getByRole('button',{name:'Войти',exact:true}).click();await select(p,B);
  await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');
  await account(p);await dialog(p).getByRole('button',{name:'Выйти из аккаунта',exact:true}).click();
  await p.waitForFunction(()=>window.MK95Account.read().status==='logout-unconfirmed');
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().status==='logout-unconfirmed');
  await expectText(p,'[data-mk95-coins]','—');
  await ctx.setOffline(false);await account(p);await dialog(p).getByRole('button',{name:'Завершить выход',exact:true}).click();
  await p.waitForFunction(()=>window.MK95Account.read().status==='signed-out');
  await dialog(p).getByRole('button',{name:'Закрыть',exact:true}).click();
  assert.equal(await p.evaluate(async()=> (await fetch('/api/v1/auth/me')).status),401);
  assert.deepEqual(await local(p),before);console.log('PASS_OFFLINE_LOGOUT_RELOAD',width);
  // A different account in another tab must invalidate the previous owner's UI.
  await account(p);await dialog(p).getByRole('textbox',{name:'Электронная почта'}).fill('student@example.test');await dialog(p).getByLabel('Пароль',{exact:true}).fill('test-password');await dialog(p).getByRole('button',{name:'Войти',exact:true}).click();await select(p,B);
  await p2.reload();await p2.waitForFunction(()=>!!window.MK95Account);
  await account(p2);await dialog(p2).getByRole('button',{name:'Выйти',exact:true}).click();
  await p2.waitForFunction(()=>window.MK95Account.read().status==='signed-out');
  await dialog(p2).getByRole('textbox',{name:'Электронная почта'}).fill('other@example.test');await dialog(p2).getByLabel('Пароль',{exact:true}).fill('test-password');await dialog(p2).getByRole('button',{name:'Войти',exact:true}).click();
  await p2.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,C);
  await p.waitForFunction(()=>!window.MK95Account.read().snapshot);await expectText(p,'[data-mk95-coins]','—');
  await expectText(p2,'[data-mk95-coins]','999');
  assert.deepEqual(await local(p),before);
  assert.deepEqual(errors,[]);console.log('PASS_BACKEND95_BROWSER',width);
 }catch(e){console.log('BROWSER_DIAGNOSTICS',JSON.stringify({width,apiTrace:apiTrace.slice(-50),errors,ui:await p.evaluate(()=>({account:window.MK95Account?.read().status,mode:window.MK95Account?.read().mode,dialog:document.querySelector('.mk95-account-dialog')?.innerText,route:window.mk854Route?.()})).catch(()=>null)}));throw e}finally{await ctx.close()}
}
async function runTable(browser,url){
 const ctx=await browser.newContext({viewport:{width:390,height:850}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(url);await p.locator('#appHeader[data-v-app]').waitFor();await p.waitForFunction(()=>!!window.MK95Account);
  const before=await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0}));
  await p.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click();
  const dialog=p.getByRole('dialog',{name:'Аккаунт МатКвест'});
  await dialog.getByLabel('Электронная почта').fill('student@example.test');await dialog.getByLabel('Пароль',{exact:true}).fill('test-password');await dialog.getByRole('button',{name:'Войти',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Серверный ученик'}).selectOption(A);
  await p.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,A);
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await p.locator('[data-mk95-table-open]').click();await p.locator('#mk95-table-question #fin').fill('6');
  await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.answer==='6');
  await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.model?.exercise.answer==='6');
  assert.equal(await p.locator('#mk95-table-question #fin').inputValue(),'6');
  assert.equal(await p.locator('[data-mk95-coins]').innerText(),'—');
  for(let i=0;i<questions.length;i++){
   const ans=String(questions[i].a*questions[i].b);await p.locator('#mk95-table-question #fin').fill(ans);
   await p.locator('#mk95-table-question #tablePrimary').click();
   await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.nextReady===true);
   await p.locator('#mk95-table-question #tablePrimary').click();
   if(i<4)await p.waitForFunction(i=>window.MK95Account.read().table.index===i+1,i);
  }
  await p.waitForFunction(()=>window.MK95Account.read().table.status==='pending');assert.equal(tablePuts,0);
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.status==='pending');
  await ctx.setOffline(false);
  await p.waitForFunction(()=>window.MK95Account.read().table.status==='confirmed');
  await p.waitForFunction(()=>document.querySelector('[data-mk95-coins]')?.textContent==='66');
  assert.equal(tableRewards,1);assert.equal(tablePuts,1);assert.equal(balance[B],82);
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.status==='confirmed');
  assert.equal(tableRewards,1);assert.deepEqual(await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),before);
  assert.deepEqual(errors,[]);console.log('PASS_TABLE_PILOT_UI draft input, offline F5, completion, reconnect, one reward');
 }finally{await ctx.close()}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{const url='http://127.0.0.1:'+server.address().port+'/';await run(browser,url,390);await run(browser,url,1280);assert(mutations.every(p=>['/auth/login','/auth/logout'].includes(p)));console.log('PASS_NO_GAMEPLAY_MUTATIONS',mutations);await runTable(browser,url)}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
