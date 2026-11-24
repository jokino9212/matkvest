'use strict';
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const assert=require('node:assert/strict');
async function captureTeacher(browser,address,missing=false){
 const context=await browser.newContext({viewport:{width:390,height:870},serviceWorkers:'block'});
 if(missing)await context.route('**/assets/ui/knowledge-map.js?*',r=>r.abort());
 const page=await context.newPage();
 try{
  await page.goto(address);
  await page.waitForFunction(()=>typeof openTeacherDashboard==='function'&&mk854HistoryReady===true);
  await page.evaluate(()=>{teacherUnlocked=true;openTeacherDashboard()});
  const dash=page.locator(missing?'#teacherDashboardVue:not([data-v-app])':'#teacherDashboardVue[data-v-app]');
  await dash.waitFor();
  for(const action of ['profiles','backup']){
   await page.evaluate(()=>openTeacherDashboard());await dash.waitFor();
   await dash.getByRole('button',{name:action==='profiles'?/Новый ученик/:/Резервная копия/}).first().click();
   await page.locator('#overlay.show').waitFor();
   const opened=await page.evaluate(()=>({
    route:mk854Route(),teacherUnlocked,host:mainView.firstElementChild?.id,
    modal:modal.firstElementChild?.className,historyDepth:mk854Depth()
   }));
   await page.keyboard.press('Escape');
   await page.locator('#overlay.show').waitFor({state:'hidden'});
   const closed=await page.evaluate(()=>({
    route:mk854Route(),teacherUnlocked,host:mainView.firstElementChild?.id,
    overlay:overlay.className,historyDepth:mk854Depth(),
    focus:document.activeElement?.outerHTML.slice(0,180)
   }));
   console.log('V280_PREFLIGHT_TEACHER_ESCAPE',JSON.stringify({missing,action,opened,closed}));
  }
 }finally{await context.close()}
}
async function skipAttempt(browser,address,iteration){
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/assets/ui/knowledge-map.js?*',r=>r.abort());
 const page=await context.newPage();
 let info={iteration,success:false};
 try{
  await page.goto(address);
  await page.evaluate(()=>{openGrade(4);startColumnStage('div',0)});
  const column=page.locator('#stage:not([data-v-app])');
  const first=column.locator('input.qin').first();
  await first.press('Enter');
  await column.getByText(/Заполни обязательные клетки/).waitFor();
  const required=column.locator('input[data-exp]:not(.mark-in)');
  const expected=await required.evaluateAll(inputs=>inputs.map(input=>input.dataset.exp));
  for(let i=0;i<expected.length;i++)await required.nth(i).fill(expected[i]);
  await first.press('Enter');
  await column.getByText(/✅ Отлично!/).waitFor();
  await column.locator('#columnPrimary').press('Enter');
  const skip=column.locator('#columnSkip');
  await skip.waitFor({state:'visible'});
  const before=await page.evaluate(()=>({
   done:blockSession?.done,currentItem:blockSession?.currentItem?.itemId,
   solved:columnSolved,finished:blockSession?.finished,dialog:!!mk872Dialog,
   current:task&&[task.a,task.b],isActive:mk872BlockActive(),
   hasStage:!!document.querySelector('#stage')
  }));
  await skip.press('Enter');
  const confirm=page.getByRole('button',{name:'Да, пропустить задание',exact:true});
  info.success=await confirm.waitFor({state:'visible',timeout:2200}).then(()=>true).catch(()=>false);
  const after=await page.evaluate(()=>({
   done:blockSession?.done,currentItem:blockSession?.currentItem?.itemId,
   solved:columnSolved,finished:blockSession?.finished,dialog:!!mk872Dialog,
   current:task&&[task.a,task.b],isActive:mk872BlockActive()
  }));
  info={...info,before,after};
  if(info.success){
   await confirm.press('Enter');
   info.committed=await page.evaluate(()=>blockSession?.items?.map(item=>[item.finalCorrect,item.skipped]));
  }
 }catch(e){info.error=String(e).slice(0,300)}
 finally{await context.close()}
 console.log('V280_PREFLIGHT_SKIP',JSON.stringify(info));
 return info;
}
withMatkvestBrowser(async(browser,address)=>{
 await captureTeacher(browser,address,false);
 await captureTeacher(browser,address,true);
 const outcomes=[];
 for(let i=0;i<12;i++)outcomes.push(await skipAttempt(browser,address,i));
 console.log('V280_PREFLIGHT_SKIP_SUMMARY',JSON.stringify({
  total:outcomes.length,confirmShown:outcomes.filter(x=>x.success).length,
  absent:outcomes.filter(x=>!x.success).length,examples:outcomes.filter(x=>!x.success).slice(0,3)
 }));
 if(outcomes.filter(x=>!x.success).length>0)process.exitCode=2;
}).catch(e=>{console.error(e);process.exitCode=1});
