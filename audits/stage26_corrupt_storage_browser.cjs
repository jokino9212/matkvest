'use strict';
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const V304='9f06afc8134e007c3e72eae231c8f9b519678fe5';
const oldHtml=execFileSync('git',['show',V304+':index.html'],{maxBuffer:32*1024*1024});
async function main(browser,url){
 let failures=0;
 try{
 for(const width of [320,390,768]){
  const context=await browser.newContext({viewport:{width,height:760},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  // Seed the genuine v304 document before a protected authority exists.
  const oldRoute=u=>u.href===url;
  await page.route(oldRoute,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:oldHtml}));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('mq4_v305_authority')),null,'legacy fixture already migrated');
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
  await page.unroute(oldRoute);
  // Migrate on the same origin; never delete a real protected record to prepare a test.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>mk305FlushWrites());
  const valid=await page.evaluate(({a,b})=>({
   current:currentProfile,xp:state.xp,coins:state.coins,
   profiles:Object.keys(profiles).sort(),
   backup:localStorage.getItem('mk872_learning_draft_v1_'+encodeURIComponent(a)),
  }),seed);
  if(valid.current!=='Проба A'||valid.xp!==271||valid.coins!==413||valid.profiles.length!==2||valid.backup!=='THIS_IS_NOT_JSON')
   throw Error('Valid profiles and corrupt draft not isolated '+JSON.stringify(valid));
  const clean=await page.evaluate(async()=>{save();await mk305FlushWrites();return {authority:localStorage.getItem('mq4_v305_authority'),legacy:localStorage.getItem('mq4_profiles'),last:localStorage.getItem('mq4')}});
  const authority=JSON.parse(clean.authority);
  assert.equal(authority.profiles['Проба A'].profileId,seed.a);
  assert.equal(authority.profiles['Проба B'].profileId,seed.b);
  assert.equal(authority.profiles['Проба A'].xp,271);assert.equal(authority.profiles['Проба A'].coins,413);
  assert.equal(authority.profiles['Проба B'].xp,892);assert.equal(authority.profiles['Проба B'].coins,124);
  console.log('PASS_STAGE26_REAL_V304_MIGRATION',width);
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

  // Damage authority itself, preserving the valid compatibility projection.
  for(const raw of ['[INVALID_AUTHORITY_JSON','[]','{"schema":1,"profiles":[],"history":[],"consumed":[]}']){
    await page.evaluate(({clean,raw})=>{localStorage.setItem('mq4_profiles',clean.legacy);localStorage.setItem('mq4',clean.last);localStorage.setItem('mq4_v305_authority',raw)}, {clean,raw});
    await page.reload({waitUntil:'domcontentloaded'});
    const out=await page.evaluate(async()=>{save();await mk305FlushWrites();return {guard:mkV877CorruptProfiles,authority:localStorage.getItem('mq4_v305_authority'),legacy:localStorage.getItem('mq4_profiles'),last:localStorage.getItem('mq4')}});
    assert.deepEqual(out,{guard:true,authority:raw,legacy:clean.legacy,last:clean.last},'damaged authority or valid projection overwritten');
    console.log('PASS_STAGE26_CORRUPT_AUTHORITY',width,raw);
  }
  await context.close();
 }
 }finally{}
 console.log('STAGE26_SUMMARY',JSON.stringify({failures}));
 if(failures)process.exitCode=1;
}
withMatkvestBrowser(main).catch(e=>{console.error(e);process.exitCode=1});
