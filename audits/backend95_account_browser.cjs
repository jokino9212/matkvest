'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,extname,sep}=require('node:path');
const site=resolve(process.argv[2]);
const owner='ea436d1d-0123-4f25-8ae9-df61e8a85370',foreign='ea436d1d-0123-4f25-8ae9-df61e8a85371';
const A='a1436d1d-0123-4f25-8ae9-df61e8a85370',B='b1436d1d-0123-4f25-8ae9-df61e8a85370',C='c1436d1d-0123-4f25-8ae9-df61e8a85370';
const profiles=[{id:A,user_id:owner,display_name:'Сервер А',xp_total:115},{id:B,user_id:owner,display_name:'Сервер Б',xp_total:250},{id:C,user_id:foreign,display_name:'Чужой ученик',xp_total:999}];
const balance={[A]:41,[B]:82,[C]:999};
const mutations=[],apiTrace=[],receipts=new Map();let tablePuts=0,tableRewards=0,tablePackNo=0;
const questions=[{a:2,b:3},{a:3,b:4},{a:4,b:5},{a:5,b:6},{a:6,b:7}];
const counts=[5,7,10],pass=[4,5,8],issued=new Map(),spent=new Set();
let dropReceipt=false;
const topics=['g4:table','g4:moro_order_1000','g4:order','g4:equations','g4:moro_missing_sub','g4:moro_missing_add','g4:moro_missing_muldiv'];
// Fixed fixtures exported from the original Python expected_cells implementation.
const columnFixtures={
 'g4:column:add':{question:{a:587,b:246},keys:[{"final:0":"8","final:1":"3","final:2":"3"},{"addMark:0":"1","addMark:1":"1","addMark:2":""}]},
 'g4:column:sub':{question:{a:502,b:178},keys:[{"final:0":"3","final:1":"2","final:2":"4"},{"subMark:0":"","subMark:1":"1","subMark:2":"1","borrowDot:0":"•","borrowDot:1":"•","borrowDot:2":""}]},
 'g4:column:mul':{question:{a:243,b:32},keys:[{"mul1:2":"4","mul1:3":"8","mul1:4":"6","mul2:1":"7","mul2:2":"2","mul2:3":"9","final:1":"7","final:2":"7","final:3":"7","final:4":"6"},{"mulCarry1:2":"","mulCarry1:3":"","mulCarry2:1":"1","mulCarry2:2":"","mulFinalCarry:0":"","mulFinalCarry:1":"","mulFinalCarry:2":"1","mulFinalCarry:3":""}]},
 'g4:column:div':{question:{a:936,b:3},keys:[{"quot:0":"3","prod0:0":"9","next0:1":"3","quot:1":"1","prod1:1":"3","next1:2":"6","quot:2":"2","prod2:2":"6","rem2:2":"0"},{}]}
};
const columnTopics=Object.keys(columnFixtures),allTopics=[...topics,...columnTopics];
const used=id=>Array.from(receipts.values()).filter(x=>x.profile===id).length;
const best=(id,topic)=>counts.map((_,stage)=>Math.max(0,...Array.from(receipts.values()).filter(x=>x.profile===id&&x.topic===topic&&x.stage===stage).map(x=>x.receipt.summary.correct)));
function makeQuestions(topic,stage){
 if(columnFixtures[topic])return Array.from({length:counts[stage]},()=>columnFixtures[topic].question);
 if(topic==='g4:table')return Array.from({length:counts[stage]},(_,i)=>questions[i%questions.length]);
 return Array.from({length:counts[stage]},(_,i)=>{
 const a=i+2,b=3,answer=a+b,expression=topic.includes('order')?a+' + 3': 'x − 3 = '+a;
 const choices=topic==='g4:order'||topic==='g4:equations'?[answer-1,answer,answer+1,answer+2]:undefined;
 return {expression,answer,steps:['Ответ: '+answer],...(choices?{choices}:{})};
 });
}
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
    if(req.method==='POST'&&!packId){
     assert(allTopics.includes(body.topic));assert.equal(body.grade,4);assert(body.unavailable_permits.length<=10);
     const now=new Date().toISOString(),expires=new Date(Date.now()+86400000).toISOString();
     const permit='e1436d1d-0123-4f25-8ae9-'+String(++tablePackNo).padStart(12,'0');
     const packs=counts.map((_,stage)=>{
      const idPack='f1436d1d-0123-4f25-8ae9-'+String(++tablePackNo).padStart(12,'0');
      const pack={id:idPack,topic_id:body.topic,stage,questions:makeQuestions(body.topic,stage),full:false,expires_at:expires,...(columnFixtures[body.topic]?{column_keys:Array.from({length:counts[stage]},()=>columnFixtures[body.topic].keys)}:{})};
      issued.set(idPack,{id,permit,pack});return pack;
     });
     return json(res,200,{full:false,server_time:now,permits:used(id)>=10?[]:[{id:permit,expires_at:expires}],topics:{[body.topic]:{packs,best:best(id,body.topic)}}});
    }
    if(req.method==='PUT'&&packId){
     tablePuts++;
     const old=receipts.get(packId);if(old){assert.equal(old.profile,id);assert.deepEqual(body,old.body);return json(res,200,old.receipt);}
     const p=issued.get(packId);assert.equal(p.id,id);assert.equal(body.permit,p.permit);assert(!spent.has(p.permit));assert(used(id)<10);
     const {stage,topic_id:topic,questions:qs}=p.pack;
     if(stage&&best(id,topic)[stage-1]<pass[stage-1])return json(res,403,{error:{code:'EQUATION_STAGE_LOCKED'}});
     assert.equal(body.items.length,qs.length);
     let correct=0,corrected=0,skipped=0;
     for(let i=0;i<qs.length;i++){
      const x=body.items[i],q=qs[i],expected=topic==='g4:table'?q.a*q.b:q.answer;
      if(columnFixtures[topic]){
       const [required,optional]=columnFixtures[topic].keys,all={...required,...optional};
       for(let j=0;j<x.checks.length;j++){
        const cells=x.checks[j];
        assert(Object.keys(required).every(k=>cells[k]));
        assert(Object.entries(cells).every(([k,v])=>Object.hasOwn(all,k)&&/^[0-9•]$/.test(v)));
        const matches=Object.entries(cells).every(([k,v])=>all[k]===v);
        assert.equal(matches,!x.skipped&&j===x.checks.length-1);
       }
       if(x.skipped){skipped++;continue;}
       assert(x.checks.length);
      }else{
       if(x.skipped){skipped++;continue;}
       assert.equal(Number(x.checks.at(-1)['answer:0']),expected);
       assert(x.checks.slice(0,-1).every(c=>Number(c['answer:0'])!==expected));
      }
      if(x.checks.length===1)correct++;else corrected++;
     }
     const receipt={id:packId,status:'finished',summary:{correct,corrected,skipped,passed:correct>=pass[stage],xp:80,coins:25}};
     receipts.set(packId,{body,receipt,profile:id,topic,stage});spent.add(p.permit);balance[id]+=25;profiles.find(p=>p.id===id).xp_total+=80;tableRewards++;
     if(dropReceipt){dropReceipt=false;res.destroy();return;}
     return json(res,200,receipt);
    }
    return json(res,405,{});
   }
   const match=/^\/student(?:-profiles|\/profiles)\/([^/]+)\/(wallet|progress|history|entitlements)$/.exec(path);
   if(match){const [,id,kind]=match,p=profiles.find(p=>p.id===id&&p.user_id===uid);if(!p)return json(res,404,{error:{code:'PROFILE_NOT_FOUND'}});
    if(kind==='wallet')return json(res,200,{profile_id:id,balance:balance[id],revision:1});
    if(kind==='progress')return json(res,200,{course_progress:[...(id===A?[]:[{course_key:'g5:natural',stage_index:0,best_score:9}]),...allTopics.flatMap(topic=>best(id,topic).flatMap((score,stage)=>score?[{course_key:topic,stage_index:stage,best_score:score}]:[]))],topic_mastery:[]});
    if(kind==='history')return json(res,200,{attempts:[{id:'server.'+id,title:'Попытка '+p.display_name,source:'server',status:'finished',correct:id===A?5:9,total:10,date:'2026-11-20T12:00:00Z'},...Array.from(receipts.values()).filter(x=>x.profile===id).map(x=>({id:'server.'+x.receipt.id,title:x.topic,source:'server',status:'finished',correct:x.receipt.summary.correct,total:counts[x.stage],date:'2026-11-20T12:00:00Z'}))],next_offset:null});
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
  assert(await p.locator('[data-mk95-topic="g4:table"][data-mk95-stage="1"]').isDisabled());
  assert(await p.locator('[data-mk95-topic="g4:table"][data-mk95-stage="2"]').isDisabled());
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
  async function nextBlock(topic,stage,{mistake=false,offline=false,lost=false}={}){
   await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
   const selector='[data-mk95-topic="'+topic+'"][data-mk95-stage="'+stage+'"]';
   await p.locator(selector).click();await p.locator('#mk95-table-question').waitFor();
   const qs=makeQuestions(topic,stage),initial=tableRewards;
   if(offline){await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');await p.reload();await p.locator('#mk95-table-question').waitFor();}
   for(let i=0;i<qs.length;i++){
    const q=qs[i],expected=String(topic==='g4:table'?q.a*q.b:q.answer);
    const answer=async value=>{
     if(q.choices)await p.locator('#mk95-table-question .school-numeric-choices').getByRole('button',{name:String(value),exact:true}).click();
     else{await p.locator('#mk95-table-question #fin').fill(String(value));await p.locator('#mk95-table-question #tablePrimary').click();}
    };
    if(mistake&&i===0){await answer(Number(expected)-1);await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.wrong===true);}
    await answer(expected);await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.nextReady===true);
    if(lost&&i===qs.length-1)dropReceipt=true;
    await p.locator('#mk95-table-question #tablePrimary').click();
    if(i<qs.length-1)await p.waitForFunction(i=>window.MK95Account.read().table.index===i+1,i);
   }
   if(offline){await p.waitForFunction(()=>window.MK95Account.read().table.status==='pending');assert.equal(tableRewards,initial);await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.status==='pending');await ctx.setOffline(false);}
   await p.waitForFunction(()=>window.MK95Account.read().table.status==='confirmed',{},{timeout:30000});
   await p.waitForFunction(expected=>document.querySelector('[data-mk95-coins]')?.textContent===String(expected),41+(initial+1)*25);
   assert.equal(tableRewards,initial+1);assert.equal(balance[B],82);
   const last=Array.from(receipts.values()).at(-1);assert.equal(last.topic,topic);assert.equal(last.stage,stage);
   assert.equal(last.receipt.summary.correct,qs.length-(mistake?1:0));
  }
  await nextBlock('g4:table',1,{mistake:true,offline:true});
  await nextBlock('g4:table',2,{lost:true});
  for(const topic of topics.slice(1))await nextBlock(topic,0,{mistake:topic==='g4:order',offline:topic==='g4:equations'});
  await nextBlock('g4:table',0);
  assert.equal(tableRewards,10);assert.equal(spent.size,10);assert(tablePuts>=11);
  await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
  await p.locator('[data-mk95-topic="g4:table"][data-mk95-stage="0"]').click();
  await p.getByRole('alert').filter({hasText:'Нет доступных тренировок Free'}).waitFor();
  assert.equal(tableRewards,10);assert.equal(balance[B],82);
  assert.deepEqual(await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),before);
  assert.deepEqual(errors,[]);console.log('PASS_GRADE4_NUMERIC_CHOICE_UI all table stages, six expression topics, quota, lost response, offline F5, no local mutations');
 }finally{await ctx.close()}
}
async function runColumns(browser,url){
 const ctx=await browser.newContext({viewport:{width:390,height:850}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',dialog=>dialog.accept());
 try{
  await p.goto(url);await p.locator('#appHeader[data-v-app]').waitFor();await p.waitForFunction(()=>!!window.MK95Account);
  const before=await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0}));
  const aCoins=balance[A];
  await p.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click();
  const dialog=p.getByRole('dialog',{name:'Аккаунт МатКвест'});
  await dialog.getByLabel('Электронная почта').fill('student@example.test');await dialog.getByLabel('Пароль',{exact:true}).fill('test-password');await dialog.getByRole('button',{name:'Войти',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Серверный ученик'}).selectOption(B);
  await p.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,B);
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cell=key=>{const [r,c]=key.split(':');return p.locator('#mk95-table-question input[data-row="'+r+'"][data-col="'+c+'"]')};
  const primary=()=>p.locator('#mk95-table-question #columnPrimary');
  const revision=()=>p.evaluate(()=>window.MK95Account.read().table.revision);
  async function changed(old){await p.waitForFunction(n=>window.MK95Account.read().table.revision>n,old)}
  async function fill(key,value){
   const input=cell(key),old=await revision();
   if(value==='•')await input.click();else await input.fill(value);
   await changed(old);assert.equal(await input.inputValue(),value);
  }
  async function check(key){const old=await revision();if(key)await cell(key).press('Enter');else await primary().click();await changed(old)}
  for(const [topic,stage] of [...columnTopics.map(topic=>[topic,0]),['g4:column:add',1],['g4:column:add',2]]){
   if(used(B))await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
   const selector='[data-mk95-topic="'+topic+'"][data-mk95-stage="'+stage+'"]';
   await p.locator(selector).click();await primary().waitFor();
   const [required,optional]=columnFixtures[topic].keys,keys=Object.keys(required),initial=used(B);
   const actual=await p.locator('#mk95-table-question input[data-row][data-col]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.row+':'+n.dataset.col,n.dataset.exp])));
   assert.deepEqual(actual,{...required,...optional});
   const offline=topic==='g4:column:sub'||topic==='g4:column:div';
   if(offline){await fill(keys[0],required[keys[0]]);await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');await p.reload();await primary().waitFor();assert.equal(await cell(keys[0]).inputValue(),required[keys[0]]);}
   for(let i=0;i<counts[stage];i++){
    const exercise=await p.evaluate(()=>window.MK95Account.read().table.model.exercise);
    assert.equal(exercise.hideSkip,false);
    if(i===0){
     await check();await p.locator('#mk95-table-question #fb').getByText('Заполни обязательные клетки.').waitFor();
     const rowkeys=keys.filter(x=>x.split(':')[0]===keys[0].split(':')[0]).sort();
     if(rowkeys.length>1){await cell(rowkeys[0]).focus();await cell(rowkeys[0]).press('ArrowRight');assert(await cell(rowkeys[1]).evaluate(el=>el===document.activeElement));await cell(rowkeys[1]).press('ArrowLeft');assert(await cell(rowkeys[0]).evaluate(el=>el===document.activeElement));}
    }
    for(const [k,v] of Object.entries(required)){if(await cell(k).inputValue()!==v)await fill(k,v);}
    if(i===0){
     // A nonempty optional mark must be validated; missing optional marks are fine.
     const mark=Object.entries(optional).find(([k,v])=>v==='1');
     const wrongKey=mark?.[0]||keys[0],right=mark?.[1]||required[wrongKey];
     await fill(wrongKey,String((Number(right)+1)%10));await check(keys[0]);
     await p.locator('#mk95-table-question #fb').getByText('Исправь отмеченные клетки.').waitFor();
     assert(await cell(wrongKey).evaluate(el=>el.classList.contains('bad')));
     await fill(wrongKey,right);
     const dot=Object.entries(optional).find(([k,v])=>v==='•');if(dot)await fill(dot[0],dot[1]);
    }
    await check(keys[0]);await p.locator('#mk95-table-question #fb').getByText('Вся запись верна!').waitFor();
    if(i===counts[stage]-1&&topic==='g4:column:mul')dropReceipt=true;
    await primary().click();
    if(i<counts[stage]-1)await p.waitForFunction(i=>window.MK95Account.read().table.index===i+1,i);
   }
   if(offline){await p.waitForFunction(()=>window.MK95Account.read().table.status==='pending');assert.equal(used(B),initial);await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.status==='pending');await ctx.setOffline(false);}
   await p.waitForFunction(()=>window.MK95Account.read().table.status==='confirmed',null,{timeout:30000});
   await p.waitForFunction(expected=>document.querySelector('[data-mk95-coins]')?.textContent===String(expected),82+(initial+1)*25);
   assert.equal(used(B),initial+1);assert.equal(balance[A],aCoins);
   const last=Array.from(receipts.values()).at(-1);assert.equal(last.topic,topic);assert.equal(last.stage,stage);assert.equal(last.receipt.summary.correct,counts[stage]-1);assert.equal(last.receipt.summary.corrected,1);
   console.log('PASS_COLUMN_UI',topic,stage);
  }
  // 10 permits consumed on A by the numeric regression; columns share that same cap.
  await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
  await p.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Серверный ученик'}).selectOption(A);
  await p.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,A);
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await p.locator('[data-mk95-topic="g4:column:add"][data-mk95-stage="0"]').click();
  await p.getByRole('alert').filter({hasText:'Нет доступных тренировок Free'}).waitFor();
  assert.equal(used(A),10);assert.equal(used(B),6);assert.equal(balance[A],aCoins);
  assert.deepEqual(await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),before);
  assert.deepEqual(errors,[]);console.log('PASS_COLUMN_SHARED_QUOTA_OFFLINE_KEYBOARD_REPLAY');
 }catch(e){console.log('COLUMN_DIAGNOSTICS',JSON.stringify({errors,apiTrace:apiTrace.slice(-30),table:await p.evaluate(()=>window.MK95Account?.read().table).catch(()=>null)}));throw e}
 finally{await ctx.close()}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{const url='http://127.0.0.1:'+server.address().port+'/';await run(browser,url,390);await run(browser,url,1280);assert(mutations.every(p=>['/auth/login','/auth/logout'].includes(p)));console.log('PASS_NO_GAMEPLAY_MUTATIONS',mutations);await runTable(browser,url);await runColumns(browser,url)}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
