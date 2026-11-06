#!/usr/bin/env python3
"""Stage19I phase2: improve confirmed small targets and focus visuals only on v69."""
from pathlib import Path
import hashlib,json
index=Path('index.html');worker=Path('sw.js')
html=index.read_text(encoding='utf-8');sw=worker.read_text(encoding='utf-8')
BASE='9f2f50a7e49653e6bfcb62de22402e6948ee1c3a642ffb80c0f25e4d3d4d55d1'
if 'id="mk-ui19i2-target-styles"' in html:
    sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
    assert 'matkvest-iphone-v70' in sw and sha in sw
    print('UI19I phase2 v70 already applied')
    raise SystemExit(0)
assert hashlib.sha256(html.encode('utf-8')).hexdigest()==BASE,'Only verified v69 may be patched'
assert 'matkvest-iphone-v69' in sw and BASE in sw
assert 'id="mk-ui19i-dialog-a11y"' in html and html.count('</body>')==1
addition=r"""
<style id="mk-ui19i2-target-styles">
/* Real Chromium inventory (v69, 320/390/768/1280px):
   32px help, 42px modal close, 38-42px category/navigation controls.
   Keep click handlers and layout models unchanged. */
#modal .mk872-help-trigger{min-width:44px;min-height:44px;flex-shrink:0}
#modal .mtop button.x{min-width:44px;min-height:44px;flex-basis:44px}
.mk872-help-dialog button.mk872-help-close{min-width:44px;min-height:44px}
#modal button.shop-tab,#modal button.shop-filter-btn{min-height:44px}
#modal .btn{min-height:44px}
#mainView button.home-back-btn,
#mainView button.mk19f-home-open,
#mainView button.mk19f-open-all,
#mainView button.mk19c4-course-link,
#mainView .training-goal-actions button.btn{min-height:44px}
.top button.brand.mk872-brand-home{min-width:44px;min-height:44px}
/* The document-level version badge is an actual 23px button in v69.
   Raise the target above 24px and restore minimum 4.5:1 ordinary text contrast. */
#appVersionBadge[role="button"]{
 min-height:28px;display:flex;align-items:center;justify-content:center;
 color:#4b6659!important
}
/* Programmatically focused dialog headings announce the content. They are not
   actionable controls: remove their heavy 3px outline. Leave focus-visible rings
   untouched on keyboard-operable buttons, inputs and tabs. */
#modal .mtop h2:focus{outline:none;border-radius:0}
@media(prefers-reduced-motion:reduce){
 #modal .mk872-help-trigger,#modal .mtop button.x{transition:none!important}
}
</style>
<script id="mk-ui19i2-avatar-a11y">
/* The independently focusable header avatar has no accessible name in v69.
   Name its existing keyboard control; do not alter its native activation. */
(function(){
 'use strict';
 const root=document.querySelector('.top');
 if(!root)return;
 function nameAvatar(){
  const item=root.querySelector('.avatar-badge.mk872-viewable[tabindex="0"]');
  if(!item)return;
  if(!item.hasAttribute('role'))item.setAttribute('role','button');
  if(!item.getAttribute('aria-label'))item.setAttribute('aria-label','Просмотреть аватар');
 }
 nameAvatar();
 new MutationObserver(nameAvatar).observe(root,{subtree:true,childList:true});
})();
</script>
"""
html=html.replace('</body>',addition+'\n</body>',1)
sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw=sw.replace('matkvest-iphone-v69','matkvest-iphone-v70').replace(BASE,sha)
assert 'matkvest-iphone-v70' in sw and sha in sw
index.write_text(html,encoding='utf-8');worker.write_text(sw,encoding='utf-8')
metadata={
 'stage':'19I','phase':'2','version':'v70','base_sha256':BASE,
 'sha256':sha,'pwa':'matkvest-iphone-v70',
 'changes':['44px measured small help, close, tabs, filters and primary navigation controls',
            '28px version badge and contrast >=4.5:1 on light surfaces',
            'remove distracting focused heading outline while retaining button focus rings',
            'accessible label for focusable top avatar'],
 'unchanged':['learning generators','grading','economy','user data','backend','production']}
Path('audits/ui_stage19i2_patch_report.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=False))
