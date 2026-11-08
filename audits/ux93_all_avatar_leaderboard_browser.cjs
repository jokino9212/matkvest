'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const out='audits/ux93_legacy_avatar_output';fs.mkdirSync(out,{recursive:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:780}});
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const avatarCatalog=await page.evaluate(()=>SHOP_CATALOG.avatars.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,icon:x.icon?.slice(0,120)})));
 console.log('AVATAR_CATALOG',JSON.stringify(avatarCatalog));
 const report=[];
 for(const item of avatarCatalog){
  const setup=await page.evaluate(item=>{
    const p=ensureProfileIdentity({...EMPTY_STATE,coins:100,xp:10000,
     inventory:{...(EMPTY_STATE.inventory||{}),avatars:['av_default',item.id],pets:['pet_none']},
     equipped:{...(EMPTY_STATE.equipped||{}),avatar:item.id,pet:'pet_none'}});
    profiles={['Тестовый '+item.id]:p};currentProfile='Тестовый '+item.id;state=p;
    openLeaderboard();
    const badge=document.querySelector('.leader-table .avatar-badge'),core=badge?.querySelector('.avatar-core')||badge;
    return {html:badge?.outerHTML.slice(0,350),sourceImg:core?.querySelector('img')?.getAttribute('src')||'',sourceSvg:core?.querySelector('svg')?.outerHTML.slice(0,200)||'',sourceText:core?.textContent?.trim()||''};
  },item);
  const core=page.locator('.leader-table .avatar-core').first();
  if(await core.count())await core.click({force:true});else await page.locator('.leader-table .avatar-badge').first().click({force:true});
  const viewer=await page.evaluate(()=>{
    const holder=document.querySelector('#mk872AvatarViewer'),v=holder.querySelector('.mk30-visual'),core=v?.querySelector('.avatar-core')||v;
    return {open:holder.classList.contains('mk872-open'),kind:v?.className,
      img:core?.querySelector('img')?.getAttribute('src')||'',svg:core?.querySelector('svg')?.outerHTML.slice(0,200)||'',
      text:core?.textContent?.trim()||'',html:v?.innerHTML.slice(0,350)||''};
  });
  const result={id:item.id,name:item.name,srcImg:!!setup.sourceImg,srcSvg:!!setup.sourceSvg,
   viewerImg:!!viewer.img,viewerSvg:!!viewer.svg,sameImage:setup.sourceImg===viewer.img,
   sameSvg:setup.sourceSvg===viewer.svg,sameText:setup.sourceText===viewer.text,
   sourceText:setup.sourceText.slice(0,35),viewerText:viewer.text.slice(0,35),open:viewer.open,
   malformed:!viewer.open||!viewer.kind?.includes('mk30-avatar')||(!!setup.sourceImg&&!viewer.img)||(!!setup.sourceSvg&&!viewer.svg)};
  report.push(result);console.log('AVATAR_CHECK',JSON.stringify(result));
  if(['av_centurion','av_grade5_master'].includes(item.id))console.log('LAYER_LAYOUT',item.id,JSON.stringify(await page.evaluate(()=>{const root=document.querySelector('#mk872AvatarViewer .mk30-visual');return [...root.querySelectorAll('.stack-icon,.stack-base,.stack-badge,img')].map(x=>{let r=x.getBoundingClientRect(),c=getComputedStyle(x);return {tag:x.tagName,cls:x.className?.baseVal||x.className,txt:x.textContent.trim().slice(0,12),w:r.width,h:r.height,left:r.left,top:r.top,fontSize:c.fontSize,position:c.position};})})));
  if(['av_default','av_centurion','av_grade5_master','av_mathquest_master'].includes(item.id)||item.id===avatarCatalog[avatarCatalog.length-1].id)await page.screenshot({path:out+'/avatar_'+item.id+'.png',animations:'disabled'});
  await page.keyboard.press('Escape');
 }
 fs.writeFileSync(out+'/legacy_avatar_matrix.json',JSON.stringify({avatarCatalog,report},null,2));
 console.log('LEGACY_AVATAR_AUDIT_TOTAL',report.length,'FAIL',report.filter(x=>x.malformed).length);
 assert(report.length>=10,'Unexpectedly small avatar catalog');
 assert(report.every(x=>!x.malformed),'Malformed legacy avatar zoom '+JSON.stringify(report.filter(x=>x.malformed)));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
