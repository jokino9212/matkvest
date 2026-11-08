'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const out='audits/ux92_viewer_v92_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
for(const width of [320,390,768,1280]){
 const page=await browser.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{state.coins=3000;state.xp=100000;openShop('pets')});
 await page.locator('#modal .shop-card .shop-icon').first().click({force:true});
 assert(!(await page.locator('#mk872AvatarViewer').evaluate(el=>el.classList.contains('mk872-open'))),'Empty pet opened fullscreen '+width);
 const first=page.locator('#modal .shop-card .shop-icon').nth(1);
 await first.click({force:true});
 const pet=await page.evaluate(()=>{
   const v=document.querySelector('#mk872AvatarViewer .mk30-visual'),img=v?.querySelector('img'),parent=img?.parentElement;
   const r=img?.getBoundingClientRect(),pr=parent?.getBoundingClientRect(),cs=parent&&getComputedStyle(parent);
   return {open:!!v,title:document.querySelector('#mk872ViewerTitle')?.textContent,imgW:r?.width,imgH:r?.height,containerW:pr?.width,containerH:pr?.height,
     background:cs?.backgroundColor,border:cs?.borderTopWidth,objectFit:img&&getComputedStyle(img).objectFit,
     isComplete:img?.complete,naturalWidth:img?.naturalWidth};
 });
 assert(pet.open&&pet.isComplete&&pet.naturalWidth>0,'Pet image missing '+JSON.stringify(pet));
 assert.equal(pet.background,'rgba(0, 0, 0, 0)','Pet tile not transparent '+JSON.stringify(pet));
 assert.equal(pet.border,'0px','Pet border remains '+JSON.stringify(pet));
 assert.equal(pet.objectFit,'contain');
 assert(Math.abs(pet.imgW-pet.imgH)<2,'Pet distorted '+JSON.stringify(pet));
 assert(pet.imgW/pet.containerW>.9,'Pet artwork too small '+JSON.stringify(pet));
 await page.screenshot({path:out+'/pet_'+width+'.png',animations:'disabled'});
 await page.keyboard.press('Escape');
 assert(!(await page.locator('#mk872AvatarViewer').evaluate(el=>el.classList.contains('mk872-open'))));
 await page.evaluate(()=>openShop('avatars'));
 await page.locator('#modal .shop-card .shop-icon').first().click({force:true});
 const avatar=await page.evaluate(()=>{
   const v=document.querySelector('#mk872AvatarViewer .mk30-visual');
   const img=v?.querySelector('img');
   return {open:!!v,title:document.querySelector('#mk872ViewerTitle')?.textContent,image:!!img,natural:img?.naturalWidth,cls:v?.className};
 });
 assert(avatar.open&&avatar.image&&avatar.natural>0&&avatar.cls.includes('mk30-avatar'),'Avatar artwork lost '+JSON.stringify(avatar));
 await page.screenshot({path:out+'/avatar_'+width+'.png',animations:'disabled'});
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[],'Browser errors '+width);
 console.log('UX92_PASS',width,JSON.stringify({pet,avatar}));
 await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
