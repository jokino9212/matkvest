'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require('playwright');

const root='#mk-g6-textbook-nav';
const search='#mk19c4-topic-tools input';
const rows=paragraph=>root+' [data-paragraph="'+paragraph+'"]';

async function checkGrade(browser,width){
 const context=await browser.newContext({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.evaluate(()=>openGrade(6));
  const toc=page.locator(root);
  const input=page.locator(search);
  await toc.waitFor();
  assert.equal(await page.locator('#mainView input[type=search]:visible').count(),1);
  assert.equal(await toc.locator('.mk-g5-toc-part').count(),2);
  assert.equal(await toc.locator('.mk-g5-toc-chapter').count(),8);
  const paragraphs=await toc.locator('[data-paragraph]').evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.paragraph)));
  assert.deepEqual(paragraphs,Array.from({length:44},(_,i)=>i+1));
  const data=await page.evaluate(selector=>{
   const catalog=g6AllTopics().map(topic=>topic.id).sort();
   const linked=[...new Set([...document.querySelectorAll(selector+' [data-topic-id]')].map(el=>el.dataset.topicId))].sort();
   return {catalog,linked};
  },root);
  assert.equal(data.catalog.length,75);
  assert.deepEqual(data.linked,data.catalog);
  assert.equal(await page.locator(root+' [data-paragraph] .mk-g6-toc-unavailable').count(),0);

  const firstSection=page.locator(root+' details').filter({hasText:'Координаты на плоскости'});
  await firstSection.locator('summary').click();
  assert.match(await page.locator(rows(44)).innerText(),/графиках/);
  assert.equal(await page.locator(rows(44)+' button').count(),1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');

  for(const term of ['раскрыть скобки','нод','§ 43','виды треугольников','круговых диаграммах']){
   await input.fill(term);
   assert.equal(await toc.locator('[data-paragraph]:visible').count(),1,term);
   assert.equal(await page.locator('#mk19c4-topic-tools .mk19c4-empty').getAttribute('data-visible'),'false',term);
   await page.getByRole('button',{name:'Очистить',exact:true}).click();
   assert.equal(await toc.locator('[data-paragraph][hidden]').count(),0);
  }
  await input.fill('нет такой темы');
  assert.equal(await toc.locator('[data-paragraph]:visible').count(),0);
  assert.equal(await page.locator('#mk19c4-topic-tools .mk19c4-empty').getAttribute('data-visible'),'true');
  await page.getByRole('button',{name:'Очистить',exact:true}).click();

  const toggle=toc.locator('.mk-g5-toc-toggle');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await input.fill('делители и кратные');
  const repeatLink=toc.locator('[data-topic-id="g6:divisors_multiples"]');
  await repeatLink.click();
  assert.match(await page.locator('#modal').innerText(),/Делители и кратные/);
  assert.equal(await page.locator('#modal .stage-card').count(),3);
  await page.reload();
  assert.equal(await toc.locator('[data-paragraph]').count(),44);
  assert.equal(await page.locator('#modal .stage-card').count(),3);
  assert.equal(await page.locator('#mainView input[type=search]:visible').count(),1);
  await page.evaluate(()=>closeModal());
  await page.locator('#modal').waitFor({state:'hidden'});
  await page.evaluate(()=>openGrade(5));
  assert.equal(await page.locator('#mk-g5-textbook-nav [data-paragraph]').count(),51);
  assert.equal(await page.locator('#mainView .g5-card').count(),74);
  const grade5Topic=page.locator('#mk-g5-textbook-nav [data-topic-id="area_units_g5"]');
  await grade5Topic.locator('xpath=ancestor::details').locator('summary').click();
  await grade5Topic.click();
  assert.equal(await page.locator('#modal .stage-card').count(),3);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}

(async()=>{
 const widths=[320,390,1280];
 for(const width of widths){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{await checkGrade(browser,width)}finally{await browser.close()}
 }
 console.log('G6_TEXTBOOK_NAVIGATION_PASS',JSON.stringify({parts:2,sections:6,paragraphs:44,linkedTopics:75,widths}));
})().catch(error=>{console.error(error);process.exitCode=1});
