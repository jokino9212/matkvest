'use strict';
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const assert=require('node:assert/strict');
async function run(browser,url,width,fallback){
 const context=await browser.newContext({viewport:{width,height:870},serviceWorkers:'block'});
 if(fallback){await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());}
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const results=[];
 try{
 await p.goto(url,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof showTeacherPinLogin==='function'&&mk854HistoryReady===true);
 const ids=await p.evaluate(()=>{
  for(const name of ['V289 Test A','V289 Test B'])profiles[name]=ensureProfileIdentity({...deepCopy(EMPTY_STATE),coins:19});
  persistSilently();
  return ['V289 Test A','V289 Test B'].map(name=>profiles[name].profileId);
 });
 const snapshot=()=>p.evaluate(()=>({teacher:teacherUnlocked,view:teacherViewingProfileId,profile:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route()),modal:overlay.classList.contains('show'),heading:modal.querySelector('h2')?.textContent,dialog:overlay.classList.contains('show')?modal.textContent:null,roster:Object.keys(profiles).sort()}));
 async function probe(name,open,selector,next,host){
  await open();
  if(!fallback&&host)await p.locator(host+'[data-v-app]').waitFor({state:'attached'});
  const old=p.locator(selector).first();await old.waitFor({state:'attached'});await old.evaluate(el=>window.__v289Old=el);
  await next();await p.waitForTimeout(350);
  const before=await snapshot();const detached=await p.evaluate(()=>!window.__v289Old.isConnected);
  await p.evaluate(()=>window.__v289Old.click());await p.waitForTimeout(350);
  const after=await snapshot();
  results.push({name,detached,changed:JSON.stringify(before)!==JSON.stringify(after),before,after});
 }
 const pin=()=>p.evaluate(()=>showTeacherPinLogin());
 const reset=()=>p.evaluate(()=>showTeacherPinReset());
 const setup=()=>p.evaluate(()=>showTeacherPinSetup());
 await probe('old-pin-login-secondary',pin,'#modal button:text("Забыли PIN?")',setup,'#modal .vue-report');
 await probe('old-pin-reset-secondary',reset,'#modal button:text-is("Отмена")',setup,'#modal .vue-report');
 await probe('old-pin-reset-close',reset,'#modal .vue-report button.x',setup,'#modal .vue-report');
 await reset();
 if(!fallback)await p.locator('#modal .vue-report[data-v-app]').waitFor();
 await p.locator('#modal').getByRole('button',{name:'Отмена',exact:true}).press('Enter');
 await p.locator('#teacherPinLogin').waitFor();
 console.log('PASS_V289_LIVE_RESET_CANCEL',width,fallback);
 await p.evaluate(()=>{closeModal();teacherUnlocked=true;openTeacherDashboard()});
 const detail=id=>p.evaluate(id=>{teacherUnlocked=true;openTeacherStudentDetailById(id)},id);
 await probe('old-student-back',()=>detail(ids[0]),'#teacherStudentVue button:text("Все ученики")',()=>detail(ids[1]),'#teacherStudentVue');
 await probe('old-student-delete-request',()=>detail(ids[0]),'#teacherStudentVue button:text("Удалить ученика")',()=>detail(ids[1]),'#teacherStudentVue');
 const deletion=id=>p.evaluate(id=>requestTeacherDelete(id),id);
 await probe('old-delete-dialog-confirm',async()=>{await detail(ids[0]);await deletion(ids[0])},'#modal button:text-is("Продолжить")',async()=>{await detail(ids[1]);await deletion(ids[1])},'#modal .vue-report');
 for(const r of results){assert.equal(r.detached,true,r.name+' fixture not detached');assert.equal(r.changed,false,r.name+' stale action changed current view');}
 // Active dialog cancel must return without deleting either test pupil.
 await p.locator('#modal').getByRole('button',{name:'Отмена',exact:true}).press('Space');
 await p.waitForFunction(()=>!overlay.classList.contains('show'));
 assert.deepEqual(errors,[]);
 assert(await p.evaluate(ids=>ids.every(id=>!!teacherProfileById(id)),ids),'No real test student deletion permitted');
 console.log('PASS_V289_TEACHER_BASELINE',JSON.stringify({width,fallback,results,errors}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(b,u)=>{await run(b,u,390,false);await run(b,u,1280,false);await run(b,u,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
