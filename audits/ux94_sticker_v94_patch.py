from pathlib import Path
import hashlib,re
p=Path("index.html");sp=Path("sw.js")
html=p.read_text('utf-8');sw=sp.read_text('utf-8')
assert 'matkvest-iphone-v93' in sw
assert 'mk-ux94-sticker-style' not in html
anchor='function catalogItem(type,id){return SHOP_CATALOG[type]?.find(x=>x.id===id)||null}'
assert html.count(anchor)==1
ids=['st_pi','st_star','st_rocket','st_lightning','st_cube','st_planet','st_trophy','st_crown']
injection="""
/* UX-94: original matching sticker decals. Preserve catalog ID, price, rarity and unlock. */
(function(){
 const ids=new Set(["st_pi","st_star","st_rocket","st_lightning","st_cube","st_planet","st_trophy","st_crown"]);
 for(const item of SHOP_CATALOG.stickers){
  if(!ids.has(item.id))continue;
  item.icon='<img class="mk-ux94-sticker-image" alt="" loading="eager" decoding="async" src="assets/source/stickers/'+item.id+'.svg">';
 }
})();
"""
html=html.replace(anchor,injection+anchor,1)
css="""
<style id="mk-ux94-sticker-style">
/* Sticker slots must be equal regardless of whether the source is text, PNG or SVG. */
.favorite-stickers{min-width:0;display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap}
.favorite-sticker,.favorite-stickers.large .favorite-sticker{
 box-sizing:border-box;display:inline-grid;place-items:center;flex:0 0 34px;
 width:34px!important;min-width:34px!important;max-width:34px!important;
 height:34px!important;min-height:34px!important;max-height:34px!important;
 padding:3px!important;margin:0;border-radius:10px;
 font-size:clamp(12px,3.4vw,17px);font-weight:900;line-height:1;
 overflow:hidden;white-space:nowrap;text-align:center;
}
.favorite-sticker>.mk-ux94-sticker-image,
.favorite-sticker>.emoji-fallback-img,
.favorite-stickers.large .favorite-sticker>.emoji-fallback-img,
.favorite-sticker>img{
 display:block!important;box-sizing:border-box;width:100%!important;
 height:100%!important;max-width:100%!important;max-height:100%!important;
 object-fit:contain!important;vertical-align:middle!important;
}
.profile-sticker-line,.leader-stickers{min-width:0;max-width:100%}
.profile-sticker-line{flex-wrap:wrap}
.shop-icon>.mk-ux94-sticker-image,.sticker-slot .sticker>.mk-ux94-sticker-image,
.mk872-col-art .mk-ux94-sticker-image{
 display:block;width:90%;height:90%;max-width:100%;max-height:100%;
 margin:auto;object-fit:contain;aspect-ratio:1;
}
@media(max-width:380px){
 .favorite-stickers{gap:4px}
 .leader-table .favorite-sticker{flex-basis:30px;width:30px!important;
  min-width:30px!important;max-width:30px!important;height:30px!important;
  min-height:30px!important;max-height:30px!important}
}
</style>
"""
assert html.count('</body>')==1
html=html.replace('</body>',css+'</body>',1)
sw=sw.replace('matkvest-iphone-v93','matkvest-iphone-v94',1)
for id in ids:
 asset=f'./assets/source/stickers/{id}.svg'
 assert asset not in sw
 assert Path('assets/source/stickers',id+'.svg').is_file()
sw=sw.replace('];\n\n// Navigation',', '+', '.join('"./assets/source/stickers/'+id+'.svg"' for id in ids)+'];\n\n// Navigation',1)
sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf-8');sp.write_text(sw,'utf-8')
print('UX94_FIRST_8_DECALS_PWA_v94',len(ids),sha)
