'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'..'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!path.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(path));}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const fixture=await browser.newContext({serviceWorkers:'block'}),source=await fixture.newPage();
  await source.goto(origin+'/v306-fixture/index.html',{waitUntil:'domcontentloaded'});
  await source.waitForFunction(()=>typeof makeBackup==='function'&&typeof mk305FlushWrites==='function');
  const actual=await source.evaluate(async()=>{
    save();await mk305FlushWrites();
    for(let i=1;i<=4;i++){
      openProfiles();document.getElementById('newProfileName').value='Пробный '+i;createProfile();await mk305FlushWrites();
      if(currentProfile!=='Пробный '+i)throw Error('Profile creation failed '+i);
      state.xp=100+i;state.coins=40+i;progressFor('g4:table').best[0]=4;save();await mk305FlushWrites();
    }
    return makeBackup('all');
  });
  assert.equal(actual.scope,'all');const names=Object.keys(actual.profiles);assert.equal(names.length,5);assert.equal(new Set(Object.values(actual.profiles).map(p=>p.profileId)).size,5);const name=names[0];assert(actual.profiles[name].profileId.startsWith('student_'));
  const subset=keys=>({...actual,currentProfile:keys[0],profiles:Object.fromEntries(keys.map(k=>[k,actual.profiles[k]]))});
  const pc=subset(names.slice(0,3)),laptop=subset([names[0],...names.slice(3)]);
  const diverged=structuredClone(laptop);diverged.profiles[name].coins+=1;await fixture.close();
  // Only synthetic fixture bytes, created inside the browser from the pinned runtime.
  const {gzipSync}=require('node:zlib');
  console.log('V307_SYNTHETIC_V306_FIXTURE_GZIP',gzipSync(Buffer.from(JSON.stringify([pc,laptop]))).toString('base64'));
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'});const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',req=>requests.push(req.url()));
   await page.goto(origin+'/integrations/v307/backup_review.html');
   const input=page.locator('#backups'),button=page.getByRole('button',{name:'Сверить профили'});
   const file=(name,text)=>({name,mimeType:'application/json',buffer:Buffer.from(text)});
   await input.setInputFiles([file('PC.json',JSON.stringify(pc)),file('Laptop.json',JSON.stringify(laptop))]);await button.click();
   await page.getByText('Сверка завершена. Ничего не перенесено.').waitFor();
   assert((await page.locator('#summary').innerText()).includes('Профилей: '+names.length+' · требуют ручной сверки: 0'));
   assert((await page.locator('#rows').innerText()).includes('PC.json, Laptop.json'));
   await input.setInputFiles([file('PC.json',JSON.stringify(pc)),file('Laptop.json',JSON.stringify(diverged))]);await button.click();
   await page.getByText('Расхождение — нужна сверка',{exact:false}).waitFor();assert((await page.locator('#summary').innerText()).includes('требуют ручной сверки: 1'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
   assert(requests.every(u=>u.startsWith(origin+'/integrations/v307/')),'unexpected network request '+requests.join(','));
   await page.getByRole('button',{name:'Очистить'}).click();assert.equal(await page.locator('#results').isVisible(),false);assert.equal(await button.isDisabled(),true);assert.deepEqual(errors,[]);
   console.log('PASS_V307_REAL_V306_BACKUP_REVIEW',width,names.length);await context.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
