#!/usr/bin/env python3
"""UX-107: fix before-first-paint pet icon hydration, head badge CSS, cache isolation and legacy sale navigation.
Run ONLY after ux105_stage_v107.py --apply in isolated/approved staging. Never changes a saved profile.
"""
from pathlib import Path
import hashlib,json,re
htmlpath=Path('index.html');workerpath=Path('sw.js')
html=htmlpath.read_text('utf-8');worker=workerpath.read_text('utf-8')
assert 'const CACHE_NAME = "matkvest-iphone-v107"' in worker
assert html.count('id="mk-ux105-ten-original-pets"')==1
assert html.count('id="mk-ux106-profile-badge-sizes"')==1
assert 'id="mk-ux107-legacy-pet-archive"' not in html
assert 'id="mk-ux107-boot-hydration"' not in html
assert '<meta name="matkvest-release" content="v107">' not in html
assert html.count('</head>')==1 and html.count('</body>')==1
m=json.loads(Path('audits/ux105_new_pets_manifest.json').read_text('utf-8'))
assert m['artwork']['art_approval']=='approved' and m['artwork']['accepted_count']==10
assert all(x['approved_sha256']==x['sha256'] for x in m['items'])
old=json.loads(Path('audits/ux105_baseline_pets.json').read_text('utf-8'))['items']
oldids=[x['id'] for x in old if x['id']!='pet_none']
assert len(oldids)==20

# Move fixed-size badge CSS and actual artwork sizing CSS into HEAD, before first visible layout.
for style_id in ['mk-ux103-pet-style','mk-ux105-pet-art-style','mk-ux106-profile-badge-sizes']:
    pat=re.compile(r'<style id="'+re.escape(style_id)+r'">.*?</style>',re.DOTALL)
    hits=list(pat.finditer(html))
    assert len(hits)==1,'Expected exactly one complete CSS block '+style_id
    block=hits[0].group()
    html=pat.sub('',html,count=1)
    html=html.replace('</head>',block+'\n</head>',1)

# Actual new pet inserts had been appended AFTER main initial render.
# Place the exact same item code immediately after the original catalog declaration.
pat=re.compile(r'<script id="mk-ux105-ten-original-pets">\s*(.*?)\s*</script>',re.DOTALL)
hits=list(pat.finditer(html))
assert len(hits)==1
body=hits[0].group(1)
assert "SHOP_CATALOG.pets.push(item)" in body and 'const items=' in body and 'item.icon=' in body
verify='''<script id="mk-ux105-ten-original-pets">
(function(){
 const ids=%s;
 if(SHOP_CATALOG.pets.length!==31)throw Error("UX107: new pet initialization not complete");
 for(const id of ids){
  const matches=SHOP_CATALOG.pets.filter(p=>p.id===id);
  if(matches.length!==1||!String(matches[0].icon).includes("assets/source/pets/"+id+".webp"))
   throw Error("UX107: initial artwork missing "+id);
 }
})();
</script>''' % json.dumps([x['id'] for x in m['items']])
html=pat.sub(lambda _:verify,html,count=1)

# 13 previously published original artworks (incl Phoenix/Orb/Ghost) must exist
# BEFORE initial profile/shop/leaderboard markup is built. Neither cost nor owned flags change.
oldArt=['pet_phoenix','pet_orb','pet_ghost','pet_bot','pet_owl','pet_penguin','pet_dino',
        'pet_cat','pet_dragon','pet_fox','pet_turtle','pet_tiger','pet_astronaut']
