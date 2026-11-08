'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:780},hasTouch:true});
 const failures=[], report=[];
 try{
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const ids=['av_mq_rex','av_mq_mare','av_mq_guard','av_centurion','av_default'];
  for(let round=0;round<12;round++){
   for(const id of ids){
    await page.evaluate(id=>{
      const p=ensureProfileIdentity({...EMPTY_STATE,xp:11000,coins:7000,
       inventory:{...(EMPTY_STATE.inventory||{}),avatars:['av_default',id],pets:['pet_none']},
       equipped:{...(EMPTY_STATE.equipped||{}),avatar:id,pet:'pet_none'}});
      profiles={['Stress-'+id]:p};currentProfile='Stress-'+id;state=p;openLeaderboard();
    },id);
    const core=page.locator('.leader-table .avatar-core').first();
    await core.click({timeout:5000});
    const immediate=await page.evaluate(()=>({
      open:document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'),
      svg:!!document.querySelector('#mk872AvatarViewer .mk30-visual svg'),
      img:!!document.querySelector('#mk872AvatarViewer .mk30-visual img')}));
    let stable=true, reason='';
    try{
      await page.waitForFunction(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'),
        null,{timeout:1300});
      const status=await page.evaluate(()=>({
        id:document.querySelector('#mk872AvatarViewer .avatar-badge')?.getAttribute('data-mk-avatar-id'),
        svg:!!document.querySelector('#mk872AvatarViewer .mk30-visual svg'),
        img:!!document.querySelector('#mk872AvatarViewer .mk30-visual img')}));
      if(status.id!==id||(!status.svg&&!status.img))throw Error('Incorrect viewer artwork '+JSON.stringify(status));
    }catch(e){stable=false;reason=String(e)}
    report.push({round,id,immediate:immediate.open,stable,reason});
    if(!stable)failures.push({round,id,immediate,reason});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open'),null,{timeout:3000});
    if(await page.evaluate(()=>document.querySelector('#mk872AvatarViewer')?.classList.contains('mk872-open')))
     failures.push({round,id,reason:'Viewer did not close after Esc'});
   }
  }
  console.log('UX100_AVATAR_STRESS',JSON.stringify({
    samples:report.length,immediateMisses:report.filter(r=>!r.immediate).length,
    delayedFailures:failures,perAvatar:ids.map(id=>({id,
       instantMisses:report.filter(r=>r.id===id&&!r.immediate).length}))}));
  assert.equal(failures.length,0,'Some repeat viewer attempts failed');
 }finally{await browser.close()}
})().catch(e=>{console.error('UX100_AVATAR_STRESS_FAIL',e.stack||e);process.exitCode=1});
