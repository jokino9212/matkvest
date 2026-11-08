from pathlib import Path
import hashlib,re,json

page=Path("index.html")
sw_file=Path("sw.js")
html=page.read_text("utf-8")
sw=sw_file.read_text("utf-8")
assert 'matkvest-iphone-v101' in sw, "Expect previous verified staging v101"
assert 'id="mk-ux103r-premium-pets"' not in html, "Premium assets already integrated"
assert html.count("</body>")==1
assert 'id="mk-ux103-pet-art"' in html, "Must keep original pet override lifecycle"
names=["pet_phoenix","pet_orb","pet_ghost"]
for id in names:
    assert Path(f"assets/source/pets/{id}.webp").is_file(), f"Missing premium original {id}"
    assert f"./assets/source/pets/{id}.webp" not in sw, f"Already cached premium source: {id}"

# This is deliberately after the legacy vector assignment, so every surface
# (shop/collection/profile/leaderboard/fullscreen viewer) sees one original WebP.
# Existing IDs, level, price, rarity, ownership and reward logic remain untouched.
script="""<script id="mk-ux103r-premium-pets">
/* UX-103 premium art correction: the old flat SVGs were not production quality. */
(function(){
 const originals={
   pet_phoenix:{price:820,rarity:"epic"},
   pet_orb:{price:1050,rarity:"legendary"},
   pet_ghost:{price:1500,rarity:"legendary"}
 };
 for(const [id,existing] of Object.entries(originals)){
   const matches=SHOP_CATALOG.pets.filter(x=>x.id===id);
   if(matches.length!==1||matches[0].price!==existing.price||matches[0].rarity!==existing.rarity)
     throw new Error("UX-103 premium pet identity/economy mismatch "+id);
   matches[0].icon='<img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image" alt="" loading="eager" decoding="async" src="assets/source/pets/'+id+'.webp">';
 }
})();
</script>
"""
html=html.replace("</body>",script+"</body>",1)
sw=sw.replace('matkvest-iphone-v101','matkvest-iphone-v102',1)
for id in names:
    unused=', "./assets/source/pets/'+id+'.svg"'
    assert sw.count(unused)==1, f"Missing old art cache entry: {id}"
    sw=sw.replace(unused,'',1)
assert sw.count('];\n\n// Navigation')==1
assets=', '+', '.join(json.dumps(f'./assets/source/pets/{id}.webp') for id in names)
sw=sw.replace('];\n\n// Navigation',assets+'];\n\n// Navigation',1)
digest=hashlib.sha256(html.encode("utf-8")).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',
 lambda m:m.group(1)+digest+m.group(2),sw,count=1)
assert n==1
page.write_text(html,"utf-8")
sw_file.write_text(sw,"utf-8")
print("UX103R_PREMIUM_PETS_PWA_v102", json.dumps({"ids":names,"art":[".webp"]*3,"html_sha256":digest,"production": "unmodified"}))
