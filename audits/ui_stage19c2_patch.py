#!/usr/bin/env python3
"""UI19C/2: compact home cards and one-row adaptive header on verified v58."""
from pathlib import Path
import hashlib,json
index=Path('index.html'); worker=Path('sw.js')
html=index.read_text('utf-8');sw=worker.read_text('utf-8')
before='0ed7fcbaa4fa3030fd7ddf21152aff2097c754a73b203c4f9c3e55a1e409f196'
if 'id="mk-ui19c2-layout"' in html:
    assert 'matkvest-iphone-v59' in sw
    assert hashlib.sha256(html.encode()).hexdigest() in sw
    print('UI19C/2 already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==before, 'Refusing to mutate mismatched v58 HTML'
assert 'matkvest-iphone-v58' in sw and before in sw, 'Unexpected service worker'
assert html.count('</body>')==1 and 'mk-ui19c-design-system' in html
css=r"""
<style id="mk-ui19c2-layout">
/* UI19C/2 — navigation density and hierarchy; scoped to existing component shells. */
@media (min-width:681px){
 .top{align-items:center!important;padding:10px 13px!important;gap:12px!important}
 .top>.stats{display:flex;align-items:center;justify-content:flex-end;flex:1 1 auto;min-width:0;flex-wrap:nowrap!important;gap:6px!important}
 /* This level pill duplicated the text already embedded in the existing progress indicator. */
 .top>.stats>.level-pill{display:none!important}
 .top>.stats>.profile-pill{min-height:44px;font-size:14px;padding:6px 8px}
 .top>.stats>.pill:not(.grade-back):not(.profile-pill):not(.level-pill){min-height:44px;font-size:14px;padding:6px 8px}
 .top>.stats>#mk872TopLevelProgress{
   flex:0 1 174px!important;width:174px!important;max-width:174px!important;
   min-width:126px!important;margin:0!important
 }
 .top>.stats>.mk-ui19-nav-wrap{align-items:center;min-width:0;gap:4px}
 .top>.stats>.mk-ui19-nav-wrap>.pill{min-height:44px;padding:7px 8px;font-size:12px;border-radius:11px}
 .top>.stats>.mk-ui19-nav-wrap>.mk-ui19-secondary-resource{font-variant-numeric:tabular-nums}
}
@media(min-width:1121px){
 .top>.stats>.mk-ui19-nav-wrap{display:flex!important;flex:0 0 auto;flex-wrap:nowrap!important;white-space:nowrap}
 .top>.stats>.mk-ui19-nav-toggle{display:none!important}
}
/* Intermediate widths: an intentional compact navigation overlay, not a second header row. */
@media(min-width:681px) and (max-width:1120px){
 .top>.stats>.mk-ui19-nav-toggle{display:flex!important;min-height:44px;min-width:86px;flex:0 0 auto}
 .top>.stats>.mk-ui19-nav-wrap{display:none!important}
 .top>.stats[data-mk-ui19-menu="open"]>.mk-ui19-nav-wrap{
   display:grid!important;position:absolute;z-index:160;
   left:auto;right:0;top:calc(100% + 8px);width:min(470px,100%);
   grid-template-columns:repeat(2,minmax(0,1fr));
   padding:12px;border:1px solid var(--mk19c-border);border-radius:16px;
   background:#fff;box-shadow:0 18px 45px rgba(21,60,47,.16);gap:8px
 }
 .top>.stats[data-mk-ui19-menu="open"]>.mk-ui19-nav-wrap>.pill{
   min-width:0;width:auto;min-height:44px;margin:0;padding:8px;
   border-radius:12px;font-size:13px
 }
}
@media(min-width:681px) and (max-width:800px){
 .top>.stats>#mk872TopLevelProgress{flex-basis:132px!important;width:132px!important;max-width:132px!important;min-width:104px!important}
 .top>.stats>.profile-pill{padding:6px}
}
/* Class selection is already clickable across the entire card.
   Tighten visual rhythm while preserving the native CTA and its focus state. */
.grade-grid>.grade-card{padding:17px!important;border-radius:18px}
.grade-grid>.grade-card>.grade-ico{max-height:48px}
.grade-grid>.grade-card>h2{
  font-size:clamp(20px,1.72vw,23px)!important;line-height:1.18!important;
  font-weight:800;letter-spacing:-.025em;margin:6px 0 4px!important
}
.grade-grid>.grade-card>p{
  font-size:14px!important;line-height:1.38!important;
  margin:8px 0 10px!important;min-height:0!important;color:var(--mk19c-muted)
}
.grade-grid>.grade-card>.grade-summary{
  font-size:11.5px!important;line-height:1.3!important;
  margin-top:auto!important;margin-bottom:7px!important;
}
#mainView .grade-grid>.grade-card>button.btn.primary{
  min-height:44px!important;padding:8px 10px!important;
  font-size:14px!important;font-weight:750!important;
  background-color:#e7f4ec!important;border:1px solid #c5dfd0!important;
  color:#155940!important;border-radius:11px!important;box-shadow:none!important;
}
@media(hover:hover){
 #mainView .grade-grid>.grade-card:hover>button.btn.primary{
   background-color:#d9eddf!important;border-color:#a9ceb6!important;color:#104b36!important
 }
}
@media(max-width:680px){
 .grade-grid>.grade-card{padding:16px!important;border-radius:16px}
 .grade-grid>.grade-card>h2{font-size:21px!important}
 .grade-grid>.grade-card>p{font-size:13px!important;line-height:1.42!important;margin:8px 0 10px!important}
 .grade-grid>.grade-card>.grade-summary{font-size:11.5px!important}
}
/* Explicit keyboard and touch feedback, never animation-dependent affordances. */
.top .mk-ui19-nav-toggle:focus-visible,
.top .mk-ui19-nav-wrap>.pill:focus-visible,
#mainView .grade-grid>.grade-card>button.btn.primary:focus-visible{
 outline:3px solid rgba(23,107,84,.4)!important;outline-offset:3px
}
@media(hover:none){#mainView .grade-grid>.grade-card:hover>button.btn.primary{background-color:#e7f4ec!important}}
@media(prefers-reduced-motion:reduce){
 .grade-grid>.grade-card>.btn.primary,.top .mk-ui19-nav-toggle{transition:none!important;animation:none!important}
}
</style>
"""
html=html.replace('</body>',css+'\n</body>',1)
after=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v58','matkvest-iphone-v59').replace(before,after)
assert 'matkvest-iphone-v59' in sw and after in sw
index.write_text(html,'utf-8');worker.write_text(sw,'utf-8')
report={'phase':'19C/2','base':before,'sha256':after,'cache':'matkvest-iphone-v59',
 'changes':['single-line desktop navigation >=1121 px','compact accessible navigation disclosure 681–1120 px','reduce redundant level pill','compact class cards','readable small-screen copy and coherent CTAs'],
 'excluded':['mathematics','store purchases','progress storage','data migrations','backend']}
Path('audits/ui_stage19c2_patch_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))