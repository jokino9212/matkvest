'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path');
const {mkdirSync,writeFileSync}=require('node:fs');
const root=resolve(__dirname,'..'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!path.startsWith(root+sep))return res.writeHead(404).end();res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(path));}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const fixture=await browser.newContext({serviceWorkers:'block'}),source=await fixture.newPage();
  await source.goto(origin+'/v306-fixture/index.html',{waitUntil:'domcontentloaded'});
  await source.waitForFunction(()=>typeof makeBackup==='function'&&typeof mk305FlushWrites==='function');
  const inventory=await source.evaluate(()=>Object.fromEntries(Object.entries(SHOP_CATALOG).map(([category,items])=>[category,items.map(item=>({id:item.id,name:item.name??item.title??null,price:item.price??null,rewardOnly:!!item.rewardOnly}))])));
  assert.equal(inventory.avatars.length,65);assert.equal(inventory.pets.length,31);assert.equal(inventory.badges.length,50);assert.equal(inventory.stickers.length,40);
  assert.equal(inventory.avatars.filter(x=>x.id==='avatar_clash_king').length,1);
  const ids=Object.values(inventory).flat().map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
  const out=resolve(root,'v307-public-fixtures');mkdirSync(out,{recursive:true});
  writeFileSync(resolve(out,'catalog-v306.json'),JSON.stringify({build:'v306',runtime:'6eb9b1d12cc49d6c91fe444f531192855022ff3d',html_sha256:'7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318',inventory},null,2));
   const policy=await source.evaluate(build=>{
    const categories=['avatars','frames','pets','stickers','titles','backgrounds','badges','accessories','nicknameStyles','effects'];
    const defaults=new Set(['av_default','fr_none','pet_none','title_none','bg_none','acc_none','fx_none']);
    const rarities=['rare','epic','legendary'];
    const oldFilter=shopRarityFilter;
    shopRarityFilter='all';
    const items=[];
    try{
     for(const category of categories){
      const visible=new Set(filteredShopItems(category).map(x=>x.id));
      const active=new Set(mk872ActiveCollectionItems(category).map(x=>x.id));
      for(const item of SHOP_CATALOG[category]||[]){
       const eligible=category!=='accessories'&&!item.hiddenInStore&&!item.hiddenFromStore&&!item.legacyHero&&!item.deprecated&&!item.archived&&!item.retired&&!item.retiredPet&&item.studentVisible!==false;
       // Free fallback cosmetics are selectable only when explicitly present in the pinned catalogue.
       const price=Number(item.price||0),level=Number(item.level||1);
       items.push({id:item.id,category,name:String(item.name||item.id),price,level,rarity:String(item.rarity||'common'),reward_only:!!item.rewardOnly,buyable:eligible&&visible.has(item.id)&&!item.rewardOnly&&price>0,selectable:(eligible&&active.has(item.id))||(defaults.has(item.id)&&price===0&&!item.rewardOnly&&category!=='accessories')});
      }
     }
    }finally{shopRarityFilter=oldFilter}
    return {build,items,pools:Object.fromEntries(rarities.map(r=>[r,mk861ChestEntries(r).map(x=>x.item.id)])),rates:Object.fromEntries(rarities.map(r=>[r,Math.round(MK861_CHEST_RATES[r]*10000)])),compensation:{...MK861_CHEST_COMPENSATION},chest_price:MK861_CHEST_PRICE,epic_misses:MK861_EPIC_PLUS_MISSES_BEFORE_GUARANTEE,legendary_misses:MK861_LEGENDARY_MISSES_BEFORE_GUARANTEE,level_linear:MK859_LEVEL_CURVE.linear,level_quadratic:MK859_LEVEL_CURVE.quadratic,refund_now:Math.round(MK865_REFUND_NOW*100),refund_training:Math.round(MK865_REFUND_TRAINING*100),mission_correct:MK865_REQUIRED_CORRECT,collector_stickers:purchasableStickerItems().map(x=>x.id),chest_xp:{...MK305_CHEST_XP},refund_chest:50,history_limit:MK861_CHEST_HISTORY_LIMIT};
   },'7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318');

  assert.equal(policy.items.length,262);
  assert.deepEqual(policy.chest_xp,{rare:60,epic:40,legendary:20});
  assert.equal(policy.items.find(x=>x.id==='avatar_clash_king').buyable,true);
  assert.equal(policy.items.find(x=>x.id==='avatar_clash_king').selectable,true);
  assert.equal(policy.items.find(x=>x.id==='pet_robotx').buyable,false);
  assert.equal(policy.items.find(x=>x.id==='pet_robotx').selectable,false);
  writeFileSync(resolve(out,'economy-v306.json'),JSON.stringify(policy,null,2)+'\n');
  const achievements=await source.evaluate(()=>ACHIEVEMENTS.map(a=>({id:a.id,title:a.title,metric:a.metric??null,target:a.target??null,reward:a.reward??{},targetMetric:a.targetMetric??null,rewardItems:[...(a.rewardType&&a.rewardId?[{category:a.rewardType,id:a.rewardId}]:[]),...achievementCatalogRewardItems(a.id).filter(x=>x.type!==a.rewardType||x.item.id!==a.rewardId).map(x=>({category:x.type,id:x.item.id}))],category:a.category??null,rarity:a.rarity??null})));
  assert.equal(new Set(achievements.map(a=>a.id)).size,achievements.length);
  writeFileSync(resolve(out,'achievements-v306.json'),JSON.stringify(achievements,null,2)+'\n');
  console.log('PASS_V307_EXACT_ECONOMY_EXPORT',JSON.stringify({items:policy.items.length,buyable:policy.items.filter(x=>x.buyable).length,pools:Object.fromEntries(Object.entries(policy.pools).map(([k,v])=>[k,v.length])),achievements:achievements.length}));

  // Render only trusted public, pinned v306 catalogue artwork. No API content or personal data.
  await source.setViewportSize({width:1024,height:3600});
  const artwork=await source.evaluate(async()=>{
    const grid=document.createElement('div');grid.id='mk307-art-grid';
    grid.style.cssText='position:fixed;top:0;left:0;z-index:2147483647;width:960px;display:grid;grid-template-columns:repeat(10,96px);grid-auto-rows:96px;gap:0;background:#f3faf6;overflow:hidden';
    const rows=[];
    for(const [category,items] of Object.entries(SHOP_CATALOG))for(const item of items){
      const cell=document.createElement('div');cell.style.cssText='width:96px;height:96px;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;';
      cell.innerHTML=shopItemIcon(category,item);grid.append(cell);
      rows.push({id:item.id,category,index:rows.length,description:String(item.desc||'')});
    }
    document.body.append(grid);
    for(const img of grid.querySelectorAll('img')){img.loading='eager';if(new URL(img.src).origin!==location.origin)throw Error('Nonlocal artwork');}
    await Promise.all([...grid.querySelectorAll('img')].map(img=>img.decode()));
    await document.fonts.ready;
    if(!grid.querySelector('img[src*="avatar_clash_king.svg"]')?.naturalWidth)throw Error('Missing king artwork');
    return rows;
  });
  assert.equal(artwork.length,262);
  const target=resolve(root,'integrations/v307');
  await source.locator('#mk307-art-grid').screenshot({path:resolve(target,'shop_art_generated.png'),animations:'disabled'});
  writeFileSync(resolve(target,'shop_art_generated.json'),JSON.stringify(artwork));
  writeFileSync(resolve(target,'shop_art_generated.css'),'.v307-art{display:inline-block;width:96px;height:96px;background-image:url("./shop_art_generated.png");background-repeat:no-repeat;flex-shrink:0;border-radius:12px;vertical-align:middle}'+artwork.map(a=>'.v307-art-'+a.index+'{background-position:-'+(a.index%10*96)+'px -'+(Math.floor(a.index/10)*96)+'px}').join('\n'));
  await source.evaluate(()=>document.getElementById('mk307-art-grid').remove());
  console.log('PASS_V307_PINNED_SHOP_ART',artwork.length);
  const actual=await source.evaluate(async()=>{
    save();await mk305FlushWrites();
    for(let i=1;i<=4;i++){
      openProfiles();document.getElementById('newProfileName').value='Пробный '+i;createProfile();await mk305FlushWrites();
      if(currentProfile!=='Пробный '+i)throw Error('Profile creation failed '+i);
      state.xp=100+i;state.coins=40+i;progressFor('g4:table').best[0]=4;
      if(i===1){state.inventory.avatars.push('avatar_clash_king');state.equipped.avatar='avatar_clash_king';}
      if(i===2){const sold=SHOP_CATALOG.pets.find(x=>x.id==='pet_cat');if(!sold)throw Error('Missing known sale fixture');state.inventory.pets=state.inventory.pets.filter(id=>id!==sold.id);state.acquisitionMetadata['pets:'+sold.id]={purchaseTimestamp:1000,soldTimestamp:2000,paidPrice:100};}
      save();await mk305FlushWrites();
    }
    return makeBackup('all');
  });
  assert.equal(actual.scope,'all');const names=Object.keys(actual.profiles);assert.equal(names.length,5);assert.equal(new Set(Object.values(actual.profiles).map(p=>p.profileId)).size,5);const name=names[0];assert(actual.profiles[name].profileId.startsWith('student_'));
  const subset=keys=>({...actual,currentProfile:keys[0],profiles:Object.fromEntries(keys.map(k=>[k,actual.profiles[k]]))});
  const pc=subset(names.slice(0,3)),laptop=subset([names[0],...names.slice(3)]);
  const diverged=structuredClone(laptop);diverged.profiles[name].coins+=1;await fixture.close();
  // Only synthetic fixture bytes, created inside the browser from the pinned runtime.
  writeFileSync(resolve(out,'pc.json'),JSON.stringify(pc));writeFileSync(resolve(out,'laptop.json'),JSON.stringify(laptop));console.log('PASS_V307_CATALOG_FIXTURE',JSON.stringify(Object.fromEntries(Object.entries(inventory).map(([k,v])=>[k,v.length]))));
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
