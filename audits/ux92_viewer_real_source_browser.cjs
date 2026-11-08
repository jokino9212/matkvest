'use strict';
const {chromium}=require('playwright'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const out='audits/ux92_viewer_probe_output';fs.mkdirSync(out,{recursive:true});
 try{for(const width of [320,390,1280]){
 const page=await browser.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{state.coins=3000;state.xp=100000;openShop('pets')});
 const pets=await page.evaluate(()=>[...document.querySelectorAll('#modal .shop-card')].slice(0,3).map(card=>({name:card.querySelector('strong')?.textContent,icon:card.querySelector('.shop-icon')?.outerHTML.slice(0,700)})));
 console.log('REAL_PETS',width,JSON.stringify(pets));
 for(const [kind,index] of [['pets',0],['pets',1],['avatars',0],['avatars',1]]){
  await page.evaluate(k=>openShop(k),kind);
  const count=await page.locator('#modal .shop-card .shop-icon').count();
  if(count<=index)continue;
  await page.locator('#modal .shop-card .shop-icon').nth(index).click({force:true});
  const diag=await page.evaluate(()=>{
   const viewer=document.querySelector('#mk872AvatarViewer'),v=viewer.querySelector('.mk30-visual'),img=v?.querySelector('img'),svgs=v?.querySelectorAll('svg');
   const rc=x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height,left:r.left,top:r.top}};
   return {open:viewer.classList.contains('mk872-open'),kind:v?.className,title:document.querySelector('#mk872ViewerTitle')?.textContent,html:v?.innerHTML.slice(0,1500),svgCount:svgs?.length||0,imgCount:v?.querySelectorAll('img').length||0,imgSrc:img?.src,metrics:rc(v),imgRect:img?rc(img):null,footer:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  console.log('VIEWER_REAL',width,kind,index,JSON.stringify(diag));
  await page.screenshot({path:out+'/'+width+'_'+kind+'_'+index+'.png',animations:'disabled'});
  await page.keyboard.press('Escape');
 }
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
