'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const output='audits/ux_mobile_shop_v91_output';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const data=[];
 try{
  for(const width of [320,360,390,430,768,1280]){
   const page=await browser.newPage({viewport:{width,height:width<500?740:850},isMobile:width<500,hasTouch:width<500});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{state.coins=3000;openShop('badges','all')});
   await page.locator('#modal .mk-ux91-category-select').waitFor();
   const check=await page.evaluate(()=>{
      const h=document.querySelector('#modal .mtop .mk872-help-heading');
      const help=h.querySelector('.mk872-help-trigger'),close=document.querySelector('#modal .mtop .x');
      const tabs=document.querySelector('#modal .shop-tabs'),select=document.querySelector('#modal .mk-ux91-category-select');
      const bb=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {heading:bb(h),help:bb(help),close:bb(close),tabs:bb(tabs),select:bb(select),
        options:select.options.length,selected:select.selectedOptions[0]?.textContent,
        tabCount:tabs.querySelectorAll('.shop-tab').length,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
        modalOverflow:document.querySelector('#modal').scrollWidth>document.querySelector('#modal').clientWidth+3};
   });
   assert(check.options>=9 && check.options===check.tabCount,'Categories lost '+JSON.stringify(check));
   assert(/Значки/.test(check.selected),'Wrong default category '+JSON.stringify(check));
   assert(!check.overflow && !check.modalOverflow,'Screen overflow '+width+' '+JSON.stringify(check));
   if(width<=480){
      assert(check.tabs.width===0,'Mobile tabs must not be partially clipped: '+JSON.stringify(check));
      assert(check.select.width>=150,'Mobile select not visible: '+JSON.stringify(check));
      assert(Math.abs((check.heading.top+check.heading.bottom)/2-(check.help.top+check.help.bottom)/2)<12,'Help icon off title line '+JSON.stringify(check));
      assert(Math.abs((check.heading.top+check.heading.bottom)/2-(check.close.top+check.close.bottom)/2)<14,'Close button off title line '+JSON.stringify(check));
      assert(check.close.right<=width+1,'Close offscreen '+JSON.stringify(check));
      const target=await page.evaluate(()=>{
       const sel=document.querySelector('#modal .mk-ux91-category-select');
       const o=[...sel.options].find(o=>/Питомцы/.test(o.textContent));
       if(!o)throw Error('Pets category missing');
       sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}));
       return o.textContent;
      });
      await page.locator('#modal .mk-ux91-category-select').waitFor();
      const after=await page.evaluate(()=>({
        active:document.querySelector('#modal .shop-tab.active')?.textContent.trim(),
        selected:document.querySelector('#modal .mk-ux91-category-select')?.selectedOptions[0]?.textContent,
        petsShown:!!document.querySelector('#modal .mk19g-pet-choice,#modal .shop-grid .shop-card'),
        count:SHOP_CATALOG.badges.length
      }));
      assert(/Питомцы/.test(after.active)&&/Питомцы/.test(after.selected),'Category change failed '+JSON.stringify(after));
      assert(after.count===50,'Badge inventory changed');
      await page.screenshot({path:output+'/mobile_pets_'+width+'.png',animations:'disabled'});
      await page.evaluate(()=>openShop('badges','all'));
      await page.locator('#modal .mk-ux91-category-select').waitFor();
   }else{
      assert(check.tabs.width>100,'Desktop tabs vanished '+JSON.stringify(check));
      assert(check.select.width===0,'Mobile dropdown must hide on desktop '+JSON.stringify(check));
   }
   const badges=await page.evaluate(async()=>{
     const imgs=[...document.querySelectorAll('#modal .mk-ux-badge-image')];
     await Promise.all(imgs.map(x=>x.decode().catch(()=>null)));
     return {count:imgs.length,broken:imgs.filter(x=>x.naturalWidth===0).map(x=>x.src)};
   });
   assert.equal(badges.count,50,'Badge list '+width);assert.deepEqual(badges.broken,[]);
   assert.deepEqual(errors,[],'Page errors '+width);
   await page.screenshot({path:output+'/shop_'+width+'.png',animations:'disabled'});
   console.log('MOBILE_SHOP_V91_PASS',width,JSON.stringify({tabs:check.tabCount,selected:check.selected,badges:badges.count}));
   data.push({width,check,badges,errors});
   await page.close();
  }
  fs.writeFileSync(output+'/report.json',JSON.stringify(data,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
