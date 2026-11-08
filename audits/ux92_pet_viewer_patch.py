from pathlib import Path
import hashlib,re
p=Path('index.html');swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v91' in sw
anchor="  const shopIcon=node.closest('.shop-card .shop-icon');"
assert s.count(anchor)==1
guard="""  // A catalog placeholder is not artwork; never zoom the empty-pet option.
  const emptyPetCard=node.closest('.shop-grid .shop-card');
  if(emptyPetCard?.querySelector('strong')?.textContent?.trim()==='Без питомца')return null;
"""
s=s.replace(anchor,guard+anchor,1)
marker='</body>'
css=r'''
<!-- UX-92: enlarged real pets show the artwork, not a second shop tile. -->
<style id="mk-ux92-pet-viewer-finish">
#mk872AvatarViewer .mk30-visual.mk30-pet > .shop-icon,
#mk872AvatarViewer .mk30-visual.mk30-pet > .mk872-col-art > .shop-icon{
  background:transparent!important;border:0!important;box-shadow:none!important;
  border-radius:0!important;overflow:visible!important;
}
#mk872AvatarViewer .mk30-visual.mk30-pet > .shop-icon > img,
#mk872AvatarViewer .mk30-visual.mk30-pet > .mk872-col-art > .shop-icon > img{
  width:94%!important;height:94%!important;
  max-width:94%!important;max-height:94%!important;
  object-fit:contain!important;aspect-ratio:1!important;
}
#mk872AvatarViewer .mk30-visual.mk30-pet{
  overflow:visible!important;
}
</style>
'''
assert s.count(marker)==1
s=s.replace(marker,css+marker,1)
sw=sw.replace('matkvest-iphone-v91','matkvest-iphone-v92',1)
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('UX92_VIEWER_FINISH',sha)
