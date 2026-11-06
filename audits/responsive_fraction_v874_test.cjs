'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
async function main(){
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,360,375,390,412,520,768]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1,isMobile:width<=520,hasTouch:width<=520});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    const root=document.createElement('section');root.id='fraction-v874-smoke';root.style='width:min(100%, 290px);box-sizing:border-box; margin:0 auto; padding:8px;border:1px solid #ddd';
    root.innerHTML='<div class="quiz-input-wrap stage18-frac-wrap"><div class="stage18-frac-entry"><div class="stage18-frac-whole"><div class="stage18-frac-label">Целая часть</div><input class="stage18-frac-cell" aria-label="Целая часть"></div><div class="stage18-frac-part"><div class="stage18-frac-label">Дробная часть</div><div class="stage18-frac-stack"><input class="stage18-frac-cell" aria-label="Числитель"><div class="stage18-frac-bar"></div><input class="stage18-frac-cell" aria-label="Знаменатель"></div></div></div></div>';
    document.body.appendChild(root);
    const fields=root.querySelectorAll('input');
    ['-1234567','9876543','1234567'].forEach((v,i)=>{fields[i].value=v;fields[i].dispatchEvent(new Event('input',{bubbles:true}));});
  });
  const result=await page.evaluate(()=>{
    const root=document.querySelector('#fraction-v874-smoke');const parent=root.getBoundingClientRect();
    const els=[...root.querySelectorAll('.stage18-frac-cell,.stage18-frac-bar')];
    const overflow=els.map(e=>({tag:e.tagName,rect:e.getBoundingClientRect()})).filter(({rect:r})=>r.left<parent.left-2||r.right>parent.right+2);
    return {screen:innerWidth,parentLeft:parent.left,parentRight:parent.right,count:els.length,overflow:overflow.map(x=>({left:x.rect.left,right:x.rect.right})),pageScrollWidth:document.documentElement.scrollWidth};
  });
  assert.equal(result.count,4,'Expected whole, numerator, bar, denominator');
  assert.equal(result.overflow.length,0,JSON.stringify({width,result}));
  assert(result.pageScrollWidth<=width+2,'Page horizontally overflows '+JSON.stringify({width,result}));
  await page.close();
  console.log('PASS fraction layout viewport',width,'px');
 }
}finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
