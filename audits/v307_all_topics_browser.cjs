'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript'};
const P='a1436d1d-0123-4f25-8ae9-df61e8a85370',U='b1436d1d-0123-4f25-8ae9-df61e8a85370';
const columnFixtures={
 'g4:column:add':{question:{a:587,b:246},keys:[{"final:0":"8","final:1":"3","final:2":"3"},{"addMark:0":"1","addMark:1":"1","addMark:2":""}]},
 'g4:column:sub':{question:{a:502,b:178},keys:[{"final:0":"3","final:1":"2","final:2":"4"},{"subMark:0":"","subMark:1":"1","subMark:2":"1","borrowDot:0":"•","borrowDot:1":"•","borrowDot:2":""}]},
 'g4:column:mul':{question:{a:243,b:32},keys:[{"mul1:2":"4","mul1:3":"8","mul1:4":"6","mul2:1":"7","mul2:2":"2","mul2:3":"9","final:1":"7","final:2":"7","final:3":"7","final:4":"6"},{"mulCarry1:2":"","mulCarry1:3":"","mulCarry2:1":"1","mulCarry2:2":"","mulFinalCarry:0":"","mulFinalCarry:1":"","mulFinalCarry:2":"1","mulFinalCarry:3":""}]},
 'g4:column:div':{question:{a:936,b:3},keys:[{"quot:0":"3","prod0:0":"9","next0:1":"3","quot:1":"1","prod1:1":"3","next1:2":"6","quot:2":"2","prod2:2":"6","rem2:2":"0"},{}]}
};
const grade5Topics=['g5:natural_compare','g5:natural_add','g5:natural_subtract','g5:natural_multiply','g5:natural_divide','g5:frac_to_mixed','g5:mixed_to_frac'];
const columnTopics=Object.keys(columnFixtures);
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

const numeric=['g4:table','g4:moro_order_1000','g4:order','g4:equations','g4:moro_missing_sub','g4:moro_missing_add','g4:moro_missing_muldiv'];
const extended=require('../v307-learning-fixtures/v306-text-question-bank.json').banks;
assert.equal(Object.keys(extended).length,15);
const all=[...numeric,...columnTopics,...grade5Topics,...Object.keys(extended)];
function packFor(topic){
 const i=all.indexOf(topic)+1,id=String(i).padStart(8,'0')+'-1234-4f25-8ae9-df61e8a85370';
 const c=columnFixtures[topic];
 const q=c?c.question:extended[topic]?extended[topic].stages[0][0][0]:grade5Topics.includes(topic)?grade5Question(topic,0):topic==='g4:table'?{a:2,b:3}:{expression:'x + 2 = 8',answer:6,steps:['8 − 2 = 6']};
 return {id,topic_id:topic,stage:0,full:true,expires_at:'2027-01-02T00:00:00Z',questions:Array.from({length:5},()=>q),...(c?{column_keys:Array.from({length:5},()=>c.keys)}:{})};
}
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(p))}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[],submitted=new Set();let selected;
  page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
  await context.route('**/api/v1/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.slice(7),m=req.method(),body=req.postDataJSON();let code=200,data;
   if(path==='/auth/login')data={user:{id:U,role:'student'},csrf_token:'csrf'};
   else if(path==='/auth/csrf')data={csrf_token:'csrf'};
   else if(path==='/auth/me')data={id:U,role:'student'};
   else if(path==='/student/profiles')data=[{id:P,display_name:'Пробный ученик'}];
   else if(path==='/profiles/'+P+'/subscription')data={profile_id:P,display_name:'Пробный ученик',full:true,sources:['tutor_paid'],test_only:true,payment_enabled:false,free_blocks_limit:10,free_blocks_used:0,can_request:false,pending:false};
   else if(path==='/student/profiles/'+P+'/offline-school'&&m==='POST'){selected=packFor(body.topic);assert.equal(body.grade,Number(body.topic[1]));data={server_time:'2027-01-01T00:00:00Z',permits:[],topics:{[body.topic]:{packs:[selected]}}}}
   else if(path==='/student/profiles/'+P+'/offline-school/'+selected?.id&&m==='PUT'){
    const q=selected.questions[0],topic=selected.topic_id,expected=columnFixtures[topic]?.keys[0]??(q.form?fractionKeys(q):{'answer:0':String(q.answer??q.a*q.b)});
    assert.equal(body.items.length,5);assert.equal(body.items[0].skipped,false);assert.deepEqual(body.items[0].checks.at(-1),expected);assert(body.items.slice(1).every(x=>x.skipped===true));assert(!submitted.has(topic));submitted.add(topic);
    data={id:selected.id,status:'finished',summary:{correct:1,corrected:0,skipped:4,passed:false,xp:4,coins:5}};
   }else{code=404;data={error:{code:'NOT_FOUND'}}}
   await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)}).catch(()=>{});
  });
  const button=n=>page.getByRole('button',{name:n,exact:true});
  await page.goto(origin+'/integrations/v307/account_review.html');await page.getByLabel('Логин или электронная почта').fill('pupil307');await page.getByLabel('Пароль',{exact:true}).fill('synthetic-password');await button('Войти').click();await button('Выбрать').click();await button('Тренажёры').click();
  for(const topic of all){
   await page.getByLabel('Тема тренажёра').selectOption(topic);await button('Открыть блок').click();await page.getByText('Самостоятельная работа',{exact:true}).waitFor();const q=packFor(topic).questions[0];
   if(columnFixtures[topic]){
    const [required,optional]=columnFixtures[topic].keys;const actual=await page.locator('#mk95-table-question input[data-row][data-col]').evaluateAll(els=>Object.fromEntries(els.map(e=>[e.dataset.row+':'+e.dataset.col,e.dataset.exp])));assert.deepEqual(actual,{...required,...optional});
    await button('Проверить всю запись').or(button('Проверить все шаги')).click();await page.getByText('Заполни обязательные клетки.',{exact:true}).waitFor();
    for(const [key,value] of Object.entries(required)){const [row,col]=key.split(':');await page.locator('input[data-row="'+row+'"][data-col="'+col+'"]').fill(value);}
    await button('Проверить всю запись').or(button('Проверить все шаги')).click();
   }else if(q.form){for(const [key,value] of Object.entries(fractionKeys(q)))await page.locator('input[data-mk95-fraction="'+key+'"]').fill(value);await button('Проверить').click();}
   else if(q.choices){await page.locator('.school-numeric-choices button').nth(q.choices.indexOf(q.answer)).click();}
   else{await page.getByLabel('Ответ',{exact:true}).fill(String(q.answer??q.a*q.b));await button('Проверить').click();}
   await button('Далее').click();
   // A check/advance transaction must complete before the next question can be skipped.
   await page.waitForFunction(()=>{const b=document.querySelector('#tablePrimary,#columnPrimary');return b&&b.textContent.trim()!=='Далее'});
   for(let i=0;i<4;i++){await button('⏭ Пропустить задание').click();await page.getByText('Выполнено '+(i+2)+' / 5',{exact:true}).waitFor();}
   await page.getByText(/Начислено 4 XP и 5 монет/).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await button('К этапам').click();
  }
  assert.equal(submitted.size,33);assert.deepEqual(errors,[]);console.log('PASS_V307_ALL_33_VUE_TOPICS',width);await context.close();
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
