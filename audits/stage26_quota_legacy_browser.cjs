'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const {execFileSync}=require('node:child_process');
const oldHtml=execFileSync('git',['show','9f06afc8134e007c3e72eae231c8f9b519678fe5:index.html'],{maxBuffer:32*1024*1024});
async function seedLegacy(page,url,seed){
 const oldRoute=u=>u.href===url;
 await page.route(oldRoute,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:oldHtml}));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('mq4_v305_authority')),null);
 const result=await page.evaluate(seed);
 await page.unroute(oldRoute);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.evaluate(()=>mk305FlushWrites());
 return result;
}
async function main(browser,url){
 let failures=0;
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:720},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});
  const page=await context.newPage();
  try{
   const seed=await seedLegacy(page,url,()=>{
    const old={...EMPTY_STATE,xp:612,coins:248,courseProgress:{'numbers':{best:[4,1,0],bonus:[true,false,false]}}};
    delete old.profileId;
    localStorage.removeItem('mq4_profiles');
    localStorage.setItem('mq4_current_profile','Старый ученик');
    localStorage.setItem('mq4',JSON.stringify(old));
    return old;
   });
   await page.evaluate(()=>{save();return mk305FlushWrites()});
   const migrated=await page.evaluate(()=>({
     profile:currentProfile,id:state.profileId,xp:state.xp,coins:state.coins,
     progress:state.courseProgress['g4:numbers']?.best,
     persisted:JSON.parse(localStorage.getItem('mq4_profiles')||'{}')['Старый ученик']?.xp
   }));
   assert.equal(migrated.profile,'Старый ученик');
   assert.equal(migrated.xp,612);
   assert.equal(migrated.coins,248);
   assert(migrated.id?.startsWith('student_'),'Missing migrated profile ID');
   assert.equal(migrated.progress?.[0],4,'Lost old stage progress');
   assert.equal(migrated.persisted,612,'Migration not persisted');
   const quota=await page.evaluate(async()=>{
     const original=Storage.prototype.setItem;
     const rawBefore=localStorage.getItem('mq4_profiles');
     const authorityBefore=localStorage.getItem('mq4_v305_authority');
     Storage.prototype.setItem=function(key,value){
       if(String(key)==='mq4_profiles')throw new DOMException('Storage quota full','QuotaExceededError');
       return original.call(this,key,value);
     };
     let failed,message,rawAfter,authorityAfter,pending;
     try{
       state.coins+=1;save();failed=await mk305FlushWrites();
       message=document.getElementById('rewardPop')?.textContent||'';
       rawAfter=localStorage.getItem('mq4_profiles');authorityAfter=localStorage.getItem('mq4_v305_authority');
       pending=Object.keys(localStorage).filter(k=>k.startsWith('mq4_v305_pending:')).length;
     }finally{Storage.prototype.setItem=original}
     save();const recovered=await mk305FlushWrites();
     return {before:rawBefore,after:rawAfter,authorityBefore,authorityAfter,failed,recovered,pending,message,
       afterRecovery:JSON.parse(localStorage.getItem('mq4_profiles')||'{}')[currentProfile]?.coins,
       memoryCoins:state.coins};
   });
   assert.equal(quota.after,quota.before,'Quota failure overwrote last good profile');
   assert.equal(quota.authorityAfter,quota.authorityBefore,'Quota failure overwrote protected authority');
   assert.equal(quota.failed,false);assert.equal(quota.recovered,true);assert(quota.pending>0,'failed save lost pending event');
   assert(/не удалось сохранить/i.test(quota.message),'Missing storage failure user warning: '+quota.message);
   assert.equal(quota.afterRecovery,249,'Saving not recovered after storage became available');
   await page.reload({waitUntil:'domcontentloaded'});
   const final=await page.evaluate(()=>({profile:currentProfile,xp:state.xp,coins:state.coins,
      progress:state.courseProgress['g4:numbers']?.best?.[0],id:state.profileId}));
   assert.equal(final.coins,249);
   assert.equal(final.progress,4);
   assert.equal(final.xp,612);
   assert.equal(final.id,migrated.id);
   console.log('PASS_STAGE26_QUOTA_LEGACY',JSON.stringify({width,migrated,quota:{message:quota.message,lastGoodRetained:true},final}));
  }catch(e){failures++;console.error('FAIL_STAGE26_QUOTA_LEGACY',JSON.stringify({width,error:String(e),stack:String(e.stack||'').slice(0,1200)}))}
  await context.close();
 }
 }finally{}
 console.log('STAGE26_QUOTA_SUMMARY',JSON.stringify({expected:3,failures}));
 if(failures)process.exitCode=1;
}
withMatkvestBrowser(main).catch(e=>{console.error(e);process.exitCode=1});
