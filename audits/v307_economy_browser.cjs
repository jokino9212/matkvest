'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',U='b1436d1d-0123-4f25-8ae9-df61e8a85370';
(async()=>{
 const policy=JSON.parse(await readFile(resolve(__dirname,'../v307-public-fixtures/economy-v306.json'),'utf8'));policy.test_only=true;
 const by=new Map(policy.items.map(x=>[x.id,x])),item=policy.pools.rare[0],refund=Math.floor(by.get(item).price/2);
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],receipts=new Map(),posts=[];let balance=1000,xp=0,opened=0,owned=false,seen=false,lose=true,sales=[],history=[],king=false,mission=null,missionDone=false;
  page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data;
   if(path==='/auth/login')data={user:{id:U,role:'student'},csrf_token:'csrf'};
   else if(path==='/auth/csrf')data={csrf_token:'csrf'};
   else if(path==='/auth/me')data={id:U,role:'student'};
   else if(path==='/student/profiles')data=[{id:P,display_name:'Пробный ученик'}];
   else if(path==='/profiles/'+P+'/subscription')data={profile_id:P,display_name:'Пробный ученик',full:false,sources:[],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:0,can_request:false,pending:false};
   else if(path==='/student/profiles/'+P+'/economy-v307/catalog')data=policy;
   else if(path==='/student/profiles/'+P+'/economy-v307/state')data={profile_id:P,build:policy.build,test_only:true,balance,xp_total:xp,wallet_revision:opened+sales.length,inventory:[...(seen?[{item_id:item,category:by.get(item).category,active:owned,source:'chest',paid_price:0}]:[]),...(king?[{item_id:'avatar_clash_king',category:'avatars',active:true,source:'store',paid_price:480}]:[])],equipped:[],achievements:[],sales,sale_quotes:[...(owned?[{item_id:item,refund_now:refund,refund_mission:0,source:'chest'}]:[]),...(king?[{item_id:'avatar_clash_king',refund_now:192,refund_mission:384}]:[])],useful_topics:[{topic_id:'g4:table',title:'Таблица умножения'}],mission:mission?{...mission,progress:missionDone?10:0,completed:missionDone}:null,historical_economy:{source:'backup',available:true,review_required:true,stats:{totalOpened:2},chests:[],sales:[{item_id:item,refund:5}]},chest:{opened,miss_epic:opened,miss_legendary:opened,legacy_review_required:false,available:{rare:seen?0:1,epic:15,legendary:10},history}};
   else if(path==='/student/profiles/'+P+'/economy-v307/operations'&&m==='POST'){
    const key=req.headers()['idempotency-key'];assert(key);assert.equal(req.headers()['x-csrf-token'],'csrf');posts.push({key,body});
    if(receipts.has(key)){assert.deepEqual(receipts.get(key).body,body);data=receipts.get(key).receipt;}
    else{
     data={profile_id:P,operation_id:key,action:body.action};
     if(body.action==='chest'){assert.equal(body.expected_price,200);opened++;balance-=seen?100:200;const picked=seen?null:item;const bonus=seen?0:60;if(picked){owned=true;seen=true;xp+=bonus;}Object.assign(data,{rarity:'rare',item_id:picked,item_type:picked?by.get(picked).category:null,bonus_xp:bonus,xp_total:xp,compensation:picked?0:100});history.unshift({...data,date:'2026-11-27T00:00:00Z'});}
     else if(body.action==='mission_start'){assert(king);assert.equal(body.item_id,'avatar_clash_king');assert.equal(body.topic_id,'g4:table');mission={id:key,item_id:body.item_id,topic_id:body.topic_id,required:10,refund:384};data.mission=mission;}
     else if(body.action==='sell'&&body.mode==='mission'){assert(king&&missionDone);assert.equal(body.item_id,mission.item_id);assert.equal(body.mission_id,mission.id);assert.equal(body.expected_refund,384);king=false;mission=null;balance+=384;data.refund=384;sales.unshift({item_id:body.item_id,refund:384,source:'store'});}
     else if(body.action==='sell'){assert(owned);assert.equal(body.item_id,item);assert.equal(body.expected_refund,refund);owned=false;balance+=refund;data.refund=refund;sales.unshift({item_id:item,refund,source:'chest'});}
     else if(body.action==='buy'){assert.equal(body.item_id,'avatar_clash_king');assert.equal(body.expected_price,480);king=true;balance-=480;}
     else throw Error('Unexpected mutation');
     data.balance=balance;receipts.set(key,{body,receipt:structuredClone(data)});
     if(body.action==='chest'&&lose){lose=false;await route.abort('failed');return;}
    }
   }else{code=404;data={error:{code:'NOT_FOUND'}}}
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
  });
  const button=n=>page.getByRole('button',{name:n,exact:true});
  async function enter(){await page.getByLabel('Логин или электронная почта').fill('pupil307');await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await button('Войти').click();await button('Выбрать').click();await button('Магазин и сундуки').click();await page.getByRole('heading',{name:'Сундук удачи',exact:false}).waitFor();}
  await page.goto(origin+'/integrations/v307/account_review.html');await enter();await button('Открыть за 200 🪙').click();await button('Повторить запрос').waitFor();
  assert.equal(opened,1);assert.equal(balance,800);assert.equal(xp,60);assert.equal(await button('Открыть за 200 🪙').isDisabled(),true);
  await page.reload();await enter();await button('Повторить запрос').click();await page.locator('.v307-reward').getByText(/Тип: .*60 XP/).waitFor();
  assert.equal(posts.length,2);assert.deepEqual(posts[0],posts[1]);assert.equal(opened,1);assert.equal(balance,800);assert.equal(xp,60);
  await button('Продать за '+refund+' монет').click();await page.getByRole('heading',{name:'Монеты: '+(800+refund)+' · 60 XP'}).waitFor();assert(!owned);assert.equal(sales.length,1);
  await button('Открыть за 200 🪙').click();await page.locator('.v307-reward').getByRole('heading',{name:'Компенсация'}).waitFor();assert.equal(await page.locator('.v307-reward').getByText(/Тип:/).count(),0);assert.equal(await page.locator('.v307-reward').getByRole('button',{name:/Продать/}).count(),0);assert.equal(xp,60);
  await button('Готово').click();await button('История').click();await page.getByText(by.get(item).name+' · +'+refund+' монет',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'История из резервной копии'}).waitFor();await page.getByText('Исторические записи, не повторные награды. Требуется сверка.').waitFor();await button('Магазин').click();await page.getByLabel('Категория предметов').selectOption('avatars');await page.locator('[data-shop-item="avatar_clash_king"]').getByText('Король',{exact:true}).waitFor();
  const card=page.locator('[data-shop-item="avatar_clash_king"]');await card.getByRole('button',{name:'Купить',exact:true}).click();await card.getByRole('button',{name:/Продать/}).click();await button('Миссия: Таблица умножения').click();await page.getByRole('heading',{name:'Миссия продажи: Король'}).waitFor();assert.equal(await button('Завершить продажу за 384 монет').count(),0);missionDone=true;await button('Обновить').click();await button('Завершить продажу за 384 монет').click();await page.getByRole('heading',{name:'Монеты: '+balance+' · 60 XP'}).waitFor();assert.equal(king,false);assert.equal(mission,null);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(receipts.size,6);assert.deepEqual(errors,[]);await context.close();console.log('PASS_V307_ECONOMY_VUE_REPLAY',width);
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
