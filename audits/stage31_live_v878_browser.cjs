'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const url='https://jokino9212.github.io/matkvest/';
const localHash=crypto.createHash('sha256').update(fs.readFileSync(path.resolve('index.html'))).digest('hex');
const sw=fs.readFileSync(path.resolve('sw.js'),'utf8');
assert(sw.includes(localHash),'Local SW hash mismatches HTML');
assert(sw.includes('matkvest-iphone-v78'),'SW not v78');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failures=0;
 try{
  for(const width of [320,390,768]){
   const context=await browser.newContext({viewport:{width,height:760},isMobile:width<500,hasTouch:width<500,serviceWorkers:'allow'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response.status(),200,'Live site HTTP status');
    const result=await page.evaluate(async()=>{
     const response=await fetch('./index.html',{cache:'no-store'});
     const src=await response.text();
     const bytes=new TextEncoder().encode(src);
     const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
     const hash=Array.from(digest).map(x=>x.toString(16).padStart(2,'0')).join('');
     const script=await (await fetch('./sw.js',{cache:'no-store'})).text();
     const expected=script.match(/APP_BUILD_HASH\s*=\s*"([a-f0-9]{64})"/)?.[1];
     const cacheName=script.match(/CACHE_NAME\s*=\s*"([^"]+)"/)?.[1];
     const missing=[];
     for(const name of ['mk30CollectionWorth','openLeaderboard','openCollection','openShop']) {
      if(typeof window[name]!=='function')missing.push(name);
     }
     const a=SHOP_CATALOG.avatars.find(x=>x.price>0);
     const p=SHOP_CATALOG.pets.find(x=>x.id!=='pet_none'&&x.price>0);
     const badge=SHOP_CATALOG.badges.find(x=>x.price>0);
     if(!a||!p||!badge)throw Error('Missing catalog assets');
     const student=ensureProfileIdentity({...EMPTY_STATE,coins:114,xp:1500,inventory:{
      ...(EMPTY_STATE.inventory||{}),avatars:[a.id],pets:[p.id],badges:[badge.id]},
      equipped:{...(EMPTY_STATE.equipped||{}),avatar:a.id,pet:p.id}
     });
     profiles={'Live Gate Test':student};currentProfile='Live Gate Test';state=student;
     const expectedWorth=a.price+p.price+badge.price;
     const worth=mk30CollectionWorth(student);
     openLeaderboard();
     const columns=[...document.querySelectorAll('.leader-table thead th')].map(e=>e.textContent.trim());
     const row=document.querySelector('.leader-table tbody tr');
     const worthCell=row?.querySelector('.mk30-worth')?.textContent.trim();
     const avatar=row?.querySelector('.avatar-badge');
     const pet=row?.querySelector('.pet-mini');
     const docWidth=document.documentElement.scrollWidth;
     return {hash,expected,cacheName,missing,expectedWorth,worth,columns,worthCell,hasAvatar:!!avatar,hasPet:!!pet,docWidth,
       viewport:document.documentElement.clientWidth,scriptContainsFix:script.includes('matkvest-iphone-v78')};
    });
    assert.equal(result.hash,localHash,'Live HTML is not current main');
    assert.equal(result.expected,localHash,'Live SW hash mismatches live HTML');
    assert.equal(result.cacheName,'matkvest-iphone-v78');
    assert.equal(result.missing.length,0,'Missing runtime functions');
    assert.equal(result.worth,result.expectedWorth,'Live collection valuation mismatch');
    assert(result.columns.some(x=>x.startsWith('Коллекция')),'Live leaderboard has no collection column: '+JSON.stringify({columns:result.columns,worthCell:result.worthCell,hash:result.hash}));
    assert.equal(result.worthCell,String(result.expectedWorth),'Live leaderboard value mismatch');
    assert(result.hasAvatar&&result.hasPet,'Avatar or pet missing');
    const original=await page.locator('.leader-table .avatar-badge .avatar-core').first().evaluate(el=>el.parentElement.querySelector('img')?.getAttribute('src'));
    await page.locator('.leader-table .avatar-badge .avatar-core').first().click();
    const avatar=await page.evaluate(()=>{
     const v=document.getElementById('mk872AvatarViewer');
     return {opened:v.classList.contains('mk872-open'),hasCopy:!!v.querySelector('.mk30-avatar .avatar-badge'),
       imageSrc:v.querySelector('.mk30-avatar .avatar-core img')?.getAttribute('src')||null};
    });
    assert(avatar.opened&&avatar.hasCopy,'Live avatar zoom missing');
    if(original!==null)assert.equal(avatar.imageSrc,original,'Live avatar artwork replaced');
    await page.keyboard.press('Escape');
    await page.locator('.leader-table .pet-mini').first().click();
    const pet=await page.evaluate(()=>{
     const v=document.getElementById('mk872AvatarViewer');
     return {opened:v.classList.contains('mk872-open'),hasCopy:!!v.querySelector('.mk30-pet')};
    });
    assert(pet.opened&&pet.hasCopy,'Live pet zoom missing');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>openCollection());
    const collectionText=await page.locator('#modal').innerText();
    assert(collectionText.includes('Стоимость коллекции'),'Live collection missing inventory worth');
    await page.evaluate(()=>openShop('pets'));
    const petIcons=page.locator('#modal .shop-grid .shop-card .shop-icon');
    assert(await petIcons.count()>=2,'No pet shop icons');
    await petIcons.nth(1).click();
    assert(await page.locator('#mk872AvatarViewer .mk30-pet').count(),'Live shop pet zoom missing');
    await page.keyboard.press('Escape');
    assert.deepEqual(errors,[],'JavaScript runtime exceptions');
    console.log('PASS_STAGE31_LIVE',JSON.stringify({width,hash:result.hash,cache:result.cacheName,worth:result.worth,columns:result.columns,
      avatar:avatar.opened,pet:pet.opened,shopPet:true,errors:errors.length}));
   }catch(e){failures++;console.error('FAIL_STAGE31_LIVE',JSON.stringify({width,error:String(e),stack:String(e.stack||'').slice(0,1300)}))}
   await context.close();
  }
 }finally{await browser.close()}
 console.log('STAGE31_LIVE_SUMMARY',JSON.stringify({expected:3,failures}));
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
