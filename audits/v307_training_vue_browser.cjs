'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const id=x=>x+'1436d1d-0123-4f25-8ae9-df61e8a85370',P=id('a'),STUDENT=id('b'),TUTOR=id('c'),A=id('d'),L=id('e'),H=id('f'),T='001436d1-0123-4f25-8ae9-df61e8a85370';
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],puts=[],receipts=new Map();let role='student',logged=false,lose=true,assigned='not_started',lesson=false;
  page.on('pageerror',e=>errors.push(String(e)));
  const pack=(id,topic='g4:table')=>({id,topic_id:topic,stage:0,full:true,expires_at:'2027-01-02T00:00:00Z',questions:Array.from({length:5},()=>({a:2,b:3}))});
  const payload={server_time:'2027-01-01T00:00:00Z',permits:[]};
  const user=()=>({id:role==='student'?STUDENT:TUTOR,role});
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data;
   if(path==='/auth/login'){logged=true;role=body.email?'tutor':'student';data={user:user(),csrf_token:'csrf'};}
   else if(path==='/auth/csrf'){if(!logged){code=401;data={error:{code:'UNAUTHORIZED'}}}else data={csrf_token:'csrf'}}
   else if(path==='/auth/me')data=user();
   else if(path==='/auth/logout'){logged=false;data={ok:true}}
   else if(path==='/student/profiles')data=[{id:P,display_name:'Пробный ученик'}];
   else if(path==='/profiles/'+P+'/subscription')data={profile_id:P,display_name:'Пробный ученик',full:true,sources:['tutor_paid'],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:0,can_request:false,pending:false};
   else if(path==='/student/profiles/'+P+'/homework')data={assignments:[{id:A,title:'Таблица умножения',topic_id:'g4:table',stage:0,status:assigned,late:false}],next_offset:null};
   else if(path==='/student/profiles/'+P+'/homework/'+A+'/prepare'&&m==='POST'){assert.equal(role,'student');assigned='prepared';data={...payload,assignment_id:A,pack:pack(H)}}
   else if(path==='/tutor/students')data={students:[{profile_id:P,display_name:'Пробный ученик'}]};
   else if(path==='/tutor/seats')data={allocated:1,limit:5,available:4,linked_student_ids:[P]};
   else if(path==='/tutor/students/'+P+'/lesson'&&m==='GET')data={allowed:true,lesson:lesson?{id:L}:null,profile:{id:P,display_name:'Пробный ученик'}};
   else if(path==='/tutor/students/'+P+'/lesson'&&m==='POST'){lesson=true;data={id:L};code=201;}
   else if(path==='/tutor/students/'+P+'/lesson/'+L+'/offline-school'&&m==='POST'){assert.equal(role,'tutor');data={...payload,topics:{'g4:table':{packs:[pack(T)]}}}}
   else if(m==='PUT'&&(path==='/student/profiles/'+P+'/offline-school/'+H||path==='/tutor/students/'+P+'/lesson/'+L+'/offline-school/'+T)){
    assert.equal(req.headers()['x-csrf-token'],'csrf');const pid=path.split('/').pop();assert.equal(role,pid===H?'student':'tutor');puts.push({path,body});
    if(receipts.has(pid))assert.deepEqual(receipts.get(pid).body,body);else receipts.set(pid,{body});
    if(pid===H)assigned='completed';data={id:pid,status:'finished',summary:{correct:5,corrected:0,skipped:0,passed:true,xp:20,coins:25}};
    if(pid===H&&lose){lose=false;await route.abort('failed');return;}
   }else {code=404;data={error:{code:'NOT_FOUND'}}}
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
  });
  const button=n=>page.getByRole('button',{name:n,exact:true});
  async function login(name){await page.getByLabel('Логин или электронная почта').fill(name);await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await button('Войти').click();}
  async function student(){await login('pupil307');await button('Выбрать').click();await button('Домашние задания').click();}
  async function answer(last=false){await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await button('Далее').click();if(!last)await page.waitForFunction(()=>{const e=document.getElementById('fin');return e&&!e.readOnly&&!e.disabled&&e.value===''});else await page.locator('.pilot-summary').waitFor();}
  await page.goto(origin+'/integrations/v307/account_review.html');await student();await button('Открыть тренажёр').click();await page.getByText('Домашнее задание',{exact:true}).waitFor();await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await button('Далее').waitFor();await page.getByText('Выполнено 1 / 5').waitFor();
  // F5 between check and advance: the solved answer is read-only, no duplicate check.
  await page.reload();await student();await button('Открыть тренажёр').click();await button('Далее').waitFor();assert.equal(await page.getByLabel('Ответ',{exact:true}).inputValue(),'6');assert.equal(await page.getByLabel('Ответ',{exact:true}).evaluate(e=>e.readOnly),true);
  await button('Далее').click();await page.waitForFunction(()=>{const e=document.getElementById('fin');return e&&!e.readOnly&&!e.disabled&&e.value===''});
  // F5 after committed advance: question two must be editable.
  await page.reload();await student();await button('Открыть тренажёр').click();await page.getByText('Выполнено 1 / 5').waitFor();assert.equal(await page.getByLabel('Ответ',{exact:true}).evaluate(e=>e.readOnly),false);
  // Offline edits use the same persistent draft; no request is sent until explicitly back online.
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});dispatchEvent(new Event('offline'));});
  for(let i=1;i<5;i++)await answer(i===4);await button('Повторить синхронизацию').waitFor();assert.equal(puts.length,0);
  // Cookie expires while the offline-completed block is pending. A Vue-internal
  // 401 must lock the full account, not leave the old training scope visible.
  logged=false;
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});dispatchEvent(new Event('online'));});
  await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
  assert.equal(await page.locator('.v307-training').count(),0);assert.equal(puts.length,0);
  await page.getByText('Войдите снова.',{exact:true}).waitFor();
  const failed=page.waitForEvent('requestfailed',{predicate:req=>req.method()==='PUT'&&req.url().includes('/offline-school/')});
  await student();await button('Открыть тренажёр').click();await failed;
  await button('Повторить синхронизацию').waitFor();
  await page.waitForFunction(()=>!document.querySelector('.v307-training button[disabled]'));
  // The automatic first PUT committed but response was lost. Retry exact body.
  await button('Повторить синхронизацию').click();await page.getByText(/Начислено 20 XP и 25 монет/).waitFor();
  assert.equal(puts.length,2);assert.deepEqual(puts[0],puts[1]);assert.equal(receipts.size,1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await button('К этапам').click();await button('Назад').click();await button('Выйти').click();await login('tutor@example.test');
  await button('Занятие').click();await button('Начать занятие').click();await button('Тренажёры занятия').click();await button('Открыть блок').click();await page.getByText('Занятие с преподавателем',{exact:true}).waitFor();
  for(let i=0;i<5;i++)await answer(i===4);await page.getByText(/Начислено 20 XP и 25 монет/).waitFor();
  assert.equal(puts.length,3);assert.equal(receipts.size,2);assert(puts[2].path.includes('/lesson/'+L+'/'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('PASS_V307_VUE_CONTEXT_TRAINING',width);await context.close();
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
