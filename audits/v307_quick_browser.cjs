'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',U='b1436d1d-0123-4f25-8ae9-df61e8a85370',START='c1436d1d-0123-4f25-8ae9-df61e8a85370',GOAL='d1436d1d-0123-4f25-8ae9-df61e8a85370';
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(p))}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280])for(const topic of ['quick:multiplication','quick:addition','quick:squares','quick:cubes']){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],writes=[],replay=new Map();let draft={revision:0,draft:null},goal=null,latest=null,starts=0,rewards=0,lose=new Set(['start','save','finish']);
  const mul=topic==='quick:multiplication',mode=mul?'all':topic==='quick:addition'?'to10':topic==='quick:squares'?'11-20':'6-10',count=mul?10:5;const example=topic==='quick:addition'?{text:'2 + 2 = ?',options:[2,4,3,5],answer:4}:topic==='quick:squares'?{text:'11² = ?',options:[111,121,131,141],answer:121}:{text:'6³ = ?',options:[206,216,226,236],answer:216};const questions=Array.from({length:count},(_,i)=>mul?{left:1,right:i+1}:i%2?{text:'Верно ли: '+example.text.replace('?',String(example.answer))+'?',options:['НЕТ','ДА']}:{text:example.text,options:example.options});const expected=questions.map((q,i)=>mul?q.left*q.right:i%2?'ДА':example.answer);
  page.on('pageerror',e=>errors.push(String(e)));
  const profile='/student/profiles/'+P;
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data,kind=null;
   const reply=()=>route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
   if(path==='/auth/login')data={user:{id:U,role:'student'},csrf_token:'csrf'};
   else if(path==='/auth/csrf')data={csrf_token:'csrf'};
   else if(path==='/auth/me')data={id:U,role:'student'};
   else if(path==='/student/profiles')data=[{id:P,display_name:'Пробный ученик'}];
   else if(path==='/profiles/'+P+'/subscription')data={profile_id:P,display_name:'Пробный ученик',full:true,sources:['tutor_paid'],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:0,can_request:false,pending:false};
   else if(path===profile+'/quick-access')data={test_only:true,topics:Object.fromEntries(['quick:multiplication','quick:addition','quick:squares','quick:cubes'].map(t=>[t,{allowed:true,full:true,free_topic:t==='quick:multiplication'}]))};
   else if(path===profile+'/draft'&&m==='GET')data=draft;
   else if(path===profile+'/verified-training/latest')data={training:latest};
   else if(path===profile+'/training-goals'&&m==='GET')data={active:goal?.status==='active'?goal:null,completed:goal?.status==='completed'?1:0,options:[{type:'correct',target:12,reward_xp:8,reward_coins:3},{type:'streak',target:6,reward_xp:8,reward_coins:3}]};
   else if(path===profile+'/training-goals'&&m==='POST'){assert.equal(body.type,'streak');assert.equal(body.topic_id,topic);goal={id:GOAL,topic_id:body.topic_id,type:'streak',target:6,progress:0,status:'active',reward_xp:8,reward_coins:3};code=201;data=goal;}
   else if(path===profile+'/training-starts/'+START+'/questions')data={training_start_id:START,topic_id:topic,status:latest?'finished':'active',questions,config:{count,mode,smart:'all'},summary:latest?.summary||null};
   else if(path===profile+'/training-starts'&&m==='POST')kind='start';
   else if(path===profile+'/draft'&&m==='PUT')kind='save';
   else if(path===profile+'/training-starts/'+START+'/result'&&m==='PUT')kind='finish';
   else {code=404;data={error:{code:'NOT_FOUND'}}}
   if(kind){
    assert.equal(req.headers()['x-csrf-token'],'csrf');const key=kind==='finish'?START:req.headers()['idempotency-key'];assert(key);writes.push({kind,key,body});
    if(replay.has(key)){const old=replay.get(key);assert.equal(old.kind,kind);assert.deepEqual(old.body,body);code=old.code;data=old.data}
    else{
     if(kind==='start'){assert.equal(body.question_count,count);assert.equal(body.topic_id,topic);assert.equal(body.mode,mode);assert.equal(body.smart,'all');assert(!draft.draft);starts++;draft={revision:1,draft:{training_start_id:START,question_index:0,answers:{}}};code=201;data={id:START}}
     if(kind==='save'){assert.equal(body.base_revision,draft.revision);assert.equal(body.draft.training_start_id,START);assert.equal(body.draft.question_index,draft.draft.question_index+1);draft={revision:draft.revision+1,draft:body.draft};data=draft}
     if(kind==='finish'){assert.deepEqual(body.answers,expected);assert.equal(body.draft_revision,draft.revision);assert.equal(draft.draft.question_index,count);rewards++;if(goal)goal={...goal,status:'completed',progress:6};draft={revision:draft.revision+1,draft:null};latest={training_start_id:START,topic_id:topic,questions,status:'finished',config:{count,mode,smart:'all'},summary:{correct:count,wrong:0,skipped:0,xp:3*count,coins:count,...(goal?{training_goal:{goal,reward_xp:8,reward_coins:3}}:{}),achievement_rewards:[]}};data=latest}
     replay.set(key,{kind,body:structuredClone(body),code,data:structuredClone(data)});
     if(lose.delete(kind)){await route.abort('failed');return}
    }
   }
   await reply();
  });
  const button=n=>page.getByRole('button',{name:n,exact:true});
  async function enter(){await page.getByLabel('Логин или электронная почта').fill('pupil307');await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await button('Войти').click();await button('Выбрать').click();await button('Быстрая тренировка и цели').click();await page.getByRole('heading',{name:/^Быстрая тренировка — /}).waitFor();}
  async function retry(){await button('Повторить запрос').waitFor();await page.reload();await enter();await button('Повторить запрос').click();await button('Повторить запрос').waitFor({state:'detached'});}
  await page.goto(origin+'/integrations/v307/account_review.html');await enter();if(mul){await button('Серия правильных ответов — 6').click();await page.getByText('Серия правильных ответов — 0 / 6',{exact:true}).waitFor();}else{await page.getByLabel('Тренажёр',{exact:true}).selectOption(topic);await page.getByLabel('Диапазон',{exact:true}).selectOption(mode);}await button(count+' заданий').click();await retry();
  for(let i=0;i<count;i++){await page.getByText('Задание '+(i+1)+' из '+count,{exact:true}).waitFor();if(mul){await page.getByLabel('Ответ',{exact:true}).fill(String(expected[i]));await button('Ответить').click();}else{await button(String(expected[i])).click();}if(i===(mul?0:1))await retry();}
  await button('Подтвердить результат').click();await retry();await page.getByText('Начислено '+3*count+' XP и '+count+' монет.',{exact:true}).waitFor();if(mul)await page.getByText('Цель выполнена: +8 XP и 3 монет.',{exact:true}).waitFor();assert.equal(starts,1);assert.equal(rewards,1);
  for(const kind of ['start','save','finish']){const first=writes.filter(x=>x.kind===kind).slice(0,2);assert.deepEqual(first[0],first[1]);}
  assert.equal(writes.filter(x=>x.kind==='save').length,count+1);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();console.log('PASS_V307_QUICK_GOALS_REPLAY',width,topic);
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
