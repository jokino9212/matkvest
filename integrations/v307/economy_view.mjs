import {createApp,h,shallowRef} from 'vue';
import StoreChest from '../../frontend/knowledge-map/StoreChest.vue';
import StoreChestResult from '../../frontend/knowledge-map/StoreChestResult.vue';
import StoreCatalog from '../../frontend/knowledge-map/StoreCatalog.vue';
import {createEconomyQueue,economyOutbox} from './economy_queue.mjs';
const types={avatars:'Аватар',frames:'Рамка',pets:'Питомец',stickers:'Наклейка',titles:'Титул',backgrounds:'Фон',badges:'Значок',accessories:'Аксессуар',nicknameStyles:'Оформление имени',effects:'Аура (эффект)'};
const rarity={rare:'Редкий',epic:'Эпический',legendary:'Легендарный',common:'Обычный',uncommon:'Необычный'};
const build='7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318';
const amount=n=>Number.isSafeInteger(n)&&n>=0;
export async function mountEconomy({host,api,scope,exit}){
 const initial=scope(),queue=createEconomyQueue({api,scope,store:economyOutbox()});
 const policy=await api.economyCatalog(initial.profile);if(policy.test_only!==true||policy.build!==build||policy.items.length!==262||policy.refund_chest!==50||JSON.stringify(policy.chest_xp)!==JSON.stringify({rare:60,epic:40,legendary:20}))throw Error('ECONOMY_POLICY_MISMATCH');
 const by=new Map(policy.items.map(x=>[x.id,x]));
 const state=shallowRef(null),pending=shallowRef(null),receipt=shallowRef(null),busy=shallowRef(false),error=shallowRef(''),tab=shallowRef('chest'),category=shallowRef('avatars'),saleChoice=shallowRef(null);
 let alive=true;
 async function refresh(){const [data,p]=await Promise.all([api.economyState(initial.profile),queue.pending()]);if(!alive)return;if(data.profile_id!==initial.profile||data.build!==build||data.test_only!==true||!amount(data.balance)||!amount(data.xp_total))throw Error('ECONOMY_STATE_MISMATCH');state.value=data;pending.value=p;}
 await refresh();
 async function run(body){
  if(!alive||busy.value)return;busy.value=true;error.value='';receipt.value=null;
  try{const r=await queue.submit(body);if(!alive)return;receipt.value=r;saleChoice.value=null;await refresh();}
  catch(e){if(!alive)return;error.value='Операция не подтверждена. Проверьте состояние и повторите сохранённый запрос. ';try{await refresh()}catch{}}
  finally{busy.value=false;}
 }
 function refreshOnly(){if(busy.value)return;busy.value=true;void refresh().catch(()=>{error.value='Не удалось обновить состояние.'}).finally(()=>busy.value=false)}
 const action=(text,onClick,disabled=false)=>h('button',{type:'button',onClick,disabled:busy.value||disabled},text);
 const name=id=>by.get(id)?.name||id;
 const icon='🎁';
 function chest(){
  const s=state.value,c=s.chest,blocked=!!pending.value||c.legacy_review_required||s.balance<policy.chest_price||!Object.values(c.available).some(n=>n>0);
  const model={price:policy.chest_price,disabled:blocked||busy.value,reason:c.legacy_review_required?'История старого профиля требует проверки':pending.value?'Есть незавершённая операция':s.balance<policy.chest_price?'Недостаточно монет':blocked?'Коллекция собрана':'',tiers:Object.keys(policy.pools).map(id=>({id,label:rarity[id],chance:policy.rates[id]/100+'% · +'+policy.chest_xp[id]+' XP',progress:(policy.pools[id].length-c.available[id])+' / '+policy.pools[id].length})),guarantees:[{text:'До гарантии эпического или легендарного: '+Math.max(1,policy.epic_misses-c.miss_epic+1)},{text:'До легендарного: '+Math.max(1,policy.legendary_misses-c.miss_legendary+1)}],history:c.history.map(x=>({icon:'🎁',name:x.item_id?name(x.item_id)+' · '+(types[by.get(x.item_id)?.category]||'Предмет')+' · +'+(x.bonus_xp||0)+' XP':'Компенсация '+x.compensation+' монет',date:new Date(x.date).toLocaleDateString('ru-RU')}))};
  return h(StoreChest,{model,actions:{open:()=>run({action:'chest',expected_price:policy.chest_price}),help:()=>{error.value='Предметы выдаёт сервер. Повторный предмет не выпадет; если выбранная редкость исчерпана, начисляется компенсация.'}}});
 }
 function result(){const r=receipt.value;if(!r||r.action!=='chest')return null;const item=by.get(r.item_id),q=state.value.sale_quotes.find(x=>x.item_id===r.item_id);const model={rarity:rarity[r.rarity],icon,title:item?.name||'Компенсация',body:item?'Тип: '+types[item.category]+' · +'+r.bonus_xp+' XP':'Возвращено '+r.compensation+' монет · 0 XP',equip:!!item?.selectable&&!pending.value&&!busy.value};
  return h('section',{class:'v307-reward'},[h(StoreChestResult,{model,actions:{reveal:()=>{},finish:()=>receipt.value=null,equip:()=>run({action:'equip',item_id:item.id,enabled:true})}}),q?.source==='chest'?action('Продать за '+q.refund_now+' монет',()=>run({action:'sell',item_id:item.id,mode:'now',expected_refund:q.refund_now}),!!pending.value):null]);
 }
 function catalog(){const s=state.value,owned=new Map(s.inventory.map(i=>[i.item_id,i])),eq=new Set(s.equipped.map(i=>i.item_id)),quotes=new Map(s.sale_quotes.map(q=>[q.item_id,q])),filtered=policy.items.filter(i=>i.category===category.value&&(tab.value==='collection'?owned.get(i.id)?.active:i.buyable||owned.get(i.id)?.active));const cards=filtered.map(i=>{const has=owned.get(i.id)?.active,q=quotes.get(i.id),equip=eq.has(i.id),disabled=busy.value||!!pending.value;return {id:i.id,name:i.name,level:i.level,rarity:i.rarity,rarityLabel:rarity[i.rarity]||i.rarity,description:types[i.category],icon:'◆',className:'v307-shop-card',status:equip?'Выбран':has?'В коллекции':'',equipped:equip,priceLabel:has?'В коллекции':i.price+' монет',button:{label:has?(equip?'Выбран':'Выбрать'):'Купить',action:disabled?null:has?(i.selectable&&!equip?'equip':null):i.buyable&&s.balance>=i.price?'buy':null,primary:true},sale:q?{allowed:!disabled,text:'Продажа: '+q.refund_now+' монет'}:null};});
  const go=(act,id)=>{const i=by.get(id),q=quotes.get(id);if(busy.value||pending.value)return;if(act==='buy')void run({action:'buy',item_id:id,expected_price:i.price});if(act==='equip')void run({action:'equip',item_id:id,enabled:true});if(act==='sell'&&q){if(q.source==='chest'){if(confirm('Продать '+i.name+' за '+q.refund_now+' монет?'))void run({action:'sell',item_id:id,mode:'now',expected_refund:q.refund_now});}else saleChoice.value=id;}};
  return h('section',[h('select',{'aria-label':'Категория предметов',value:category.value,onChange:e=>category.value=e.target.value},Object.entries(types).map(([v,t])=>h('option',{value:v},t))),h('div',{class:'v307-shop-grid'},[h(StoreCatalog,{model:{cards},actions:{run:go}})])]);
 }
 function saleOptions(){
  const s=state.value,id=saleChoice.value,q=s.sale_quotes.find(x=>x.item_id===id);
  if(!q||q.source==='chest')return null;
  const disabled=!!pending.value;
  return h('section',{class:'v307-reward'},[h('h3','Продажа: '+name(id)),action('Продать сейчас за '+q.refund_now+' монет',()=>{if(confirm('Подтвердить продажу?'))void run({action:'sell',item_id:id,mode:'now',expected_refund:q.refund_now})},disabled),h('p','За выполнение миссии: '+q.refund_mission+' монет.'),s.mission?h('p','Уже есть активная миссия.'):!(s.useful_topics||[]).length?h('p','Нет подходящих тем для миссии.'):h('div',{class:'actions'},s.useful_topics.map(t=>action('Миссия: '+(t.title||t.topic_id),()=>run({action:'mission_start',item_id:id,topic_id:t.topic_id}),disabled))),action('Отмена',()=>saleChoice.value=null)]);
 }
 function mission(){
  const m=state.value.mission;if(!m)return null;
  return h('section',{class:'v307-reward'},[h('h3','Миссия продажи: '+name(m.item_id)),h('p',m.topic_id+' · '+m.progress+' / '+m.required+' · '+m.refund+' монет'),h('p','Выполните новые учебные блоки по этой теме, затем обновите состояние.'),m.completed?action('Завершить продажу за '+m.refund+' монет',()=>run({action:'sell',item_id:m.item_id,mode:'mission',expected_refund:m.refund,mission_id:m.id}),!!pending.value):action('Отменить миссию',()=>run({action:'mission_cancel',mission_id:m.id}),!!pending.value)]);
 }
 function historyView(){
  const s=state.value,old=s.historical_economy,defs=new Map((policy.achievement_catalog||[]).map(a=>[a.id,a]));
  return h('section',[h('h3','Продажи'),...s.sales.map(i=>h('p',name(i.item_id)+' · +'+i.refund+' монет')),h('h3','Достижения'),...s.achievements.map(a=>h('p',(defs.get(a.id)?.title||a.id)+' · '+(a.source==='migration'?'Импортировано':'Получено'))),defs.size?h('p','Серверное начисление подключено: '+[...defs.values()].filter(a=>a.server_supported).length+' / '+defs.size):null,old?h('section',[h('h3','История из резервной копии'),h('p','Исторические записи, не повторные награды. Требуется сверка.'),old.available? h('div',[h('p','Открытий: '+(old.stats?.totalOpened??'—')),...(old.chests||[]).map(x=>h('p',x.item_id?name(x.item_id)+' · '+(types[x.item_type]||'Предмет')+' · '+(x.bonus_xp??'—')+' XP':'Компенсация '+(x.compensation??'—')+' монет')),...(old.sales||[]).map(x=>h('p',name(x.item_id)+' · продажа · '+(x.refund??'—')+' монет'))]):h('p','История недоступна.')]):null]);
 }
 const app=createApp({setup(){return ()=>h('section',{class:'v307-economy'},[h('h2','Монеты: '+state.value.balance+' · '+state.value.xp_total+' XP'),h('p',{class:'notice'},'Тестовая серверная экономика. Изменения подтверждает сервер.'),error.value?h('p',{role:'alert'},error.value):null,pending.value?h('div',{class:'notice'},['Сохранён незавершённый запрос. Новые операции заблокированы.',action('Повторить запрос',()=>run(pending.value.body))]):null,result(),saleOptions(),mission(),h('div',{class:'actions'},[['chest','Сундуки'],['shop','Магазин'],['collection','Коллекция'],['history','История']].map(([v,t])=>action(t,()=>{tab.value=v;receipt.value=null;saleChoice.value=null}))),tab.value==='chest'?chest():tab.value==='history'?historyView():catalog(),h('div',{class:'actions'},[action('Обновить',refreshOnly),action('Назад',exit)])]);}});app.mount(host);
 return {dispose(){alive=false;app.unmount();}};
}
