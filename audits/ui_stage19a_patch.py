#!/usr/bin/env python3
"""MatKvest UI Stage19A: modern interaction polish + one-action cards."""
from pathlib import Path
import hashlib,json
idx=Path('index.html');swp=Path('sw.js')
html=idx.read_text(encoding='utf-8');sw=swp.read_text(encoding='utf-8')
before='12e52584246cf5763dc378052b7e134dda3b4d7639576296f3448ab97d638e0d'
if 'id="mk-ui19a-styles"' in html:
    assert 'matkvest-iphone-v56' in sw
    assert hashlib.sha256(html.encode()).hexdigest() in sw
    print('UI19A already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==before,"Unexpected production baseline: refuse mutation"
assert 'matkvest-iphone-v55' in sw and before in sw,"Mismatched service worker"
css=r"""
<style id="mk-ui19a-styles">
/* Stage19A: restrained, accessible interaction system.  Never alter question layout. */
:root { --mk-ui-accent:#24745c; --mk-ui-accent-tint:#e9f5ef; --mk-ui-ring:rgba(38,121,91,.36) }
.grade-grid > .grade-card,
.quick-home .quick-card {
  cursor:pointer;
  border-color:rgba(48,85,71,.17);
  box-shadow:0 2px 4px rgba(27,60,45,.035),0 11px 28px rgba(27,60,45,.075);
  transition:transform 190ms cubic-bezier(.2,.7,.2,1),box-shadow 190ms ease,border-color 190ms ease,background-color 190ms ease;
}
.grade-grid > .grade-card:not(.soon):hover,
.quick-home .quick-card:hover {
  transform:translateY(-3px);
  border-color:rgba(31,113,79,.48);
  box-shadow:0 6px 14px rgba(26,75,54,.075),0 19px 38px rgba(26,75,54,.13);
}
.grade-grid > .grade-card:active,
.quick-home .quick-card:active {transform:translateY(-1px)}
.grade-grid > .grade-card:focus-within,
.quick-home .quick-card:focus-within {outline:3px solid var(--mk-ui-ring);outline-offset:3px;border-color:var(--mk-ui-accent)}
.grade-grid > .grade-card .btn:focus-visible,
.quick-home .quick-card .btn:focus-visible {outline:2px solid var(--mk-ui-accent);outline-offset:3px}
.grade-grid > .grade-card .btn,
.quick-home .quick-card .btn {transition:background-color 165ms ease,transform 165ms ease,box-shadow 165ms ease,border-color 165ms ease}
.grade-grid > .grade-card:hover .btn.primary,
.quick-home .quick-card:hover .btn.primary {box-shadow:0 3px 10px rgba(65,55,6,.13)}
/* Consistent unobtrusive feedback for other genuinely interactive components. */
.btn:not(:disabled),
.pill[onclick],.profile-pill,.shop-pill,.report-pill,.data-pill,.leader-pill{
  transition:transform 150ms ease,box-shadow 150ms ease,background-color 150ms ease,border-color 150ms ease;
}
.btn:not(:disabled):hover {filter:brightness(1.035)}
.btn:not(:disabled):active {transform:scale(.985)}
.btn:focus-visible,button:focus-visible,a:focus-visible,
[role="button"]:focus-visible {outline:3px solid var(--mk-ui-ring);outline-offset:3px}
@media (hover:none) {
 .grade-grid > .grade-card:hover,.quick-home .quick-card:hover {transform:none;box-shadow:0 2px 4px rgba(27,60,45,.035),0 11px 28px rgba(27,60,45,.075)}
 .btn:not(:disabled):hover{filter:none}
}
@media (prefers-reduced-motion:reduce) {
 .grade-grid > .grade-card,.quick-home .quick-card,.btn,.pill {transition:none!important;animation:none!important;transform:none!important}
}
</style>
"""
script=r"""
<script id="mk-ui19a-card-interaction">
/* Existing CTA remains the one accessible keyboard target.  Click any empty
 * surface only when there is EXACTLY one valid action. Dynamic re-renders work
 * without listeners attached to individual cards. */
(function(){
  const cardSelector='.grade-grid > .grade-card:not(.g7-card):not(.soon), .quick-home .quick-card';
  const interactive='button,a[href],input,select,textarea,[role="button"],[role="link"],[contenteditable="true"]';
  function onlyAction(card){
    if(!card||card.matches('[aria-disabled="true"],.disabled,.locked,.soon'))return null;
    const actions=Array.from(card.querySelectorAll(interactive))
      .filter(el=>!el.matches('[disabled],[aria-disabled="true"]') && getComputedStyle(el).display!=='none');
    if(actions.length!==1)return null;
    const action=actions[0];
    if(action.tagName!=='BUTTON'&&action.tagName!=='A')return null;
    return action;
  }
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(!(e.target instanceof Element))return;
    if(e.target.closest(interactive))return; // native action, do not duplicate
    const card=e.target.closest(cardSelector);
    if(!card)return;
    const action=onlyAction(card);
    if(!action)return;
    action.click(); // reuse the original route; never guess a lesson ID
  });
})();
</script>
"""
assert html.count('</head>')==1 and html.count('</body>')==1
html=html.replace('</head>',css+'\n</head>',1)
html=html.replace('</body>',script+'\n</body>',1)
after=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v55','matkvest-iphone-v56').replace(before,after)
assert 'matkvest-iphone-v56' in sw and after in sw
idx.write_text(html,encoding='utf-8');swp.write_text(sw,encoding='utf-8')
report={"old_html_sha256":before,"new_html_sha256":after,"sw_cache":"matkvest-iphone-v56",
"scope":["1-6 grade cards entire surface","home quick-trainer cards entire surface","consistent hover focus and pressed states","touch and reduced-motion responsive safeguards"],
"excluded":["g7/g8 already-clickable cards","multiple-action cards","shop buying/deleting interactions"]}
Path('audits/ui_stage19a_patch_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
