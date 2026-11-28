'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const journalAudit=require('./fixtures/v307_encrypted_journal_test.cjs');
const root=resolve(__dirname,journalAudit.enabled?'../dist-v307-encrypted-journals-audit':'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',U='b1436d1d-0123-4f25-8ae9-df61e8a85370',ERROR='c1436d1d-0123-4f25-8ae9-df61e8a85370',CONTROL='d1436d1d-0123-4f25-8ae9-df61e8a85370';
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(p))}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],writes=[],replay=new Map(),rows=new Map();let active=null,resolved=0,baseRewards=0,loseStart=true,loseCheck=true;
  const bank=require('../v307-learning-fixtures/v306-visual-question-bank.json').banks['g5:frac_shapes'].stages[0][0][0];
  const column={a:587,b:246,column_fields:['final:0','final:1','final:2','addMark:0','addMark:1','addMark:2']};
  function next(r){if(r.mode==='errors')return {topic_id:'g4:table',question:{a:2,b:3}};
   if(r.index===0)return {topic_id:'g4:column:add',question:column};
   if(r.index===1){const {answer,steps,solution,source_template,...q}=bank;return {topic_id:'g5:frac_shapes',question:q};}
   return {topic_id:'g4:table',question:{a:3,b:4}};
  }
  function publicState(r){return {...r,question:r.status==='active'?r.question:null};}
  page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
  const path0='/student/profiles/'+P+'/review';
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data;
   if(path==='/auth/login')data={user:{id:U,role:'student'},csrf_token:'csrf'};
   else if(path==='/auth/csrf')data={csrf_token:'csrf'};
   else if(path==='/auth/me')data={id:U,role:'student'};
   else if(path==='/student/profiles')data=[{id:P,display_name:'Пробный ученик'}];
   else if(path==='/profiles/'+P+'/subscription')data={profile_id:P,display_name:'Пробный ученик',full:true,sources:['tutor_paid'],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:0,can_request:false,pending:false};
   else if(path===path0&&m==='GET')data={test_only:true,full:true,active:active?publicState(rows.get(active)):null,groups:[{topic_id:'g4:table',active:2-resolved,resolved}],studied:[{topic:'g4:table',stage:0,status:'weak'},{topic:'g4:column:add',stage:0,status:'good'},{topic:'g5:frac_shapes',stage:0,status:'good'}]};
   else if(path.startsWith(path0+'/')&&m==='GET')data=publicState(rows.get(path.split('/').pop()));
   else if(path===path0&&m==='POST'||path.startsWith(path0+'/')&&m==='PUT'){
    const key=req.headers()['idempotency-key'];assert(key);assert.equal(req.headers()['x-csrf-token'],'csrf');writes.push({path,body,key});
    if(replay.has(key)){const old=replay.get(key);assert.deepEqual(old.body,body);assert.equal(old.path,path);data=old.data;code=old.code;}
    else if(m==='POST'){
     assert(!active);const mode=body.mode;assert.equal(body.count,mode==='errors'?5:10);const id=mode==='errors'?ERROR:CONTROL;const r={id,mode,status:'active',revision:0,index:0,total:mode==='errors'?2:10,stage:0,cells:{},feedback:null,outcome:'open',wrong_checks:0,reward:null,summary:null};Object.assign(r,next(r));rows.set(id,r);active=id;data=publicState(r);code=201;replay.set(key,{path,body,data:structuredClone(data),code});
     if(mode==='errors'&&loseStart){loseStart=false;await route.abort('failed');return;}
    }else{
     const id=path.split('/').pop(),r=rows.get(id);assert.equal(body.revision,r.revision);assert.equal(r.status,'active');
     if(body.action==='check'){
      assert.equal(r.outcome,'open');r.cells=body.cells;
      const correct=r.topic_id==='g4:column:add'?['8','3','3'].every((d,i)=>body.cells['final:'+i]===d):r.topic_id==='g5:frac_shapes'?body.cells['answer:0']===String(bank.answer):body.cells['answer:0']===String(r.question.a*r.question.b);
      r.feedback={missing:[],wrong:correct?[]:['answer:0']};
      if(correct){r.outcome='solved';r.reward={xp:r.mode==='control'||!r.wrong_checks?5:0,coins:r.mode==='control'||!r.wrong_checks?1:0,resolved:r.mode==='errors'&&!r.wrong_checks};if(r.reward.resolved)resolved++;baseRewards+=r.reward.coins;if(r.topic_id==='g5:frac_shapes')r.question={...r.question,solution_nodes:bank.solution,steps:bank.steps}}
      else r.wrong_checks++;
     }else if(body.action==='advance'||body.action==='skip'){
      if(body.action==='advance')assert.equal(r.outcome,'solved');else assert.equal(r.outcome,'open');
      if(r.index+1===r.total){r.status='finished';active=null;r.summary=r.mode==='errors'?{first_try:1,corrected:1,wrong:0,skipped:0,resolved:1,xp:5,coins:1,topics:[]}:{first_try:2,corrected:0,wrong:0,skipped:8,resolved:0,xp:10,coins:2,topics:[]};}
      else {r.index++;Object.assign(r,next(r),{cells:{},feedback:null,outcome:'open',wrong_checks:0,reward:null});}
     }else if(body.action==='save')r.cells=body.cells;
     else throw Error('Unexpected review action');
     r.revision++;data=publicState(r);replay.set(key,{path,body,data:structuredClone(data),code});
     if(body.action==='check'&&r.mode==='errors'&&r.outcome==='solved'&&loseCheck){loseCheck=false;await route.abort('failed');return;}
    }
   }else{code=404;data={error:{code:'NOT_FOUND'}}}
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
  });
  await journalAudit.prepare(context);
  const button=n=>page.getByRole('button',{name:n,exact:true});
  async function enter(){if(journalAudit.enabled)await journalAudit.ready(page);else{await page.getByLabel('Логин или электронная почта').fill('pupil307');await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await button('Войти').click();await button('Выбрать').click();await button('Работа над ошибками и контроль').click();}await page.getByText('Тестовый серверный режим. Требуется интернет.',{exact:true}).waitFor();}
  async function retry(){await button('Повторить запрос').waitFor();const before=await journalAudit.check(page,'review',true);await page.reload();await enter();const after=await journalAudit.check(page,'review',true);assert.deepEqual(before,after);await button('Повторить запрос').click();await button('Повторить запрос').waitFor({state:'detached'});await journalAudit.check(page,'review',false);}
  await page.goto(origin+journalAudit.path('review'));await enter();await journalAudit.check(page,'review',false);await button('Начать').click();await retry();
  await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await retry();await page.getByText('Ошибка отработана: +5 XP и 1 монета.',{exact:true}).waitFor();await button('Далее').click();
  await page.getByText(/Задание 2 из 2/).waitFor();await page.getByLabel('Ответ',{exact:true}).fill('7');await button('Проверить').click();await page.getByText('Проверь ответ.',{exact:true}).waitFor();await page.getByLabel('Ответ',{exact:true}).fill('6');await button('Проверить').click();await page.getByText('Верно. Старую ошибку нужно повторить.',{exact:true}).waitFor();await button('Далее').click();await page.getByRole('heading',{name:'Работа над ошибками завершена'}).waitFor();await page.getByText('Отработано ошибок: 1',{exact:true}).waitFor();
  await button('К списку').click();await button('Контрольное повторение').click();await button('Начать').click();
  for(const [key,value] of Object.entries({'final:0':'8','final:1':'3','final:2':'3'})){const [row,col]=key.split(':');await page.locator('input[data-row="'+row+'"][data-col="'+col+'"]').fill(value);}
  await button('Проверить всю запись').click();await button('Далее').click();
  await page.getByText(/Задание 2 из 10/).waitFor();assert.equal(await page.locator('.v307-visual-prompt svg').count()>0,true);await page.locator('.school-numeric-choices button').nth(bank.answer).click();await button('Далее').click();
  for(let i=3;i<=10;i++){await page.getByText(new RegExp('Задание '+i+' из 10')).waitFor();await button('⏭ Пропустить задание').click();}
  await page.getByRole('heading',{name:'Контрольное повторение завершено'}).waitFor();await page.getByText('Начислено 10 XP и 2 монет.',{exact:true}).waitFor();
  assert.equal(resolved,1);assert.equal(baseRewards,3);const duplicated=writes.filter((x,i)=>writes.findIndex(y=>y.key===x.key)!==i);assert.equal(duplicated.length,2);for(const x of duplicated)assert.deepEqual(x,writes.find(y=>y.key===x.key));assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await journalAudit.check(page,'review',false);await context.close();console.log(journalAudit.enabled?'ENCRYPTED':'STANDARD','PASS_V307_REVIEW_ERROR_CONTROL_REPLAY',width);
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
