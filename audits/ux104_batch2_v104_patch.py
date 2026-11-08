#!/usr/bin/env python3
"""UX-104 batch 2: guarded, immutable, art-only future staging upgrade.

Never use this to bypass batch 1. --preflight performs no writes.
Release requires the reviewed image hashes AND v103 already active in staging.
"""
import sys, json, hashlib, re
from pathlib import Path

manifest=json.loads(Path('audits/ux104_batch2_manifest.json').read_text('utf-8'))
items=manifest['candidates']
assert [i['id'] for i in items]==['pet_dino','pet_cat','pet_dragon']
index=Path('index.html'); swfile=Path('sw.js')
html=index.read_text('utf-8'); sw=swfile.read_text('utf-8')
current_cache=re.search(r'const CACHE_NAME = "([^"]+)"',sw)
assert current_cache
src_path=lambda i:Path('assets/source/pets')/(i['id']+'.webp')
if '--preflight' in sys.argv:
    print('UX104_BATCH2_PREVIEW_ONLY',json.dumps({
      'status':'awaiting_art_approval_and_prior_batch_release',
      'ids':[i['id'] for i in items],
      'cache_present':current_cache.group(1),
      'cache_required':'matkvest-iphone-v103',
      'candidate_files':[Path(i['asset']).is_file() for i in items],
      'missing_source':[str(src_path(i)) for i in items if not src_path(i).is_file()],
      'art_approval':manifest['art_acceptance']['status'],
      'html_sw_mutated':False,
      'production':'untouched'
    },ensure_ascii=False))
    sys.exit(0)

assert current_cache.group(1)=='matkvest-iphone-v103',(
    'Release blocked: UX104 batch1 must pass full Gate and publish staging v103 first.')
assert 'id="mk-ux104-premium-pets-1"' in html,(
    'Release blocked: prior batch art-only script absent.')
assert 'id="mk-ux104-premium-pets-2"' not in html,(
    'Batch2 already added. Refuse duplicate patch.')
assert html.count('</body>')==1

accept=manifest['art_acceptance']
assert accept['status']=='approved',(
    'Release blocked: all 3 premium characters need explicitly approved visual art.')
approved=accept['accepted_sha256']
assert set(approved)=={i['id'] for i in items}
records=[]
for i in items:
    original=Path(i['asset'])
    active=src_path(i)
    assert original.is_file() and active.is_file(),f'Missing candidate/source {i["id"]}'
    a=original.read_bytes();b=active.read_bytes()
    assert b==a,f'Artwork source not byte-identical to reviewed candidate {i["id"]}'
    assert len(b)==i['size'] and 20000<=len(b)<=400000
    assert b[:4]==b'RIFF' and b[8:12]==b'WEBP',f'Not WebP {i["id"]}'
    sha=hashlib.sha256(b).hexdigest()
    assert sha==i['sha256']==approved[i['id']],(
        'Artwork SHA not approved / replaced without re-review: '+i['id'])
    assert './'+active.as_posix() not in sw,'Already cached '+i['id']
    records.append((i,active,sha))
assert len({r[2] for r in records})==3

checks={i['id']:{field:i[field] for field in ['price','rarity','level']}
        for i in items}
sources={i['id']:active.as_posix() for i,active,sha in records}
script='''<script id="mk-ux104-premium-pets-2">
/* UX-104 second approved premium art batch: no economy, progress or ID mutations. */
(function(){
 const checks=__CHECKS__;
 const sources=__SOURCES__;
 for(const [id,requirements] of Object.entries(checks)){
  const matches=SHOP_CATALOG.pets.filter(x=>x.id===id);
  if(matches.length!==1)throw Error("UX104 batch2 missing/duplicate pet "+id);
  const pet=matches[0];
  for(const [key,expected] of Object.entries(requirements))
   if(pet[key]!==expected)
     throw Error("UX104 batch2 price/level/rarity mismatch "+id+"."+key);
  pet.icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image mk-ux104-premium-image" alt="" loading="eager" decoding="async" src="'+sources[id]+'">';
 }
})();
</script>
'''.replace('__CHECKS__',json.dumps(checks,ensure_ascii=False,separators=(',',':'))).replace('__SOURCES__',json.dumps(sources,ensure_ascii=False,separators=(',',':')))
new_html=html.replace('</body>',script+'</body>',1)
new_sw=sw.replace('matkvest-iphone-v103','matkvest-iphone-v104',1)
anchor='];\n\n// Navigation'
assert new_sw.count(anchor)==1
paths=', '+', '.join(json.dumps('./'+active.as_posix()) for i,active,sha in records)
new_sw=new_sw.replace(anchor,paths+anchor,1)
digest=hashlib.sha256(new_html.encode('utf-8')).hexdigest()
new_sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',
  lambda m:m.group(1)+digest+m.group(2),new_sw,count=1)
assert n==1 and new_sw!=sw and new_html!=html
index.write_text(new_html,'utf-8')
swfile.write_text(new_sw,'utf-8')
print('UX104_BATCH2_APPROVED_STAGE_V104',json.dumps({
  'ids':[i['id'] for i in items],'art_sha256':{i['id']:sha for i,active,sha in records},
  'pwa':'v104','html_hash':digest,'production':'untouched'
},ensure_ascii=False))
