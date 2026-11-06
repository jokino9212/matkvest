import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));if(!chrome)throw Error('Chrome unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const out={version:'v62',screens:[],errors:[],warnings:[],timestamp:new Date().toISOString()};
const visible=e=>e&&e.getBoundingClientRect().width>0; // browser only inside evaluate, do not call here
try{
 for(const width of [390,1280]){
  const context=await browser.createBrowserContext(),page=await context.newPage();
  page.on('pageerror',e=>out.errors.push({width,error:String(e)}));
  await page.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.evaluate(()=>{
   const b=document.querySelector('.mk-ui19-nav-toggle');if(b&&getComputedStyle(b).display!=='none')b.click();
   const shop=document.querySelector('.shop-pill');if(!shop)throw Error('Shop unavailable');shop.click();
  });
  const tabs=await page.evaluate(()=>[...document.querySelectorAll('#modal .shop-tab')].map(x=>x.innerText.replace(/\s+/g,' ').trim()));
  for(let k=0;k<tabs.length;k++){
   const tab=tabs[k];
   await page.evaluate(i=>{const b=document.querySelectorAll('#modal .shop-tab')[i];if(!b)throw Error('No tab '+i);b.click()},k);
   const d=await page.evaluate(()=>{
    const m=document.querySelector('#modal'),tabs=[...m.querySelectorAll('.shop-tab')];
    const cards=[...m.querySelectorAll('.shop-card')].map((x,i)=>{
      const txt=x.innerText.replace(/\s+/g,' ').trim(),buttons=[...x.querySelectorAll('button')].map(b=>({text:b.innerText.replace(/\s+/g,' ').trim(),disabled:b.disabled,title:b.title,onclick:b.getAttribute('onclick')?.slice(0,130)}));
      const r=x.getBoundingClientRect();
      const infos=[...x.querySelectorAll('[class*="rarity"],[class*="price"],[class*="cost"],[class*="owned"],[class*="level"],[class*="sale"],[class*="badge"]')].slice(0,10).map(y=>({className:String(y.className).slice(0,120),text:y.textContent.replace(/\s+/g,' ').trim().slice(0,75)}));
      return{index:i,text:txt.slice(0,600),className:x.className,attributes:[...x.attributes].filter(a=>a.name.startsWith('data-')||a.name==='style').map(a=>[a.name,a.value.slice(0,90)]),buttons,info:infos,rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
    });
    const filter=[...m.querySelectorAll('.shop-filter-btn')].map(x=>({text:x.innerText.replace(/\s+/g,' ').trim(),active:x.classList.contains('active')}));
    const chest=[...m.querySelectorAll('.mk861-chest-card')].slice(0,16).map(x=>({text:x.innerText.replace(/\s+/g,' ').trim().slice(0,750),className:x.className,buttons:[...x.querySelectorAll('button')].map(b=>({text:b.innerText,disabled:b.disabled}))}));
    const mod=m.getBoundingClientRect();
    return {activeTab:tabs.find(t=>t.classList.contains('active'))?.innerText.replace(/\s+/g,' ').trim(),count:cards.length,cards,
      chest,filter,bodyWidth:document.documentElement.scrollWidth,modalWidth:Math.round(mod.width),viewport:innerWidth,shopTitle:m.querySelector('.mtop h2')?.innerText,
      text:m.innerText.replace(/\s+/g,' ').slice(0,1700)};
   });
   out.screens.push({width,tab,...d});
   if([0,2,10,11].includes(k))await page.screenshot({path:'audits/ui19d_before_'+width+'_tab'+k+'.png',fullPage:false});
   if(k===0){
    // Verify the categorical controls on default tab, without purchasing or equip actions.
    for(let j=0;j<7;j++){
     const f=await page.evaluate(i=>{
      const btn=[...document.querySelectorAll('#modal .shop-filter-btn')][i];if(!btn)return null;
      const label=btn.textContent.replace(/\s+/g,' ').trim();btn.click();
      return {label,visibleCards:document.querySelectorAll('#modal .shop-card').length,
        active:document.querySelector('#modal .shop-filter-btn.active')?.textContent.replace(/\s+/g,' ').trim(),
        cardText:[...document.querySelectorAll('#modal .shop-card')].slice(0,5).map(x=>x.innerText.replace(/\s+/g,' ').trim().slice(0,160))};
     },j);
     if(f)out.screens.push({width,tab:'rarity_filter',...f});
    }
   }
  }
  await context.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19d_shop_inventory.json',JSON.stringify(out,null,2)+'\n');
 console.log('UI19D SHOP INVENTORY',JSON.stringify({screens:out.screens.filter(s=>s.tab!=='rarity_filter').map(s=>({width:s.width,tab:s.tab,count:s.count,filter:s.filter.map(x=>x.text),firstCards:s.cards.slice(0,4).map(c=>({text:c.text,buttons:c.buttons,info:c.info})),chest:s.chest.slice(0,3)})),
  filters:out.screens.filter(s=>s.tab==='rarity_filter').filter(s=>s.width===1280).map(s=>({label:s.label,visibleCards:s.visibleCards,active:s.active})),
  errors:out.errors},null,2).slice(0,31000));
 if(out.errors.length)process.exitCode=1;
}