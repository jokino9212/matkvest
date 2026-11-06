#!/usr/bin/env python3
"""v8.75: keyboard accessible grade cards, no gameplay changes."""
from pathlib import Path
import hashlib,re
p=Path('index.html');sp=Path('sw.js')
s=p.read_text('utf8');sw=sp.read_text('utf8')
assert s.count("</body>")==1
assert 'id="mk-v875-card-keyboard"' not in s
assert 'matkvest-iphone-v74' in sw
old_click="if(e.target.closest(interactive))return; // native action, do not duplicate"
new_click="if(e.target.closest('button,a[href],input,select,textarea,[contenteditable=\"true\"],[role=\"link\"],[role=\"button\"]:not(.grade-card)'))return; // keep card role while excluding true nested controls"
assert s.count(old_click)==1, "Existing delegated card activation handler changed"
s=s.replace(old_click,new_click)

style='''
<!-- v8.75: real full-card keyboard activation and focus affordance -->
<style id="mk-v875-card-keyboard">
#mainView .grade-grid>.grade-card[role="button"]:focus-visible{
 outline:3px solid rgba(23,107,84,.55)!important;outline-offset:3px;
 border-color:#267e5c!important;box-shadow:0 0 0 3px rgba(38,126,92,.1)!important
}
@media(hover:none){#mainView .grade-grid>.grade-card[role="button"]:active{background:#f1faf5}}
@media(prefers-reduced-motion:reduce){#mainView .grade-grid>.grade-card[role="button"]{transition:none!important}}
</style>
<script>
(function(){
 'use strict';
 const root=document.getElementById('mainView');
 if(!root)return;
 function enhance(){
  root.querySelectorAll('.grade-grid > .grade-card').forEach(card=>{
   if(card.matches('.soon,.disabled,[aria-disabled="true"]'))return;
   const action=card.querySelector(':scope > button.btn:not(:disabled)[onclick]');
   if(!action)return;
   if(card.dataset.mkV875Accessible==='1')return;
   card.dataset.mkV875Accessible='1';
   card.tabIndex=0;
   card.setAttribute('role','button');
   card.setAttribute('aria-label',action.textContent.trim());
  });
 }
 enhance();
 new MutationObserver(enhance).observe(root,{childList:true});
 root.addEventListener('keydown',event=>{
  if(event.repeat||!(event.key==='Enter'||event.key===' '))return;
  const card=event.target;
  if(!(card instanceof Element)||!card.matches('.grade-grid > .grade-card[data-mk-v875-accessible="1"]'))return;
  const action=card.querySelector(':scope > button.btn:not(:disabled)[onclick]');
  if(!action)return;
  event.preventDefault();
  action.click();
 });
})();
</script>
'''
s=s.replace("</body>",style+"</body>")
assert '8.74' in s
s=s.replace('8.74','8.75')
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
sw=sw.replace('matkvest-iphone-v74','matkvest-iphone-v75')
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[0-9a-f]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1 and 'matkvest-iphone-v75' in sw
sp.write_text(sw,'utf8')
print('v8.75 candidate built:',sha)
