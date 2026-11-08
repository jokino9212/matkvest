from pathlib import Path
import re,hashlib
p=Path('index.html'); swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v90' in sw
assert 'id="mk-ux91-mobile-shop-ui"' not in s
assert s.count('</body>')==1
patch=r'''
<style id="mk-ux91-mobile-shop-ui">
@media(max-width:480px){
 #modal .mtop:has(.mk872-help-heading){
   display:flex;align-items:center;justify-content:space-between;gap:8px;
   min-width:0;flex-wrap:nowrap;
 }
 #modal .mtop .mk872-help-heading{
   flex:1 1 auto;min-width:0;margin:0;display:flex;align-items:center;
   gap:6px;white-space:nowrap;font-size:clamp(15px,4.5vw,19px);
   line-height:1.22;letter-spacing:-.35px;
 }
 #modal .mtop .mk872-help-heading .mk872-help-trigger{
   display:inline-grid;place-items:center;flex:0 0 30px;
   width:30px;height:30px;min-width:30px;margin:0;white-space:nowrap;
 }
 #modal .mtop .x{
   flex:0 0 36px;min-width:36px;width:36px;height:36px;
   margin:0;display:grid;place-items:center;
 }
 #modal .mk-ux91-category-label{
   display:grid;grid-template-columns:1fr;gap:5px;
   margin:8px 0 12px;font-weight:800;font-size:13px;
   color:var(--ink);min-width:0;
 }
 #modal .mk-ux91-category-select{
   width:100%;min-width:0;max-width:100%;box-sizing:border-box;
   min-height:44px;padding:10px 38px 10px 13px;border-radius:12px;
   border:1px solid #a5c5b4;background:#f8fbf9;color:var(--ink);
   font:800 15px/1.25 system-ui,sans-serif;
 }
 #modal .mk-ux91-category-select:focus-visible{
   outline:3px solid #3b916b;outline-offset:2px;
 }
 #modal .shop-tabs:has(+ .mk-ux91-category-label),
 #modal .shop-tabs:has(~ .mk-ux91-category-label){display:none}
}
@media(min-width:481px){#modal .mk-ux91-category-label{display:none}}
</style>
<script id="mk-ux91-mobile-shop-ui-script">
(function(){
 'use strict';
 const modal=document.getElementById('modal');
 if(!modal)return;
 let pending=false;
 function enhance(){
  pending=false;
  const tabs=modal.querySelector('.shop-tabs');
  const heading=modal.querySelector('.mtop .mk872-help-heading');
  if(!tabs||!heading||!heading.textContent.includes('Магазин наград'))return;
  if(tabs.nextElementSibling?.classList.contains('mk-ux91-category-label'))return;
  const buttons=[...tabs.querySelectorAll('.shop-tab')].filter(b=>b.getAttribute('onclick'));
  if(!buttons.length)return;
  const label=document.createElement('label');
  label.className='mk-ux91-category-label';
  label.append(document.createTextNode('Раздел магазина'));
  const select=document.createElement('select');
  select.className='mk-ux91-category-select';
  select.setAttribute('aria-label','Раздел магазина');
  buttons.forEach((button,i)=>{
   const option=document.createElement('option');
   option.value=String(i);
   option.textContent=button.textContent.trim();
   option.selected=button.classList.contains('active');
   select.append(option);
  });
  select.addEventListener('change',()=>{
   const i=Number(select.value);
   const target=buttons[i];
   if(target)target.click();
  });
  label.append(select);
  tabs.insertAdjacentElement('afterend',label);
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
s=s.replace('</body>',patch+'</body>',1)
sw=sw.replace('matkvest-iphone-v90','matkvest-iphone-v91',1)
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('MOBILE_SHOP_PATCH_V91',sha)
