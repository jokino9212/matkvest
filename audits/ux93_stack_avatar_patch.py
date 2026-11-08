from pathlib import Path
import hashlib,re
p=Path('index.html');swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v92' in sw
assert 'id="mk-ux93-stack-avatar-css"' not in s
before='return `<span class="avatar-badge ${size} ${frame}">${c.avatar?.icon||"🙂"}${pet?`<span class="pet-mini">${pet}</span>`:""}</span>`;'
after='return `<span class="avatar-badge ${size} ${frame}" data-mk-avatar-id="${c.avatar?.id||"av_default"}">${c.avatar?.icon||"🙂"}${pet?`<span class="pet-mini">${pet}</span>`:""}</span>`;'
assert s.count(before)==1
s=s.replace(before,after,1)
before_label="    : (name?.textContent?.trim()||img?.alt?.trim()||'Аватар');"
after_label="""    : (name?.textContent?.trim()
       ||SHOP_CATALOG.avatars.find(x=>x.id===(orig.dataset.mkAvatarId||orig.querySelector('[data-mk-avatar-id]')?.dataset.mkAvatarId))?.name
       ||img?.alt?.trim()||'Аватар');"""
assert s.count(before_label)==1
s=s.replace(before_label,after_label,1)
style=r'''
<style id="mk-ux93-stack-avatar-css">
/* Historic award avatars combine trophy image and numeric tag. Both must scale together. */
#mk872AvatarViewer .mk30-visual.mk30-avatar .stack-icon{
 box-sizing:border-box!important;display:grid!important;place-items:center!important;
 position:relative!important;width:92%!important;height:92%!important;
 max-width:92%!important;max-height:92%!important;
 font-size:inherit!important;line-height:1!important;
 overflow:visible!important;transform:none!important;
}
#mk872AvatarViewer .mk30-visual.mk30-avatar .stack-base{
 display:grid!important;place-items:center!important;
 width:100%!important;height:100%!important;
 max-width:100%!important;max-height:100%!important;
}
#mk872AvatarViewer .mk30-visual.mk30-avatar .stack-base>img,
#mk872AvatarViewer .mk30-visual.mk30-avatar .stack-base>svg{
 width:100%!important;height:100%!important;
 max-width:100%!important;max-height:100%!important;
 object-fit:contain!important;
}
#mk872AvatarViewer .mk30-visual.mk30-avatar .stack-badge{
 display:grid!important;place-items:center!important;
 position:absolute!important;right:1%!important;bottom:1%!important;
 width:auto!important;height:auto!important;max-width:65%!important;
 font-size:clamp(18px,5vw,27px)!important;font-weight:900!important;
 line-height:1.2!important;padding:3px 7px!important;
 color:#16362d!important;background:#fffdf0!important;
 border:2px solid #b4cdbd!important;border-radius:10px!important;
 box-shadow:0 3px 9px #15292140!important;
 transform:none!important;
}
</style>
'''
assert s.count('</body>')==1
s=s.replace('</body>',style+'</body>',1)
sw=sw.replace('matkvest-iphone-v92','matkvest-iphone-v93',1)
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('UX93_AVATAR_FIX_PWA_v93',sha)
