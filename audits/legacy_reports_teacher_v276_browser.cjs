'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function check(browser,base,width,missing=false){
 const context=await browser.newContext({viewport:{width,height:870},isMobile:width<600,
  hasTouch:width<600,serviceWorkers:missing?'block':'allow'});
 if(missing){
  await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
  await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());
 }
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof renderTeacherView==='function'&&typeof showVueReport==='function'&&mk854HistoryReady===true);
  if(!missing){
   assert.deepEqual(await page.evaluate(()=>[
    typeof MatKvestVueActions?.reportSurfaceActions,typeof MatKvestVueActions?.teacherViewActions]),
    ['function','function']);
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   assert(await page.evaluate(async()=>{
    const c=await caches.open('matkvest-iphone-v276');
    return (await caches.keys()).includes('matkvest-iphone-v276')&&
      (await c.keys()).some(x=>x.url.endsWith('assets/ui/legacy-vue-actions.js'));
   }));
   await context.setOffline(true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof showVueReport==='function'&&mk854HistoryReady===true);
  }else{
   assert.equal(await page.evaluate(()=>typeof window.MatKvestVueActions),'undefined');
  }

  await page.evaluate(()=>{
   showVueReport('mountMissingV276',{title:'Проверка отчёта v276'},{close:closeModal});
   window.__v276StaleClose=document.querySelector('.vue-report [data-report-close]');
  });
  const modal=page.locator('#modal');
  await modal.getByRole('button',{name:'Закрыть окно',exact:true}).press('Enter');
  assert.equal(await page.locator('#overlay').evaluate(x=>x.classList.contains('show')),false);
  await page.evaluate(()=>{
   showVueReport('mountMissingV276',{title:'Новый отчёт v276'},{close:closeModal});
   window.__v276StaleClose.click();
  });
  await modal.getByRole('heading',{name:'Новый отчёт v276',exact:true}).waitFor();
  assert(await page.locator('#overlay').evaluate(x=>x.classList.contains('show')),
    'A detached fallback close button must not close the new report');
  await modal.getByRole('button',{name:'Закрыть окно',exact:true}).press('Space');
  assert.equal(await page.locator('#overlay').evaluate(x=>x.classList.contains('show')),false);

  const original=await page.evaluate(()=>{
    ensureProfileIdentity(state);
    profiles[currentProfile]=deepCopy(state);
    save();
    teacherUnlocked=true;
    openTeacherDashboard();
    return {profileId:state.profileId,xp:state.xp,coins:state.coins,
      reports:state.attemptHistory?.length||0};
  });
  const dashboard=page.locator(missing?'#teacherDashboardVue:not([data-v-app])':'#teacherDashboardVue[data-v-app]');
  await dashboard.waitFor();
  await page.evaluate(id=>openTeacherStudentReport(id),original.profileId);
  const report=page.locator(missing?'#teacherStudentReportVue:not([data-v-app])':'#teacherStudentReportVue[data-v-app]');
  await report.locator('.student-report-screen').waitFor();
  await report.getByRole('heading',{name:'Отчёт об учебном прогрессе'}).waitFor();
  const periods=report.getByRole('group',{name:'Период отчёта'});
  await periods.getByRole('button',{name:'7 дней',exact:true}).click();
  await report.getByRole('heading',{name:'Отчёт об учебном прогрессе'}).waitFor();
  assert.equal(await periods.getByRole('button',{name:'7 дней',exact:true}).getAttribute('aria-pressed'),'true');
  await report.getByLabel('Начало периода').fill('');
  await report.getByRole('button',{name:'Свой период',exact:true}).click();
  await report.getByRole('alert').getByText('Укажите обе даты собственного периода.').waitFor();
  await report.getByRole('button',{name:/К ученику/}).first().press('Enter');
  const detail=page.locator(missing?'#teacherStudentVue:not([data-v-app])':'#teacherStudentVue[data-v-app]');
  await detail.waitFor();
  const stats=await page.evaluate(()=>({xp:state.xp,coins:state.coins,reports:state.attemptHistory?.length||0}));
  assert.deepEqual(stats,{xp:original.xp,coins:original.coins,reports:original.reports},
    'Report period and navigation must be read-only');
  if(!missing){
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof renderTeacherView==='function'&&mk854HistoryReady===true);
   const after=await page.evaluate(()=>({xp:state.xp,coins:state.coins,
     reports:state.attemptHistory?.length||0}));
   assert.deepEqual(after,stats,'offline F5 must preserve teacher report data/rewards');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS_V276_REPORT_TEACHER_BROWSER',JSON.stringify({width,missing,
    staleReportClose:true,teacherReport:true,period:true,invalidDates:true,
    back:true,rewardStable:true,offlineF5:!missing}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(browser,base)=>{
 await check(browser,base,390);
 await check(browser,base,1280);
 await check(browser,base,390,true);
}).catch(err=>{console.error(err);process.exitCode=1});
