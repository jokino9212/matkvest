'use strict';
// Export actual policy from the pinned v290 page, never from client requests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const BUILD='bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce';
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../index.html'))).digest('hex'),BUILD);
(async()=>{
 await withMatkvestBrowser(async(browser,url)=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:850}});
  try{
   const p=await ctx.newPage();
   await p.goto(url);
   await p.waitForFunction(()=>typeof SHOP_CATALOG!=='undefined'&&typeof mk861ChestEntries==='function'&&typeof mk872ActiveCollectionItems==='function'&&typeof mk865SellEligibility==='function');
   const policy=await p.evaluate(build=>{
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
       const eligible=category!=='accessories'&&!item.hiddenInStore&&!item.hiddenFromStore&&!item.legacyHero&&!item.deprecated&&!item.archived&&!item.retired&&item.studentVisible!==false;
       // Free fallback cosmetics are selectable only when explicitly present in the pinned catalogue.
       const price=Number(item.price||0),level=Number(item.level||1);
       items.push({id:item.id,category,name:String(item.name||item.id),price,level,rarity:String(item.rarity||'common'),reward_only:!!item.rewardOnly,buyable:eligible&&visible.has(item.id)&&!item.rewardOnly&&price>0,selectable:(eligible&&active.has(item.id))||(defaults.has(item.id)&&price===0&&!item.rewardOnly&&category!=='accessories')});
      }
     }
    }finally{shopRarityFilter=oldFilter}
    return {build,items,pools:Object.fromEntries(rarities.map(r=>[r,mk861ChestEntries(r).map(x=>x.item.id)])),rates:Object.fromEntries(rarities.map(r=>[r,Math.round(MK861_CHEST_RATES[r]*10000)])),compensation:{...MK861_CHEST_COMPENSATION},chest_price:MK861_CHEST_PRICE,epic_misses:MK861_EPIC_PLUS_MISSES_BEFORE_GUARANTEE,legendary_misses:MK861_LEGENDARY_MISSES_BEFORE_GUARANTEE,level_linear:MK859_LEVEL_CURVE.linear,level_quadratic:MK859_LEVEL_CURVE.quadratic,refund_now:Math.round(MK865_REFUND_NOW*100),refund_training:Math.round(MK865_REFUND_TRAINING*100),mission_correct:MK865_REQUIRED_CORRECT,collector_stickers:purchasableStickerItems().map(x=>x.id)};
   },BUILD);
   const by=new Map(policy.items.map(x=>[x.id,x]));
   assert.equal(by.size,policy.items.length);assert(policy.items.length>30);
   for(const item of policy.items){assert(Number.isSafeInteger(item.price)&&item.price>=0);assert(Number.isSafeInteger(item.level)&&item.level>=1);assert(!item.buyable||!item.reward_only&&item.price>0);}
   const pool=Object.entries(policy.pools).flatMap(([rarity,ids])=>ids.map(id=>{const x=by.get(id);assert(x&&x.rarity===rarity&&!x.reward_only&&x.selectable&&!['avatars','accessories'].includes(x.category));return id}));
   assert.equal(new Set(pool).size,pool.length);
   assert(Object.values(policy.pools).every(xs=>xs.length));
   assert.equal(Object.values(policy.rates).reduce((a,b)=>a+b,0),10000);
   assert.equal(policy.refund_now,40);assert.equal(policy.refund_training,80);assert.equal(policy.mission_correct,10);
   assert(policy.collector_stickers.every(id=>by.get(id)?.category==='stickers'&&!by.get(id)?.reward_only));
   if(policy.collector_stickers.length)assert(by.get('fr_collector')?.reward_only);
   const dest=process.argv[2];assert(dest);const content=JSON.stringify(policy,null,2)+'\n';
   fs.writeFileSync(dest,content,{flag:'wx'});
   // Artifact listing is unavailable through this connector. Output only the
   // public game policy (no account, session or secrets), in bounded chunks.
   const encoded=require('node:zlib').gzipSync(Buffer.from(content)).toString('base64');
   for(let i=0;i<encoded.length;i+=600)console.log('MK95_POLICY_CHUNK '+String(i/600).padStart(4,'0')+' '+encoded.slice(i,i+600));
   console.log('MK95_POLICY_END '+encoded.length);
   const mission=await p.evaluate(()=>({useful:String(mk865UsefulSaleTopics),start:String(mk865StartMission),record:String(mk865RecordMissionCorrect),eligibility:String(mk865SellEligibility),sale:String(mk865SellItem)}));
   const m64=require('node:zlib').gzipSync(Buffer.from(JSON.stringify(mission))).toString('base64');
   for(let i=0;i<m64.length;i+=600)console.log('MK95_MISSION_CHUNK '+String(i/600).padStart(4,'0')+' '+m64.slice(i,i+600));
   console.log('MK95_MISSION_END '+m64.length);
   console.log('PASS_PINNED_ECONOMY_POLICY',JSON.stringify({sha256:crypto.createHash('sha256').update(content).digest('hex'),items:policy.items.length,buyable:policy.items.filter(x=>x.buyable).length,pool:Object.fromEntries(Object.entries(policy.pools).map(([r,ids])=>[r,ids.length])),price:policy.chest_price,rates:policy.rates,compensation:policy.compensation,refund:[policy.refund_now,policy.refund_training]}));
  }finally{await ctx.close()}
 });
})().catch(e=>{console.error(e);process.exitCode=1});