assert len(oldArt)==13
assert set(oldArt).issubset(set(oldids))
lateIds=['pet_phoenix','pet_orb','pet_ghost']
bootstrapIds=[id for id in oldArt if id not in lateIds]
assert len(bootstrapIds)==10
early='''\n/* id="mk-ux107-boot-hydration" — first-paint pet artwork, no economy changes. */
(function(){
 const ids=%s;
 for(const id of ids){
  const matches=SHOP_CATALOG.pets.filter(p=>p.id===id);
  if(matches.length!==1)throw Error("UX107: missing legacy pet "+id);
  matches[0].icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image mk-ux104-premium-image" alt="" loading="eager" decoding="async" src="assets/source/pets/'+id+'.webp">';
 }
})();
'''%json.dumps(bootstrapIds)
needle='const SHOP_CATALOG={'
start=html.index(needle);end=html.find('\n};',start)
assert start>0 and 35000<end-start<150000,'Catalog object end changed'
insertAt=end+len('\n};')
assert 'SHOP_CATALOG.avatars.push' in html[insertAt:insertAt+900]
html=html[:insertAt]+early+html[insertAt:]
assert html.index('id="mk-ux107-boot-hydration"')<html.index('function openShop')

# Phoenix, Orb and Ghost are inserted into the original catalog in a LATER
# script block, after the base pet object. Hydrate them only when those records exist.
lateNeedle='''SHOP_CATALOG.pets.push(
 {id:"pet_phoenix",name:"Феникс"'''
startLate=html.find(lateNeedle)
assert startLate>=0,"Original premium three registration changed"
endLate=html.find('\n);',startLate)
assert 200<endLate-startLate<1000
lateCode='''
/* UX107 first-paint premium-three hydration after original SKU creation */
(function(){
 const ids=["pet_phoenix","pet_orb","pet_ghost"];
 for(const id of ids){
  const pet=SHOP_CATALOG.pets.find(x=>x.id===id);
  if(!pet)throw Error("UX107 legacy pet registration missing "+id);
  pet.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="assets/source/pets/'+id+'.webp">';
 }
})();
'''
# Append new SKUs only after all 20 old SKUs; baseline order remains unchanged.
lateCode+=body+"\n"
html=html[:endLate+len('\n);')]+lateCode+html[endLate+len('\n);'):]

# Previously UX-104 batch1 threw if the correct art was already connected;
# the early initialization now makes that a legitimate idempotent state.
oldLine="if(oldSource.includes('assets/source/pets/'+id+'.webp'))\n   throw Error(\"UX-104 pet art already linked \"+id);"
assert html.count(oldLine)==1
html=html.replace(oldLine,"if(oldSource.includes('assets/source/pets/'+id+'.webp'))\n   continue;",1)

# Head-level explicit release marker makes a stale HTML response machine-detectable.
html=html.replace('</head>','<meta name="matkvest-release" content="v107">\n</head>',1)

