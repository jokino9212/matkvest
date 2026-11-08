from pathlib import Path
import hashlib,re,json
p=Path('index.html');swp=Path('sw.js')
html=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v96' in sw
assert 'id="mk-ux97-sticker-stage"' not in html
ids=['st_star2','st_royal','st_infinity','st_golden_pi','st_master10','st_grade4','st_control_perfect']
anchor='function catalogItem(type,id){return SHOP_CATALOG[type]?.find(x=>x.id===id)||null}'
assert html.count(anchor)==1
injection="""
/* UX-97: matching math decals — vector-only visual override, zero economy changes. */
(function(){
 const ids=new Set(["st_star2","st_royal","st_infinity","st_golden_pi","st_master10","st_grade4","st_control_perfect"]);
 for(const item of SHOP_CATALOG.stickers){
  if(!ids.has(item.id))continue;
  item.icon='<img class="mk-ux94-sticker-image" alt="" loading="eager" decoding="async" src="assets/source/stickers/'+item.id+'.svg">';
 }
})();
"""
# Late reward decorators overwrite st_orbit and st_bolt2 in the catalog.
# Apply the vector override only after those decorators finish.
html=html.replace('</body>','<script id="mk-ux97-final-sticker-art">'+injection+'</script>\n</body>',1)
html=html.replace('</body>','<!-- UX-97: 31/31 original vector stickers --><meta id="mk-ux97-sticker-stage" data-series="31"/>\n</body>',1)
sw=sw.replace('matkvest-iphone-v96','matkvest-iphone-v97',1)
assert sw.count('];\n\n// Navigation')==1
for id in ids:
 assert Path('assets/source/stickers',id+'.svg').is_file()
 assert './assets/source/stickers/'+id+'.svg' not in sw
sw=sw.replace('];\n\n// Navigation',', '+', '.join(json.dumps('./assets/source/stickers/'+id+'.svg') for id in ids)+'];\n\n// Navigation',1)
sha=hashlib.sha256(html.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf8');swp.write_text(sw,'utf8')
print('UX96_VECTOR_STICKERS_31_OF_31',sha)
