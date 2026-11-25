'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,extname,sep}=require('node:path');
const site=resolve(process.argv[2]);
const owner='ea436d1d-0123-4f25-8ae9-df61e8a85370',foreign='ea436d1d-0123-4f25-8ae9-df61e8a85371';
const A='a1436d1d-0123-4f25-8ae9-df61e8a85370',B='b1436d1d-0123-4f25-8ae9-df61e8a85370',C='c1436d1d-0123-4f25-8ae9-df61e8a85370';
const profiles=[{id:A,user_id:owner,display_name:'Сервер А',xp_total:115},{id:B,user_id:owner,display_name:'Сервер Б',xp_total:250},{id:C,user_id:foreign,display_name:'Чужой ученик',xp_total:999}];
const balance={[A]:41,[B]:82,[C]:999};
const mutations=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'};
const json=(res,status,data,headers={})=>res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers}).end(JSON.stringify(data));
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
  await p.locator('[data-mk95-progress]').click();await p.locator('#modal [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/g5:natural/);assert.doesNotMatch(await p.locator('#modal').innerText(),/g4:table/);
  await p.locator('#modal button.x').click();await p.locator('[data-mk95-journal]').click();await p.locator('#modal [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/Попытка Сервер Б/);assert.doesNotMatch(await p.locator('#modal').innerText(),/Попытка Сервер А/);
  await p.locator('#modal button.x').click();assert.deepEqual(await local(p),before);
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
  assert.deepEqual(errors,[]);console.log('PASS_BACKEND95_BROWSER',width);
 }finally{await ctx.close()}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{const url='http://127.0.0.1:'+server.address().port+'/';await run(browser,url,390);await run(browser,url,1280);assert(mutations.every(p=>['/auth/login','/auth/logout'].includes(p)));console.log('PASS_NO_GAMEPLAY_MUTATIONS',mutations)}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
