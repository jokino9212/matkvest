import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const terms=[/function\s+(?:normalizeShop|shopCard|shopTabs|shopItemIcon|buyShopItem|equipShopItem|openShop|openCollection|mk872CollectionOwned|mk872ActiveCollectionItems|grantAchievementReward|isAchievementUnlocked|renderProfilePreview)/,/pet-mini|pet-preview|equipped\.pet|pet_none|rarity-card-pet|pet-card|pet-icon|pet-sprite|shop-card\.equipped|shop-card\.owned/i];
const focus=[];for(let i=0;i<lines.length;i++)if(terms.some(re=>re.test(lines[i]))&&lines[i].length<8000)focus.push(i);
const idx=[...new Set([...focus.slice(0,130),...Array.from({length:105},(_,i)=>7360+i),...Array.from({length:85},(_,i)=>19800+i)])].sort((a,b)=>a-b);
const context=idx.map(i=>({line:i+1,code:lines[i].slice(0,1000)}));
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const result={source:context,screens:[],checks:[],errors:[]};
for(const width of [390,1280]){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(String(e)));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 if(width<600)await p.evaluate(()=>document.querySelector('.mk-ui19-nav-toggle')?.click());
 await p.evaluate(()=>document.querySelector('.shop-pill')?.click());
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal .shop-tab')].find(x=>x.textContent.includes('Питомцы'));if(!b)throw Error('pet shop tab missing');b.click()});
 const look=async(label)=>{const data=await p.evaluate(()=>{
  const modal=document.querySelector('#modal'),cards=[...modal.querySelectorAll('.shop-card')];
  const rect=e=>{const r=e?.getBoundingClientRect();return r?[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]:null};
  const item=e=>({text:e.innerText.replace(/\s+/g,' ').slice(0,280),cls:e.className,html:e.outerHTML.slice(0,1300),rect:rect(e),buttons:[...e.querySelectorAll('button')].map(b=>({text:b.innerText,disabled:b.disabled,onclick:b.getAttribute('onclick')}))});
  return{balance:state.coins,level:levelFor(state.xp),owned:state.inventory.pets.slice(),equipped:state.equipped.pet,activeTab:modal.querySelector('.shop-tab.active')?.textContent,
   filters:[...modal.querySelectorAll('.shop-filter-btn')].map(x=>({text:x.textContent,active:x.classList.contains('active')})),
   summary:modal.querySelector('.mk19d-shop-summary')?.innerText,
   preview:modal.querySelector('.profile-preview')?.innerText.replace(/\s+/g,' ').slice(0,340),
   previewPet:modal.querySelector('.pet-mini')?.outerHTML||'',
   allCards:cards.map(item),modalWidth:rect(modal),bodyScroll:document.documentElement.scrollWidth};
 });result.screens.push({width,label,data});};
 await look('unowned');
 if(width===390)await p.screenshot({path:'audits/ui19g_before_shop_390.png',fullPage:false});
 const grant=await p.evaluate(()=>{state.coins=3000;state.xp=1000000;save();const pre=state.coins;buyShopItem('pets','pet_cat');return{pre,post:state.coins,owned:state.inventory.pets.includes('pet_cat'),equipped:state.equipped.pet}});
 result.checks.push({width,grant});
 await new Promise(ok=>setTimeout(ok,200));
 await p.evaluate(()=>openShop('pets'));await look('purchased');
 if(width===390)await p.screenshot({path:'audits/ui19g_before_purchased_390.png',fullPage:false});
 await p.evaluate(()=>{equipShopItem('pets','pet_none');openShop('pets')});await look('unequipped');
 await p.evaluate(()=>{equipShopItem('pets','pet_cat');openCollection()});await look('collection');
 if(width===390)await p.screenshot({path:'audits/ui19g_before_collection_390.png',fullPage:false});
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal .shop-tab')].find(x=>x.textContent.includes('Питомцы'));b?.click()});await look('collection_pets');
 if(width===390)await p.screenshot({path:'audits/ui19g_before_collection_pets_390.png',fullPage:false});
 await ctx.close();
}
await browser.close();fs.writeFileSync('audits/ui_stage19g_pet_baseline.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({screens:result.screens.map(x=>({width:x.width,label:x.label,owned:x.data.owned,equipped:x.data.equipped,active:x.data.activeTab,filters:x.data.filters.map(y=>y.text.trim()),summary:x.data.summary,preview:x.data.preview,previewPet:x.data.previewPet,cards:x.data.allCards.slice(0,5).map(y=>({txt:y.text,btns:y.buttons})),scroll:x.data.bodyScroll})),checks:result.checks,errors:result.errors}).slice(0,24000));
