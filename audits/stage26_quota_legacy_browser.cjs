'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const url='file://'+path.resolve('index.html');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:720},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   const seed=await page.evaluate(()=>{
    const old={...EMPTY_STATE,xp:612,coins:248,courseProgress:{'numbers':{best:[4,1,0],bonus:[true,false,false]}}};
    delete old.profileId;
    localStorage.removeItem('mq4_profiles');
    localStorage.setItem('mq4_current_profile','Старый ученик');
    localStorage.setItem('mq4',JSON.stringify(old));
    return old;
   });
   await page.reload({waitUntil:'domcontentloaded'});
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
   const quota=await page.evaluate(()=>{
     const original=Storage.prototype.setItem;
     const rawBefore=localStorage.getItem('mq4_profiles');
     Storage.prototype.setItem=function(key,value){
       if(String(key)==='mq4_profiles')throw new DOMException('Storage quota full','QuotaExceededError');
       return original.call(this,key,value);
     };
     state.coins+=1;
     save();
     const message=document.getElementById('rewardPop')?.textContent||'';
     const rawAfter=localStorage.getItem('mq4_profiles');
     Storage.prototype.setItem=original;
     save();
     return {before:rawBefore,after:rawAfter,message,
       afterRecovery:JSON.parse(localStorage.getItem('mq4_profiles')||'{}')[currentProfile]?.coins,
       memoryCoins:state.coins};
   });
   assert.equal(quota.after,quota.before,'Quota failure overwrote last good profile');
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
 }finally{await browser.close()}
 console.log('STAGE26_QUOTA_SUMMARY',JSON.stringify({expected:3,failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
