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
export function buildEconomy(snapshot,catalog,achievementList){
 const owned=new Map(snapshot.collection.items.map(i=>[i.id,i]));
 const equipped=new Set(snapshot.collection.equipped.map(i=>i.item_id));
 const defs=Object.entries(catalog||{}).filter(([k,v])=>Object.hasOwn(categories,k)&&Array.isArray(v));
 const localItem=(category,id)=>defs.find(([key])=>key===category)?.[1].find(i=>i.id===id);
 const collectionSections=Object.entries(categories).map(([category,title])=>{
  const items=snapshot.collection.items.filter(i=>i.category===category).map(i=>{
   const info=localItem(category,i.id);
   return {id:i.id,title:info?.name||i.id,selected:equipped.has(i.id),art:'<div class="mk872-col-preview">◆</div>',meta:(equipped.has(i.id)?'Выбрано · ':'')+(i.paid_price===null?'Цена приобретения неизвестна':'Приобретено за '+i.paid_price+' монет')};
  });
  return {id:category,title,owned:items.length,items,serverReadOnly:true};
 }).filter(x=>x.items.length);
 // Unknown historical categories remain visible rather than silently disappearing.
 for(const i of snapshot.collection.items.filter(i=>!Object.hasOwn(categories,i.category))){
  collectionSections.push({id:'archive:'+i.id,title:'Исторические предметы',owned:1,serverReadOnly:true,items:[{id:i.id,title:i.id,selected:equipped.has(i.id),art:'',meta:'Сохранено сервером'}]});
 }
 const achievements=snapshot.collection.achievements.map(i=>({id:i.id,title:achievementList?.find(a=>a.id===i.id)?.title||i.id,selected:true,art:'<div class="mk872-col-preview">🏆</div>',meta:i.reward_recorded?'Награда учтена сервером':'Награда не учтена сервером'}));
 collectionSections.push({id:'achievements',title:'Достижения',owned:achievements.length,serverReadOnly:true,items:achievements});
 const catalogSections=defs.map(([id,items])=>({id,title:categories[id],cards:items.filter(i=>!i.hiddenInStore&&!i.archived&&!i.legacyHero&&!i.retired).map(i=>{
  const inCollection=owned.has(i.id);
  return {id:i.id,name:i.name||i.id,level:i.level,description:i.desc||'',rarity:i.rarity||'common',rarityLabel:'',className:'shop-card'+(inCollection?' owned':''),icon:'<div class="shop-icon">◆</div>',equipped:equipped.has(i.id),status:equipped.has(i.id)?'Выбрано':inCollection?'В коллекции':'',priceLabel:i.rewardOnly?'Наградный предмет':'Цена не подтверждена сервером',button:{label:inCollection?'В коллекции':'Покупка недоступна'}};
 })})).filter(x=>x.cards.length);
 return {wallet:{serverReadOnly:true,balance:snapshot.wallet.balance,profile:snapshot.profile.display_name,revision:snapshot.wallet.revision},collectionSections,catalogSections};
}
