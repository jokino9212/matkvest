'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,extname,sep}=require('node:path');
const site=resolve(process.argv[2]);
const {gunzipSync}=require('node:zlib'),{readFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const rawPolicy=gunzipSync(Buffer.from(readFileSync(resolve(__dirname,'../integrations/backend95-next/economy_v290.json.gz.b64'),'utf8').trim(),'base64'));
const policyHash=createHash('sha256').update(rawPolicy).digest('hex');
assert.equal(policyHash,'e12e0b972331ecf508f40a0e9a5b285d205807844222d2191260d91a88e54c43');
const policy={...JSON.parse(rawPolicy),policy_sha256:policyHash},defs=new Map(policy.items.map(i=>[i.id,i]));
const owner='ea436d1d-0123-4f25-8ae9-df61e8a85370',foreign='ea436d1d-0123-4f25-8ae9-df61e8a85371';
const A='a1436d1d-0123-4f25-8ae9-df61e8a85370',B='b1436d1d-0123-4f25-8ae9-df61e8a85370',C='c1436d1d-0123-4f25-8ae9-df61e8a85370';
const D='d1436d1d-0123-4f25-8ae9-df61e8a85370',E='ee436d1d-0123-4f25-8ae9-df61e8a85370';
const profiles=[{id:A,user_id:owner,display_name:'Сервер А',xp_total:115},{id:B,user_id:owner,display_name:'Сервер Б',xp_total:250},{id:C,user_id:foreign,display_name:'Чужой ученик',xp_total:999},{id:D,user_id:owner,display_name:'Сервер Д',xp_total:0},{id:E,user_id:owner,display_name:'Экономика',xp_total:10000}];
const balance={[A]:41,[B]:82,[C]:999,[D]:0,[E]:2000};
const collections={[A]:{items:[{id:'av_fox',category:'avatars',source:'migration',paid_price:120}],equipped:[{slot:'avatar',position:0,item_id:'av_fox'}],achievements:[{id:'solved10',source:'server',reward_recorded:true,unlocked_at:null}]},[B]:{items:[{id:'pet_cat',category:'pets',source:'migration',paid_price:null}],equipped:[],achievements:[]},[C]:{items:[{id:'av_dino',category:'avatars',source:'migration',paid_price:null}],equipped:[],achievements:[]},[D]:{items:[],equipped:[],achievements:[]},[E]:{items:[],equipped:[],achievements:[]}};
const econReceipts=new Map(),econHistory=[],everOwned=new Set();let econMission=null,econWrites=0,econCommits=0;
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
const grade5Topics=['g5:natural_compare','g5:natural_add','g5:natural_subtract','g5:natural_multiply','g5:natural_divide','g5:frac_to_mixed','g5:mixed_to_frac'];
const columnTopics=Object.keys(columnFixtures),allTopics=[...topics,...columnTopics,...grade5Topics];
const fractionKeys=q=>q.form.kind==='number'?{'answer:0':String(q.answer)}:q.form.kind==='mixed'?{'fraction:0':String(Math.floor(q.answer/q.form.denominator)),'fraction:1':String(q.answer%q.form.denominator)}:{'fraction:1':String(q.answer)};
function grade5Question(topic,i){
 if(topic==='g5:natural_compare'){
  if(i%2===0)return {expression:'Какой знак поставить между числами 1234 □ 1243?',answer:0,choices:[0,1,2],choice_labels:['<','=','>'],place_values:['1234','1243'],steps:['1234 < 1243.']};
  return {expression:'Какое число больше: 1234 или 1243?',answer:1243,choices:[1234,1243],steps:['1243 больше.']};
 }
 if(topic==='g5:frac_to_mixed'||topic==='g5:mixed_to_frac'){
  if(i%3===1)return {expression:'Раздели 11 на 3 с остатком. Каков остаток?',prompt_markup:'Раздели 11 на 3 с остатком. Каков остаток?',form:{kind:'number',denominator:null,label:'Остаток'},answer:2,steps:['11 = 3 · 3 + 2.']};
  if(topic==='g5:frac_to_mixed')return {expression:'Представь дробь 26/9 смешанным числом.',prompt_markup:'Представь дробь <span class="frac"><span class="num">26</span><span class="den">9</span></span> смешанным числом.',form:{kind:'mixed',denominator:9,label:''},answer:26,steps:['26 = 2 · 9 + 8.']};
  return {expression:'Запиши 3 8/10 неправильной дробью.',prompt_markup:'Запиши <span class="mixed"><span class="whole">3</span><span class="frac"><span class="num">8</span><span class="den">10</span></span></span> неправильной дробью.',form:{kind:'improper',denominator:10,label:''},answer:38,steps:['3 · 10 + 8 = 38.']};
 }
 const vals={'g5:natural_add':['278 + 321',599],'g5:natural_subtract':['1234 − 345',889],'g5:natural_multiply':['1234 · 123',151782],'g5:natural_divide':['987654 : 3',329218]};
 const [expression,answer]=vals[topic];
 return {expression,answer,steps:['Ответ: '+answer],...(['g5:natural_add','g5:natural_subtract'].includes(topic)?{choices:[answer-1,answer,answer+1]}:{})};
}
const used=id=>Array.from(receipts.values()).filter(x=>x.profile===id).length;
const best=(id,topic)=>counts.map((_,stage)=>Math.max(0,...Array.from(receipts.values()).filter(x=>x.profile===id&&x.topic===topic&&x.stage===stage).map(x=>x.receipt.summary.correct)));
function makeQuestions(topic,stage){
 if(grade5Topics.includes(topic))return Array.from({length:counts[stage]},(_,i)=>grade5Question(topic,i));
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
   const economy=/^\/student\/profiles\/([^/]+)\/economy\/(catalog|state|operations)$/.exec(path);
   if(economy){
    const [,id,kind]=economy;if(!profiles.some(p=>p.id===id&&p.user_id===uid)||id!==E)return json(res,404,{error:{code:'NOT_FOUND'}});
    const quotes=()=>collections[id].items.filter(i=>i.source==='store').map(i=>({item_id:i.id,refund_now:Math.floor(i.paid_price*.4),refund_mission:Math.floor(i.paid_price*.8)}));
    if(kind==='catalog')return json(res,200,policy);
    if(kind==='state')return json(res,200,{profile_id:id,build:policy.build,sale_quotes:quotes(),useful_topics:[{topic_id:'g4:table',title:'Таблица умножения',reason:'Нужно подтянуть'}],mission:econMission,chest:{opened:econHistory.length,miss_epic:econHistory.length,miss_legendary:econHistory.length,available:Object.fromEntries(Object.entries(policy.pools).map(([r,ids])=>[r,ids.filter(k=>!everOwned.has(k)).length])),legacy_review_required:false,history:econHistory}});
    assert.equal(req.method,'POST');assert.equal(req.headers['x-csrf-token'],'test-csrf');
    let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw),key=req.headers['idempotency-key'];
    assert(/^[0-9a-f-]{36}$/i.test(key));econWrites++;
    const previous=econReceipts.get(key);if(previous){assert.deepEqual(body,previous.body);return json(res,200,previous.receipt);}
    const item=defs.get(body.item_id),owned=collections[id].items.find(i=>i.id===body.item_id);
    const grant=(item,source,price)=>{assert(!collections[id].items.some(x=>x.id===item.id));collections[id].items.push({id:item.id,category:item.category,source,paid_price:price});everOwned.add(item.id)};
    const setEquip=(item,enabled=true)=>{const slot={avatars:'avatar',frames:'frame',pets:'pet',stickers:'sticker',badges:'badge'}[item.category];if(!['sticker','badge'].includes(slot))collections[id].equipped=collections[id].equipped.filter(x=>x.slot!==slot);else collections[id].equipped=collections[id].equipped.filter(x=>x.item_id!==item.id);if(enabled)collections[id].equipped.push({slot,item_id:item.id,position:0});};
    if(body.action==='buy'){assert(item.buyable&&!owned&&body.expected_price===item.price&&balance[id]>=item.price);balance[id]-=item.price;grant(item,'store',item.price);if(item.category!=='stickers')setEquip(item);}
    else if(body.action==='equip'){assert(item.selectable);if(!owned){assert.equal(item.id,'pet_none');grant(item,'default',0)}setEquip(item,body.enabled);}
    else if(body.action==='mission_start'){assert(!econMission&&owned?.source==='store'&&body.topic_id==='g4:table');econMission={id:key,item_id:item.id,topic_id:body.topic_id,progress:0,required:10,completed:false,refund:Math.floor(owned.paid_price*.8)};}
    else if(body.action==='mission_cancel'){assert(econMission?.id===body.mission_id&&!econMission.completed);econMission=null;}
    else if(body.action==='sell'){
     const q=quotes().find(x=>x.item_id===item.id);assert(q);if(body.mode==='mission'){assert(econMission?.id===body.mission_id&&econMission.completed&&econMission.item_id===item.id);assert.equal(body.expected_refund,q.refund_mission);}else assert.equal(body.expected_refund,q.refund_now);
     collections[id].items=collections[id].items.filter(x=>x.id!==item.id);collections[id].equipped=collections[id].equipped.filter(x=>x.item_id!==item.id);balance[id]+=body.expected_refund;if(econMission?.item_id===item.id)econMission=null;
    }else if(body.action==='chest'){assert.equal(body.expected_price,policy.chest_price);assert(balance[id]>=policy.chest_price);balance[id]-=policy.chest_price;const picked=defs.get(policy.pools.rare.find(k=>!everOwned.has(k)));grant(picked,'chest',0);econHistory.unshift({rarity:'rare',item_id:picked.id,compensation:0,date:new Date().toISOString()});}
    else throw Error('Unsupported operation');
    econCommits++;const receipt={profile_id:id,operation_id:key,action:body.action,balance:balance[id],wallet_revision:econCommits};econReceipts.set(key,{body,receipt});
    return json(res,200,receipt);
   }
   const training=/^\/student\/profiles\/([^/]+)\/offline-school(?:\/([^/]+))?$/.exec(path);
   if(training){
    const [,id,packId]=training;if(!profiles.some(p=>p.id===id&&p.user_id===uid))return json(res,404,{error:{code:'PROFILE_NOT_FOUND'}});
    let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
    assert.equal(req.headers['x-csrf-token'],'test-csrf');
    if(req.method==='POST'&&!packId){
     assert(allTopics.includes(body.topic));assert.equal(body.grade,Number(body.topic[1]));assert(body.unavailable_permits.length<=10);
     const now=new Date().toISOString(),expires=new Date(Date.now()+86400000).toISOString();
     const permit='e1436d1d-0123-4f25-8ae9-'+String(++tablePackNo).padStart(12,'0');
     const packs=counts.map((_,stage)=>{
      const idPack='f1436d1d-0123-4f25-8ae9-'+String(++tablePackNo).padStart(12,'0');
      const pack={id:idPack,topic_id:body.topic,stage,questions:makeQuestions(body.topic,stage),full:false,expires_at:expires,...(columnFixtures[body.topic]?{column_keys:Array.from({length:counts[stage]},()=>columnFixtures[body.topic].keys)}:{})};
      issued.set(idPack,{id,permit,pack,mission:id===E?econMission?.id:null});return pack;
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
      }else if(q.form){
       const required=fractionKeys(q),allowed=q.form.kind==='number'?['answer:0']:['fraction:0','fraction:1','fraction:2'];
       for(let j=0;j<x.checks.length;j++){
        const cells=x.checks[j];
        assert(Object.keys(required).every(k=>cells[k]));
        assert(Object.entries(cells).every(([k,v])=>allowed.includes(k)&&/^\d{1,6}$/.test(v)));
        let matches=Object.entries(required).every(([k,v])=>Number(cells[k])===Number(v));
        if(q.form.kind==='improper'&&cells['fraction:0'])matches=false;
        if(cells['fraction:2']&&Number(cells['fraction:2'])!==q.form.denominator)matches=false;
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
     if(id===E&&econMission?.id===p.mission&&econMission.topic_id===topic){econMission.progress=Math.min(10,econMission.progress+correct+corrected);econMission.completed=econMission.progress===10;}
     if(dropReceipt){dropReceipt=false;res.destroy();return;}
     return json(res,200,receipt);
    }
    return json(res,405,{});
   }
   const match=/^\/student(?:-profiles|\/profiles)\/([^/]+)\/(wallet|progress|history|entitlements|collection)$/.exec(path);
   if(match){const [,id,kind]=match,p=profiles.find(p=>p.id===id&&p.user_id===uid);if(!p)return json(res,404,{error:{code:'PROFILE_NOT_FOUND'}});
    if(kind==='collection')return json(res,200,collections[id]);
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
  await p.locator('#appHeader').getByRole('button',{name:'Серверные монеты'}).click();await p.locator('[data-economy-view="wallet"]').waitFor();assert.equal(await p.locator('[data-economy-view="wallet"] .mk19e-balance').innerText(),'82');
  await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();await p.locator('[data-economy-view="collection"]').waitFor();assert.equal(await p.locator('[data-economy-view="collection"] .mk872-col-card').count(),1);
  await p.locator('#appHeader').getByRole('button',{name:'Магазин',exact:true}).click();await p.locator('[data-economy-view="shop"]').waitFor();assert.equal(await p.locator('[data-economy-view="shop"] .shop-card button:not(:disabled)').count(),0);assert(await p.locator('[data-economy-view="shop"] .shop-card').count()>0);
  await p.locator('[data-economy-view="shop"]').getByRole('button',{name:'Назад к тренировкам'}).click();
  assert.equal(await p.evaluate(async id=>(await fetch('/api/v1/student/profiles/'+id+'/collection')).status,C),404);
  await p.locator('[data-mk95-progress]').click();await p.locator('#modal .vue-report[data-v-app] [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/g5:natural/);assert.doesNotMatch(await p.locator('#modal').innerText(),/g4:table/);
  await p.locator('#modal button.x').click();await p.locator('[data-mk95-journal]').click();await p.locator('#modal .vue-report[data-v-app] [data-mk95-server]').waitFor();assert.match(await p.locator('#modal').innerText(),/Попытка Сервер Б/);assert.doesNotMatch(await p.locator('#modal').innerText(),/Попытка Сервер А/);
  await p.locator('#modal button.x').click();await p.waitForFunction(()=>!document.getElementById('modal').textContent.includes('Попытка Сервер Б'));assert.deepEqual(await local(p),before);
  assert.equal(await p.evaluate(async id=>(await fetch('/api/v1/student/profiles/'+id+'/history')).status,C),404);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await p.reload();await expectText(p,'[data-mk95-name]','Сервер Б');assert.deepEqual(await local(p),before);
  await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();await p.locator('[data-economy-view="collection"]').waitFor();
  await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');await expectText(p,'[data-mk95-coins]','—');assert.equal(await p.locator('[data-mk95-economy]').count(),0);
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().status==='offline');await expectText(p,'[data-mk95-coins]','—');assert.equal(await p.locator('#mainView .grade-grid').count(),0);
  const apiKeys=await p.evaluate(async()=>{const result=[];for(const name of await caches.keys()){const c=await caches.open(name);for(const k of await c.keys())if(new URL(k.url).pathname.startsWith('/api/'))result.push(k.url)}return result});assert.deepEqual(apiKeys,[]);
  await ctx.setOffline(false);await expectText(p,'[data-mk95-name]','Сервер Б');
  const p2=await ctx.newPage();p2.on('pageerror',e=>errors.push(e.message));await ready(p2);await account(p2);await select(p2,A);await expectText(p2,'[data-mk95-coins]','41');await expectText(p,'[data-mk95-coins]','82');
  await p2.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();await p2.locator('[data-economy-view="collection"]').waitFor();assert.equal(await p2.locator('[data-economy-view="collection"] .mk872-col-card').count(),2);await p2.locator('[data-economy-view="collection"]').getByRole('button',{name:'Назад к тренировкам'}).click();
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
  await p.waitForFunction(()=>document.querySelector('[data-mk95-xp]')?.textContent==='195 XP');
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
async function runGrade5(browser,url){
 const ctx=await browser.newContext({viewport:{width:390,height:850}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',dialog=>dialog.accept());
 try{
  await p.goto(url);await p.locator('#appHeader[data-v-app]').waitFor();await p.waitForFunction(()=>!!window.MK95Account);
  const before=await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0}));
  const otherBalances=[balance[A],balance[B],balance[C]];
  await p.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click();
  const dialog=p.getByRole('dialog',{name:'Аккаунт МатКвест'});
  await dialog.getByLabel('Электронная почта').fill('student@example.test');await dialog.getByLabel('Пароль',{exact:true}).fill('test-password');await dialog.getByRole('button',{name:'Войти',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Серверный ученик'}).selectOption(D);
  await p.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,D);
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const root=p.locator('#mk95-table-question'),primary=()=>root.locator('#tablePrimary');
  const fracCell=key=>root.locator('input[data-mk95-fraction="'+key+'"]');
  const cases=[...grade5Topics.map(topic=>[topic,0]),['g5:frac_to_mixed',1],['g5:frac_to_mixed',2],['g4:table',0]];
  for(const [topic,stage] of cases){
   if(used(D))await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
   const selector='[data-mk95-topic="'+topic+'"][data-mk95-stage="'+stage+'"]';
   await p.locator(selector).click();await root.waitFor();
   const qs=makeQuestions(topic,stage),initial=used(D),putsBefore=tablePuts;
   const offline=topic==='g5:frac_to_mixed'&&stage===0||topic==='g5:natural_multiply';
   if(offline){
    if(qs[0].form)await fracCell('fraction:0').fill('2');else await root.locator('#fin').fill(String(qs[0].answer));
    await p.waitForFunction(f=>{const m=window.MK95Account.read().table.model?.exercise;return f?m?.fraction.whole.value==='2':m?.answer==='151782'},!!qs[0].form);
    await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');await p.reload();await root.waitFor();
    assert.equal(await (qs[0].form?fracCell('fraction:0'):root.locator('#fin')).inputValue(),qs[0].form?'2':'151782');
   }
   for(let i=0;i<qs.length;i++){
    const q=qs[i];
    if(q.form){
     const expected=fractionKeys(q);
     if(i===0&&q.form.kind==='mixed'){
      // A partial mixed number must not be a counted error.
      await fracCell('fraction:0').fill(expected['fraction:0']);await primary().click();
      await root.getByText('Заполни обязательные клетки.',{exact:true}).waitFor();
      await fracCell('fraction:1').fill('9');await primary().click();
      await root.getByText('Исправь отмеченные клетки.',{exact:true}).waitFor();
      assert(await fracCell('fraction:1').evaluate(el=>el.classList.contains('bad')));
     }
     if(q.form.kind!=='number'){
      assert.equal(await root.getByLabel('Заданный знаменатель').innerText(),String(q.form.denominator));
      assert.equal(await root.locator('input[data-mk95-fraction="fraction:2"]').count(),0);
      assert(await root.locator('.flash .frac .num').count()>0);
     }
     for(const [key,val] of Object.entries(expected))await fracCell(key).fill(val);
     await fracCell(Object.keys(expected).at(-1)).press('Enter');
    }else if(q.choices){
     if(q.choice_labels){assert(await root.getByRole('button',{name:'<',exact:true}).isVisible());assert(await root.locator('.mk-g5-comparison-table').isVisible());}
     await root.locator('.school-numeric-choices').getByRole('button',{name:String(q.choice_labels?.[q.answer]??q.answer),exact:true}).click();
    }else{
     const value=String(topic==='g4:table'?q.a*q.b:q.answer);
     await root.locator('#fin').fill(value);assert.equal(await root.locator('#fin').inputValue(),value);await primary().click();
    }
    await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.nextReady===true);
    if(topic==='g5:mixed_to_frac'&&i===qs.length-1)dropReceipt=true;
    await primary().click();
    if(i<qs.length-1)await p.waitForFunction(i=>window.MK95Account.read().table.index===i+1,i);
   }
   if(offline){await p.waitForFunction(()=>window.MK95Account.read().table.status==='pending');assert.equal(used(D),initial);assert.equal(tablePuts,putsBefore);await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().table.status==='pending');await ctx.setOffline(false);}
   await p.waitForFunction(()=>window.MK95Account.read().table.status==='confirmed',null,{timeout:30000});
   await p.waitForFunction(expected=>document.querySelector('[data-mk95-coins]')?.textContent===String(expected),(initial+1)*25);
   assert.equal(used(D),initial+1);assert.deepEqual([balance[A],balance[B],balance[C]],otherBalances);
   const last=Array.from(receipts.values()).at(-1);
   assert.equal(last.topic,topic);assert.equal(last.stage,stage);
   assert.equal(last.receipt.summary.correct,qs.length-(qs[0].form?.kind==='mixed'?1:0));
   console.log('PASS_GRADE5_UI',topic,stage);
  }
  assert.equal(used(D),10);
  await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
  await p.locator('[data-mk95-topic="g5:natural_compare"][data-mk95-stage="0"]').click();
  await p.getByRole('alert').filter({hasText:'Нет доступных тренировок Free'}).waitFor();
  assert.equal(used(D),10);assert.equal(balance[D],250);
  await p.reload();await p.waitForFunction(()=>window.MK95Account.read().snapshot?.wallet.balance===250);
  assert.equal(used(D),10);assert.deepEqual(await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),before);
  assert.deepEqual(errors,[]);console.log('PASS_GRADE5_SHARED_QUOTA_OFFLINE_REPLAY');
 }catch(e){console.log('GRADE5_DIAGNOSTICS',JSON.stringify({errors,apiTrace:apiTrace.slice(-30),table:await p.evaluate(()=>window.MK95Account?.read().table).catch(()=>null)}));throw e}
 finally{await ctx.close()}
}
async function runEconomy(browser,url){
 const ctx=await browser.newContext({viewport:{width:390,height:850}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 // Deliver the POST to the fixture, then reject its successful response at the
 // fetch boundary. A destroyed socket can be retried by browser networking;
 // this explicitly models a committed write whose receipt the client never sees.
 await p.addInitScript(()=>{
  const fetchOriginal=window.fetch.bind(window);
  window.__mk95DropBuyReceipt=false;
  window.__mk95DroppedBuyReceipt=null;
  window.fetch=async (input,init)=>{
   const url=typeof input==='string'?input:input.url;
   let body=null;try{body=JSON.parse(init?.body||'null')}catch{}
   const drop=window.__mk95DropBuyReceipt&&init?.method==='POST'&&url.endsWith('/economy/operations')&&body?.action==='buy'&&body?.item_id==='pet_bot';
   if(drop)window.__mk95DropBuyReceipt=false;
   const response=await fetchOriginal(input,init);
   if(drop&&response.ok){
    const receipt=await response.clone().json();
    window.__mk95DroppedBuyReceipt=receipt.operation_id;
    throw new TypeError('Injected loss of committed purchase receipt');
   }
   return response;
  };
 });
 try{
  await p.goto(url);await p.locator('#appHeader[data-v-app]').waitFor();await p.waitForFunction(()=>!!window.MK95Account);
  const before=await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),others=[balance[A],balance[B],balance[C],balance[D]];
  const account=()=>p.locator('#appHeader').getByRole('button',{name:'Аккаунт',exact:true}).click(),dialog=p.getByRole('dialog',{name:'Аккаунт МатКвест'});
  await account();await dialog.getByLabel('Электронная почта').fill('student@example.test');await dialog.getByLabel('Пароль',{exact:true}).fill('test-password');await dialog.getByRole('button',{name:'Войти',exact:true}).click();
  const choose=async id=>{await dialog.getByRole('combobox',{name:'Серверный ученик'}).selectOption(id);await p.waitForFunction(id=>window.MK95Account.read().snapshot?.profile.id===id,id);await dialog.getByRole('button',{name:'Закрыть',exact:true}).click()};
  await choose(E);await p.waitForFunction(()=>!!window.MK95Account.read().snapshot?.economy);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const openShop=async category=>{await p.locator('#appHeader').getByRole('button',{name:'Магазин',exact:true}).click();await p.locator('[data-economy-view="shop"]').waitFor();await p.getByLabel('Категория магазина').selectOption(category)};
  const card=id=>p.locator('[data-shop-item="'+id+'"]');
  const waitBalance=value=>p.waitForFunction(n=>document.querySelector('[data-mk95-coins]')?.textContent===String(n)&&!window.MK95Account.read().operation?.busy,value);
  await openShop('stickers');await card('st_pi').getByRole('button',{name:'Купить за 25 🪙'}).click();await waitBalance(1975);assert.equal(econCommits,1);
  await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();
  const pi=p.locator('[data-collection-item="st_pi"]');await pi.getByRole('button',{name:'Выбрать',exact:true}).click();await p.waitForFunction(()=>window.MK95Account.read().snapshot?.collection.equipped.some(i=>i.item_id==='st_pi')&&!window.MK95Account.read().operation.busy);
  await openShop('pets');await p.evaluate(()=>{window.__mk95DropBuyReceipt=true});
  await card('pet_bot').getByRole('button',{name:'Купить за 240 🪙'}).click();
  await p.waitForFunction(()=>window.MK95Account.read().operation?.pending&&!window.MK95Account.read().operation.busy);
  assert.equal(balance[E],1735);assert.equal(econCommits,3);assert.equal(econWrites,3);
  const lostKey=await p.evaluate(()=>window.__mk95DroppedBuyReceipt);assert(lostKey);assert.equal(econReceipts.get(lostKey)?.body.item_id,'pet_bot');
  console.log('PASS_ECONOMY_COMMITTED_RECEIPT_LOSS');
  await p.reload();await p.locator('[data-mk95-economy-retry]').waitFor();
  // Another profile must not see/retry the first profile's pending purchase.
  await account();await choose(B);assert.equal(await p.locator('[data-mk95-economy-retry]').count(),0);
  await account();await choose(E);await p.locator('[data-mk95-economy-retry]').click();await waitBalance(1735);
  await p.waitForFunction(()=>!window.MK95Account.read().operation.pending);assert.equal(econCommits,3);assert.equal(econWrites,4);assert.equal(econReceipts.size,3);assert(econReceipts.has(lostKey));console.log('PASS_ECONOMY_SAME_UUID_RETRY');
  await openShop('pets');await card('pet_none').getByRole('button',{name:'Выбрать',exact:true}).click();await p.waitForFunction(()=>window.MK95Account.read().snapshot?.collection.equipped.some(i=>i.item_id==='pet_none')&&!window.MK95Account.read().operation.busy);
  await card('pet_bot').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:'Продать сейчас',exact:true}).click();await waitBalance(1831);assert.equal(econCommits,5);
  await p.locator('[data-economy-view="shop"]').getByRole('button',{name:'Открыть за 200 🪙'}).click();await waitBalance(1631);assert.equal(econHistory.length,1);
  await openShop('stickers');await card('st_pi').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:/4 класс.*Таблица умножения/}).click();
  await p.waitForFunction(()=>window.MK95Account.read().mission?.progress===0&&!window.MK95Account.read().operation.busy);
  await p.locator('[data-economy-view="shop"]').getByRole('button',{name:'Назад к тренировкам'}).click();
  for(let block=0;block<2;block++){
   if(block)await p.locator('#mk95-table-practice').getByRole('button',{name:'К этапам'}).click();
   await p.locator('[data-mk95-table-open]').click();await p.locator('#mk95-table-question').waitFor();
   for(let i=0;i<questions.length;i++){
    await p.locator('#mk95-table-question #fin').fill(String(questions[i].a*questions[i].b));
    await p.locator('#mk95-table-question #tablePrimary').click();await p.waitForFunction(()=>window.MK95Account.read().table.model?.exercise.nextReady===true);
    await p.locator('#mk95-table-question #tablePrimary').click();
    if(i<4)await p.waitForFunction(i=>window.MK95Account.read().table.index===i+1,i);
   }
   await p.waitForFunction(expected=>window.MK95Account.read().mission?.progress===expected,5*(block+1));
  }
  await openShop('stickers');await card('st_pi').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:'Получить 80%',exact:true}).click();await waitBalance(1701);
  assert.equal(econMission,null);assert.equal(econCommits,8);
  await openShop('pets');await ctx.setOffline(true);await p.waitForFunction(()=>window.MK95Account.read().status==='offline');assert.equal(await p.locator('[data-mk95-economy]').count(),0);
  await p.reload();await p.waitForFunction(()=>window.MK95Account?.read().status==='offline');assert.equal(await p.locator('[data-mk95-economy]').count(),0);await ctx.setOffline(false);await waitBalance(1701);
  assert.deepEqual([balance[A],balance[B],balance[C],balance[D]],others);assert.deepEqual(await p.evaluate(()=>({xp:state.xp,coins:state.coins,history:state.attemptHistory?.length||0})),before);
  assert.deepEqual(errors,[]);console.log('PASS_ECONOMY_UI exact prices, lost response F5, scoped retry, pets, chest, mission 80%, offline isolation');
 }catch(e){console.log('ECONOMY_DIAGNOSTICS',JSON.stringify({errors,apiTrace:apiTrace.slice(-25),ui:await p.evaluate(()=>({status:window.MK95Account?.read().status,operation:window.MK95Account?.read().operation,view:window.MK95Account?.read().economy?.view,mission:window.MK95Account?.read().mission})).catch(()=>null)}));throw e}
 finally{await ctx.close()}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{const url='http://127.0.0.1:'+server.address().port+'/';await run(browser,url,390);await run(browser,url,1280);assert(mutations.every(p=>['/auth/login','/auth/logout'].includes(p)));console.log('PASS_NO_GAMEPLAY_MUTATIONS',mutations);await runTable(browser,url);await runColumns(browser,url);await runGrade5(browser,url);await runEconomy(browser,url)}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
