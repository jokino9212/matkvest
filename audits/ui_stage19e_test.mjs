import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');if(!sw.includes('matkvest-iphone-v64')||!sw.includes(sha))throw Error('PWA v64 mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={version:'v64',sha,checks:[],errors:[],screens:[]};
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail:detail??null});
async function fresh(w){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push({width:w,message:String(e)}));
 await p.setViewport({width:w,height:900,isMobile:w<=600,hasTouch:w<=600});await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return{ctx,p};
}
async function openShop(p,w){
 await p.evaluate(w=>{
  const toggler=document.querySelector('.mk-ui19-nav-toggle');if(w<=600&&toggler&&getComputedStyle(toggler).display!=='none')toggler.click();
  const shop=document.querySelector('.shop-pill');if(!shop)throw Error('Shop button missing');shop.click();
 },w)
}
const snapshot=p=>p.evaluate(()=>{
 const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]};
 const root=document.querySelector('#mk19eWallet'),tab=document.querySelector('#modal .mk19e-wallet-tab'),pill=document.querySelector('#coins')?.closest('.pill');
 const balance=root?.querySelector('.mk19e-balance')?.textContent.trim()||null;
 const labels=[...root?.querySelectorAll('.mk19e-label')||[]].map(x=>x.textContent.trim());
 const vals=[...root?.querySelectorAll('.mk19e-wallet-cell')||[]].map(x=>({label:x.querySelector('.mk19e-label')?.textContent.trim(),value:x.querySelector('strong')?.textContent.trim(),small:x.querySelector('small')?.textContent.trim()}));
 const potential=root?.querySelector('.mk19e-potential')?.innerText.replace(/\s+/g,' ').slice(0,350);
 return{width:innerWidth,bodyWidth:document.documentElement.scrollWidth,wallet:!!root,
   modal:r(document.querySelector('#modal')),balance,labels,vals,potential,
   tabCount:document.querySelectorAll('#modal .mk19e-wallet-tab').length,active:tab?.classList.contains('active'),
   pillRole:pill?.getAttribute('role'),pillTabIndex:pill?.getAttribute('tabindex'),pillAria:pill?.getAttribute('aria-label'),
   sales:[...root?.querySelectorAll('.mk19e-transaction')||[]].map(e=>e.textContent.replace(/\s+/g,' ').slice(0,160)),
   info:root?.querySelector('details.mk19e-info')?.textContent.trim().slice(0,620),buttons:[...root?.querySelectorAll('.mk19e-shortcuts button')||[]].map(x=>x.textContent.trim()),
   chest:[...root?.querySelectorAll('.mk19e-fact')||[]].map(x=>x.innerText.replace(/\s+/g,' ').trim()),profileName:root?.querySelector('.mk19e-id')?.textContent.trim()};
});
try{
 for(const w of [320,390,768,1280]){
  const {ctx,p}=await fresh(w);await openShop(p,w);
  const walletTab=await p.evaluate(()=>[...document.querySelectorAll('#modal .shop-tab')].find(x=>/Кошелёк/.test(x.innerText))?.textContent.trim());
  check('Wallet reachable from shop tab at '+w,!!walletTab,walletTab);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal .shop-tab')].find(x=>/Кошелёк/.test(x.innerText));if(!b)throw Error('Wallet tab missing');b.click()});
  let a=await snapshot(p);
  check('Wallet opens with active tab and real zero balance at '+w,a.wallet&&a.balance==='0'&&a.tabCount===1&&a.active,a);
  check('Wallet explicitly labels shop-only expenses and no invented lifetime earnings at '+w,a.vals.some(x=>x.label==='Потрачено в магазине'&&x.value==='0')&&
    a.info.includes('не хранится')&&a.info.includes('не включают сундуки'),a);
  check('Wallet has accurate 0 potential refund at '+w,a.potential?.includes('+0')&&a.potential?.includes('Баланс + возможные возвраты'),a);
  check('Wallet opens without horizontal overflow at '+w,a.bodyWidth<=w+2,{bodyWidth:a.bodyWidth,viewport:w});
  check('Wallet actions remain reachable at '+w,a.buttons.includes('В магазин')&&a.buttons.includes('Моя коллекция'),a);
  check('Top balance is a real accessible wallet shortcut at '+w,a.pillRole==='button'&&a.pillTabIndex==='0'&&a.pillAria?.includes('кошелёк'),a);
  if([320,390,1280].includes(w))await p.screenshot({path:'audits/ui19e_after_wallet_'+w+'.png',fullPage:false});
  // Verify moving back to the marketplace and the standalone top shortcut works.
  await p.evaluate(()=>document.querySelector('#mk19eWallet .mk19e-shortcuts button').click());
  const inShop=await p.evaluate(()=>!!document.querySelector('#modal .shop-grid')&&!!document.querySelector('#modal .mk19e-wallet-tab'));
  check('Wallet returns to shopping without losing shop filters at '+w,inShop);
  await p.evaluate(()=>document.querySelector('#coins').closest('.pill').click());
  a=await snapshot(p);
  check('Coin pill click opens wallet at '+w,a.wallet&&a.active,a);
  await p.keyboard.press('Tab');
  await p.evaluate(()=>{document.querySelector('#coins').closest('.pill').focus()});
  await p.keyboard.press('Enter');
  a=await snapshot(p);
  check('Coin pill Enter works for keyboard users at '+w,a.wallet&&a.active,a);
  report.screens.push({width:w,initial:a});
  await ctx.close();
 }
 // A shop purchase changes balance, then the wallet must report recorded spending and guaranteed resale.
 {
  const {ctx,p}=await fresh(1280);
  const setup=await p.evaluate(()=>{
   state.xp=1000000;state.coins=10000;save();
   return{balance:state.coins,before:JSON.stringify({coins:state.coins,spent:state.shopStats.spent,refunded:state.shopStats.refundedCoins,owned:state.inventory.pets})};
  });
  const after=await p.evaluate(()=>{
   buyShopItem('pets','pet_cat');const b=state.coins,summary=mk19eProfileSummary(state);
   openShop('wallet');return{balance:b,summary};
  });
  check('Wallet after 390 purchase shows real price and 40 percent realizable refund',after.balance===setup.balance-390&&after.summary.spent===390&&after.summary.purchases===1&&after.summary.realizable===156&&after.summary.potential===after.balance+156,after);
  let snap=await snapshot(p);
  check('Wallet displays purchase counts and resale separate from current coins',snap.balance===after.balance.toLocaleString('ru-RU')&&snap.vals.some(v=>v.label==='Потрачено в магазине'&&v.value==='390')&&snap.potential.includes('+156'),snap);
  const beforeRead=await p.evaluate(()=>JSON.stringify({coins:state.coins,shopStats:state.shopStats,inventory:state.inventory,acquisitionMetadata:state.acquisitionMetadata,sales:state.saleHistory}));
  await p.evaluate(()=>{mk19eWallet();mk19eProfileSummary(state)});
  const afterRead=await p.evaluate(()=>JSON.stringify({coins:state.coins,shopStats:state.shopStats,inventory:state.inventory,acquisitionMetadata:state.acquisitionMetadata,sales:state.saleHistory}));
  check('Wallet calculation cannot mutate economy or inventory',beforeRead===afterRead);
  await p.evaluate(()=>mk865SellItem('pets','pet_cat',0.4));
  await p.evaluate(()=>mk19eWallet());
  const sold=await snapshot(p);
  check('After selling pet, wallet updates current coins and zeroes resale value',
    sold.balance===(after.balance+156).toLocaleString('ru-RU')&&sold.potential?.includes('+0'),sold);
  check('Wallet displays actual sale-history receipt',sold.sales.some(x=>x.includes('Кот')&&x.includes('156')),sold.sales);
  check('Wallet records real refund and sale counters',
    sold.vals.some(x=>x.label==='Возвращено монет'&&x.value==='156')&&
    sold.vals.some(x=>x.label==='Продаж и компенсаций'&&x.value==='1'),sold.vals);
  await p.reload({waitUntil:'domcontentloaded',timeout:120000});
  await p.evaluate(()=>mk19eWallet());
  const persisted=await snapshot(p);
  check('Wallet reflects same monetary records after browser reload',persisted.balance===sold.balance&&persisted.sales.length===1&&persisted.vals.some(x=>x.value==='390'),persisted);
  await ctx.close();
 }
 // Confirm exact refund in potential, without actually issuing a full refund on the read-only screen.
 {
  const {ctx,p}=await fresh(1280);
  const given=await p.evaluate(()=>{
   state.coins=15;state.inventory.avatars=[...new Set([...state.inventory.avatars,'av_cat'])];
   mk865SetAcquisition(state,'avatars','av_cat','store',400,Date.now()-86400000);save();
   const eligibility=mk873Eligibility(state,'av_cat');
   const metrics=mk19eProfileSummary(state);
   mk19eWallet();
   return{eligible:eligibility.ok,balance:state.coins,metrics};
  });
  check('Archived paid avatar contributes exact 100 percent to potential, not balance',given.eligible&&given.metrics.realizable===400&&given.metrics.potential===given.balance+400,given);
  const snap=await snapshot(p);
  check('Wallet explains archived 100% potential and does not credit coins',snap.balance==='15'&&snap.potential.includes('+400')&&snap.potential.includes('415'),snap);
  await ctx.close();
 }
 // Confirm opening history and compensation display from existing counters, without opening chests.
 {
  const {ctx,p}=await fresh(390);
  await p.evaluate(()=>{
   state.chestStats.totalOpened=3;state.chestStats.compensationCoins=28;state.coins=200;save();mk19eWallet();
  });
  const snap=await snapshot(p);
  check('Wallet displays chest opening count without claiming exact chest spending',snap.chest.some(x=>x.includes('Открыто сундуков')&&x.includes('3'))&&snap.chest.some(x=>x.includes('28'))&&snap.info.includes('не включают сундуки'),snap);
  await ctx.close();
 }
}finally{
 await browser.close();fs.writeFileSync('audits/ui_stage19e_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fails=report.checks.filter(x=>!x.pass);
 console.log(JSON.stringify({sha,checks:report.checks.length,passed:report.checks.length-fails.length,failures:fails,errors:report.errors},null,2).slice(0,22000));
 if(fails.length||report.errors.length)process.exitCode=1;
}