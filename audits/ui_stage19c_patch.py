#!/usr/bin/env python3
"""19C/1: bounded visual-system overlay on verified v57, no lesson logic touched."""
from pathlib import Path
import hashlib, json
idx=Path('index.html'); swp=Path('sw.js')
html=idx.read_text('utf-8'); sw=swp.read_text('utf-8')
before='2728993b13c043cc1f5d3fbdc8df38d387c172578208893b3455a124f8bfaad5'
if 'id="mk-ui19c-design-system"' in html:
    assert 'matkvest-iphone-v58' in sw
    assert hashlib.sha256(html.encode()).hexdigest() in sw
    print('Stage19C design system already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==before, 'Refuse to overwrite non-v57 HTML'
assert 'matkvest-iphone-v57' in sw and before in sw
style=r"""
<style id="mk-ui19c-design-system">
/* UI 19C/1: cohesive visual primitives. Never restyle formulas, diagrams or question markup. */
:root {
  --mk19c-ink:#17372f; --mk19c-muted:#577269; --mk19c-brand:#176b54;
  --mk19c-brand-hover:#0d5946; --mk19c-wash:#eff7f3; --mk19c-canvas:#f4f8f7;
  --mk19c-border:#d5e5de; --mk19c-surface:#fff;
  --mk19c-shadow:0 2px 7px rgba(22,54,44,.035),0 11px 27px rgba(22,54,44,.075);
  --mk19c-shadow-hover:0 5px 14px rgba(22,54,44,.065),0 16px 32px rgba(22,54,44,.12);
  --mk19c-ease:cubic-bezier(.2,.72,.22,1);
}
body{background:var(--mk19c-canvas);color:var(--mk19c-ink)}
.top{
  border:1px solid var(--mk19c-border);
  background:var(--mk19c-surface);
  border-radius:20px;
  box-shadow:0 2px 8px rgba(21,60,47,.035),0 12px 30px rgba(21,60,47,.065)
}
.top .brand{letter-spacing:-.045em}
.stats .pill:not(.level-pill){
  border-radius:12px;
  border-color:var(--mk19c-border);
  box-shadow:none;
}
.stats .profile-pill{background:#f7fbf9;color:var(--mk19c-ink)}
.stats .mk-ui19-nav-toggle{
  background:var(--mk19c-wash);color:var(--mk19c-brand);
  border-color:#c4ded1;border-radius:12px;
  font-weight:750;transition:background-color .16s ease,border-color .16s ease,box-shadow .16s ease
}
.stats .mk-ui19-nav-toggle:hover{background:#e5f2eb;border-color:#92bda8}
.stats[data-mk-ui19-menu="open"] .mk-ui19-nav-toggle{background:#e0f1e7;border-color:#91bba6;box-shadow:0 0 0 2px rgba(23,107,84,.07)}
.stats .mk-ui19-nav-wrap .pill{
  font-weight:750;border-color:var(--mk19c-border);
}
@media(max-width:680px){
 .stats[data-mk-ui19-menu="open"] .mk-ui19-nav-wrap{
   border-color:var(--mk19c-border);border-radius:16px;
   box-shadow:0 18px 42px rgba(21,60,47,.15)
 }
}
/* Home: remove the dated high-relief look; make every surface feel like the same product. */
.grade-grid>.grade-card,.quick-home .quick-card{
  background:var(--mk19c-surface);
  border:1px solid var(--mk19c-border);
  box-shadow:var(--mk19c-shadow);
  border-radius:20px;
  transition:transform 180ms var(--mk19c-ease),border-color 180ms ease,box-shadow 180ms ease,background-color 180ms ease
}
.grade-grid>.grade-card h2{
  font-size:clamp(21px,2.05vw,26px);
  font-weight:800;letter-spacing:-.035em;line-height:1.13
}
.grade-grid>.grade-card .btn.primary,.quick-home .quick-card .btn.primary{
  min-height:44px;
  background:#edf6f1;
  color:#135640;
  border:1px solid #c7e1d2;
  border-radius:12px;
  box-shadow:none;
  font-weight:750;
  font-size:clamp(14px,1.2vw,15px);
  letter-spacing:-.008em;
  transition:background-color .16s ease,border-color .16s ease,color .16s ease
}
.grade-grid>.grade-card .btn.primary:hover,.quick-home .quick-card .btn.primary:hover{
  background:#dff0e6;border-color:#a4cbb7;color:#104d3a
}
.quick-home .quick-card{border-radius:17px}
@media(hover:hover){
 .grade-grid>.grade-card:not(.soon):hover,.quick-home .quick-card:hover{
   transform:translateY(-2px);
   background:#fff;
   border-color:#9fc8b5;box-shadow:var(--mk19c-shadow-hover)
 }
 .grade-grid>.grade-card:hover .btn.primary,.quick-home .quick-card:hover .btn.primary{
   background:#e1f1e8;border-color:#add5bd;box-shadow:none
 }
}
/* Sections and topics: same background, depth and focus behavior across grades 1–8. */
.topic{
  background-color:var(--mk19c-surface);
  border-color:var(--mk19c-border);
  border-radius:18px;
  box-shadow:var(--mk19c-shadow);
  transition:transform 170ms var(--mk19c-ease),border-color 170ms ease,box-shadow 170ms ease,background-color 170ms ease
}
.topic.g7-card{background-color:#fff}
.topic[role="button"]:focus-visible{
  outline:3px solid rgba(23,107,84,.38);outline-offset:3px;border-color:var(--mk19c-brand)
}
@media(hover:hover){
 .topic:not(.locked):not(.disabled):not(.soon):hover{
   transform:translateY(-2px);border-color:#9bc4b1;box-shadow:var(--mk19c-shadow-hover)
 }
}
.mk874-section-heading{letter-spacing:-.028em;line-height:1.22}
.grade-hero{border-radius:22px;box-shadow:0 8px 25px rgba(21,60,47,.09)}
.grade-hero h1{font-size:clamp(29px,3.35vw,43px);line-height:1.13;letter-spacing:-.035em}
.g7-course{border-color:var(--mk19c-border);border-radius:20px}
/* Common button vocabulary while retaining the existing functional variants. */
.btn{border-radius:12px;font-weight:750;letter-spacing:-.008em}
.btn.soft:not(:disabled){background:#eef6f2;border-color:#d1e4d9;color:#255948}
.btn.primary:not(:disabled){border-color:#e1b552}
.btn:focus-visible,[role="button"]:focus-visible{outline:3px solid rgba(23,107,84,.38);outline-offset:3px}
@media(max-width:680px){
 .grade-grid>.grade-card{border-radius:17px}
 .grade-grid>.grade-card h2{font-size:22px}
 .quick-home .quick-card{border-radius:15px}
 .topic{border-radius:16px}
 .grade-hero{border-radius:20px}
 .grade-hero h1{font-size:clamp(28px,7.5vw,34px)}
 .mk874-section-heading{line-height:1.2}
}
@media(hover:none){
 .grade-grid>.grade-card:hover,.quick-home .quick-card:hover,.topic:hover{
   transform:none;box-shadow:var(--mk19c-shadow)
 }
}
@media(prefers-reduced-motion:reduce){
 .grade-grid>.grade-card,.quick-home .quick-card,.topic,.btn,.stats .mk-ui19-nav-toggle{
   transform:none!important;animation:none!important;transition:none!important
 }
}
</style>
"""
behavior=r"""
<script id="mk-ui19c-topic-keyboard">
/* Existing pointer-clickable topic cards have no native keyboard semantics.
 * Enhance only single-action, enabled cards without changing their event handlers. */
(function(){
 const root=document.getElementById('mainView');
 if(!root)return;
 const unavailable='.soon,.locked,.disabled,[aria-disabled="true"]';
 function enhance(el){
   if(!(el instanceof Element)||!el.matches('.topic')||el.matches(unavailable))return;
   if(el.querySelector('a,button,input,select,textarea,[role="button"]'))return;
   if(el.hasAttribute('tabindex')||el.hasAttribute('role'))return;
   if(getComputedStyle(el).cursor!=='pointer')return;
   el.setAttribute('role','button');el.tabIndex=0;
 }
 root.querySelectorAll('.topic').forEach(enhance);
 const observer=new MutationObserver(records=>{
   for(const rec of records)for(const n of rec.addedNodes){
     if(n.nodeType!==1)continue;
     enhance(n);
     n.querySelectorAll?.('.topic').forEach(enhance);
   }
 });
 observer.observe(root,{childList:true,subtree:true});
 root.addEventListener('keydown',e=>{
   if(e.repeat||!['Enter',' '].includes(e.key))return;
   const el=e.target;
   if(!(el instanceof Element)||!el.matches('.topic[role="button"]'))return;
   if(el.matches(unavailable))return;
   e.preventDefault();el.click();
 });
})();
</script>
"""
assert html.count('</body>')==1 and 'mk-ui19a-styles' in html and 'mk-ui19b-header-styles' in html
html=html.replace('</body>',style+'\n'+behavior+'\n</body>',1)
after=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v57','matkvest-iphone-v58').replace(before,after)
assert 'matkvest-iphone-v58' in sw and after in sw
idx.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
report={'phase':'19C/1','baseline':before,'sha256':after,'sw':'matkvest-iphone-v58',
 'scope':['shared design tokens','grade and quick cards','topic card styling','grade hero typography','header controls','topic keyboard activation'],
 'excluded':['exercises','generators','purchase flow','profile data']}
Path('audits/ui_stage19c_patch_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
