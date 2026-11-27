'use strict';
const assert=require('node:assert/strict');
const {withMatkvestBrowser}=require('./matkvest_browser_harness.cjs');
const labels={avatars:'Аватар',frames:'Рамка',pets:'Питомец',titles:'Титул',backgrounds:'Фон',badges:'Значок',stickers:'Наклейка',effects:'Аура (эффект)',nicknameStyles:'Оформление имени',accessories:'Аксессуар'};
const rarities=['rare','epic','legendary'];
async function run(browser,url,width,fallback){
 const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
 if(fallback)await ctx.route('**/assets/ui/knowledge-map.js*',r=>r.abort());
 try{
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>typeof mk305FlushWrites==='function'&&mk854HistoryReady);
  await p.evaluate(()=>{state.coins=50000;state.xp=10000;save();return mk305FlushWrites()});
  const candidates=await p.evaluate(rs=>rs.flatMap(rarity=>mk861UnownedEntries(state,rarity).map(x=>({rarity,type:x.type,id:x.item.id}))),rarities);
  const categories=[...new Set(candidates.map(x=>x.type))];
  assert(categories.length>0);
  for(const type of categories){
   assert(labels[type],'Unmapped chest category '+type);
   const target=candidates.find(x=>x.type===type);
   const r=await p.evaluate(async target=>{
    const roll=mk861RollRarity,pick=mk861PickArray;mk861RollRarity=()=>target.rarity;mk861PickArray=a=>a.find(x=>x.item.id===target.id)||null;
    try{const before={coins:state.coins,xp:state.xp};const r=await mk861OpenChestTransaction();return {id:r?.rewardId,type:r?.type,name:r?.item?.name,comp:r?.compensation,bonus:r?.bonusXp,deltaCoins:state.coins-before.coins,deltaXp:state.xp-before.xp};}
    finally{mk861RollRarity=roll;mk861PickArray=pick}
   },target);
   assert.equal(r.id,target.id);assert.equal(r.type,type);assert(!r.comp);
   assert.equal(r.deltaCoins,-200);assert.equal(r.deltaXp,r.bonus);
   const root=p.locator('.mk861-reveal');
   if(!fallback)await p.locator('.mk861-reveal[data-v-app]').waitFor();
   else assert.equal(await root.getAttribute('data-v-app'),null);
   await root.getByRole('button',{name:'Пропустить'}).click();
   await root.locator('.mk861-result').waitFor({state:'visible'});
   const message=await root.innerText();
   assert(message.includes('Тип: '+labels[type]),message);
   assert(message.includes(r.name),message);
   assert(message.includes('+'+r.bonus+' XP'),message);
   assert(await root.getByRole('button',{name:/Продать за/}).isVisible());
   await root.getByRole('button',{name:'Готово'}).click();
   await root.waitFor({state:'detached'});
   console.log('V306_TYPE_PASS',JSON.stringify({width,fallback,type,id:r.id,label:labels[type]}));
  }
  // An exhausted rarity produces coins, not a fictional cosmetic category.
  await p.evaluate(async()=>{for(const x of mk861ChestEntries('rare'))mk865RememberEverOwned(state,x.type,x.item.id);save();await mk305FlushWrites()});
  const comp=await p.evaluate(async()=>{const roll=mk861RollRarity;mk861RollRarity=()=> 'rare';try{const r=await mk861OpenChestTransaction();return {comp:r?.compensation,bonus:r?.bonusXp}}finally{mk861RollRarity=roll}});
  assert.equal(comp.comp,true);assert.equal(comp.bonus,0);
  const root=p.locator('.mk861-reveal');
  if(!fallback)await p.locator('.mk861-reveal[data-v-app]').waitFor();
  await root.getByRole('button',{name:'Пропустить'}).click();
  assert(!(await root.innerText()).includes('Тип:'));
  assert.equal(await root.getByRole('button',{name:/Продать за/}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('V306_COMPENSATION_PASS',width,fallback);
 }finally{await ctx.close()}
}
withMatkvestBrowser(async(browser,url)=>{
 for(const width of [390,1280])for(const fallback of [false,true])await run(browser,url,width,fallback);
}).catch(e=>{console.error(e);process.exitCode=1});
