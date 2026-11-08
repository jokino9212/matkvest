from pathlib import Path
import hashlib,re,json
root=Path('.')
p=root/'index.html'; swp=root/'sw.js'
html=p.read_text('utf-8'); sw=swp.read_text('utf-8')
assert 'matkvest-iphone-v100' in sw,'Wrong staging baseline; refuse to patch'
assert 'id="mk-ux103-pet-art"' not in html,'UX-103 already applied'
assert html.count('</body>')==1, 'Ambiguous insertion point'
ids=['pet_phoenix','pet_orb','pet_ghost']
for id in ids:
    asset=Path('assets/source/pets',id+'.svg')
    assert asset.is_file(),f'Missing original drawing: {asset}'
    assert ('./'+str(asset).replace('\\','/')) not in sw, f'Already cached: {id}'
js="""<style id="mk-ux103-pet-style">
/* Transparent artwork, never a tile or an ornamental puddle. */
.shop-icon>img.mk-ux103-pet-image,.mk872-col-art img.mk-ux103-pet-image{
  box-sizing:border-box;display:block;width:90%;height:90%;max-width:100%;max-height:100%;
  margin:auto;object-fit:contain;aspect-ratio:1;background:none!important;border:0!important;
}
#mk872AvatarViewer .mk30-visual.mk30-pet img.mk-ux103-pet-image{
  display:block;box-sizing:border-box;width:94%!important;height:94%!important;
  max-width:94%!important;max-height:94%!important;object-fit:contain!important;
  margin:auto;background:transparent!important;border:0!important;
}
</style>
<script id="mk-ux103-pet-art">
/* Late art-only override: keep stable ID, rarity, price, level, ownership and achievements. */
(function(){
 const expected={
  pet_phoenix:{price:820,rarity:'epic'},
  pet_orb:{price:1050,rarity:'legendary'},
  pet_ghost:{price:1500,rarity:'legendary'}
 };
 for(const [id,check] of Object.entries(expected)){
  const pet=SHOP_CATALOG.pets.find(item=>item.id===id);
  if(!pet||pet.price!==check.price||pet.rarity!==check.rarity)
    throw new Error('UX-103 pet catalog mismatch '+id);
  pet.icon='<img class="emoji-fallback-img mk-ux103-pet-image" alt="" loading="eager" decoding="async" src="assets/source/pets/'+id+'.svg">';
 }
})();
</script>
"""
html=html.replace('</body>',js+'</body>',1)
sw=sw.replace('matkvest-iphone-v100','matkvest-iphone-v101',1)
assert sw.count('];\n\n// Navigation')==1,'PWA precache end changed'
assetpaths=[f'./assets/source/pets/{id}.svg' for id in ids]
sw=sw.replace('];\n\n// Navigation',', '+', '.join(json.dumps(path) for path in assetpaths)+'];\n\n// Navigation',1)
sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[a-f0-9]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
print('UX103_PETS_THREE_ORIGINAL_ART',json.dumps({'ids':ids,'staging':'v101','hash':sha,'expected_pets':20},ensure_ascii=False))
