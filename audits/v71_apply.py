#!/usr/bin/env python3
"""Apply the reviewed v71 UI-only hotfix to the unchanged v70 frontend."""
from pathlib import Path
import hashlib
import json
import re

page=Path("index.html")
worker=Path("sw.js")
old=page.read_text(encoding="utf-8")
base_sha="c93d13aeaafdb742e3ceda0111d3242daaf19fcc3a2cdd7b90b1b4a18f0817f2"
assert hashlib.sha256(old.encode()).hexdigest()==base_sha, "Refusing to patch non-v70 HTML"
assert '<script id="mk-v71-ui-fixes">' not in old

for a,b in (
 ('aria-label="Целая часть, если есть" placeholder="—"','aria-label="Целая часть, если есть"'),
 ('aria-label="Числитель" placeholder="числ."','aria-label="Числитель"'),
 ('aria-label="Знаменатель" placeholder="знам."','aria-label="Знаменатель"'),
):
 assert old.count(a)==1, "Missing or duplicated field: "+a
 old=old.replace(a,b)

addon=r'''
<!-- UI hotfix v71: existing progress/economy/catalogue remain the single source of truth. -->
<style id="mk-v71-ui">
.stage18-frac-entry{flex-wrap:nowrap;align-items:flex-end;gap:14px}
.stage18-frac-cell{box-sizing:border-box;width:74px;max-width:100%;height:55px;padding:3px 5px;min-width:0;font-size:25px;font-variant-numeric:tabular-nums;text-align:center}
.stage18-frac-stack{gap:3px}.stage18-frac-bar{width:78px;max-width:100%;height:2px}
.stage18-frac-label{min-height:34px}
@media(max-width:390px){.stage18-frac-entry{gap:10px}.stage18-frac-cell{width:65px;height:51px;font-size:22px}.stage18-frac-bar{width:69px}}
@media(max-width:340px){.stage18-frac-entry{gap:8px}.stage18-frac-cell{width:60px;height:49px;font-size:20px}.stage18-frac-bar{width:64px}}
#mainView .v71-section-progress{display:block;max-width:420px;width:100%;margin-top:8px;font-size:12px;font-weight:750;color:#266849;line-height:1.35}
#mainView .v71-section-progress .v71-progress-count{display:block;font-variant-numeric:tabular-nums}
#mainView .v71-section-progress .v71-progress-track{display:block;width:100%;height:6px;margin-top:5px;border-radius:20px;background:#d7e7de;overflow:hidden}
#mainView .v71-section-progress .v71-progress-fill{display:block;height:100%;background:#328e66;border-radius:20px}
#mainView .grade-head>div{min-width:0}
#modal .v71-sort-control{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:9px 0 12px;font-size:12px;font-weight:750;color:#416555}
#modal .v71-sort-control select{width:auto;max-width:100%;min-width:175px;min-height:38px;box-sizing:border-box;border-radius:10px;border:1px solid #bed7ca;background:#fff;color:#21563f;font:inherit;font-size:13px;padding:7px 10px;cursor:pointer}
#modal .v71-sort-control select:focus-visible{outline:3px solid #6eb58f;outline-offset:2px}
@media(max-width:390px){#modal .v71-sort-control select{min-width:0;width:100%}}
</style>
<script id="mk-v71-ui-fixes">
(function(){
 'use strict';
 function groups(g){
  if(g===1)return G1_GROUPS;if(g===2)return G2_GROUPS;if(g===3)return G3_GROUPS;
  if(g===5)return [{topics:G5_CORE},{topics:G5_FRACTIONS},{topics:G5_DECIMALS}];
  if(g===6)return G6_GROUPS;
  if(g===7)return G7_COURSES.flatMap(function(c){return g7GroupsByCourse(c.id)});
  if(g===8)return G8_COURSES.flatMap(function(c){return g8GroupsByCourse(c.id)});
  return [];
 }
 function complete(g,t){return g===4&&t.id==='column'?columnCompleted()===12:completedStages(g===5?'g5:'+t.id:t.id)===3}
 function counts(g,topics){
  const list=Array.isArray(topics)?topics:[];
  return {done:list.filter(function(t){return complete(g,t)}).length,total:list.length};
 }
 function render(parent,g,topics){
  if(!parent)return;
  const n=counts(g,topics);
  let el=parent.querySelector(':scope > .v71-section-progress');
  if(!el){el=document.createElement('div');el.className='v71-section-progress';el.innerHTML='<span class="v71-progress-count"></span><span class="v71-progress-track" role="progressbar"><span class="v71-progress-fill"></span></span>';parent.append(el)}
  const label='Пройдено '+n.done+' из '+n.total+' тем';
  const span=el.querySelector('.v71-progress-count');if(span.textContent!==label)span.textContent=label;
  const bar=el.querySelector('.v71-progress-track');
  bar.setAttribute('aria-label',label);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(n.total));bar.setAttribute('aria-valuenow',String(n.done));
  const width=(n.total?Math.round(n.done/n.total*100):0)+'%';
  const fill=el.querySelector('.v71-progress-fill');if(fill.style.width!==width)fill.style.width=width;
 }
 function refresh(){
  const main=document.getElementById('mainView');
  const h=main&&main.querySelector(':scope > .grade-hero h1');
  const m=h&&h.textContent.match(/([1-8])\s+класса/i);
  if(!m)return;
  const g=Number(m[1]);
  if(g===4){
   if(main.querySelector('#topics'))render(main.querySelector(':scope > .title'),4,TOPICS);
   return;
  }
  const gs=groups(g);
  Array.from(main.querySelectorAll(g===5?'.g5-group':'.g6-group')).forEach(function(el,i){
   if(gs[i])render(el.querySelector(':scope > .grade-head > div'),g,gs[i].topics);
  });
  if(g===7||g===8){
   const courses=g===7?G7_COURSES:G8_COURSES,byCourse=g===7?g7GroupsByCourse:g8GroupsByCourse;
   Array.from(main.querySelectorAll(':scope > .g7-course')).forEach(function(el,i){
    if(courses[i])render(el.querySelector(':scope > .grade-head > div'),g,byCourse(courses[i].id).flatMap(function(sec){return sec.topics}));
   });
  }
 }
 const main=document.getElementById('mainView');
 if(main)new MutationObserver(refresh).observe(main,{childList:true});
 const oldStats=stats;stats=function(){const r=oldStats.apply(this,arguments);refresh();return r};
 const oldSave=save;save=function(){const r=oldSave.apply(this,arguments);refresh();return r};
 refresh();
 window.mkV71SectionCounts=counts;window.mkV71RefreshSections=refresh;
})();
(function(){
 'use strict';
 const ranks={common:0,uncommon:1,rare:2,epic:3,legendary:4};
 let mode='rarity';
 function price(x){const p=Number(x&&x.price);return Number.isFinite(p)?p:0}
 function rarity(x){return Object.prototype.hasOwnProperty.call(ranks,x&&x.rarity)?ranks[x.rarity]:9}
 function ordered(type,items){
  const source=type==='avatars'?mk872ModernCatalog():(SHOP_CATALOG[type]||[]);
  const order=new Map(source.map(function(item,i){return [item.id,i]}));
  return items.slice().sort(function(a,b){
   const p=price(a)-price(b),r=rarity(a)-rarity(b);
   const first=mode==='priceAsc'?p:mode==='priceDesc'?-p:r;
   const second=mode==='rarity'?p:r;
   return first||second||(order.get(a.id)??Number.MAX_SAFE_INTEGER)-(order.get(b.id)??Number.MAX_SAFE_INTEGER);
  });
 }
 const oldFiltered=filteredShopItems;
 filteredShopItems=function(type){return ordered(type,oldFiltered.apply(this,arguments))};
 const oldOwned=mk872CollectionOwned;
 mk872CollectionOwned=function(type){const a=oldOwned.apply(this,arguments);return type==='achievements'?a:ordered(type,a)};
 function selector(context,category){
  const label=document.createElement('label');label.className='v71-sort-control';label.textContent='Сортировать:';
  const select=document.createElement('select');select.setAttribute('aria-label','Сортировка предметов');
  [['rarity','По редкости ↑, затем по цене'],['priceAsc','По цене ↑'],['priceDesc','По цене ↓']].forEach(function(x){
   const opt=document.createElement('option');opt.value=x[0];opt.textContent=x[1];select.append(opt);
  });
  select.value=mode;
  select.addEventListener('change',function(){mode=select.value;if(context==='collection')openCollection();else openShop(category,shopRarityFilter)});
  label.append(select);return label;
 }
 const oldShop=openShop;
 openShop=function(category,rarityFilter){
  const result=oldShop.apply(this,arguments);
  if(category==='collection'||category==='achievements'||category==='wallet')return result;
  const modal=document.getElementById('modal'),bar=modal&&modal.querySelector('.shop-filter-bar');
  if(bar){const summary=modal.querySelector('.mk19d-shop-summary');(summary||bar).insertAdjacentElement('afterend',selector('shop',category||'avatars'))}
  return result;
 };
 const oldCollection=openCollection;
 openCollection=function(){const r=oldCollection.apply(this,arguments);const root=document.getElementById('mk872CollectionUX');if(root)root.prepend(selector('collection',null));return r};
 window.mkV71SortItems=ordered;window.mkV71SortMode=function(){return mode};
})();
(function(){
 // Shrink only long numeric answers; keyboard Tab, minus and focus remain native.
 function fit(el){if(!el||!el.classList.contains('stage18-frac-cell'))return;const n=String(el.value||'').length;el.style.fontSize=n>=7?'13px':n>=6?'15px':n>=5?'17px':n>=4?'20px':''}
 document.addEventListener('input',function(e){fit(e.target)},true);
 document.addEventListener('focusin',function(e){fit(e.target)},true);
})();
</script>
'''
assert old.count('</body></html>')==1
new=old.replace('</body></html>',addon+'\n</body></html>')
sha=hashlib.sha256(new.encode('utf-8')).hexdigest()
sw=worker.read_text(encoding='utf-8')
assert 'matkvest-iphone-v70' in sw and base_sha in sw
worker.write_text(sw.replace('matkvest-iphone-v70','matkvest-iphone-v71').replace(base_sha,sha),encoding='utf-8')
page.write_text(new,encoding='utf-8')
assert '<script id="mk-v71-ui-fixes">' in page.read_text(encoding='utf-8')
print(json.dumps({'new_sha256':sha,'bytes':len(new.encode()),'change_bytes':len(new.encode())-len(old.encode()),'cache':'matkvest-iphone-v71'},ensure_ascii=False))
