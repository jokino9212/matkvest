'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'..'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',Q='b1436d1d-0123-4f25-8ae9-df61e8a85370',R='c1436d1d-0123-4f25-8ae9-df61e8a85370';
(async()=>{
 const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!path.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());let pending=false,logoutFail=false,role='parent',authed=false,delay=false,lessonOpen=false,assigned=false,parentLinked=true,recoveryAllowed=true,tutorLinked=false,permission=false;const invite='a'.repeat(43),recovery='b'.repeat(43),future='2027-01-02T00:00:00Z';
  await page.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON?.();let code=200,data;
   if(m!=='GET')writes.push({path,body,headers:req.headers()});
   if(path==='/auth/login'){authed=true;role=body.email?.startsWith('tutor')?'tutor':body.email?'parent':'student';data={user:{id:R,role},csrf_token:'csrf'};}
   else if(path==='/auth/csrf'){if(!authed){code=401;data={error:{code:'UNAUTHORIZED'}}}else data={csrf_token:'csrf'}}
   else if(path==='/auth/me')data={id:R,role};
   else if(path==='/auth/logout'){if(logoutFail){await route.abort('failed');return}authed=false;data={ok:true}}
   else if(path==='/parent/children')data={links:parentLinked?[{id:R,recovery_allowed:recoveryAllowed,student_username:'pupil307',profiles:[{id:P,display_name:'Проба А'},{id:Q,display_name:'Проба Б'}]}]:[]};
   else if(path==='/parent/invitations'&&m==='POST'){assert.equal(role,'parent');assert.equal(body.current_password,'synthetic-password');code=201;data={code:invite,expires_at:future,scope:'all_profiles'};}
   else if(path==='/parent/children/'+R+'/recovery'&&m==='POST'){assert.equal(role,'parent');assert(parentLinked&&recoveryAllowed);code=201;data={username:'pupil307',code:recovery,expires_at:future,single_use:true};}
   else if(path==='/student/parent-links'&&m==='GET')data={links:parentLinked?[{id:R,parent_email:'parent@example.test',recovery_allowed:recoveryAllowed}]:[]};
   else if(path==='/student/parent-links/'+R&&m==='DELETE'){parentLinked=false;data={ok:true};}
   else if(path==='/student/parent-links/accept'&&m==='POST'){assert.equal(role,'student');assert.equal(body.code,invite);assert.equal(body.consent_all_profiles,true);assert.equal(body.allow_recovery,false);parentLinked=true;recoveryAllowed=false;code=201;data={id:R};}
   else if(path==='/student/profiles/'+Q+'/lesson-permission'&&m==='GET')data={linked:tutorLinked,allowed:permission};
   else if(path==='/student/profiles/'+Q+'/lesson-permission'&&m==='POST'){assert(tutorLinked);assert.equal(body.consent,true);assert.equal(body.current_password,'synthetic-password');permission=true;code=201;data={allowed:true};}
   else if(path==='/student/profiles/'+Q+'/lesson-permission'&&m==='DELETE'){permission=false;data={allowed:false};}
   else if(path==='/student/tutor-links/accept'&&m==='POST'){assert.equal(body.student_profile_id,Q);assert.equal(body.consent,true);tutorLinked=true;code=201;data={id:R};}
   else if(path==='/student/profiles/'+Q+'/tutor-link'&&m==='DELETE'){tutorLinked=false;permission=false;data={ok:true};}
   else if(path==='/auth/student-recovery/issue'&&m==='POST'){assert.equal(role,'student');code=201;data={code:recovery,expires_at:future,single_use:true};}

   else if(path==='/student/profiles')data=[{id:Q,display_name:'Проба Б'}];
   else if(path==='/tutor/students')data={students:[{profile_id:Q,display_name:'Проба Б'}]};
   else if(path==='/tutor/seats')data={allocated:1,limit:5,available:4,linked_student_ids:[Q]};
   else if(path==='/tutor/students/'+Q+'/homework'&&m==='GET')data={assignments:assigned?[{id:R,title:'Таблица умножения',status:'not_started',late:false}]:[],next_offset:null};
   else if(path==='/tutor/students/'+Q+'/homework'&&m==='POST'){assert.equal(body.topic_id,'g4:table');assert.equal(body.stage,0);assert(req.headers()['idempotency-key']);assigned=true;code=201;data={id:R};}
   else if(path==='/tutor/students/'+Q+'/lesson'&&m==='GET')data={lesson:lessonOpen?{id:R}:null,profile:{id:Q,display_name:'Проба Б'}};
   else if(path==='/tutor/students/'+Q+'/lesson'&&m==='POST'){assert(req.headers()['idempotency-key']);lessonOpen=true;code=201;data={id:R}}
   else if(path==='/tutor/students/'+Q+'/lesson/'+R&&m==='DELETE'){lessonOpen=false;data={status:'ended'}}

   else if(path==='/profiles/'+P+'/subscription'||path==='/profiles/'+Q+'/subscription'){
    const a=path.includes(P);data={profile_id:a?P:Q,display_name:a?'Проба А':'Проба Б',full:a,sources:a?['tutor_paid']:[],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:2,can_request:!a&&!pending,pending:!a&&pending,own_pending_id:!a&&pending?R:null,personal_ends_at:null};
    if(delay){await new Promise(r=>setTimeout(r,500));}
   }else if(path==='/profiles/'+Q+'/subscription/requests'&&m==='POST'){assert(req.headers()['idempotency-key']);assert.equal(req.headers()['x-csrf-token'],'csrf');pending=true;code=201;data={id:R,profile_id:Q,status:'pending',test_only:true,payment_enabled:false}}
   else if(path==='/profiles/'+Q+'/subscription/requests/'+R&&m==='DELETE'){pending=false;data={id:R,status:'cancelled'}}
   else if(path==='/student/profiles/'+Q+'/homework')data={assignments:[{id:R,title:'Таблица умножения',status:'not_started',late:false}],next_offset:null};
   else {code=404;data={error:{code:'NOT_FOUND'}}}
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
  });
  const start=()=>page.goto(origin+'/integrations/v307/account_review.html');
  const login=async name=>{await page.getByLabel('Логин или электронная почта').fill(name);await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await page.getByRole('button',{name:'Войти',exact:true}).click()};
  await start();await login('parent@example.test');await page.getByRole('heading',{name:'Кабинет родителя'}).waitFor();
  const button=n=>page.getByRole('button',{name:n,exact:true});
  await button('Подключить ребёнка').click();await page.getByLabel('Пароль родителя').fill('synthetic-password');await button('Получить приглашение').click();await page.getByLabel('Одноразовый код').waitFor();assert.equal(await page.getByLabel('Одноразовый код').inputValue(),invite);await button('Закрыть').click();
  await button('Код восстановления ребёнка').click();await page.getByLabel('Пароль родителя').fill('synthetic-password');await button('Получить код').click();await page.getByLabel('Одноразовый код').waitFor();assert.equal(await page.getByLabel('Одноразовый код').inputValue(),recovery);await button('Закрыть').click();
  await page.locator('.row').filter({hasText:'Проба А'}).getByRole('button',{name:'Управлять доступом'}).click();await page.getByText('Оплачено преподавателем',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Создать тестовую заявку Premium'}).count(),0);
  await page.getByRole('button',{name:'Все профили'}).click();await page.locator('.row').filter({hasText:'Проба Б'}).getByRole('button',{name:'Управлять доступом'}).click();
  await page.getByRole('button',{name:'Создать тестовую заявку Premium'}).click();await page.getByText('Ожидает подтверждения тестовым администратором.').waitFor();
  assert.equal(await page.getByRole('button',{name:'Создать тестовую заявку Premium'}).count(),0);assert.equal(await page.locator('.price').innerText(),'Free');
  await page.getByRole('button',{name:'Отменить тестовую заявку'}).click();await page.getByRole('button',{name:'Создать тестовую заявку Premium'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  logoutFail=true;await page.getByRole('button',{name:'Выйти'}).click();await page.getByRole('heading',{name:'Завершить выход'}).waitFor();await page.getByText('Выход не подтверждён сервером.').waitFor();
  await page.reload();await page.getByRole('heading',{name:'Завершить выход'}).waitFor();logoutFail=false;await page.getByRole('button',{name:'Повторить выход'}).click();await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
  await login('pupil307');await page.getByRole('heading',{name:'Мои профили'}).waitFor();
  await button('Код восстановления').click();await page.getByLabel('Текущий пароль').fill('synthetic-password');await button('Получить код').click();await page.getByLabel('Одноразовый код').waitFor();assert.equal(await page.getByLabel('Одноразовый код').inputValue(),recovery);await button('Закрыть').click();
  await button('Выбрать').click();await page.locator('.price').waitFor();await button('Связи и разрешения').click();await button('Отвязать родителя').click();await button('Подключить родителя').click();
  await page.getByLabel('Код приглашения').fill(invite);await page.getByLabel('Почта родителя').fill('parent@example.test');await page.getByLabel('Текущий пароль').fill('synthetic-password');
  let count=writes.filter(w=>w.path==='/student/parent-links/accept').length;await button('Подтвердить связь').click();await page.getByText('Нужно явно подтвердить доступ.',{exact:true}).waitFor();assert.equal(writes.filter(w=>w.path==='/student/parent-links/accept').length,count);
  // Password was deliberately cleared after submit; enter again with explicit consent.
  await page.getByLabel('Текущий пароль').fill('synthetic-password');await page.getByRole('checkbox',{name:'Разрешаю доступ ко всем моим профилям'}).check();await button('Подтвердить связь').click();await page.getByText('Без права восстановления',{exact:true}).waitFor();
  await page.getByLabel('Код преподавателя').fill(invite);await page.getByRole('checkbox',{name:'Разрешаю преподавателю видеть учебные результаты этого профиля'}).check();await button('Подключить преподавателя').click();
  await page.getByLabel('Текущий пароль').fill('synthetic-password');await page.getByRole('checkbox',{name:'Разрешаю преподавателю проводить занятия с этим профилем'}).check();await button('Разрешить занятия').click();await page.getByText('Проведение занятий разрешено',{exact:true}).waitFor();
  await button('Отозвать разрешение на занятия').click();await button('Разрешить занятия').waitFor();assert.equal(permission,false);await button('Отключить преподавателя').click();await button('Подключить преподавателя').waitFor();assert.equal(tutorLinked,false);
  await button('Назад').click();await button('Домашние задания').click();await page.getByRole('heading',{name:'Таблица умножения'}).waitFor();
  await page.getByRole('button',{name:'Назад'}).click();await page.locator('.price').waitFor();delay=true;await page.getByRole('button',{name:'Обновить'}).click();await page.evaluate(()=>dispatchEvent(new Event('offline')));await page.waitForTimeout(700);assert.equal(await page.getByRole('heading',{name:'Вход в МатКвест'}).count(),1);assert.equal(await page.locator('.price').count(),0);
  delay=false;await login('tutor@example.com');await page.getByRole('heading',{name:'Кабинет преподавателя'}).waitFor();await page.getByRole('button',{name:'Домашние задания'}).click();await page.getByRole('button',{name:'Выдать домашнее задание'}).waitFor();const topics=page.getByRole('combobox',{name:'Тема',exact:true});await topics.waitFor();assert.equal(await topics.locator('option').count(),147);assert.equal(await topics.inputValue(),'g4:table');await page.getByRole('button',{name:'Выдать домашнее задание'}).click();await page.getByRole('heading',{name:'Таблица умножения'}).waitFor();await page.getByRole('button',{name:'Назад'}).click();await page.getByRole('button',{name:'Занятие',exact:true}).click();await page.getByRole('button',{name:'Начать занятие'}).click();await page.getByRole('button',{name:'Завершить занятие'}).click();await page.getByRole('button',{name:'Начать занятие'}).waitFor();assert.equal(lessonOpen,false);
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(([a,b])=>[localStorage,sessionStorage].some(s=>JSON.stringify(s).includes(a)||JSON.stringify(s).includes(b)||JSON.stringify(s).includes('synthetic-password')),[invite,recovery]),false);assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),['mk307-auth-event']);assert.match(await page.evaluate(()=>localStorage.getItem('mk307-auth-event')),/^[a-f0-9-]{36}$/);assert(writes.filter(w=>w.path.includes('/subscription/requests')&&w.path.endsWith('/requests')).length===1);console.log('PASS_V307_ACCOUNT_REVIEW_SYNTHETIC',width);await context.close();
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
