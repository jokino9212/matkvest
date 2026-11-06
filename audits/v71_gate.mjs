import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const sha=createHash('sha256').update(html).digest('hex');
if(!sw.includes('matkvest-iphone-v71')||!sw.includes(sha))throw Error('v71 SW and HTML hash mismatch');
if(!html.includes('id="mk-v71-ui-fixes"')||html.includes('placeholder="числ."')||html.includes('placeholder="знам."')||html.includes('placeholder="—"'))throw Error('Fraction layout patch missing');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!exe)throw Error('No Chromium executable');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const errors=[],results=[];
const page=await browser.newPage();
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const functional=await page.evaluate(()=>{
  const checks=[],fail=[];
  const check=(name,ok,details)=>{checks.push({name,ok,details});if(!ok)fail.push(name)};
  check('v71 APIs',typeof mkV71SectionCounts==='function'&&typeof mkV71SortItems==='function');
  const gs=G6_GROUPS,focus=gs.find(x=>x.id==='fractions'||x.title==='Обыкновенные дроби');
  check('real G6 fraction catalog',!!focus&&focus.topics.length>0,focus&&focus.topics.length);
  const first=gs[0].topics[0],row=progressFor(first.id),old=Array.isArray(row.best)?row.best.slice():[0,0,0];
  try{
    row.best=[0,0,0];
    check('zero completed section',mkV71SectionCounts(6,[first]).done===0);
    row.best=[STAGES[0].need,STAGES[1].need,0];
    check('partial topic not completed',mkV71SectionCounts(6,[first]).done===0);
    row.best=STAGES.map(s=>s.need);
    check('all three stages count exactly once',mkV71SectionCounts(6,[first]).done===1);
  }finally{row.best=old}
  const rank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
  for(const type of ['avatars','frames','pets','stickers','titles','backgrounds','badges','effects','nicknameStyles']){
   const catalog=type==='avatars'?mk872ModernCatalog():(SHOP_CATALOG[type]||[]);
   const a=mkV71SortItems(type,catalog);
   const sorted=a.every((item,i)=>i===0||rank[a[i-1].rarity]<=rank[item.rarity]&&(
      rank[a[i-1].rarity]<rank[item.rarity]||Number(a[i-1].price||0)<=Number(item.price||0)));
   check('rarity and price stable '+type,sorted,{items:a.length});
   check('stable tie order '+type,JSON.stringify(mkV71SortItems(type,catalog).map(x=>x.id))===JSON.stringify(a.map(x=>x.id)));
  }
  openShop('pets','all');
  check('store sort control present',!!document.querySelector('#modal .v71-sort-control select'));
  const storeNames=()=>[...document.querySelectorAll('#modal .shop-grid .shop-card strong')].map(x=>x.textContent.trim());
  const sortedPets=filteredShopItems('pets').map(x=>x.name);
  check('rendered store follows sorted data',JSON.stringify(storeNames())===JSON.stringify(sortedPets));
  let sel=document.querySelector('#modal .v71-sort-control select');
  sel.value='priceAsc';sel.dispatchEvent(new Event('change',{bubbles:true}));
  const prices=filteredShopItems('pets').map(x=>Number(x.price||0));
  check('price ascending',prices.every((p,i)=>i===0||p>=prices[i-1]));
  sel=document.querySelector('#modal .v71-sort-control select');sel.value='priceDesc';sel.dispatchEvent(new Event('change',{bubbles:true}));
  const desc=filteredShopItems('pets').map(x=>Number(x.price||0));
  check('price descending',desc.every((p,i)=>i===0||p<=desc[i-1]));
  check('default category prices not mutated',SHOP_CATALOG.pets.every(x=>x.price===catalogItem('pets',x.id).price));
  openCollection();
  check('collection sort control present',!!document.querySelector('#mk872CollectionUX .v71-sort-control select'));
  const own=mk872CollectionOwned('pets');
  check('collection owned only',own.every(x=>isOwned('pets',x.id)));
  for(let grade=1;grade<=8;grade++){
    openGrade(grade);
    mkV71RefreshSections();
    const expected=grade===4?1:grade===5?3:grade===1?G1_GROUPS.length:grade===2?G2_GROUPS.length:grade===3?G3_GROUPS.length:grade===6?G6_GROUPS.length:grade===7?G7_GROUPS.length+G7_COURSES.length:G8_GROUPS.length+G8_COURSES.length;
    const bars=document.querySelectorAll('#mainView .v71-section-progress');
    check('section count grade '+grade,bars.length===expected,{bars:bars.length,expected});
    check('progressbar aria grade '+grade,[...bars].every(x=>{const p=x.querySelector('[role="progressbar"]');return p&&Number(p.getAttribute('aria-valuenow'))<=Number(p.getAttribute('aria-valuemax'))}));
  }
  return {checks,fail};
 });
 results.push(...functional.checks);
 if(functional.fail.length)errors.push('Functional: '+functional.fail.join(', '));
 for(const width of [320,390,768,1280]){
  await page.setViewport({width,height:850,deviceScaleFactor:1});
  const row=await page.evaluate(()=>{
   show('<div class="mtop"><h2>Проверка полей дроби</h2><button class="x" onclick="closeModal()">×</button></div>'+stage18FractionMarkup('nextQ','nextQ',''));
   const inputs=['quizFracWhole','quizFracNum','quizFracDen'].map(id=>document.getElementById(id));
   const checks=inputs.every(input=>input&&input.placeholder===''&&input.getBoundingClientRect().width>35);
   inputs[0].value='-12345';inputs[0].dispatchEvent(new Event('input',{bubbles:true}));
   inputs[1].value='1234567';inputs[1].dispatchEvent(new Event('input',{bubbles:true}));
   inputs[2].value='1234567';inputs[2].dispatchEvent(new Event('input',{bubbles:true}));
   const widths=inputs.map(x=>({client:x.clientWidth,scroll:x.scrollWidth,bounds:x.getBoundingClientRect()}));
   const fit=inputs.every(x=>x.scrollWidth<=x.clientWidth+1);
   const overflow=document.documentElement.scrollWidth>innerWidth+2;
   return {checks,fit,overflow,values:inputs.map(x=>x.value),widths:widths.map(x=>({client:x.client,scroll:x.scroll}))};
  });
  results.push({name:'fraction layout viewport '+width,ok:row.checks&&row.fit&&!row.overflow,details:row});
  if(!row.checks||!row.fit||row.overflow)errors.push('Viewport '+width+' '+JSON.stringify(row));
  await page.screenshot({path:'audits/v71_fraction_'+width+'.png',fullPage:false});
  await page.evaluate(()=>closeModal());
 }
 const report={sha256:sha,tests:results.length,passed:results.filter(x=>x.ok).length,errors,results};
 fs.writeFileSync('audits/v71_gate_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({sha256:sha,tests:report.tests,passed:report.passed,errors},null,2));
 if(errors.length)process.exitCode=1;
}finally{await browser.close()}
