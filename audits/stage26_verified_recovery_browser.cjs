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
const {readFileSync}=require('node:fs');
async function checkStorageRecovery(browser,address,viewport){
 const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500,acceptDownloads:true,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>{errors.push('Unexpected native dialog: '+dialog.message());return dialog.dismiss()});
 const banner=page.locator('#mk-v877-storage-recovery[data-v-app]');
 const view=page.locator('#overlay.show .vue-report[data-v-app]');
 const restore=banner.getByRole('button',{name:'Восстановить из полной копии',exact:true});
 const replace=view.getByRole('button',{name:'Заменить всё',exact:true});
 const corrupt='{"Оборванные данные ученика":\n';
 const snapshot=()=>page.evaluate(()=>({
  guard:mkV877CorruptProfiles,raw:localStorage.getItem('mq4_profiles'),
  rescue:localStorage.getItem('mk_v877_corrupt_profiles_rescue'),
  savedName:localStorage.getItem('mq4_current_profile'),legacy:localStorage.getItem('mq4'),
  settings:localStorage.getItem('mq4_app_settings'),
  active:currentProfile,profiles:Object.keys(profiles).sort().map(name=>[name,profiles[name].profileId,profiles[name].coins,profiles[name].xp])
 }));
 try{
  const ids=await seedLegacy(page,address,()=>{
   const first=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:101,xp:492});
   const second=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:509,xp:783});
   first.courseProgress['g4:table']={best:[STAGES[0].need,0,0]};
   localStorage.setItem('mq4_profiles',JSON.stringify({'Проба А':first,'Проба Б':second}));
   localStorage.setItem('mq4_current_profile','Проба А');
   localStorage.setItem('mq4',JSON.stringify(first));
   return [first.profileId,second.profileId];
  });
  const backup=await page.evaluate(async()=>{save();await mk305FlushWrites();return makeBackup('all')});
  assert.equal(backup.scope,'all');
  assert.equal(backup.currentProfile,'Проба А');
  assert.deepEqual(['Проба А','Проба Б'].map(name=>backup.profiles[name].profileId),ids);
  assert.deepEqual(['Проба А','Проба Б'].map(name=>[backup.profiles[name].coins,backup.profiles[name].xp]),[[101,492],[509,783]]);
  backup.currentProfile='Проба Б';
  const expected=Object.keys(backup.profiles).sort().map(name=>{
   const profile=backup.profiles[name];
   return [name,profile.profileId,profile.coins,profile.xp];
  });
  assert.equal(await banner.count(),0);
  await page.evaluate(raw=>localStorage.setItem('mq4_profiles',raw),corrupt);
  await page.reload();
  await banner.getByRole('alert').getByText(/Данные профилей повреждены/).waitFor();
  await banner.getByRole('alert').getByText(/Автосохранение приостановлено/).waitFor();
  await page.evaluate(()=>persistSilently());
  const before=await snapshot();
  assert.equal(before.guard,true);
  assert.equal(before.raw,corrupt);
  assert.deepEqual(before.profiles,expected.slice(0,1));


  await restore.click();
  await view.getByRole('heading',{name:/Данные и резервные копии/}).waitFor();
  // The warning stays present while the file dialog and its close button remain usable.
  await view.getByRole('button',{name:'Закрыть окно',exact:true}).click();
  await view.waitFor({state:'hidden'});
  await restore.click();
  const chooserEvent=page.waitForEvent('filechooser');
  await view.getByRole('button',{name:'Выбрать файл',exact:true}).click();
  const chooser=await chooserEvent;
  await chooser.setFiles({name:'полная-копия.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  for(const name of Object.keys(backup.profiles))await view.locator('.import-plan').getByText(name,{exact:true}).waitFor();
  await view.getByRole('heading',{name:/Предпросмотр восстановления/}).waitFor();
  await view.getByRole('alert').getByText(/Локальные данные повреждены/).waitFor();
  assert.equal(await view.getByRole('button',{name:'Умно объединить',exact:true}).count(),0);
  await view.getByRole('button',{name:'Скачать повреждённые исходные данные',exact:true}).waitFor();
  assert.deepEqual(await snapshot(),before);
  await replace.click();
  await view.getByRole('heading',{name:/Заменить все данные/}).waitFor();
  await view.getByRole('button',{name:'Отмена',exact:true}).click();
  assert.equal((await snapshot()).raw,corrupt);
  assert.equal((await snapshot()).guard,true);
  await page.evaluate(()=>{
   const original=Storage.prototype.setItem;
   window.failStorageWrite='mk_v877_corrupt_profiles_rescue';
   Storage.prototype.setItem=function(key,value){
    if(this===localStorage&&key===window.failStorageWrite)throw new DOMException('Test quota','QuotaExceededError');
    return original.call(this,key,value);
   };
  });
  await replace.click();
  await view.getByRole('button',{name:'Да, восстановить копию',exact:true}).click();
  await view.getByRole('alert').getByText(/Браузер не смог сохранить копию повреждённых данных/).waitFor();
  assert.deepEqual(await snapshot(),before);

  const receipt=page.waitForEvent('download');
  await view.getByRole('button',{name:'Скачать повреждённые исходные данные',exact:true}).click();
  const download=await receipt;
  assert.equal(download.suggestedFilename(),'matkvest_corrupt_profiles_rescue.txt');
  assert.deepEqual(readFileSync(await download.path()),Buffer.from(corrupt));
  assert.equal(await page.evaluate(()=>mkV877RecoveryExported),true);
  assert.equal((await snapshot()).raw,corrupt);

  await page.evaluate(()=>{window.failStorageWrite='mq4_profiles'});
  const retry=view.getByRole('button',{name:'Повторить восстановление',exact:true});
  await retry.click();
  await view.getByRole('alert').getByText(/Браузер не смог записать восстановленные профили/).waitFor();
  const preserved={...before,rescue:corrupt};
  assert.deepEqual(await snapshot(),preserved);
  await page.evaluate(()=>persistSilently());
  assert.deepEqual(await snapshot(),preserved);
  await page.evaluate(()=>{window.failStorageWrite=null});
  await retry.click();
  await view.getByRole('heading',{name:/Профили учеников/}).waitFor();
  await banner.waitFor({state:'detached'});
  const restored=await snapshot();
  assert.equal(restored.guard,false);
  assert.equal(restored.rescue,corrupt);
  assert.equal(restored.active,backup.currentProfile);
  assert.deepEqual(restored.profiles,expected);
  assert.deepEqual(Object.keys(JSON.parse(restored.raw)).sort(),Object.keys(backup.profiles).sort());
  await page.keyboard.press('F5');
  await page.reload();
  assert.equal(await banner.count(),0);
  const after=await snapshot();
  assert.equal(after.guard,false);
  assert.equal(after.rescue,corrupt);
  assert.equal(after.active,backup.currentProfile);
  assert.deepEqual(after.profiles,expected);
  assert.equal(await page.evaluate(()=>profiles['Проба А'].courseProgress['g4:table'].best[0]),backup.profiles['Проба А'].courseProgress['g4:table'].best[0]);
  assert.equal(after.savedName,backup.currentProfile);
  assert.equal(JSON.parse(after.legacy).profileId,backup.profiles[backup.currentProfile].profileId);
  assert.deepEqual(errors,[]);
  console.log('PASS_STAGE26_RECOVERY',JSON.stringify({width:viewport.width,originalBytesPreserved:true,explicitRestore:true,bothProfilesPreserved:true,quotaFailuresTested:true}));
 }finally{await context.close()}
}

withMatkvestBrowser(async(browser,url)=>{for(const width of [320,390,768])await checkStorageRecovery(browser,url,{width,height:760});console.log('STAGE26_RECOVERY_SUMMARY',JSON.stringify({expected:3,failures:0}));}).catch(e=>{console.error(e);process.exitCode=1});
