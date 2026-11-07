'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1280]){
   const ctx=await browser.newContext({viewport:{width,height:800}});
   const page=await ctx.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+process.cwd()+'/index.html',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
    const thumbnail=document.createElement('span');
    thumbnail.className='pet-mini';
    thumbnail.textContent='🦊';
    document.body.append(thumbnail);
    thumbnail.click();
   });
   const data=await page.evaluate(()=>{
    const v=document.querySelector('#mk872AvatarViewer');
    const wrap=v?.querySelector('.mk30-visual.mk30-pet');
    const art=wrap?.firstElementChild;
    const b=art?.getBoundingClientRect();
    return {open:v?.classList.contains('mk872-open'),count:wrap?.children.length,
      width:b?.width,height:b?.height,viewerWidth:wrap?.getBoundingClientRect().width,
      label:v?.querySelector('#mk872ViewerTitle')?.textContent,
      copies:v?.querySelectorAll('.mk30-visual.mk30-pet').length};
   });
   assert(data.open,'Viewer must open at '+width);
   assert.equal(data.count,1,'Only one artwork child');
   assert.equal(data.copies,1,'Only one pet viewer');
   assert(data.width>=150&&data.height>=150,'Pet did not enlarge '+JSON.stringify(data));
   assert(data.width/data.viewerWidth>.90,'Pet is still tiny '+JSON.stringify(data));
   assert(data.label==='Питомец','Tiny emoji must not be repeated as caption '+JSON.stringify(data));
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#mk872AvatarViewer').evaluate(el=>el.classList.contains('mk872-open'))),'Escape must close');
   assert.equal(errors.length,0,'No runtime errors '+errors.join('; '));
   console.log('PET_VIEWER_PASS',width,data.width,data.height,data.label);
   await ctx.close();
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
