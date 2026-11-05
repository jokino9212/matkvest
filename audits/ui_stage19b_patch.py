#!/usr/bin/env python3
"""Stage19B: turn the cramped header pills into a real mobile menu without removing actions."""
import hashlib,json
from pathlib import Path
idx=Path('index.html');swp=Path('sw.js')
html=idx.read_text('utf-8');sw=swp.read_text('utf-8')
old='a0d5dd6cf22d3f6d4514a2f558b463c139e05600782b99ce0858f161bc15f949'
if 'id="mk-ui19b-header-styles"' in html:
 assert 'matkvest-iphone-v57' in sw
 assert hashlib.sha256(html.encode()).hexdigest() in sw
 raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==old, 'Refuse to patch mismatched v56'
assert 'matkvest-iphone-v56' in sw and old in sw
css=r"""
<style id="mk-ui19b-header-styles">
/* Mobile first: place secondary destinations in a disclosure menu instead of six wrap rows. */
.top { position:relative; }
.stats .mk-ui19-nav-toggle {display:none;align-items:center;justify-content:center;gap:7px;white-space:nowrap;
  border:1px solid #c9ddd3;border-radius:12px;background:#f2f8f5;color:#164c39;font-weight:700;font-size:13px;line-height:1.2;font-family:inherit;
  min-height:44px;min-width:72px;padding:8px 11px;cursor:pointer}
.stats .mk-ui19-nav-toggle:hover{background:#e7f4ed;border-color:#8dbca5}
.stats .mk-ui19-hamburger{display:flex;flex-direction:column;gap:3px}
.stats .mk-ui19-hamburger i{width:14px;height:2px;background:currentColor;border-radius:2px;display:block}
.stats .mk-ui19-nav-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.stats .mk-ui19-nav-wrap .pill{white-space:nowrap;min-height:40px;display:flex;align-items:center;justify-content:center}
.stats .mk-ui19-nav-wrap .pill:focus-visible {outline:3px solid rgba(38,121,91,.36);outline-offset:2px}
@media (min-width:681px) {
 .stats .mk-ui19-nav-wrap{gap:5px}
 .stats .mk-ui19-nav-wrap .pill{padding:8px 9px;font-size:13px}
}
@media (max-width:680px) {
 .top{overflow:visible!important}
 .stats {display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}
 .stats>.level-pill {display:none!important}
 .stats>.profile-pill {order:1;min-height:44px}
 .stats>.pill:not(.grade-back):not(.profile-pill):not(.level-pill) {order:2;min-height:44px}
 .stats>.mk-ui19-nav-toggle {display:flex!important;order:3}
 .stats>:not(.pill):not(.mk-ui19-nav-wrap):not(.mk-ui19-nav-toggle) {order:4;min-width:0}
 .stats .mk-ui19-nav-wrap{display:none!important}
 .stats[data-mk-ui19-menu="open"] .mk-ui19-nav-wrap {
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;
  position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:150;
  padding:12px;border:1px solid #d3e7dc;border-radius:18px;
  background:#fff;box-shadow:0 18px 45px rgba(19,61,43,.2)
 }
 .stats .mk-ui19-nav-wrap .pill{margin:0;min-width:0;width:auto;min-height:46px;border-radius:12px}
 .stats .mk-ui19-nav-wrap .mk-ui19-secondary-resource{background:#f6faf7}
}
@media(prefers-reduced-motion:reduce){
 .stats .mk-ui19-nav-toggle{transition:none!important;animation:none!important}
}
</style>
"""
script=r"""
<script id="mk-ui19b-header-behavior">
/* Preserve original existing onclick handlers: move actual navigation DOM nodes,
 * never clone them. Keyboard activation enables existing div-pill actions. */
(function(){
 const top=document.querySelector('.top'),stats=top?.querySelector('.stats');
 if(!top||!stats||stats.querySelector('.mk-ui19-nav-toggle'))return;
 const classes=['shop-pill','data-pill','report-pill','leader-pill'];
 const destinations=classes.map(c=>stats.querySelector('.'+c)).filter(Boolean);
 if(destinations.length!==4)return;
 const nav=document.createElement('nav');
 nav.className='mk-ui19-nav-wrap';nav.id='mk-ui19-navigation';
 nav.setAttribute('aria-label','Разделы МатКвеста');
 for(const p of destinations){
   nav.appendChild(p);
   p.setAttribute('role','button');p.tabIndex=0;
   p.addEventListener('keydown',e=>{
     if((e.key==='Enter'||e.key===' ')&&!e.repeat){
       e.preventDefault();p.click();
     }
   });
 }
 const plainPills=[...stats.children].filter(e=>e.className==='pill');
 if(plainPills.length>=2){
   plainPills[1].classList.add('mk-ui19-secondary-resource');
   nav.appendChild(plainPills[1]);
 }
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='mk-ui19-nav-toggle';
 toggle.setAttribute('aria-controls',nav.id);
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-label','Открыть меню разделов');
 toggle.innerHTML='<span class="mk-ui19-hamburger" aria-hidden="true"><i></i><i></i><i></i></span><span>Меню</span>';
 stats.appendChild(toggle);stats.appendChild(nav);
 function setOpen(open){
   stats.dataset.mkUi19Menu=open?'open':'closed';
   toggle.setAttribute('aria-expanded',String(open));
   toggle.setAttribute('aria-label',open?'Закрыть меню разделов':'Открыть меню разделов');
 }
 setOpen(false);
 toggle.addEventListener('click',e=>{e.stopPropagation();setOpen(stats.dataset.mkUi19Menu!=='open')});
 nav.addEventListener('click',e=>{if(e.target.closest('.shop-pill,.data-pill,.report-pill,.leader-pill'))setOpen(false)});
 document.addEventListener('click',e=>{if(!top.contains(e.target))setOpen(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stats.dataset.mkUi19Menu==='open'){setOpen(false);toggle.focus()}});
})();
</script>
"""
assert html.count('</head>')==1 and html.count('</body>')==1
html=html.replace('</head>',css+'\n</head>',1)
html=html.replace('</body>',script+'\n</body>',1)
sha=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v56','matkvest-iphone-v57').replace(old,sha)
assert sha in sw and 'matkvest-iphone-v57' in sw
idx.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
r={'from':old,'sha256':sha,'cache':'matkvest-iphone-v57','scope':'mobile nav disclosure + keyboard support, all existing actions preserved'}
Path('audits/ui_stage19b_patch_report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
print(r)
