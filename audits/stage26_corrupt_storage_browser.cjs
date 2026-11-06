'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');
const url='file://'+path.resolve('index.html');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:760},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const seed=await page.evaluate(()=>{
   const prof=JSON.parse(localStorage.getItem('mq4_profiles')||'{}');
   const a=ensureProfileIdentity({...EMPTY_STATE,xp:271,coins:413,courseProgress:{'g7:rational_numbers_forms':{best:[4,0,0]}}});
   const b=ensureProfileIdentity({...EMPTY_STATE,xp:892,coins:124,courseProgress:{'g8:square_root_arithmetic':{best:[5,0,0]}}});
   localStorage.setItem('mq4_profiles',JSON.stringify({'Проба A':a,'Проба B':b}));
   localStorage.setItem('mq4_current_profile','Проба A');
   localStorage.setItem('mq4',JSON.stringify(a));
   localStorage.setItem('mk872_learning_draft_v1_'+encodeURIComponent(a.profileId),'THIS_IS_NOT_JSON');
   return {a:a.profileId,b:b.profileId,original:localStorage.getItem('mq4_profiles')};
  });
  // New browser load should not destroy valid user balances or corrupt draft bytes.
  await page.reload({waitUntil:'domcontentloaded'});
  const valid=await page.evaluate(({a,b})=>({
   current:currentProfile,xp:state.xp,coins:state.coins,
   profiles:Object.keys(profiles).sort(),
   backup:localStorage.getItem('mk872_learning_draft_v1_'+encodeURIComponent(a)),
  }),seed);
  if(valid.current!=='Проба A'||valid.xp!==271||valid.coins!==413||valid.profiles.length!==2||valid.backup!=='THIS_IS_NOT_JSON')
   throw Error('Valid profiles and corrupt draft not isolated '+JSON.stringify(valid));
  const corrupted='[INVALID_PROFILE_JSON:DO_NOT_REPLACE]';
  await page.evaluate(value=>localStorage.setItem('mq4_profiles',value),corrupted);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>save());
  const outcome=await page.evaluate(()=>({
   stored:localStorage.getItem('mq4_profiles'),
   current:currentProfile,
   xp:state.xp,coins:state.coins,
   originalLegacy:JSON.parse(localStorage.getItem('mq4')||'{}')?.xp,
   guard:typeof mkV877CorruptProfiles!=='undefined'?mkV877CorruptProfiles:null,
   keys:Object.keys(localStorage).filter(x=>/backup|recovery|corrupt/.test(x)).slice(0,10)
  }));
  console.log('STAGE26_CASE',JSON.stringify({width,valid,corruptProfile:{...outcome,stored:String(outcome.stored).slice(0,150)},errors:errors.slice(0,3)}));
  if(outcome.stored!==corrupted) {failures++;console.error('FAIL_STAGE26',JSON.stringify({width,reason:'CORRUPT_PROFILE_OVERWRITTEN',stored:String(outcome.stored).slice(0,160)}))}
  if(outcome.originalLegacy!==271){failures++;console.error('FAIL_STAGE26',JSON.stringify({width,reason:'LAST_GOOD_LEGACY_OVERWRITTEN',originalLegacy:outcome.originalLegacy}))}
  if(!outcome.guard){failures++;console.error('FAIL_STAGE26',JSON.stringify({width,reason:'SAFE_MODE_NOT_ENABLED'}))}
  for(const invalidShape of ['[]','{"Проба A":42}']){
    await page.evaluate(raw=>localStorage.setItem('mq4_profiles',raw),invalidShape);
    await page.reload({waitUntil:'domcontentloaded'});
    const afterShape=await page.evaluate(()=>{save();return {raw:localStorage.getItem('mq4_profiles'),xp:state.xp,coins:state.coins,guard:mkV877CorruptProfiles}});
    if(afterShape.raw!==invalidShape||afterShape.xp!==271||afterShape.coins!==413||!afterShape.guard){
      failures++;
      console.error('FAIL_STAGE26',JSON.stringify({width,reason:'PARSEABLE_INVALID_SCHEMA',invalidShape,afterShape}));
    }else console.log('PASS_STAGE26_INVALID_SCHEMA',JSON.stringify({width,invalidShape,protected:true}));
  }

  await context.close();
 }
 }finally{await browser.close()}
 console.log('STAGE26_SUMMARY',JSON.stringify({failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
