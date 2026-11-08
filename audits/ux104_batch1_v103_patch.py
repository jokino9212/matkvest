#!/usr/bin/env python3
"""UX-104: guarded, art-only first batch. Never publish placeholders."""
import sys,json,hashlib,re
from pathlib import Path
p=Path('index.html')
swp=Path('sw.js')
manifest=json.loads(Path('audits/ux104_batch1_manifest.json').read_text('utf-8'))
items=manifest['items']
assert [v['id'] for v in items]==['pet_bot','pet_owl','pet_penguin']
assert len({v['id'] for v in items})==len(items)
html=p.read_text('utf-8');sw=swp.read_text('utf-8')
assert 'matkvest-iphone-v102' in sw,'UX104 must only start from verified v102'
assert 'id="mk-ux103r-premium-pets"' in html,'Original premium standard must remain active'
assert 'id="mk-ux104-premium-pets-1"' not in html,'UX104 batch already integrated'
assert html.count('</body>')==1
if '--preflight' in sys.argv:
    print('UX104_PREFLIGHT_READY',json.dumps({
        'batch':1,'candidate_ids':[v['id'] for v in items],
        'missing_original_assets':[v['asset'] for v in items if not Path(v['asset']).is_file()],
        'staging':'v102 unchanged until source artwork passes Gate',
        'production':'v81 unchanged'
    },ensure_ascii=False))
    sys.exit(0)
art=[]
for item in items:
    f=Path(item['asset'])
    assert f.is_file(),f"Missing real high-quality pet art: {f}. Refuse to publish a placeholder."
    data=f.read_bytes()
    assert len(data)>=20000 and len(data)<=400000,f'Wrong compressed artwork size {f}: {len(data)}'
    assert data[:4]==b'RIFF' and data[8:12]==b'WEBP',f'Not real WebP: {f}'
    assert f'./{f.as_posix()}' not in sw, f'File already cached: {f}'
    art.append((item,hashlib.sha256(data).hexdigest()))
assert len({digest for _,digest in art})==3,'Different pets cannot reuse one source image'
checks={i['id']:{k:i[k] for k in ['price','rarity','level']} for i in items}
src={i['id']:i['asset'] for i in items}
js='''<script id="mk-ux104-premium-pets-1">
/* UX-104: premium unique art for 3 original pets; preserve all historic item/economy fields. */
(function(){
 const checks=__CHECKS__;
 const sources=__SOURCES__;
 for(const [id,requirements] of Object.entries(checks)){
  const matches=SHOP_CATALOG.pets.filter(item=>item.id===id);
  if(matches.length!==1)throw Error("UX-104 missing/duplicate pet "+id);
  const item=matches[0];
  for(const [field,expected] of Object.entries(requirements))
   if(item[field]!==expected)throw Error("UX-104 economic/level mismatch "+id+"."+field);
  const oldSource=String(item.icon||"");
  if(oldSource.includes('assets/source/pets/'+id+'.webp'))
   throw Error("UX-104 pet art already linked "+id);
  item.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image mk-ux104-premium-image" alt="" loading="eager" decoding="async" src="'+sources[id]+'">';
 }
})();
</script>
'''.replace('__CHECKS__',json.dumps(checks,ensure_ascii=False,separators=(',',':'))).replace('__SOURCES__',json.dumps(src,ensure_ascii=False,separators=(',',':')))
html=html.replace('</body>',js+'</body>',1)
sw=sw.replace('matkvest-iphone-v102','matkvest-iphone-v103',1)
anchor='];\n\n// Navigation'
assert sw.count(anchor)==1,'Offline asset list anchor changed'
sw=sw.replace(anchor,', '+', '.join(json.dumps('./'+i['asset']) for i in items)+anchor,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[a-f0-9]{64}(")',lambda m:m.group(1)+digest+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
print('UX104_BATCH1_PREMIUM_ART_INTEGRATED',json.dumps({
 'ids':[i['id'] for i in items],'sha256':{i['id']:h for i,h in art},'pwa':'v103',
 'html':digest,'production':'unchanged'
},ensure_ascii=False))
