from pathlib import Path
import hashlib,re,json
p=Path('index.html');swp=Path('sw.js')
html=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v95' in sw
assert 'id="mk-ux96-sticker-stage"' not in html
ids=['st_x2','st_approx','st_fraction','st_degree','st_orbit','st_fire','st_crystal','st_bolt2']
anchor='function catalogItem(type,id){return SHOP_CATALOG[type]?.find(x=>x.id===id)||null}'
assert html.count(anchor)==1
injection="""
/* UX-96: matching math decals — vector-only visual override, zero economy changes. */
(function(){
 const ids=new Set(["st_x2","st_approx","st_fraction","st_degree","st_orbit","st_fire","st_crystal","st_bolt2"]);
 for(const item of SHOP_CATALOG.stickers){
  if(!ids.has(item.id))continue;
  item.icon='<img class="mk-ux94-sticker-image" alt="" loading="eager" decoding="async" src="assets/source/stickers/'+item.id+'.svg">';
 }
})();
"""
html=html.replace(anchor,injection+anchor,1)
html=html.replace('</body>','<!-- UX-95: 24/31 original vector stickers --><meta id="mk-ux95-sticker-stage" data-series="24"/>\n</body>',1)
sw=sw.replace('matkvest-iphone-v94','matkvest-iphone-v96',1)
assert sw.count('];\n\n// Navigation')==1
for id in ids:
 assert Path('assets/source/stickers',id+'.svg').is_file()
 assert './assets/source/stickers/'+id+'.svg' not in sw
sw=sw.replace('];\n\n// Navigation',', '+', '.join(json.dumps('./assets/source/stickers/'+id+'.svg') for id in ids)+'];\n\n// Navigation',1)
sha=hashlib.sha256(html.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf8');swp.write_text(sw,'utf8')
print('UX96_VECTOR_STICKERS_24_OF_31',sha)
