// Read-only server economy. The installed backend exposes no purchase/resale/equip API.
// All presentation metadata comes from the bundled catalogue, never from server HTML.
const categories={avatars:'Аватары',frames:'Рамки',pets:'Питомцы',stickers:'Стикеры',titles:'Титулы',backgrounds:'Фоны',badges:'Значки',accessories:'Аксессуары',effects:'Эффекты',nicknameStyles:'Стили имени'};
const ident=x=>typeof x==='string'&&x.length>0&&x.length<=160;
export function validateCollection(value){
 if(!value||!Array.isArray(value.items)||!Array.isArray(value.equipped)||!Array.isArray(value.achievements))throw Error('COLLECTION_INVALID');
 const items=new Map();
 for(const x of value.items){
  if(!ident(x.id)||!ident(x.category)||!ident(x.source)||items.has(x.id)||!(x.paid_price===null||Number.isSafeInteger(x.paid_price)&&x.paid_price>=0))throw Error('COLLECTION_INVALID_ITEM');
  items.set(x.id,x);
 }
 for(const x of value.equipped)if(!ident(x.slot)||!items.has(x.item_id)||!Number.isInteger(x.position)||x.position<0)throw Error('COLLECTION_INVALID_EQUIPPED');
 const ids=new Set();
 for(const x of value.achievements){if(!ident(x.id)||ids.has(x.id)||typeof x.reward_recorded!=='boolean'||!ident(x.source))throw Error('COLLECTION_INVALID_ACHIEVEMENT');ids.add(x.id);}
 return structuredClone(value);
}
const BUILD='bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce';
const POLICY='e12e0b972331ecf508f40a0e9a5b285d205807844222d2191260d91a88e54c43';
export function validateEconomy(catalog,state,id){
 if(catalog?.build!==BUILD||catalog.policy_sha256!==POLICY||state?.build!==BUILD||state.profile_id!==id||!Array.isArray(catalog.items)||catalog.items.length!==261||!Array.isArray(state.sale_quotes)||!Array.isArray(state.useful_topics)||!state.chest)return null;
 if(catalog.items.some(i=>!ident(i.id)||!Object.hasOwn(categories,i.category)||!Number.isSafeInteger(i.price)||i.price<0||!Number.isSafeInteger(i.level)||i.level<1||typeof i.buyable!=='boolean'||typeof i.selectable!=='boolean'||typeof i.reward_only!=='boolean')||new Set(catalog.items.map(i=>i.id)).size!==catalog.items.length||catalog.items.filter(i=>i.buyable).length!==184||catalog.chest_price!==200||catalog.refund_now!==40||catalog.refund_training!==80||catalog.mission_correct!==10)return null;
 if(!catalog.rates||!catalog.pools||!state.chest.available||!['rare','epic','legendary'].every(r=>Number.isSafeInteger(catalog.rates[r])&&Array.isArray(catalog.pools[r])&&Number.isSafeInteger(state.chest.available[r])&&state.chest.available[r]>=0&&state.chest.available[r]<=catalog.pools[r].length))return null;
 if(![state.chest.opened,state.chest.miss_epic,state.chest.miss_legendary].every(x=>Number.isSafeInteger(x)&&x>=0))return null;
 if(state.mission&&(!ident(state.mission.id)||!ident(state.mission.item_id)||!ident(state.mission.topic_id)||state.mission.required!==10||!Number.isInteger(state.mission.progress)||state.mission.progress<0||state.mission.progress>10||state.mission.completed!==(state.mission.progress===10)))return null;
 if(state.sale_quotes.some(q=>!ident(q.item_id)||!Number.isSafeInteger(q.refund_now)||q.refund_now<0||!Number.isSafeInteger(q.refund_mission)||q.refund_mission<0)||state.useful_topics.some(x=>!ident(x.topic_id)||!ident(x.title))||!Array.isArray(state.chest.history))return null;
 return {catalog,state};
}
const defaults=new Set(['av_default','fr_none','pet_none','title_none','bg_none','fx_none']);
const multi=new Set(['badges','stickers']);
const rarityLabels={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
function trustedArt(info,collection=false){
 const icon=info?.icon||'◆';return '<div class="'+(collection?'mk872-col-preview':'shop-icon')+'">'+icon+'</div>';
}
export function buildEconomy(snapshot,catalog,achievementList,ops={}){
 const owned=new Map(snapshot.collection.items.map(i=>[i.id,i]));
 const equipped=new Set(snapshot.collection.equipped.map(i=>i.item_id));
 const defs=Object.entries(catalog||{}).filter(([k,v])=>Object.hasOwn(categories,k)&&Array.isArray(v));
 const localItem=(category,id)=>defs.find(([key])=>key===category)?.[1].find(i=>i.id===id);
 const live=snapshot.economy,policy=live?.catalog,state=live?.state,by=new Map((policy?.items||[]).map(i=>[i.id,i])),quotes=new Map((state?.sale_quotes||[]).map(i=>[i.item_id,i]));
 const blocked=!!(ops.busy||ops.pending);
 const level=snapshot.level?.currentLevel??1;
 const collectionSections=Object.entries(categories).map(([category,title])=>{
  const items=snapshot.collection.items.filter(i=>i.category===category).map(i=>{
   const info=localItem(category,i.id);
   const p=by.get(i.id),selected=equipped.has(i.id);
   return {id:i.id,title:p?.name||info?.name||i.id,selected,art:live?trustedArt(info,true):'<div class="mk872-col-preview">◆</div>',meta:(selected?'Выбрано · ':'')+(i.paid_price===null?'Цена приобретения неизвестна':'Приобретено за '+i.paid_price+' монет'),...(live&&p?.selectable?{button:selected?(multi.has(category)?'Убрать':'Выбрано ✓'):'Выбрать',disabled:blocked||(selected&&!multi.has(category))}:{}),sale:live&&quotes.has(i.id)&&!blocked};
  });
  return {id:category,title,owned:items.length,items,serverReadOnly:true};
 }).filter(x=>x.items.length);
 // Unknown historical categories remain visible rather than silently disappearing.
 for(const i of snapshot.collection.items.filter(i=>!Object.hasOwn(categories,i.category))){
  collectionSections.push({id:'archive:'+i.id,title:'Исторические предметы',owned:1,serverReadOnly:true,items:[{id:i.id,title:i.id,selected:equipped.has(i.id),art:'',meta:'Сохранено сервером'}]});
 }
 const achievements=snapshot.collection.achievements.map(i=>({id:i.id,title:achievementList?.find(a=>a.id===i.id)?.title||i.id,selected:true,art:'<div class="mk872-col-preview">🏆</div>',meta:i.reward_recorded?'Награда учтена сервером':'Награда не учтена сервером'}));
 collectionSections.push({id:'achievements',title:'Достижения',owned:achievements.length,serverReadOnly:true,items:achievements});
 const previewSections=defs.map(([id,items])=>({id,title:categories[id],cards:items.filter(i=>!i.hiddenInStore&&!i.archived&&!i.legacyHero&&!i.retired).map(i=>{
  const inCollection=owned.has(i.id);
  return {id:i.id,name:i.name||i.id,level:i.level,description:i.desc||'',rarity:i.rarity||'common',rarityLabel:'',className:'shop-card'+(inCollection?' owned':''),icon:'<div class="shop-icon">◆</div>',equipped:equipped.has(i.id),status:equipped.has(i.id)?'Выбрано':inCollection?'В коллекции':'',priceLabel:i.rewardOnly?'Наградный предмет':'Цена не подтверждена сервером',button:{label:inCollection?'В коллекции':'Покупка недоступна'}};
 })})).filter(x=>x.cards.length);
 const catalogSections=live?Object.entries(categories).map(([id,title])=>({id,title,cards:policy.items.filter(i=>i.category===id&&(i.buyable||i.reward_only&&i.selectable||defaults.has(i.id)||owned.has(i.id)&&i.selectable)).map(i=>{
  const info=localItem(id,i.id),selected=equipped.has(i.id),inCollection=owned.has(i.id),eligible=i.selectable&&(inCollection||defaults.has(i.id));
  let button={label:'Недоступно'};
  if(eligible){button=selected&&!multi.has(id)?{label:'Выбрано ✓'}:{label:selected?'Убрать':'Выбрать',action:'equip',primary:!selected};}
  else if(i.reward_only)button={label:'Наградный предмет'};
  else if(i.buyable&&!inCollection){button=level<i.level?{label:'Нужен ур. '+i.level}:snapshot.wallet.balance<i.price?{label:'Нужно ещё '+(i.price-snapshot.wallet.balance)+' 🪙'}:{label:'Купить за '+i.price+' 🪙',action:'buy',primary:true};}
  if(blocked)button={label:button.label};
  return {id:i.id,name:i.name,level:i.level,description:info?.desc||'',rarity:i.rarity,rarityLabel:rarityLabels[i.rarity]||'',className:'shop-card rarity-card rarity-card-'+i.rarity+(inCollection?' owned':''),icon:trustedArt(info),equipped:selected,status:selected?'Выбрано':inCollection?'В коллекции':'',priceLabel:i.reward_only?'Наградный предмет':i.price?i.price+' 🪙':'Бесплатно',button,sale:quotes.has(i.id)&&!blocked?{allowed:true}:null};
 })})).filter(x=>x.cards.length):previewSections;
 const chest=live?{price:policy.chest_price,tiers:['rare','epic','legendary'].map(r=>({id:r,label:rarityLabels[r],chance:policy.rates[r]/100+'%',progress:'Осталось '+state.chest.available[r]+' из '+policy.pools[r].length})),guarantees:[{text:'Гарантия эпического или выше после '+policy.epic_misses+' неудач: '+state.chest.miss_epic+'/'+policy.epic_misses,hot:state.chest.miss_epic>=policy.epic_misses},{text:'Гарантия легендарного после '+policy.legendary_misses+' неудач: '+state.chest.miss_legendary+'/'+policy.legendary_misses,hot:state.chest.miss_legendary>=policy.legendary_misses}],history:state.chest.history.map(r=>({icon:'🎁',name:r.item_id?(by.get(r.item_id)?.name||r.item_id):'Компенсация '+r.compensation+' 🪙',date:new Date(r.date).toLocaleString('ru-RU')})),disabled:blocked||state.chest.legacy_review_required||snapshot.wallet.balance<policy.chest_price||!Object.values(state.chest.available).some(Boolean),reason:state.chest.legacy_review_required?'Сначала требуется проверка истории перенесённых сундуков.':blocked?'Ожидается подтверждение операции.':snapshot.wallet.balance<policy.chest_price?'Недостаточно монет.':''}:null;
 return {live:!!live,blocked,ops,wallet:{serverReadOnly:true,balance:snapshot.wallet.balance,profile:snapshot.profile.display_name,revision:snapshot.wallet.revision},collectionSections,catalogSections,chest,mission:state?.mission||null,usefulTopics:state?.useful_topics||[],quotes:state?.sale_quotes||[]};
}
