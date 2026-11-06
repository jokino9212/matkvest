import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';

const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v69')||!sw.includes(sha))throw Error('19I v69 PWA/hash mismatch');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!exe)throw Error('Chromium missing');
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const url=pathToFileURL(path.resolve('index.html')).href;
const report={stage:'19I',version:'v69',sha,checks:[],errors:[],screens:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail:pass?undefined:detail});}
async function fresh(width){
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push({width,error:String(e)}));
 await p.setViewport({width,height:900,isMobile:width<=600,hasTouch:width<=600});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 return{ctx,p};
}
const state=p=>p.evaluate(()=>{
 const modal=document.getElementById('modal'),shown=!!modal?.getClientRects().length;
 const title=modal?.querySelector('.mtop h2');
 const close=modal?.querySelector('.mtop button.x');
 const active=document.activeElement;
 const buttons=[...(modal?.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')||[])].filter(e=>e.getClientRects().length>0&&e.tabIndex>=0);
 return{shown,role:modal?.getAttribute('role'),ariaModal:modal?.getAttribute('aria-modal'),
    labelledBy:modal?.getAttribute('aria-labelledby'),titleId:title?.id,titleText:title?.innerText,
    closeLabel:close?.getAttribute('aria-label'),closeType:close?.getAttribute('type'),
    activeIn:!!modal?.contains(active),activeIsTitle:active===title,
    activeIsFirst:active===buttons[0],activeIsLast:active===buttons.at(-1),
    activeTag:active?.tagName,activeText:active?.innerText?.slice(0,65),firstText:buttons[0]?.innerText?.slice(0,65),
    buttons:buttons.length,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};
});
try{
 for(const width of [320,390,768,1280]){
  const{ctx,p}=await fresh(width);
  const opened=await p.evaluate(()=>{
    const b=document.querySelectorAll('.grade-grid>.grade-card')[6]?.querySelector('button.btn.primary');
    if(!b)return false;
    b.click();
    const t=[...document.querySelectorAll('#mainView .topic')].find(e=>getComputedStyle(e).cursor==='pointer'&&!e.matches('.locked,.disabled,.soon'));
    if(!t)return false;
    if(t.tabIndex>=0)t.focus();
    t.click();
    return true;
  });
  check('7th-grade topic UI opens at '+width,opened);
  await p.waitForFunction(()=>document.querySelector('#modal[role="dialog"][aria-modal="true"]')?.getClientRects().length>0,{timeout:10000});
  let d=await state(p);
  check('Dialog announces heading and uses correct accessible modal semantics at '+width,
    d.shown&&d.role==='dialog'&&d.ariaModal==='true'&&!!d.titleId&&d.labelledBy===d.titleId,d);
  check('Dialog close button exposes an understandable accessible name at '+width,
    d.closeLabel==='Закрыть окно'&&d.closeType==='button',d);
  check('Focus enters the opened dialog at '+width,d.activeIn&&d.activeIsTitle,d);
  check('Stage dialog remains within viewport at '+width,d.bodyWidth<=width+2,d);
  if(width===390||width===1280)await p.screenshot({path:'audits/ui19i_dialog_'+width+'.png',fullPage:false});
  await p.keyboard.press('Tab');
  d=await state(p);
  check('Tab from dialog heading starts on a real control at '+width,d.activeIn&&d.activeIsFirst,d);
  await p.keyboard.down('Shift');await p.keyboard.press('Tab');await p.keyboard.up('Shift');
  d=await state(p);
  check('Shift+Tab from first wraps to last dialog control at '+width,d.activeIn&&d.activeIsLast,d);
  await p.keyboard.press('Tab');
  d=await state(p);
  check('Tab from last wraps to first dialog control at '+width,d.activeIn&&d.activeIsFirst,d);
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!document.querySelector('#modal')?.getClientRects().length,{timeout:10000});
  d=await state(p);
  check('Escape closes stage selector and removes aria-modal at '+width,!d.shown&&!d.ariaModal,d);
  const restored=await p.evaluate(()=>document.activeElement?.matches('#mainView .topic')||document.activeElement?.matches('.mk872-brand-home'));
  check('Closing dialog returns focus to its origin at '+width,restored);

  // Reusing the same dialog element must also re-announce store and collection.
  const shop=await p.evaluate(()=>{if(typeof openShop!=='function')return false;openShop('pets');return true});
  check('Reward shop opens at '+width,shop);
  await p.waitForFunction(()=>document.querySelector('#modal[role="dialog"][aria-modal="true"]')?.getClientRects().length>0,{timeout:10000});
  d=await state(p);
  check('Shop has the same accessible modal contract at '+width,d.activeIn&&d.labelledBy===d.titleId&&d.closeLabel==='Закрыть окно',d);
  check('Shop has no horizontal viewport overflow at '+width,d.bodyWidth<=width+2,d);
  if(width===390)await p.screenshot({path:'audits/ui19i_shop_390.png',fullPage:false});
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!document.querySelector('#modal')?.getClientRects().length,{timeout:10000});
  const coll=await p.evaluate(()=>{if(typeof openCollection!=='function')return false;openCollection();return true});
  check('Collection opens at '+width,coll);
  await p.waitForFunction(()=>document.querySelector('#modal[role="dialog"][aria-modal="true"]')?.getClientRects().length>0,{timeout:10000});
  d=await state(p);
  check('Collection dialog has focus, name and close control at '+width,d.activeIn&&d.titleText?.includes('коллекц')&&d.labelledBy===d.titleId&&!!d.closeLabel,d);
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!document.querySelector('#modal')?.getClientRects().length,{timeout:10000});
  report.screens.push({width,shop:true,topic:true,collection:true});
  await ctx.close();
 }
}finally{
 await browser.close();
 fs.writeFileSync('audits/ui_stage19i_test_report.json',JSON.stringify(report,null,2)+'\n');
 const fails=report.checks.filter(c=>!c.pass);
 console.log('UI19I v69 '+JSON.stringify({sha,pass:report.checks.length-fails.length,total:report.checks.length,failures:fails,errors:report.errors,screens:report.screens},null,2).slice(0,26000));
 if(fails.length||report.errors.length)process.exitCode=1;
}