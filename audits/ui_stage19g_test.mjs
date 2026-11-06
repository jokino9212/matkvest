import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('matkvest-iphone-v67')||!sw.includes(sha))throw Error('PWA v67 mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={sha,checks:[],errors:[],scenes:[]};
function check(name,ok,data){report.checks.push({name,pass:!!ok,detail:ok?undefined:data})}
async function fresh(width){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{ctx,p};
}
async function openShop(p,width){
 await p.evaluate(w=>{if(w<=600){const b=document.querySelector('.mk-ui19-nav-toggle');if(b&&getComputedStyle(b).display!=='none')b.click()}document.querySelector('.shop-pill').click()},width);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal .shop-tab')].find(x=>x.textContent.includes('Питомцы'));if(!b)throw Error('Pet tab unavailable');b.click()});
}
const view=p=>p.evaluate(()=>{
 const el=document.querySelector('#mk19gPetPanel'),host=document.querySelector('#modal');
 const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height),Math.round(r.right),Math.round(r.bottom)]};
 const avatar=host?.querySelector('.profile-preview .avatar-badge.large'),mini=avatar?.querySelector('.pet-mini'),info=host?.querySelector('.profile-preview-info');
 return{panel:!!el,view:host?.querySelector('.shop-tab.active')?.textContent?.trim(),current:el?.querySelector('.mk19g-pet-name')?.textContent,
  total:el?.querySelector('.mk19g-pet-collection-count')?.textContent,
  btns:[...el?.querySelectorAll('.mk19g-pet-choice')||[]].map(e=>({text:e.textContent,disabled:e.disabled,pressed:e.getAttribute('aria-pressed')})),
  market:!!el?.querySelector('.mk19g-pet-market'),rewardCards:[...host.querySelectorAll('.shop-card')].filter(x=>/Награда|Серия 10|Мастерство/i.test(x.innerText)).length,
  petAvatar:rect(avatar),mini:rect(mini),info:rect(info),bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
  balance:state.coins,owned:state.inventory.pets.slice(),equipped:state.equipped.pet,shopCardCount:host.querySelectorAll('.shop-card').length,
  filter:host.querySelector('.shop-filter-btn.active')?.textContent.trim(),profileText:info?.innerText.replace(/\s+/g,' ').slice(0,280)};
});
const act=(p,text)=>p.evaluate(label=>{const b=[...document.querySelectorAll('#mk19gPetPanel .mk19g-pet-choice')].find(x=>x.textContent.includes(label)&&!x.disabled);if(!b)return false;b.click();return true},text);
try{
 for(const width of [320,390,768,1280]){
  const{ctx,p}=await fresh(width);await openShop(p,width);
  let x=await view(p);report.scenes.push({width,stage:'empty',data:x});
  check('Initial pet panel appears with real 0 / 20 collection at '+width,x.panel&&x.current==='Без питомца'&&x.total?.replace(/\s/g,'')==='0/20',x);
  check('Initial quick choices contain only equipped pet_none at '+width,x.btns.length===1&&x.btns[0].disabled&&x.btns[0].pressed==='true',x);
  check('Initial shop keeps 21 catalog pet cards at '+width,x.shopCardCount===21,x);
  check('Initial shop stays within viewport at '+width,x.bodyWidth<=width+2,x);
  if([390,1280].includes(width))await p.screenshot({path:'audits/ui19g_after_empty_'+width+'.png',fullPage:false});
  const starting=await p.evaluate(()=>{
    state.xp=1000000;state.coins=10000;save();
    const before=state.coins;
    buyShopItem('pets','pet_cat');
    return{before,after:state.coins,owned:state.inventory.pets.includes('pet_cat'),equipped:state.equipped.pet};
  });
  check('Buying cat costs exactly 390, owns and equips it at '+width,starting.after===starting.before-390&&starting.owned&&starting.equipped==='pet_cat',starting);
  await new Promise(r=>setTimeout(r,160));
  await p.evaluate(()=>openShop('pets'));
  x=await view(p);
  check('Purchased cat appears in panel and owned-only switches at '+width,x.current==='Кот'&&x.total?.replace(/\s/g,'')==='1/20'&&x.btns.length===2&&x.btns.some(z=>z.text.includes('Кот')&&z.pressed==='true'),x);
  check('Profile avatar pet badge fits inside avatar without overlapping copy at '+width,
    !!x.mini&&!!x.petAvatar&&!!x.info&&x.mini[4]<=x.petAvatar[4]+3&&x.mini[4]<x.info[0]&&x.mini[5]<=x.petAvatar[5]+3,
    {avatar:x.petAvatar,mini:x.mini,info:x.info});
  check('Purchase does not cause mobile horizontal scrolling at '+width,x.bodyWidth<=width+2,x);
  if([390,1280].includes(width))await p.screenshot({path:'audits/ui19g_after_cat_'+width+'.png',fullPage:false});
  const beforeSwitch=x.balance;
  const un=await act(p,'Без питомца');x=await view(p);
  check('Quick switch off keeps cat owned and balance constant at '+width,un&&x.current==='Без питомца'&&x.equipped==='pet_none'&&x.owned.includes('pet_cat')&&x.balance===beforeSwitch,x);
  const on=await act(p,'Кот');x=await view(p);
  check('Quick switch on uses original equipped cat and no charge at '+width,on&&x.current==='Кот'&&x.equipped==='pet_cat'&&x.balance===beforeSwitch,x);
  await p.evaluate(()=>openCollection());
  x=await view(p);
  check('Collection has same live pet panel at '+width,x.panel&&x.market&&x.current==='Кот'&&x.total?.replace(/\s/g,'')==='1/20',x);
  const off=await act(p,'Без питомца');x=await view(p);
  check('Collection quick switch returns to collection and updates pet at '+width,off&&x.view?.includes('Моё')&&x.equipped==='pet_none'&&x.current==='Без питомца'&&x.balance===beforeSwitch,x);
  await p.evaluate(()=>{const b=document.querySelector('#mk19gPetPanel .mk19g-pet-market');b.click()});
  x=await view(p);
  check('Collection shortcut returns to full pet shop at '+width,x.view?.includes('Питомцы')&&x.shopCardCount===21,x);
  await p.reload({waitUntil:'domcontentloaded',timeout:120000});
  const persisted=await p.evaluate(()=>({owned:state.inventory.pets.includes('pet_cat'),equipped:state.equipped.pet,coins:state.coins}));
  check('Pet ownership and unequipped state persist after reload at '+width,persisted.owned&&persisted.equipped==='pet_none'&&persisted.coins===beforeSwitch,persisted);
  report.scenes.push({width,stage:'after',data:x});
  await ctx.close();
 }
 // Achievement-only pets must not be purchasable or forged by the quick switch.
 {
  const{ctx,p}=await fresh(390);await openShop(p,390);
  const reward=await p.evaluate(()=>{
   state.coins=2000;state.xp=1000000;save();
   const id='pet_streak_owl',coins=state.coins;
   buyShopItem('pets',id);
   const denied={coinsBefore:coins,coinsAfter:state.coins,owned:state.inventory.pets.includes(id)};
   // Simulate a legitimately granted reward in this isolated throwaway test profile.
   state.inventory.pets.push(id);save();openShop('pets');
   return{denied,price:catalogItem('pets',id).price};
  });
  check('Achievement-only pet is never bought with coins',reward.denied.coinsAfter===reward.denied.coinsBefore&&!reward.denied.owned&&reward.price===0,reward);
  let x=await view(p);
  check('Owned achievement pet appears as selectable quick choice',x.btns.some(v=>v.text.includes('Сова серии')&&!v.disabled),x);
  const before=x.balance,chosen=await act(p,'Сова серии');x=await view(p);
  check('Awarded pet equips without charging or changing rarity',chosen&&x.equipped==='pet_streak_owl'&&x.balance===before&&x.current==='Сова серии',x);
  await ctx.close();
 }
 // Two independent profiles must never share equipped companions.
 {
  const{ctx,p}=await fresh(390);
  const r=await p.evaluate(()=>{
   const before=mk19gPetSummary(state);
   const alt={...state,inventory:{...state.inventory,pets:['pet_none','pet_cat']},equipped:{...state.equipped,pet:'pet_cat'}};
   const selected=mk19gPetSummary(alt);const after=mk19gPetSummary(state);
   return{before:{id:before.current.id,count:before.collected},selected:{id:selected.current.id,count:selected.collected},after:{id:after.current.id,count:after.collected}};
  });
  check('Pet summary is profile-isolated and read-only',r.before.id==='pet_none'&&r.before.count===0&&r.selected.id==='pet_cat'&&r.selected.count===1&&JSON.stringify(r.before)===JSON.stringify(r.after),r);
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19g_test_report.json',JSON.stringify(report,null,2)+'\n');
 const failed=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-failed.length,failures:failed,errors:report.errors},null,2).slice(0,20000));
 if(failed.length||report.errors.length)process.exitCode=1;
}