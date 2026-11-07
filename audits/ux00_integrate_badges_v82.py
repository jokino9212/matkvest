from pathlib import Path
import hashlib,re,json
root=Path('.')
p=root/'index.html';swp=root/'sw.js'
s=p.read_text('utf-8');sw=swp.read_text('utf-8')
ids=['bd_star','bd_diamond','bd_pi','bd_root','bd_sigma','bd_fraction','bd_infinity','bd_div_master','bd_fraction_master','bd_perfect','bd_control','bd_errors','bd_grade4','bd_grade5','bd_thousand','bd_equations']
for badge in ids:
 f=Path('assets/source/badges/prototypes')/(badge+'.svg')
 assert f.is_file(),f
 data=f.read_text('utf8')
 assert 'viewBox="0 0 512 512"' in data
 assert '<script' not in data.lower()
assert 'const SHOP_CATALOG' in s and 'function catalogItem(type,id)' in s
assert s.count('function catalogItem(type,id)')==1
assert 'mkUX00BadgeArtworkInstalled' not in s
anchor='function catalogItem(type,id)'
# Icons are set at bootstrap to the same real image in every view.
# Never change the catalog records' IDs, prices, rarity, ownership or achievements.
inject='''/* UX/UI FINAL: SVG-first artwork for existing badge catalog, zero economy changes. */
(function mkUX00BadgeArtworkInstalled(){
 const artworkIds=new Set(%s);
 const itemList=SHOP_CATALOG.badges||[];
 for(const item of itemList){
  if(!artworkIds.has(item.id))continue;
  const file='assets/source/badges/prototypes/'+item.id+'.svg';
  item.icon='<img class="mk-ux-badge-image" alt="" loading="eager" decoding="async" src="'+file+'">';
 }
})();
'''%json.dumps(ids,ensure_ascii=False)
s=s.replace(anchor,inject+anchor,1)
# Put stylesheet before the closing HTML head, preserving math and general styles.
style='''<style id="mk-ux00-badge-artwork">
.shop-badge-icon{display:grid;place-items:center;width:100%;height:100%;font-size:inherit}
.mk-ux-badge-image{display:block;object-fit:contain;max-width:100%;max-height:100%;width:100%;height:100%;aspect-ratio:1}
.shop-icon:has(.mk-ux-badge-image){overflow:hidden;padding:3px}
.badge-select-item .mk-ux-badge-image,.badge-token .mk-ux-badge-image,
.achievement-reward-item-icon .mk-ux-badge-image{width:100%;height:100%;object-fit:contain}
</style>
'''
assert s.count('</head>')==1
s=s.replace('</head>',style+'</head>',1)
assert 'matkvest-iphone-v81' in sw
# Build hash is bound to final index content for SW gate.
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw=sw.replace('matkvest-iphone-v81','matkvest-iphone-v82')
sw=re.sub(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
# Include new assets in offline pre-cache for robust zoom even when offline.
paths=['"./assets/source/badges/prototypes/'+x+'.svg"' for x in ids]
old='const APP_FILES = ["./", "./index.html", "./manifest.webmanifest"];'
assert sw.count(old)==1
sw=sw.replace(old,'const APP_FILES = ["./", "./index.html", "./manifest.webmanifest", '+', '.join(paths)+'];',1)
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('BADGES_INTEGRATED',len(ids),'HTML_SHA256',sha,'PWA','v82')
