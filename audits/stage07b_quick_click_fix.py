"""Stage07B: one-action quick cards must respond on empty area and expose specific accessible labels."""
from pathlib import Path
import hashlib,re
h=Path("index.html");w=Path("sw.js")
s=h.read_text("utf8")
old="""   if(!card.hasAttribute('aria-label'))card.setAttribute('aria-label',button.textContent.trim()||'Открыть тренировку');"""
new="""   const title=(card.querySelector('strong')?.textContent||'').trim();
   card.setAttribute('aria-label',title?title+' — '+(button.textContent.trim()||'Открыть тренировку'):'Открыть тренировку');"""
assert s.count(old)+s.count(new)==1, "Quick card accessible label source changed"
s=s.replace(old,new,1)
anchor=""" document.addEventListener('keydown',event=>{"""
click=""" // The whole visual surface performs the one available action. A click on the
 // existing button remains native: do not retarget it or call twice.
 root.addEventListener('click',event=>{
  const card=event.target?.closest?.('.quick-card[role="button"]');
  if(!card||!root.contains(card))return;
  if(event.target.closest('button,a[href],input,select,textarea,[role="button"]:not(.quick-card)'))return;
  const actions=card.querySelectorAll('button');
  if(actions.length!==1||actions[0].disabled)return;
  event.preventDefault();
  event.stopPropagation();
  actions[0].click();
 },true);
"""
tag='<script id="mk-stage07-quick-card-keyboard">'
assert s.count(tag)==1,"Missing stage07 quick card script"
before,remaining=s.split(tag,1)
viewer,after=remaining.split('</script>',1)
assert viewer.count(anchor)==1,"Stage07 quick card keydown entry point moved"
if click.strip() not in viewer:viewer=viewer.replace(anchor,click+anchor,1)
s=before+tag+viewer+'</script>'+after
h.write_text(s,"utf8")
digest=hashlib.sha256(h.read_bytes()).hexdigest()
sw=w.read_text("utf8")
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,sw))==1,"PWA digest location changed"
sw=re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,"utf8")
print("STAGE07B_QUICK_CARD_FIX_PASS",digest)
