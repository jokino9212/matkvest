'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');

function planFixture(){
 return {
  editor:true,done:false,progress:{done:0,total:2,pct:0},
  title:'🧩 План тренировки',backLabel:'← Ученик',status:'Редактирование',
  description:'Проверка действий редактора',empty:'Пусто',note:'',
  items:[{id:'v272-item-1',number:1,title:'Контрольный пункт',reason:'Проверка редактора',
   type:'Школьная тема',done:false,current:false,status:'',
   buttons:[
    {key:'earlier',label:'↑ Выше',className:'training-plan-mini',disabled:false},
    {key:'later',label:'↓ Ниже',className:'training-plan-mini',disabled:false},
    {key:'toggle',label:'Отметить выполненным',className:'training-plan-mini',disabled:false},
    {key:'remove',label:'Убрать',className:'training-plan-mini',disabled:false},
    {key:'launch',label:'Открыть снова',className:'training-plan-mini',disabled:false},
    {key:'complete',label:'Подтвердить блок',className:'training-plan-mini',disabled:false}
   ]}],
  buttons:[
   {key:'start',label:'Начать тренировку',className:'btn primary',disabled:false},
   {key:'rebuild',label:'Собрать заново',className:'btn soft',disabled:false},
   {key:'delete',label:'Удалить текущий план',className:'btn soft',disabled:false}
  ]
 };
}
async function waitForApp(page){
 await page.waitForFunction(()=>typeof renderTrainingPlanView==='function'&&typeof mk854Route==='function'&&mk854HistoryReady===true,
  null,{timeout:30000});
}
async function testPlan(browser,base,width,{missingModules=false}={}){
 const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:missingModules?'block':'allow'});
 if(missingModules){
  await context.route('**/assets/ui/legacy-vue-actions.js*',route=>route.abort());
  await context.route('**/assets/ui/knowledge-map.js*',route=>route.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await waitForApp(page);
  if(!missingModules){
   assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions?.trainingPlanActions),'function');
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});await waitForApp(page);
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   const info=await page.evaluate(async()=>{
    const cache=await caches.open('matkvest-iphone-v272');
    return {cache:(await caches.keys()).includes('matkvest-iphone-v272'),
      module:(await cache.keys()).some(k=>k.url.endsWith('/assets/ui/legacy-vue-actions.js'))};
   });
   assert(info.cache&&info.module,'Plan actions adapter must be in verified offline cache');
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});await waitForApp(page);
   assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions?.trainingPlanActions),'function');
  }else{
   assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  }
  await page.evaluate((fixture)=>{
   window.__v272Calls=[];
   const actions=Object.fromEntries(
    ['back','earlier','later','toggle','remove','launch','complete','start','rebuild','delete']
    .map(name=>[name,item=>window.__v272Calls.push([name,item])]));
   renderTrainingPlanView(fixture,actions);
  },planFixture());
  const host=page.locator('#trainingPlanVue');
  await host.waitFor();
  if(!missingModules)await page.locator('#trainingPlanVue[data-v-app]').waitFor();
  else assert.equal(await page.locator('#trainingPlanVue[data-v-app]').count(),0);
  const clicks=[
   ['↑ Выше','earlier'],['↓ Ниже','later'],
   ['Отметить выполненным','toggle'],['Убрать','remove'],
   ['Начать тренировку','start'],['Собрать заново','rebuild'],
   ['Удалить текущий план','delete'],['Открыть снова','launch'],
   ['Подтвердить блок','complete'],['← Ученик','back'],
  ];
  for(let i=0;i<clicks.length;i++){
   const [label,key]=clicks[i],button=host.getByRole('button',{name:label,exact:true});
   await button.waitFor();
   if(i===0)await button.press('Enter');
   else if(i===1)await button.press('Space');
   else await button.click();
   await page.waitForFunction(n=>window.__v272Calls.length===n,i+1);
   const latest=await page.evaluate(()=>window.__v272Calls.at(-1));
   assert.equal(latest[0],key);
   assert.equal(latest[1]??'',['earlier','later','toggle','remove','launch','complete'].includes(key)?'v272-item-1':'');
  }
  const before=await page.evaluate(()=>window.__v272Calls.length);
  await page.evaluate(()=>{
   const host=document.querySelector('#trainingPlanVue');
   window.__v272Detached=host.querySelector('button');
   renderHome();
   window.__v272Detached.click();
  });
  assert.equal(await page.evaluate(()=>window.__v272Calls.length),before,
   'Detached plan screen must not dispatch stale clicks');
  assert.deepEqual(errors,[],'No JavaScript exceptions allowed');
  console.log('PASS_V272_TRAINING_PLAN_BROWSER',JSON.stringify({width,offline:!missingModules,
    vue:!missingModules,fallback:missingModules,actions:before,staleGuard:!missingModules}));
 }finally{await context.close();}
}
withMatkvestBrowser(async(browser,base)=>{
 for(const width of [390,1280])await testPlan(browser,base,width);
 await testPlan(browser,base,390,{missingModules:true});
}).catch(error=>{console.error(error);process.exitCode=1;});
