#!/usr/bin/env python3
"""19G: compact real pet status and owned-pet switcher; no economy changes."""
from pathlib import Path
import hashlib,json
idx=Path('index.html');swfile=Path('sw.js')
html=idx.read_text('utf-8');sw=swfile.read_text('utf-8')
base='5e335da962b320d29d2988cc1607df4d9fb20501efb132b4353890ae9fa10ffa'
if 'id="mk-ui19g-pets-style"' in html:
    assert 'matkvest-iphone-v67' in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print('v67 already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==base,'Wrong v66 source; no patch applied'
assert base in sw and 'matkvest-iphone-v66' in sw and 'id="mk-ui19f-progress-style"' in html
assert html.count('</body>')==1
css=r"""
<style id="mk-ui19g-pets-style">
#modal .mk19g-pet-panel{
  border:1px solid #cfe2d5;border-radius:15px;background:#f6faf7;
  padding:12px 14px;margin:10px 0 13px;display:flex;flex-direction:column;gap:9px;
}
#modal .mk19g-pet-head{display:flex;align-items:center;gap:10px;min-width:0}
#modal .mk19g-pet-icon{
  width:46px;height:46px;min-width:46px;border:1px solid #cddfd2;
  border-radius:13px;background:#fff;display:grid;place-items:center;
  font-size:30px;line-height:1;overflow:hidden
}
#modal .mk19g-pet-icon .emoji-fallback-img{max-width:80%;max-height:80%;object-fit:contain}
#modal .mk19g-pet-info{min-width:0;flex:1 1 auto}
#modal .mk19g-pet-eyebrow{font-size:11px;line-height:1.25;color:#577666;font-weight:750}
#modal .mk19g-pet-name{font-size:15px;line-height:1.32;color:#1b5940;font-weight:850}
#modal .mk19g-pet-rarity{font-size:11px;line-height:1.35;color:#577567}
#modal .mk19g-pet-collection-count{
  margin-left:auto;white-space:nowrap;padding:6px 8px;border-radius:9px;
  background:#e7f3eb;color:#226c4b;font-size:12px;font-weight:800;
  font-variant-numeric:tabular-nums;
}
#modal .mk19g-pet-switch-title{font-size:11px;font-weight:750;color:#587368}
#modal .mk19g-pet-actions{
  display:flex;align-items:center;gap:6px;
  max-width:100%;overflow-x:auto;overscroll-behavior-inline:contain;
  scrollbar-width:thin;padding:1px 0 5px;
}
#modal .mk19g-pet-choice{
  border:1px solid #cadfd1;border-radius:10px;background:#fff;
  padding:7px 11px;min-height:42px;display:inline-flex;align-items:center;
  justify-content:center;gap:6px;flex:0 0 auto;cursor:pointer;
  color:#285d44;font-size:12px;font-weight:750;
}
#modal .mk19g-pet-choice:hover:not([disabled]){background:#e9f5ec;border-color:#9fcbb0}
#modal .mk19g-pet-choice[aria-pressed="true"]{
  background:#dff0e5;border-color:#66ad86;color:#155436;
}
#modal .mk19g-pet-choice[disabled]{cursor:default}
#modal .mk19g-pet-choice:focus-visible,
#modal .mk19g-pet-market:focus-visible{
  outline:3px solid rgba(27,119,78,.38);outline-offset:2px;
}
#modal .mk19g-pet-empty{
  font-size:12px;line-height:1.45;color:#6a8073;
}
#modal .mk19g-pet-market{
  align-self:flex-start;border:1px solid #bbd9c6;background:#edf7f0;
  color:#226647;border-radius:10px;padding:8px 12px;min-height:42px;
  font-size:12px;font-weight:800;cursor:pointer;
}
#modal .profile-preview .avatar-badge.large .pet-mini{
  right:0!important;bottom:0!important;
  width:20px!important;height:20px!important;max-width:20px!important;
  max-height:20px!important;pointer-events:none;
}
/* Rarity and reward card appearance stays app-owned. Only make selection state distinct. */
#modal .shop-card.equipped .shop-icon{border-radius:12px}
@media(max-width:680px){
 #modal .mk19g-pet-panel{padding:10px 11px;margin:9px 0 10px;border-radius:13px;gap:7px}
 #modal .mk19g-pet-icon{width:42px;height:42px;min-width:42px;font-size:26px;border-radius:12px}
 #modal .mk19g-pet-name{font-size:14px}
 #modal .mk19g-pet-choice{min-height:44px}
}
@media(prefers-reduced-motion:reduce){
 #modal .mk19g-pet-choice{transition:none!important}
}
</style>
"""
script=r"""
<script id="mk-ui19g-pets-script">
/* One profile source of truth: state.inventory.pets and state.equipped.pet.
 * All equip actions delegate to the existing inventory-protected equipShopItem. */
(function(){
 'use strict';
 function mk19gPetSummary(profile=state){
   const all=SHOP_CATALOG.pets||[];
   const owned=new Set(Array.isArray(profile?.inventory?.pets)?profile.inventory.pets:[]);
   const available=all.filter(item=>owned.has(item.id));
   const equipped=owned.has(profile?.equipped?.pet)?profile.equipped.pet:'pet_none';
   const current=all.find(item=>item.id===equipped)||all.find(item=>item.id==='pet_none');
   return{current,available,
     collected:available.filter(item=>item.id!=='pet_none').length,
     total:all.filter(item=>item.id!=='pet_none').length,
     rewardTotal:all.filter(item=>item.rewardOnly).length,
     rewardOwned:available.filter(item=>item.rewardOnly).length};
 }
 function mk19gEnhancePets(context){
   const host=document.querySelector('#modal');
   const tabs=host?.querySelector('.shop-tabs');
   if(!tabs||host.querySelector('#mk19gPetPanel'))return;
   const d=mk19gPetSummary(state),chosen=d.current;
   if(!chosen)return;
   const box=document.createElement('section');
   box.id='mk19gPetPanel';box.className='mk19g-pet-panel';
   box.setAttribute('aria-label','Выбранный питомец и быстрая смена');
   const head=document.createElement('div');head.className='mk19g-pet-head';
   const icon=document.createElement('div');icon.className='mk19g-pet-icon';
   // Trusted icons come from the built-in catalog, not user-provided text.
   icon.innerHTML=chosen.icon||'—';
   icon.setAttribute('aria-hidden','true');
   const info=document.createElement('div');info.className='mk19g-pet-info';
   const eyebrow=document.createElement('div');eyebrow.className='mk19g-pet-eyebrow';
   eyebrow.textContent='Питомец в профиле';
   const title=document.createElement('div');title.className='mk19g-pet-name';
   title.textContent=chosen.id==='pet_none'?'Без питомца':chosen.name;
   const rarity=document.createElement('div');rarity.className='mk19g-pet-rarity';
   rarity.textContent=chosen.id==='pet_none'?'Питомец не выбран':rarityName(chosen.rarity)+(chosen.rewardOnly?' · за достижение':'');
   info.append(eyebrow,title,rarity);
   const count=document.createElement('span');count.className='mk19g-pet-collection-count';
   count.textContent=d.collected+' / '+d.total;
   count.setAttribute('aria-label','Получено питомцев: '+d.collected+' из '+d.total);
   head.append(icon,info,count);
   const lbl=document.createElement('div');lbl.className='mk19g-pet-switch-title';
   lbl.textContent='Быстрый выбор из своей коллекции';
   const actions=document.createElement('div');actions.className='mk19g-pet-actions';
   actions.setAttribute('role','group');actions.setAttribute('aria-label','Выбрать имеющегося питомца');
   for(const pet of d.available){
     const button=document.createElement('button');
     button.type='button';button.className='mk19g-pet-choice';
     const selected=pet.id===chosen.id;
     button.textContent=(pet.id==='pet_none'?'Без питомца':pet.name)+(selected?' ✓':'');
     button.disabled=selected;button.setAttribute('aria-pressed',String(selected));
     button.addEventListener('click',()=>{
       if(pet.id===state.equipped.pet)return;
       if(!isOwned('pets',pet.id))return;
       equipShopItem('pets',pet.id);
       if(context==='collection')openCollection();
     });
     actions.append(button);
   }
   box.append(head,lbl,actions);
   if(d.collected===0){
     const empty=document.createElement('span');empty.className='mk19g-pet-empty';
     empty.textContent='Покупки и награды за достижения появятся здесь.';
     box.append(empty);
   }
   if(context==='collection'){
     const market=document.createElement('button');market.type='button';
     market.className='mk19g-pet-market';market.textContent='Посмотреть всех питомцев';
     market.addEventListener('click',()=>openShop('pets'));
     box.append(market);
   }
   tabs.insertAdjacentElement('afterend',box);
 }
 const beforeShop=openShop;
 openShop=function(category='avatars',rarity=null){
   const result=beforeShop(category,rarity);
   if(category==='pets')mk19gEnhancePets('shop');
   return result;
 };
 const beforeCollection=openCollection;
 openCollection=function(){
   const result=beforeCollection();
   mk19gEnhancePets('collection');
   return result;
 };
 window.mk19gPetSummary=mk19gPetSummary;
})();
</script>
"""
html=html.replace('</body>',css+'\n'+script+'\n</body>',1)
sha=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v66','matkvest-iphone-v67').replace(base,sha)
assert 'matkvest-iphone-v67' in sw and sha in sw
idx.write_text(html,'utf-8');swfile.write_text(sw,'utf-8')
meta={'stage':'19G','candidate':'v67','base_sha256':base,'sha256':sha,'cache':'matkvest-iphone-v67',
 'changes':['current pet preview and owned count in pet shop and collection','quick switch between truly owned pets and pet_none','keep collection visible after changing pet in collection','adjust floating pet-mini badge inside mobile profile avatar'],
 'unchanged':['catalog','pet prices','rarity','achievement requirements','XP','coins','business purchase/equip handlers','saved data format','backend']}
Path('audits/ui_stage19g_patch_report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False))
