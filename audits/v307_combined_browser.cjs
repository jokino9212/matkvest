'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const root=resolve(__dirname,'../dist-v307-review'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'allow'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin+'/local/index.html');await page.waitForFunction(()=>typeof makeBackup==='function'&&typeof mk305FlushWrites==='function');
  const before=await page.evaluate(async()=>{state.xp=271;state.coins=413;save();await mk305FlushWrites();return {name:currentProfile,id:state.profileId,coins:state.coins,xp:state.xp,authority:localStorage.getItem('mq4_v305_authority')}});
  assert.equal(before.coins,413);assert.equal(before.xp,271);
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,{},{timeout:30000});
  assert((await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL)).endsWith('/local/sw.js'));
  await page.getByRole('link',{name:'Серверный кабинет (тест)'}).click();await page.getByRole('heading',{name:'Вход в МатКвест'}).waitFor();
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/integrations/v307/account-offline-sw.js'),{},{timeout:30000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('mq4_v305_authority')),before.authority);
  await page.getByRole('link',{name:'Вернуться к локальным профилям'}).click();await page.waitForFunction(()=>typeof mk305FlushWrites==='function');
  const after=await page.evaluate(()=>({name:currentProfile,id:state.profileId,coins:state.coins,xp:state.xp}));
  assert.deepEqual(after,{name:before.name,id:before.id,coins:413,xp:271});
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof mk305FlushWrites==='function');assert.equal(await page.evaluate(()=>state.coins),413);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS_V307_COMBINED_LOCAL_ISOLATION',width);
 }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
