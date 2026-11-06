#!/usr/bin/env python3
"""19D: fix store filter bleed across tabs; display truthful rarity counts and price range."""
from pathlib import Path
import hashlib,json
idx=Path('index.html');sw_path=Path('sw.js')
html=idx.read_text('utf-8');sw=sw_path.read_text('utf-8')
before='eae5f44bc14b0736579e0435f4fa0118e2a17fb1b51399b0e7408527de53a2f0'
if 'id="mk-ui19d-shop-clarity"' in html:
 assert 'matkvest-iphone-v63' in sw and hashlib.sha256(html.encode()).hexdigest() in sw
 print('UI19D already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==before,'Refusing non-v62 app'
assert before in sw and 'matkvest-iphone-v62' in sw and html.count('</body>')==1
css=r"""
<style id="mk-ui19d-shop-clarity">
/* Store categories list only filters with actual items.
 * Values of price, rarity, level and refund rates remain unchanged. */
#modal .shop-filter-bar{
 display:flex;gap:6px;flex-wrap:wrap;
 margin:11px 0 8px
}
#modal .shop-filter-btn{
 display:inline-flex;align-items:center;gap:5px;
 border-radius:10px;min-height:38px;padding:6px 10px;
 font-size:12px;font-weight:750
}
#modal .shop-filter-btn .mk19d-filter-count{
 font-variant-numeric:tabular-nums;
 display:inline-flex;align-items:center;justify-content:center;
 min-width:19px;height:19px;padding:0 4px;
 font-size:11px;border-radius:7px;
 background:rgba(32,105,75,.09);color:#2c7055
}
#modal .shop-filter-btn.active .mk19d-filter-count{
 background:rgba(14,100,61,.16);color:inherit
}
#modal .mk19d-shop-summary{
 display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;
 margin:0 0 12px;padding:8px 11px;
 background:#f5faf7;border:1px solid #dceae1;
 border-radius:11px;color:#4e7060;font-size:12px;line-height:1.4
}
#modal .mk19d-shop-summary b{
 font-weight:800;color:#206a4c
}
#modal .shop-filter-btn:focus-visible{
 outline:3px solid rgba(23,107,84,.38);outline-offset:2px
}
@media(max-width:680px){
 #modal .shop-filter-bar{gap:5px;margin:9px 0 7px}
 #modal .shop-filter-btn{padding:6px 8px;min-height:40px}
 #modal .mk19d-shop-summary{padding:8px 10px;margin-bottom:10px}
}
@media(prefers-reduced-motion:reduce){
 #modal .shop-filter-btn{transition:none!important}
}
</style>
"""
script=r"""
<script id="mk-ui19d-shop-clarity-script">
/* Keep all established catalog/checkout/refund handlers intact. */
(function(){
 'use strict';
 const rarityOptions=[['common','Обычные'],['uncommon','Необычные'],['rare','Редкие'],['epic','Эпические'],['legendary','Легендарные']];
 const previousOpenShop=openShop;
 function availableItems(category){
   if(category==='avatars')return mk872ModernCatalog();
   return SHOP_CATALOG[category]||[];
 }
 function filterOptions(category){
   const items=availableItems(category);
   const opts=[['all','Все',items.length]];
   for(const [id,label] of rarityOptions){
     const total=items.filter(x=>x.rarity===id).length;
     if(total)opts.push([id,label,total]);
   }
   const rewards=items.filter(x=>x.rewardOnly).length;
   if(rewards)opts.push(['reward','Только награды',rewards]);
   return opts;
 }
 shopRarityButtons=function(category){
   const options=filterOptions(category);
   return '<div class="shop-filter-bar" role="group" aria-label="Редкость предметов">'
     +options.map(([id,label,n])=>'<button type="button" class="shop-filter-btn '+(shopRarityFilter===id?'active':'')+'" onclick="openShop(&quot;'+category+'&quot;,&quot;'+id+'&quot;)" aria-pressed="'+(shopRarityFilter===id)+'">'+label+'<span class="mk19d-filter-count" aria-hidden="true">'+n+'</span></button>').join('')
     +'</div>';
 };
 const pretty=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString('ru-RU');
 openShop=function(category='avatars',rarity=null){
   const normalized=category==='accessories'?'avatars':category;
   const modalRoot=document.querySelector('#modal');
   const shown=!!modalRoot&&getComputedStyle(modalRoot).display!=='none'&&modalRoot.getBoundingClientRect().width>20;
   const active=shown?modalRoot.querySelector('.shop-tab.active'):null;
   const previousCategory=active?.getAttribute('onclick')?.match(/openShop\('([^']+)'/)?.[1]||null;
   // Explicit rarity clicks retain their filter. Navigation to a DIFFERENT tab always shows All.
   if(rarity===null&&(!previousCategory||previousCategory!==normalized))shopRarityFilter='all';
   const result=previousOpenShop(category,rarity);
   if(normalized==='collection'||normalized==='achievements')return result;
   const modal=document.querySelector('#modal'),bar=modal?.querySelector('.shop-filter-bar');
   if(!bar)return result;
   const shownItems=filteredShopItems(normalized);
   const all=availableItems(normalized);
   const paid=shownItems.filter(x=>!x.rewardOnly&&Number(x.price)>0).map(x=>Math.floor(Number(x.price)));
   const min=paid.length?Math.min(...paid):null,max=paid.length?Math.max(...paid):null;
   const range=paid.length?'Стоимость: '+pretty(min)+(max!==min?'–'+pretty(max):'')+' 🪙'
     :shownItems.length?'Награды или бесплатные предметы':'Предметов не найдено';
   const info=document.createElement('div');
   info.className='mk19d-shop-summary';
   info.setAttribute('role','status');info.setAttribute('aria-live','polite');
   const count=document.createElement('span');count.innerHTML='Показано: <b>'+shownItems.length+'</b> из '+all.length;
   const price=document.createElement('span');price.textContent=range;
   info.append(count,price);
   bar.insertAdjacentElement('afterend',info);
   return result;
 };
})();
</script>
"""
html=html.replace('</body>',css+'\n'+script+'\n</body>',1)
after=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v62','matkvest-iphone-v63').replace(before,after)
assert 'matkvest-iphone-v63' in sw and after in sw
idx.write_text(html,'utf-8');sw_path.write_text(sw,'utf-8')
meta={'stage':'19D','candidate':'v63','baseline':before,'sha256':after,'sw':'matkvest-iphone-v63',
      'changes':['reset rarity filter when shop category changes','show rarity options only for available catalog entries','display actual visible counts and purchase price range'],
      'not_changed':['catalog prices','rarity classifications','level requirements','purchase handlers','resale 40/80%','archived 100% refund','chest 200 and odds','learning logic']}
Path('audits/ui_stage19d_patch_report.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False))
