"""Stage07A: accessible single-action quick-card keyboard surface; no change to existing click routing."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
s=h.read_text('utf8')
tag='<script id="mk-stage07-quick-card-keyboard">'
patch="""<style id="mk-stage07-quick-card-focus">
.quick-card[role="button"]:focus-visible{outline:3px solid var(--accent,#58a6ff);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.quick-card[role="button"]{transition:none!important}}
</style>
<script id="mk-stage07-quick-card-keyboard">
(function(){
 'use strict';
 const root=document.getElementById('mainView');
 if(!root)return;
 function initialize(){
  root.querySelectorAll('.quick-card').forEach(card=>{
   const actions=card.querySelectorAll('button');
   // Cards with two or more operations retain their independent focus targets.
   if(actions.length!==1||card.querySelector('a[href],input,select,textarea'))return;
   const button=actions[0];
   card.setAttribute('role','button');
   card.setAttribute('tabindex','0');
   if(!card.hasAttribute('aria-label'))card.setAttribute('aria-label',button.textContent.trim()||'Открыть тренировку');
   // One keyboard target per one-action card; existing pointer button stays active.
   button.setAttribute('tabindex','-1');
  });
 }
 document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const card=event.target;
  if(!card?.matches?.('.quick-card[role="button"]'))return;
  const buttons=card.querySelectorAll('button');
  if(buttons.length!==1||buttons[0].disabled)return;
  event.preventDefault();event.stopPropagation();
  buttons[0].click();
 },true);
 const observer=new MutationObserver(initialize);
 observer.observe(root,{childList:true,subtree:true});
 initialize();
})();
</script>"""
if tag not in s:
 assert s.count('</body></html>')==1,'Unexpected HTML ending'
 s=s.replace('</body></html>',patch+'\n</body></html>')
 print('STAGE07_QUICK_CARD_KEYBOARD_APPLIED')
else:
 print('STAGE07_QUICK_CARD_ALREADY_APPLIED')
h.write_text(s,'utf8')
digest=hashlib.sha256(h.read_bytes()).hexdigest()
sw=w.read_text('utf8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,sw))==1
sw=re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,'utf8')
print('STAGE07_HTML_SHA256',digest)
