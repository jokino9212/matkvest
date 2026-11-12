'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const broken=process.argv.includes('--expect-broken');
const html=fs.readFileSync('index.html'),sw=fs.readFileSync('sw.js','utf8');
const cacheVersion=Number(sw.match(/const CACHE_NAME = "matkvest-iphone-v(\d+)";/)?.[1]);
assert(broken?cacheVersion===105:Number.isInteger(cacheVersion)&&cacheVersion>=107,
 'Unexpected cache version '+cacheVersion+(broken?' for v105 baseline':' for current badge regression'));
assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')),'PWA fingerprint mismatch');
const folder='audits/ux107_badge_firstpaint_output';if(!broken)fs.mkdirSync(folder,{recursive:true});

const collect=()=>[...document.querySelectorAll('#modal .profile-badges .profile-badge-chip')].map(el=>{
 const icon=el.querySelector('img,svg,span,picture');
 const outer=el.getBoundingClientRect(),inner=icon?.getBoundingClientRect(),style=getComputedStyle(el);
 return {title:el.title||'',chip:[outer.x,outer.y,outer.width,outer.height].map(x=>+x.toFixed(1)),
   icon:inner?[inner.x,inner.y,inner.width,inner.height].map(x=>+x.toFixed(1)):null,
   clipped:style.overflow,html:el.outerHTML.slice(0,180)};
});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try{
 for(const width of [320,390,900,1280]){
  if(broken&&width!==900)continue;
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
  const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const setup=await page.evaluate(()=>{
   const allBadges=SHOP_CATALOG.badges.map(x=>x.id);
   const allStickers=SHOP_CATALOG.stickers.map(x=>x.id);
   const create=(coins,xp,which)=>{
    const b=allBadges.slice(which,which+3);
    const s=['st_hourglass','st_orbit','st_control_perfect'];
    return ensureProfileIdentity({...EMPTY_STATE,coins,xp,
     inventory:{...(EMPTY_STATE.inventory||{}),badges:allBadges,stickers:allStickers,pets:['pet_none','pet_owl']},
     equipped:{...(EMPTY_STATE.equipped||{}),badges:b,stickers:s,pet:'pet_owl',avatar:'av_default'}});
   };
   profiles={'sausage2628':create(114,5141,0),'Боба':create(181,2851,2)};
   currentProfile='Боба';state=profiles['Боба'];
   openProfiles();
   return {badges:allBadges.length,stickers:allStickers.length,records:Object.keys(profiles)};
  });
  assert.equal(setup.badges,50);
  const p=await page.evaluate(collect);
  assert(p.length>=6,'Fixture did not exercise six badge chips');
  const maxBad=Math.max(...p.map(x=>x.icon?.[2]||0));
  if(broken){
   assert(maxBad>100,'Baseline is not demonstrably broken: '+JSON.stringify(p.slice(0,3)));
   console.log('UX107_REPRODUCED_PRODUCTION_BUG',JSON.stringify({maxBad,example:p.slice(0,3)}));
   await page.close();continue;
  }
  for(const r of p){
   assert(r.chip[2]<=40&&r.chip[3]<=40,'Big badge box in profile '+JSON.stringify(r));
   assert(r.icon&&r.icon[2]<=34&&r.icon[3]<=34,'Big badge IMG in profile '+JSON.stringify(r));
   assert(r.icon[0]>=r.chip[0]-1&&r.icon[1]>=r.chip[1]-1 &&
          r.icon[0]+r.icon[2]<=r.chip[0]+r.chip[2]+1 &&
          r.icon[1]+r.icon[3]<=r.chip[1]+r.chip[3]+1,
       'Icon escapes chip in profile '+JSON.stringify(r));
   assert(r.clipped==='hidden','Profile chip not clipped '+JSON.stringify(r));
  }
  await page.screenshot({path:folder+'/profiles_'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>openLeaderboard());
  const leader=await page.evaluate(collect);
  assert(leader.length>=6,'Fixture did not exercise six leaderboard chips');
  for(const r of leader){
   assert(r.chip[2]<=40&&r.chip[3]<=40,'Big badge box in leaderboard '+JSON.stringify(r));
   assert(r.icon&&r.icon[2]<=34&&r.icon[3]<=34,'Big badge IMG in leaderboard '+JSON.stringify(r));
   assert(r.icon[0]+r.icon[2]<=r.chip[0]+r.chip[2]+1 &&
          r.icon[1]+r.icon[3]<=r.chip[1]+r.chip[3]+1,
        'Icon escapes chip in leaderboard '+JSON.stringify(r));
  }
  await page.screenshot({path:folder+'/leaderboard_'+width+'.png',animations:'disabled'});
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(scroll<=2,'Horizontal document overflow at '+width+': '+scroll);
  assert.deepEqual(jsErrors,[],'Unexpected JS errors');
  const out={width,profiles:p.length,leaderboard:leader.length,largestChip:Math.max(...[...p,...leader].map(x=>x.chip[2])),largestArtwork:Math.max(...[...p,...leader].map(x=>x.icon?.[2]||0)),jsErrors:0};
  results.push(out);console.log('UX107_BADGE_OVERFLOW_FIXED_PASS',JSON.stringify(out));
  await page.close();
 }
}finally{await browser.close()}
if(!broken)fs.writeFileSync(folder+'/qa.json',JSON.stringify({results,version:'v107',original_bug_reproduction:'v105 verified prior'},null,2));
})().catch(e=>{console.error('UX107_BADGE_QA_FAIL',e.stack||e);process.exitCode=1});
