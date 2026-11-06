import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('matkvest-iphone-v63')||!sw.includes(sha))throw Error('v63 PWA mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href,report={sha,checks:[],errors:[],snapshots:[],transactions:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
async function fresh(w=1280){
 const ctx=await browser.createBrowserContext(),page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
 await page.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{ctx,page};
}
async function shop(page,w){
 await page.evaluate(width=>{
  const toggle=document.querySelector('.mk-ui19-nav-toggle');
  if(width<=600&&toggle&&getComputedStyle(toggle).display!=='none')toggle.click();
  const b=document.querySelector('.shop-pill');if(!b)throw Error('Missing shop button');b.click();
 },w);
}
const buttons=page=>page.evaluate(()=>({
 tabLabels:[...document.querySelectorAll('#modal .shop-tab')].map(x=>x.innerText.replace(/\s+/g,' ').trim()),
 filterLabels:[...document.querySelectorAll('#modal .shop-filter-btn')].map(x=>x.textContent.replace(/\s+/g,' ').trim()),
 activeTab:document.querySelector('#modal .shop-tab.active')?.textContent.replace(/\s+/g,' ').trim(),
 activeFilter:document.querySelector('#modal .shop-filter-btn.active')?.textContent.replace(/\s+/g,' ').trim(),
 count:document.querySelectorAll('#modal .shop-card').length,
 total:document.querySelector('#modal .mk19d-shop-summary')?.textContent.replace(/\s+/g,' ').trim(),
 totals:document.querySelectorAll('#modal .mk19d-shop-summary').length,
 bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
 modalWidth:Math.round(document.querySelector('#modal').getBoundingClientRect().width)
}));
async function select(page,part,cls='.shop-tab'){
 const value=await page.evaluate(({part,cls})=>{
  const b=[...document.querySelectorAll('#modal '+cls)].find(x=>x.textContent.includes(part));
  if(!b)return false;b.click();return true;
 },{part,cls});
 if(!value)throw Error('Missing '+cls+' text '+part);
}
try{
 for(const width of [390,768,1280]){
  const {ctx,page}=await fresh(width);await shop(page,width);
  const initial=await buttons(page);
  check('Shop opens with all modern avatars at '+width,initial.count===21&&initial.activeFilter?.startsWith('Все'),initial);
  check('Avatars offer only existing rarities at '+width,
   initial.filterLabels.length===4&&initial.filterLabels.some(x=>x.includes('Редкие'))&&
   initial.filterLabels.some(x=>x.includes('Эпические'))&&initial.filterLabels.some(x=>x.includes('Легендарные'))&&
   !initial.filterLabels.some(x=>x.includes('Обычные')||x.includes('Необычные')||x.includes('Только награды')),initial);
  check('Summary matches 21 visible heroes at '+width,initial.total?.includes('21')&&initial.total?.includes('210')&&initial.total?.includes('2 600')&&initial.totals===1,initial);
  check('Shop stays within viewport at '+width,initial.bodyWidth<=width+2,initial);
  await select(page,'Редкие','.shop-filter-btn');
  const rare=await buttons(page);
  check('Rare avatars filter exactly 4 at '+width,rare.count===4&&rare.activeFilter?.includes('Редкие'),rare);
  await select(page,'Питомцы');
  const pets=await buttons(page);
  check('Changing to pets automatically resets rarity at '+width,pets.activeFilter?.startsWith('Все')&&pets.count===21,pets);
  check('Pets expose real category rarity counts at '+width,
    pets.filterLabels.some(x=>x.includes('Обычные'))&&pets.filterLabels.some(x=>x.includes('Только награды')),pets);
  await select(page,'Только награды','.shop-filter-btn');
  const petRewards=await buttons(page);
  check('Pet rewards filter shows 3 reward-only pets at '+width,petRewards.count===3&&petRewards.activeFilter?.includes('Только награды'),petRewards);
  await select(page,'Ауры');
  const auras=await buttons(page);
  check('Switch from rewards to auras restores purchasable inventory at '+width,auras.activeFilter?.startsWith('Все')&&auras.count>=8,auras);
  await select(page,'Аватары');
  const back=await buttons(page);
  check('Return to avatars restores all 21 at '+width,back.count===21&&back.activeFilter?.startsWith('Все'),back);
  if([390,1280].includes(width)){
   await page.screenshot({path:'audits/ui19d_after_avatars_'+width+'.png',fullPage:false});
   await select(page,'Питомцы');
   await page.screenshot({path:'audits/ui19d_after_pets_'+width+'.png',fullPage:false});
  }
  report.snapshots.push({width,initial,rare,pets,petRewards,auras,back});
  await ctx.close();
 }
 // Purchase and resale use a fresh, isolated browser profile; never use a real learner's stored data.
 {
  const {ctx,page}=await fresh();
  const before=await page.evaluate(()=>{
   ensureProfileIdentity(state,{touch:true});state.coins=10000;state.xp=1000000;save();
   const item=catalogItem('pets','pet_cat');
   return{coins:state.coins,price:item.price,level:levelFor(state.xp),owned:state.inventory.pets.includes(item.id)};
  });
  check('Known non-reward test pet starts unowned and costs 390',before.coins===10000&&before.price===390&&!before.owned,before);
  const bought=await page.evaluate(()=>{
   buyShopItem('pets','pet_cat');
   const acq=mk865Acquisition(state,'pets','pet_cat');
   return{coins:state.coins,owned:state.inventory.pets.includes('pet_cat'),equipped:state.equipped.pet,acq:acq&&{source:acq.source,paidPrice:acq.paidPrice},
    spent:state.shopStats.spent,purchases:state.shopStats.purchases};
  });
  check('Purchase costs exact 390 and writes proof',bought.coins===9610&&bought.owned&&bought.equipped==='pet_cat'&&bought.acq?.paidPrice===390&&bought.acq?.source==='store',bought);
  const noDup=await page.evaluate(()=>{const n=state.coins;buyShopItem('pets','pet_cat');return{before:n,after:state.coins,purchases:state.shopStats.purchases}});
  check('Repeated purchase cannot charge twice',noDup.after===noDup.before&&noDup.purchases===1,noDup);
  const eligible=await page.evaluate(()=>{
   const q=mk865SellEligibility('pets','pet_cat');
   return {ok:q.ok,paidPrice:q.paidPrice,now:q.refundNow,training:q.refundTraining};
  });
  check('Resale refunds use paid price 40%/80%',eligible.ok&&eligible.paidPrice===390&&eligible.now===156&&eligible.training===312,eligible);
  const attempted80=await page.evaluate(()=>{
   const n=state.coins;mk865SellItem('pets','pet_cat',0.8);
   return{before:n,after:state.coins,owned:state.inventory.pets.includes('pet_cat')};
  });
  check('80% resale is impossible without training',attempted80.before===attempted80.after&&attempted80.owned,attempted80);
  const sold=await page.evaluate(()=>{
   mk865SellItem('pets','pet_cat',0.4);
   return{coins:state.coins,owned:state.inventory.pets.includes('pet_cat'),equipped:state.equipped.pet,
    sales:state.shopStats.sales,returned:state.shopStats.refundedCoins,
    rec:state.saleHistory.filter(x=>x.type==='pets'&&x.id==='pet_cat').slice(-1)[0]};
  });
  check('40% resale credits once and unequips pet',sold.coins===9766&&!sold.owned&&sold.equipped==='pet_none'&&sold.sales===1&&sold.returned===156&&sold.rec?.refundCoins===156,sold);
  const duplicate=await page.evaluate(()=>{
   const n=state.coins;mk865SellItem('pets','pet_cat',0.4);return{before:n,after:state.coins,owned:state.inventory.pets.includes('pet_cat')};
  });
  check('Second sale cannot mint coins',duplicate.after===duplicate.before&&!duplicate.owned,duplicate);
  const reward=await page.evaluate(()=>{
   const it=SHOP_CATALOG.pets.find(x=>x.rewardOnly&&!(state.inventory.pets||[]).includes(x.id));
   const coins=state.coins;buyShopItem('pets',it.id);
   return{id:it.id,coinsBefore:coins,coinsAfter:state.coins,owned:state.inventory.pets.includes(it.id)};
  });
  check('Achievement-only pet cannot be bought',reward.coinsAfter===reward.coinsBefore&&!reward.owned,reward);
  report.transactions.push({type:'purchase_repurchase_sell_and_reward',before,bought,noDup,eligible,attempted80,sold,duplicate,reward});
  await ctx.close();
 }
 // Archived-avatar full refund is separate from the normal resale policy.
 {
  const {ctx,page}=await fresh();
  const given=await page.evaluate(()=>{
   ensureProfileIdentity(state,{touch:true});state.coins=50;state.xp=100000;
   state.inventory.avatars=[...new Set([...state.inventory.avatars,'av_cat'])];
   const paid=400;
   mk865SetAcquisition(state,'avatars','av_cat','store',paid,Date.now()-86400000);
   save();
   const q=mk873Eligibility(state,'av_cat');
   return{ok:q.ok,quoted:q.paidPrice,reason:q.reason,coins:state.coins,profileId:state.profileId,owned:state.inventory.avatars.includes('av_cat')};
  });
  check('Verified archived avatar is eligible for exact paid-price refund',given.ok&&given.quoted===400&&given.owned,given);
  const refunded=await page.evaluate(()=>{
   window.confirm=()=>true;mk873RefundArchivedAvatar('av_cat');
   const receipt=mk873Receipt(state,'av_cat'),eligible=mk873Eligibility(state,'av_cat');
   return{coins:state.coins,owned:state.inventory.avatars.includes('av_cat'),sales:state.shopStats.sales,
     receipt:receipt&&{paid:receipt.paidPrice,refund:receipt.refundCoins,rate:receipt.refundRate},eligible:eligible.ok,reason:eligible.reason};
  });
  check('Archived avatar refunds 100% of historical 400 once',refunded.coins===450&&!refunded.owned&&refunded.receipt?.refund===400&&refunded.receipt?.rate===1&&!refunded.eligible,refunded);
  const again=await page.evaluate(()=>{
   const coins=state.coins;mk873RefundArchivedAvatar('av_cat');
   return{before:coins,after:state.coins,receipt:!!mk873Receipt(state,'av_cat')};
  });
  check('Archived refund cannot credit twice',again.after===again.before&&again.receipt,again);
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  const persistent=await page.evaluate(()=>({
   coins:state.coins,owned:state.inventory.avatars.includes('av_cat'),receipt:mk873Receipt(state,'av_cat')?.refundCoins,
   eligibility:mk873Eligibility(state,'av_cat').ok
  }));
  check('Full refund remains safe after reload',persistent.coins===450&&!persistent.owned&&persistent.receipt===400&&!persistent.eligibility,persistent);
  report.transactions.push({type:'archived_full_refund',given,refunded,again,persistent});
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19d_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fail=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-fail.length,failed:fail,errors:report.errors,transactions:report.transactions.map(x=>x.type)},null,2));
 if(fail.length||report.errors.length)process.exitCode=1;
}