from pathlib import Path
import hashlib,re
p=Path('index.html');swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v77' in sw and 'mk30CollectionWorth' not in s
D='$'
# Shared current inventory catalog valuation, not the player's lifetime spending.
base='function openLeaderboard(){'
helper="""function mk30CollectionWorth(profile){
 const inv=profile?.inventory||{};
 let value=0;
 for(const [type,ids] of Object.entries(inv)){
  if(!Array.isArray(ids)||!Object.prototype.hasOwnProperty.call(SHOP_CATALOG,type))continue;
  for(const id of new Set(ids.filter(id=>typeof id==='string'))){
   const item=catalogItem(type,id),price=Number(item?.price);
   if(item&&Number.isFinite(price)&&price>0)value+=Math.floor(price);
  }
 }
 return value;
}
function mk30WorthLabel(profile){return mk30CollectionWorth(profile).toLocaleString('ru-RU')}
"""
assert s.count(base)==1
s=s.replace(base,helper+base,1)
old='<td>'+D+'{p.coins||0}</td><td>'+D+'{p.bestStreak||0}</td>'
new='<td>'+D+'{p.coins||0}</td><td class="mk30-worth" title="Стоимость всех принадлежащих предметов">'+D+'{mk30WorthLabel(p)}</td><td>'+D+'{p.bestStreak||0}</td>'
assert s.count(old)==1
s=s.replace(old,new,1)
old='<th>Монеты</th><th>🔥 рекорд</th>'
new='<th>Монеты</th><th title="Стоимость принадлежащих вещей по ценам каталога">Коллекция 🪙</th><th>🔥 рекорд</th>'
assert s.count(old)==1
s=s.replace(old,new,1)
old='<b>Всего потрачено:</b> 🪙 '+D+'{state.shopStats.spent||0}'
new='<b>Стоимость коллекции:</b> 🪙 '+D+'{mk30WorthLabel(state)}'
assert s.count(old)==1
s=s.replace(old,new,1)
old="cell('Потрачено в магазине',mk19eMoney(a.spent),'Учтённые покупки предметов; без сундуков')+"
new="cell('Стоимость коллекции',mk19eMoney(mk30CollectionWorth(state)),'Все принадлежащие предметы по ценам каталога')+\\n        cell('Расходы на покупки',mk19eMoney(a.spent),'Исторические расходы в магазине; без сундуков')+"
assert s.count(old)==1
new=new.replace(chr(92)+'n',chr(10))
s=s.replace(old,new,1)
# The viewer is repaired by intercepting at window capture: existing document
# handler cannot replace the cloned artwork with text or medal/level numbers.
css="""<style id="mk30-zoom-style">
#mk872ViewerVisual{display:grid;place-items:center;width:100%}
.mk30-visual{display:grid;place-items:center;width:min(300px,75vw,44dvh);height:min(300px,75vw,44dvh);margin:10px auto}
.mk30-visual>.avatar-badge,.mk30-visual>.shop-icon,.mk30-visual>.pet-mini,.mk30-visual>.study-pet{
 width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
 max-width:100%!important;max-height:100%!important;display:grid!important;place-items:center!important;
 font-size:clamp(75px,24vw,165px)!important;border-radius:22%!important;
 transform:none!important;inset:auto!important;position:relative!important;margin:0!important
}
.mk30-visual .avatar-core{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;font-size:inherit!important}
.mk30-visual img,.mk30-visual svg,.mk30-visual .emoji-fallback-img{
 max-width:100%!important;max-height:100%!important;object-fit:contain!important
}
.mk30-visual>.pet-mini img,.mk30-visual>.study-pet img{width:100%!important;height:100%!important}
.mk30-visual .pet-mini{width:21%!important;height:21%!important;right:-8px!important;bottom:-8px!important;font-size:22px!important}
.leader-table .mk30-worth{white-space:nowrap;font-variant-numeric:tabular-nums}
.pet-mini,.mk19g-pet-icon{pointer-events:auto!important;cursor:zoom-in!important}
@media(max-width:520px){
 .leader-table{min-width:640px}
 .leader-table th:nth-child(5),.leader-table td:nth-child(5),
 .leader-table th:nth-child(6),.leader-table td:nth-child(6){display:table-cell!important}
 .leader-table th:nth-child(n+7),.leader-table td:nth-child(n+7){display:none!important}
}
</style>"""
script="""<script id="mk30-artwork-viewer-script">
(function(){
 'use strict';
 const popup=document.getElementById('mk872AvatarViewer');
 const visual=document.getElementById('mk872ViewerVisual');
 const title=document.getElementById('mk872ViewerTitle');
 const closeButton=popup.querySelector('.mk872-viewer-close');
 let previousFocus=null;
 function select(node){
  if(!node?.closest||node.closest('#mk872AvatarViewer'))return null;
  const pet=node.closest('.pet-mini,.study-pet,.mk19g-pet-icon');
  if(pet)return {kind:'pet',node:pet};
  const petIcon=node.closest('.mk19g-pet-choice .shop-icon,.mk19g-pet-choice .mk19g-pet-art,.shop-card[data-type="pets"] .shop-icon,.shop-card[data-shop-type="pets"] .shop-icon');
  if(petIcon)return {kind:'pet',node:petIcon};
  // Shop cards do not store their type in data-*; use the active tab.
  const shopIcon=node.closest('.shop-card .shop-icon');
  if(shopIcon&&/Питомцы/.test(document.querySelector('.shop-tabs .active')?.textContent||''))return {kind:'pet',node:shopIcon};
  // Collection cards are grouped by section, not by a type attribute.
  const collected=node.closest('.mk872-col-art');
  if(collected&&/Питомцы/.test(collected.closest('.mk872-col-section')?.querySelector('h3')?.textContent||''))return {kind:'pet',node:collected};
  const avatar=node.closest('.avatar-badge,.mk868-final-hero-card .shop-icon');
  if(avatar)return {kind:'avatar',node:avatar};
  return null;
 }
 function open(item){
  const orig=item.node,copy=orig.cloneNode(true);
  copy.removeAttribute('id');copy.removeAttribute('tabindex');copy.removeAttribute('onclick');
  copy.querySelectorAll('[id],[tabindex],[onclick]').forEach(el=>{
   el.removeAttribute('id');el.removeAttribute('tabindex');el.removeAttribute('onclick');
  });
  const wrap=document.createElement('div');wrap.className='mk30-visual '+(item.kind==='pet'?'mk30-pet':'mk30-avatar');
  wrap.append(copy);visual.replaceChildren(wrap);
  const img=orig.querySelector('img');
  const row=orig.closest('.leader-identity');
  const name=orig.closest('.mk868-final-hero-card,.shop-card,.mk19g-pet-choice')?.querySelector('strong,.shop-name');
  title.textContent=name?.textContent?.trim()||img?.alt?.trim()||(item.kind==='pet'?'Питомец':'Аватар');
  popup.setAttribute('aria-label',item.kind==='pet'?'Просмотр питомца':'Просмотр аватара');
  previousFocus=document.activeElement;
  popup.classList.add('mk872-open');popup.setAttribute('aria-hidden','false');
  closeButton.focus({preventScroll:true});
 }
 function close(){
  if(!popup.classList.contains('mk872-open'))return;
  popup.classList.remove('mk872-open');popup.setAttribute('aria-hidden','true');
  visual.replaceChildren();
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
 }
 window.addEventListener('click',e=>{
  if(popup.contains(e.target))return;
  const target=select(e.target);
  if(!target)return;
  e.preventDefault();e.stopImmediatePropagation();open(target);
 },true);
 window.addEventListener('keydown',e=>{
  if(!popup.classList.contains('mk872-open'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}
 },true);
 window.addEventListener('keydown',e=>{
  if(popup.classList.contains('mk872-open')||!['Enter',' '].includes(e.key))return;
  const target=select(e.target);
  if(!target)return;
  e.preventDefault();e.stopImmediatePropagation();open(target);
 },true);
 const makeZoomable=root=>{
  if(root.nodeType!==1&&root.nodeType!==9)return;
  let nodes=[];
  if(root.nodeType===1)nodes.push(root);
  root.querySelectorAll?.('.avatar-badge,.pet-mini,.study-pet,.mk868-final-hero-card .shop-icon,.mk19g-pet-choice .shop-icon,.mk19g-pet-icon,.mk872-col-art,.shop-card .shop-icon').forEach(el=>nodes.push(el));
  for(const el of nodes){
   if(!select(el))continue;
   el.classList.add('mk872-viewable');
   if(!el.hasAttribute('tabindex'))el.tabIndex=0;
  }
 };
 makeZoomable(document);
 new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(makeZoomable))).observe(document.body,{childList:true,subtree:true});
})();
</script>"""
assert s.count('</body>')==1
s=s.replace('</body>',css+'\n'+script+'\n</body>',1)
extra="""<style id="mk30-collection-worth-style">
.mk30-collection-worth{display:flex;align-items:center;justify-content:space-between;
 gap:10px;flex-wrap:wrap;border:1px solid #d8e7df;border-radius:12px;
 background:#f5fbf7;color:#173a2d;padding:10px 14px;margin:10px 0 12px}
.mk30-collection-worth strong{font-size:18px;font-variant-numeric:tabular-nums}
.mk30-collection-worth small{color:#597668;font-size:11px}
</style>
<script id="mk30-collection-worth-script">
(function(){
 'use strict';
 const original=openCollection;
 openCollection=function(){
  const result=original.apply(this,arguments);
  const modal=document.getElementById('modal');
  if(!modal||modal.querySelector('.mk30-collection-worth'))return result;
  const anchor=modal.querySelector('.collection-stats,.mk872-col-counter-grid,.shop-tabs,.profile-preview');
  const line=document.createElement('section');
  line.className='mk30-collection-worth';
  const label=document.createElement('span');label.textContent='📦 Стоимость коллекции';
  const amount=document.createElement('strong');amount.textContent=mk30WorthLabel(state)+' 🪙';
  const hint=document.createElement('small');hint.textContent='Все принадлежащие предметы по ценам каталога';
  line.append(label,amount,hint);
  if(anchor)anchor.insertAdjacentElement('beforebegin',line);
  else modal.querySelector('.mtop')?.insertAdjacentElement('afterend',line);
  return result;
 };
})();
</script>"""
s=s.replace('</body>',extra+chr(10)+'</body>',1)
assert '8.77' in s
s=s.replace('8.77','8.78')
sw=sw.replace('matkvest-iphone-v77','matkvest-iphone-v78')
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
sw,n=re.subn(r'[a-f0-9]{64}',sha,sw,count=1)
assert n==1
swp.write_text(sw,'utf8')
print('STAGE30_PATCH_OK',sha,'v78')
