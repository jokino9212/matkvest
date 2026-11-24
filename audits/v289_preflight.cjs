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
 const snapshot=()=>p.evaluate(()=>({teacher:teacherUnlocked,view:teacherViewingProfileId,profile:state.profileId,xp:state.xp,coins:state.coins,attempts:state.attemptHistory?.length||0,route:JSON.stringify(mk854Route()),modal:overlay.classList.contains('show'),heading:modal.querySelector('h2')?.textContent,roster:Object.keys(profiles).sort()}));
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
 await probe('old-pin-reset-secondary',reset,'#modal button:text("Назад")',pin,'#modal .vue-report').catch(e=>results.push({name:'old-pin-reset-secondary',fixtureError:String(e)}));
 await p.evaluate(()=>{closeModal();teacherUnlocked=true;openTeacherDashboard()});
 const detail=id=>p.evaluate(id=>{teacherUnlocked=true;openTeacherStudentDetailById(id)},id);
 await probe('old-student-back',()=>detail(ids[0]),'#teacherStudentVue button:text("Все ученики")',()=>detail(ids[1]),'#teacherStudentVue');
 await probe('old-student-delete-request',()=>detail(ids[0]),'#teacherStudentVue button:text("Удалить ученика")',()=>detail(ids[1]),'#teacherStudentVue');
 assert(await p.evaluate(ids=>ids.every(id=>!!teacherProfileById(id)),ids),'No real test student deletion permitted');
 console.log('V289_PREFLIGHT',JSON.stringify({width,fallback,results,errors}));
 }finally{await context.close()}
}
withMatkvestBrowser(async(b,u)=>{await run(b,u,390,false);await run(b,u,1280,false);await run(b,u,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
