'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const out='audits/ux93_stack_avatar_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  for(const id of ['av_centurion','av_grade5_master','av_mathquest_master','av_default']){
   await page.evaluate(id=>{
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:100,xp:50000,
     inventory:{...(EMPTY_STATE.inventory||{}),avatars:['av_default',id],pets:['pet_none']},
     equipped:{...(EMPTY_STATE.equipped||{}),avatar:id,pet:'pet_none'}});
    profiles={'Тест Боба':p};currentProfile='Тест Боба';state=p;openLeaderboard();
   },id);
   await page.locator('.leader-table .avatar-badge').first().click({force:true});
   const info=await page.evaluate(()=>{
    const viewer=document.querySelector('#mk872AvatarViewer'),visual=viewer.querySelector('.mk30-visual'),
      stack=visual.querySelector('.stack-icon'),base=visual.querySelector('.stack-base'),img=base?.querySelector('img'),badge=visual.querySelector('.stack-badge');
    const box=x=>{if(!x)return null;const r=x.getBoundingClientRect();return {w:r.width,h:r.height,x:r.left,y:r.top}};
    return {title:document.querySelector('#mk872ViewerTitle')?.textContent,open:viewer.classList.contains('mk872-open'),
      kind:visual?.className,visual:box(visual),stack:box(stack),base:box(base),img:box(img),label:box(badge),
      imageLoaded:img?.naturalWidth>0,levelText:badge?.textContent?.trim(),elementId:visual?.querySelector('[data-mk-avatar-id]')?.dataset.mkAvatarId};
   });
   assert(info.open&&info.kind.includes('mk30-avatar'),'Viewer failed '+JSON.stringify(info));
   assert.equal(info.title,SHOP_AVATAR_TITLE(id),'Avatar name incorrect '+JSON.stringify(info));
   assert.equal(info.elementId,id);
   if(id!=='av_default'){
    assert(info.imageLoaded,'Legacy award image missing '+JSON.stringify(info));
    assert(info.img.w/info.visual.w>.68,'Legacy trophy still tiny '+JSON.stringify(info));
    assert(info.label.w/info.visual.w<.38,'Numeric label too wide '+JSON.stringify(info));
    assert(info.img.h/info.visual.h>.68,'Legacy trophy still tiny height '+JSON.stringify(info));
   }
   await page.screenshot({path:out+'/'+width+'_'+id+'.png',animations:'disabled'});
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#mk872AvatarViewer').evaluate(x=>x.classList.contains('mk872-open'))));
   console.log('UX93_PASS',width,id,JSON.stringify(info));
  }
  await page.close();
 }}finally{await browser.close()}
 function SHOP_AVATAR_TITLE(id){return id==='av_centurion'?'Сотник':id==='av_grade5_master'?'Легенда 5 класса':id==='av_mathquest_master'?'Мастер МатКвеста':'Аватар'}
})().catch(e=>{console.error(e);process.exitCode=1});
