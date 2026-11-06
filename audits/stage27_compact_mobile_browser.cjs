'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
const url='file://'+path.resolve('index.html');

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const issues=[],summaries=[];
 try{
 for(const [width,height] of [[320,568],[360,640],[375,667],[390,640],[412,732],[430,740],[768,800]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430});
  for(const [name,initialize] of [
   ['home',()=>renderHome()],
   ['shop',()=>openShop('avatars','all')],
   ['collection',()=>openCollection()],
   ['journal',()=>openAttemptJournal()],
   ['grade8',()=>openGrade(8)],
   ['fraction',()=>startG5QuizStage('g5:frac_to_mixed',0)],
   ['coordinates',()=>startG7QuizStage('g7:coordinate_plane',2)],
   ['column',()=>startColumnStage('div',0)],
  ]){
   const page=await context.newPage();const pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded'});
   try{
    const result=await page.evaluate(init=>{
     eval('('+init+')')();
     const vw=document.documentElement.clientWidth;
     const vh=document.documentElement.clientHeight;
     const overlay=document.getElementById('overlay');
     const modal=document.getElementById('modal');
     const active=overlay?.classList.contains('show')&&modal?.getBoundingClientRect().width>0;
     const area=active?modal:document.getElementById('mainView');
     const box=area?.getBoundingClientRect();
     const elements=[...(area?.querySelectorAll('button,input,select,textarea,[role="button"],.stage18-frac-stack,.stage18-frac-cell,.div-layout,.quizq')||[])]
      .filter(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0});
     const overflow=elements.filter(e=>{
       const r=e.getBoundingClientRect();
       if(e.closest('.shop-tabs'))return false;
       let p=e.parentElement;
       while(p&&p!==area){
        const st=getComputedStyle(p);
        if(['auto','scroll'].includes(st.overflowX)&&p.scrollWidth>p.clientWidth+3)return false;
        p=p.parentElement;
       }
       return r.left<Math.max(0,box?.left||0)-3||r.right>Math.min(vw,box?.right||vw)+3;
     }).slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,65),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}));
     const activeTab=area?.querySelector('.shop-tabs .shop-tab.active');
     const strip=area?.querySelector('.shop-tabs');
     const tabVisible=!activeTab||!strip||activeTab.getBoundingClientRect().left>=strip.getBoundingClientRect().left-3&&activeTab.getBoundingClientRect().right<=strip.getBoundingClientRect().right+3;
     const small=elements.filter(e=>e.matches('button,[role="button"]')&&!e.closest('.shop-tabs')).filter(e=>{const r=e.getBoundingClientRect();return r.height<32&&r.width<100}).slice(0,6)
       .map(e=>({text:e.textContent.trim().slice(0,35),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
     const entry=area?.querySelector('input:not([type="hidden"]),textarea');
     return {vw,vh,active,scrollWidth:document.documentElement.scrollWidth,area:{left:Math.round(box?.left||0),right:Math.round(box?.right||0),scrollHeight:area?.scrollHeight,clientHeight:area?.clientHeight,overflowY:area&&getComputedStyle(area).overflowY},
       overflow,tabVisible,small,controls:elements.length,inputSelector:entry?.id||null};
    },initialize.toString());
    const error=[];
    if(result.scrollWidth>width+2)error.push({type:'document-overflow',actual:result.scrollWidth});
    if(result.overflow.length)error.push({type:'controls-clipped',list:result.overflow});
    if(!result.tabVisible)error.push({type:'active-category-offscreen'});
    if(pageErrors.length)error.push({type:'js',errors:pageErrors.slice(0,3)});
    if(result.inputSelector){
      const input=page.locator('#'+result.inputSelector);
      await input.focus();
      await page.setViewportSize({width,height:Math.min(420,height)});
      await input.evaluate(el=>el.scrollIntoView({block:'nearest',inline:'nearest'}));
      const keyboard=await input.evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,focused:document.activeElement===el}));
      if(keyboard.top < -3 || keyboard.bottom>Math.min(420,height)+3||!keyboard.focused)
       error.push({type:'input-obstructed-after-height-change',keyboard});
    }
    console.log('STAGE27_SCREEN',JSON.stringify({width,height,name,...result,issues:error}));
    summaries.push({width,height,name,issues:error.length});
    if(error.length)issues.push({width,height,name,errors:error});
   }catch(e){issues.push({width,height,name,errors:[{type:'opening-error',reason:String(e).slice(0,200)}]});console.error('STAGE27_OPEN_FAIL',width,height,name,String(e).slice(0,180))}
   await page.close();
  }
  await context.close();
 }
 }finally{await browser.close()}
 console.log('STAGE27_SUMMARY',JSON.stringify({screens:summaries.length,issueCases:issues.length,issues:issues.slice(0,40)}));
 if(issues.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