# Keep old purchase history intact; extend archive with *existing* owned/historic pet IDs.
# This is navigation to the existing audited 40%/80% sale flow, NOT a new coin mint.
archive_js=r'''<script id="mk-ux107-legacy-pet-archive">
(function(){
 const oldPetIds=new Set(OLD_PET_IDS_JSON);
 function oldPetRows(profile=state){
  const ids=new Set();
  for(const id of profile?.inventory?.pets||[])ids.add(id);
  for(const key of profile?.everOwned||[])if(String(key).startsWith('pets:'))ids.add(String(key).slice(5));
  for(const key of Object.keys(profile?.acquisitionMetadata||{}))if(key.startsWith('pets:'))ids.add(key.slice(5));
  for(const row of profile?.saleHistory||[])if(row?.type==='pets')ids.add(row.id);
  return [...ids].filter(id=>oldPetIds.has(id)&&catalogItem('pets',id)).sort((a,b)=>catalogItem('pets',a).name.localeCompare(catalogItem('pets',b).name,'ru'));
 }
 const originalArchiveCards=mk873ArchiveCards;
 mk873ArchiveCards=function(){
  const base=originalArchiveCards(),ids=oldPetRows(state);
  if(!ids.length)return base;
  const cards=ids.map(id=>{
   const item=catalogItem('pets',id),e=mk865SellEligibility('pets',id,state);
   const owned=Array.isArray(state.inventory?.pets)&&state.inventory.pets.includes(id);
   const sold=(state.saleHistory||[]).some(x=>x?.type==='pets'&&x.id===id);
   const label=e.ok?'Куплен ранее · продажа по сохранённой цене':owned?'Питомец сохранён · '+(e.reason||'Требуется подтверждение покупки'):sold?'Уже продан':'Историческая запись владения';
   const action=e.ok?`<button type="button" class="mk872-col-action primary mk873-archive-action" onclick="mk865OpenSellDialog('pets','${id}')">Продать питомца</button>`:'';
   return '<div class="mk872-col-card mk873-archive-card"><div class="mk872-col-art"><span class="shop-icon" style="height:100%;width:100%;margin:0">'+(item.icon||'🐾')+'</span></div><strong>'+esc(item.name)+'</strong><span class="mk872-col-meta">Ранее приобретённый питомец</span><div class="mk873-archive-price">'+esc(label)+'</div>'+action+'</div>';
  }).join('');
  return base+'<section class="mk-ux107-old-pets"><h3>🐾 История старых питомцев</h3><p>Ранее приобретённые питомцы остаются за учеником. Их можно продать по прежним правилам: 40% сразу или 80% после полезной тренировки. Сумма берётся из подтверждённой покупки, повторная продажа исключена. Новые питомцы не заменяют старые.</p><div class="mk872-col-grid">'+cards+'</div></section>';
 };
 const originalSwitch=mk873CollectionSwitch;
 mk873CollectionSwitch=function(type){
  const result=originalSwitch(type);
  if(type!=='archive')return result;
  const total=mk873ArchiveRows(state).length+oldPetRows(state).length;
  const subtitle=document.querySelector('#mk872CollectionContent .mk872-col-head small');
  if(subtitle)subtitle.textContent=total+' обнаружено';
  const counter=document.querySelector('#mk872CollectionUX [data-mk872-collection-tab="archive"] b');
  if(counter)counter.textContent=String(total);
  return result;
 };
 const originalOpenCollection=openCollection;
 openCollection=function(){
  const result=originalOpenCollection();
  const counter=document.querySelector('#mk872CollectionUX [data-mk872-collection-tab="archive"] b');
  if(counter)counter.textContent=String(mk873ArchiveRows(state).length+oldPetRows(state).length);
  return result;
 };
})();
</script>'''.replace('OLD_PET_IDS_JSON',json.dumps(oldids))
# No modifications to existing profiles or purchase transactions at application startup.
html=html.replace('</body>','<style id="mk-ux107-old-pets-style">.mk-ux107-old-pets{margin-top:18px}.mk-ux107-old-pets h3{margin:0 0 6px;font-size:17px}.mk-ux107-old-pets p{font-size:12px;line-height:1.5;color:var(--muted);margin:0 0 12px}</style>\n'+archive_js+'\n</body>',1)

# SW cache cannot return an asset from any older cache when v107 controls the page.
assert worker.count('caches.match(request).then(cached =>')==1
worker=worker.replace('caches.match(request).then(cached =>',
                      'caches.open(CACHE_NAME).then(cache => cache.match(request)).then(cached =>',1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
worker,n=re.subn(r'(const APP_BUILD_HASH = ")[a-f0-9]{64}(")',lambda match:match.group(1)+digest+match.group(2),worker,count=1)
assert n==1
assert html.count('id="mk-ux106-profile-badge-sizes"')==1 and html.index('id="mk-ux106-profile-badge-sizes"')<html.index('</head>')
assert html.count('id="mk-ux105-ten-original-pets"')==1
assert html.count('id="mk-ux107-legacy-pet-archive"')==1
assert html.count('id="mk-ux107-boot-hydration"')==1
assert digest==re.search(r'const APP_BUILD_HASH = "([a-f0-9]{64})"',worker).group(1)
htmlpath.write_text(html,encoding='utf-8')
workerpath.write_text(worker,encoding='utf-8')
print('UX107_BEFORE_FIRST_PAINT_HYDRATION_AND_ARCHIVE_READY',json.dumps({
 'cache':'v107','old_pets':20,'early_art':13,'new_art':10,'head_badge_css':True,
 'legacy_pet_sale':'existing_verified_40_80_rules','old_caches_not_read':True,
 'html_sha256':digest},ensure_ascii=False))
