'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function run(browser,url,width,fallback){
 const context=await browser.newContext({viewport:{width,height:870},serviceWorkers:'block',acceptDownloads:true});
 if(fallback){await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());}
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const modal=p.locator('#modal .vue-report');
 const btn=name=>modal.getByRole('button',{name,exact:true});
 const manager=async()=>{await p.evaluate(()=>openDataManager());await modal.locator('#backupFileInput').waitFor({state:'attached'});if(!fallback)await p.locator('#modal .vue-report[data-v-app]').waitFor()};
 const upload=async(name,data,heading=/Предпросмотр умного импорта/)=>{await modal.locator('#backupFileInput').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await modal.getByRole('heading',{name:heading}).waitFor()};
 const roster=()=>p.evaluate(()=>Object.entries(profiles).map(([n,v])=>[n,v.profileId,v.coins,v.xp]).sort());
 try{
 await p.goto(url);await p.waitForFunction(()=>typeof openDataManager==='function'&&mk854HistoryReady===true);
 const fixture=await p.evaluate(()=>{
  const backup=makeBackup('current');const name=Object.keys(backup.profiles)[0];const local=backup.profiles[name].profileId;const incoming=newProfileId();
  backup.profiles[name].profileId=incoming;
  return {backup,name,local,incoming};
 });
 const before=await roster();
 const conflict=async()=>{await manager();await upload('conflict.json',fixture.backup);await btn('Умно объединить').click();await modal.getByRole('heading',{name:/Совпадение профиля/}).waitFor()};
 await conflict();await btn('Пропустить').click();await modal.getByText(/Пропущено профилей:/).waitFor();assert.deepEqual(await roster(),before);
 await conflict();await btn('Да, это тот же ученик').click();await modal.getByRole('status').waitFor();
 const merged=await roster();assert.equal(merged.length,before.length);assert(merged.some(r=>r[1]===fixture.local));
 await conflict();await btn('Нет, это другой ученик').click();await modal.getByRole('status').waitFor();
 const separate=await roster();assert.equal(separate.length,before.length+1);assert(separate.some(r=>r[1]===fixture.incoming));
 await manager();await upload('repeat.json',fixture.backup);await btn('Умно объединить').click();await modal.getByRole('status').waitFor();assert.deepEqual(await roster(),separate);
 // A full backup must preserve profile identities and balances after corrupt storage restoration.
 const full=await p.evaluate(()=>makeBackup('all'));
 const corrupt='{"broken":';
 await p.evaluate(raw=>localStorage.setItem('mq4_profiles',raw),corrupt);await p.reload();
 const banner=p.locator('#mk-v877-storage-recovery');
 await banner.getByRole('button',{name:'Восстановить из полной копии'}).click();
 await upload('restore.json',full,/Предпросмотр восстановления/);
 await btn('Заменить всё').click();await btn('Отмена').click();
 assert.equal(await p.evaluate(()=>localStorage.getItem('mq4_profiles')),corrupt);
 await btn('Заменить всё').click();await btn('Да, восстановить копию').click();
 await banner.waitFor({state:'detached'});assert.deepEqual(await roster(),separate);
 await p.reload();assert.deepEqual(await roster(),separate);
 assert.equal(await p.evaluate(()=>localStorage.getItem('mk_v877_corrupt_profiles_rescue')),corrupt);
 assert.deepEqual(errors,[]);console.log('PASS_FINAL_CONFLICT_RECOVERY',width,fallback);
 }finally{await context.close()}
}
withMatkvestBrowser(async(b,u)=>{await run(b,u,390,false);await run(b,u,1280,false);await run(b,u,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
