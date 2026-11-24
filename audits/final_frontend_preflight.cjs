'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
async function run(browser,url,width,fallback){
 const context=await browser.newContext({viewport:{width,height:870},serviceWorkers:'block'});
 if(fallback){await context.route('**/assets/ui/knowledge-map.js*',r=>r.abort());await context.route('**/assets/ui/legacy-vue-actions.js*',r=>r.abort());}
 const p=await context.newPage(),errors=[],results=[];p.on('pageerror',e=>errors.push(e.message));
 const modal=p.locator('#modal .vue-report');
 const button=(name)=>modal.getByRole('button',{name,exact:true});
 const manager=async()=>{await p.evaluate(()=>openDataManager());await modal.locator('#backupFileInput').waitFor({state:'attached'});if(!fallback)await p.locator('#modal .vue-report[data-v-app]').waitFor()};
 const snapshot=()=>p.evaluate(()=>({profile:state.profileId,coins:state.coins,xp:state.xp,route:mk854Route(),overlay:overlay.classList.contains('show'),dialog:overlay.classList.contains('show')?document.getElementById('modal').textContent:null,profiles:Object.entries(profiles).map(([n,v])=>[n,v.profileId,v.coins,v.xp]).sort(),pending:typeof pendingImportFilename==='undefined'?null:pendingImportFilename}));
 const data=await (async()=>{await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof openDataManager==='function'&&mk854HistoryReady===true);return p.evaluate(()=>makeBackup('all'))})();
 const upload=async(name,payload)=>{await modal.locator('#backupFileInput').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await modal.getByRole('heading',{name:/Предпросмотр умного импорта/}).waitFor()};
 const probe=async(name,action,next)=>{await action.waitFor();await action.evaluate(el=>window.__finalOld=el);await next();const before=await snapshot();const detached=await p.evaluate(()=>!window.__finalOld.isConnected);await p.evaluate(()=>window.__finalOld.click());await p.waitForTimeout(250);const after=await snapshot();results.push({name,detached,changed:JSON.stringify(before)!==JSON.stringify(after),before,after})};
 try{
  await manager();await upload('first.json',data);
  await probe('stale-preview-replace',button('Заменить всё'),async()=>{await manager();await upload('second.json',data)});
  await manager();await upload('first.json',data);await button('Заменить всё').click();
  await probe('stale-replace-confirm',button('Да, восстановить копию'),async()=>{await manager();await upload('second.json',data);await button('Заменить всё').click();await button('Да, восстановить копию').waitFor()});
  await manager();
  // Hold File.text() or FileReader delivery until the originating dialog is gone.
  await p.evaluate(()=>{
   const original=File.prototype.text;
   window.__finalReleases=[];window.__finalReadCalls=0;
   File.prototype.text=function(){const file=this;window.__finalReadCalls++;return new Promise((res,rej)=>window.__finalReleases.push(()=>original.call(file).then(res,rej)))};
   const read=FileReader.prototype.readAsText;
   FileReader.prototype.readAsText=function(...args){window.__finalReadCalls++;window.__finalReleases.push(()=>read.apply(this,args))};
  });
  await modal.locator('#backupFileInput').setInputFiles({name:'delayed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await p.waitForFunction(()=>window.__finalReadCalls>0,{},{timeout:5000});
  await p.evaluate(()=>closeModal());
  const before=await snapshot();await p.evaluate(()=>window.__finalReleases.splice(0).forEach(f=>f()));await p.waitForTimeout(600);
  const after=await snapshot();results.push({name:'delayed-file-after-close',changed:JSON.stringify(before)!==JSON.stringify(after),before,after});
  if(process.env.FINAL_EXPECT_FIXED==='1'){
   assert.deepEqual(results.map(r=>r.changed),[false,false,false]);
   assert(results.slice(0,2).every(r=>r.detached));
  }else assert.equal(results[2].changed,true,'Baseline must reproduce delayed read');
  console.log('FINAL_PREFLIGHT',JSON.stringify({width,fallback,results,errors}));
  assert.deepEqual(errors,[]);
  if(process.env.FINAL_EXPECT_FIXED==='1'){
   // Earlier selection completes after later selection. Latest preview must win.
   await manager();
   const setFile=(name,payload)=>modal.locator('#backupFileInput').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
   await setFile('old-invalid.json',{bad:true});await setFile('latest.json',data);
   await p.waitForFunction(()=>window.__finalReleases.length===2);
   await p.evaluate(()=>window.__finalReleases.pop()());
   await modal.getByRole('heading',{name:/Предпросмотр умного импорта/}).waitFor();
   await modal.getByRole('heading',{name:'latest.json',exact:true}).waitFor();
   const latest=await snapshot();
   await p.evaluate(()=>window.__finalReleases.shift()());await p.waitForTimeout(600);
   assert.deepEqual(await snapshot(),latest,'Older invalid read changed latest preview');
   // Release a successful read while the originating manager is replaced by a new one.
   await manager();await setFile('obsolete.json',data);await p.waitForFunction(()=>window.__finalReleases.length===1);
   await manager();const newManager=await snapshot();
   await p.evaluate(()=>window.__finalReleases.shift()());await p.waitForTimeout(600);
   assert.deepEqual(await snapshot(),newManager);
   console.log('PASS_FINAL_READ_ORDER',width,fallback);
  }
 }finally{await context.close()}
}
withMatkvestBrowser(async(b,u)=>{await run(b,u,390,false);await run(b,u,1280,false);await run(b,u,390,true)}).catch(e=>{console.error(e);process.exitCode=1});
