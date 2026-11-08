from pathlib import Path
import re,hashlib
p=Path('index.html');sp=Path('sw.js')
s=p.read_text('utf8');sw=sp.read_text('utf8')
assert 'matkvest-iphone-v98' in sw
assert 'id="mk-ux99-leader-scroll-hint"' not in s
patch=r'''
<style id="mk-ux99-leader-scroll-hint">
#modal .mk-ux99-scroll-hint{display:none}
@media(max-width:480px){
 #modal .mk-ux99-scroll-hint{
   display:flex;align-items:center;gap:7px;
   margin:5px 0 9px;padding:7px 9px;
   border:1px solid #a0d3c2;border-radius:10px;
   background:#e7f6f1;color:#184c3f;
   font:700 11px/1.3 system-ui,sans-serif;
   max-width:100%;box-sizing:border-box;min-width:0;
 }
 #modal .mk-ux99-scroll-hint span{white-space:normal;overflow-wrap:anywhere}
 #modal .leader-table-parent-scroll{
   overscroll-behavior-inline:contain;
   -webkit-overflow-scrolling:touch;
   scroll-snap-type:none;
 }
}
</style>
<script id="mk-ux99-leader-scroll-hint-script">
(function(){
 'use strict';
 const modal=document.getElementById('modal');
 if(!modal)return;
 let pending=false;
 function enhance(){
  pending=false;
  const table=modal.querySelector('.leader-table');
  if(!table)return;
  const wrap=table.parentElement;
  if(!wrap||wrap.querySelector('.mk-ux99-scroll-hint'))return;
  if(wrap.previousElementSibling?.classList.contains('mk-ux99-scroll-hint'))return;
  if(wrap.scrollWidth<=wrap.clientWidth+12)return;
  wrap.classList.add('leader-table-parent-scroll');
  wrap.setAttribute('aria-label','Таблица лидеров — прокручивается горизонтально');
  wrap.setAttribute('tabindex','0');
  const hint=document.createElement('div');
  hint.className='mk-ux99-scroll-hint';
  hint.setAttribute('role','status');
  hint.innerHTML='<span></span>';
  const label=hint.querySelector('span');
  function update(){
   const max=wrap.scrollWidth-wrap.clientWidth;
   label.textContent=max<=0?''
      :wrap.scrollLeft>max/2?'← Листайте вправо, чтобы вернуться к ученику'
      :'Листайте таблицу влево → XP, монеты, коллекция';
  }
  wrap.addEventListener('scroll',update,{passive:true});
  update();
  wrap.before(hint);
 }
 function queue(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(enhance);
 }
 new MutationObserver(queue).observe(modal,{childList:true,subtree:true});
 queue();
})();
</script>
'''
assert s.count('</body>')==1
s=s.replace('</body>',patch+'</body>',1)
sw=sw.replace('matkvest-iphone-v98','matkvest-iphone-v99',1)
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');sp.write_text(sw,'utf8')
print('UX99_LEADER_SCROLL_AFFORDANCE',sha)
