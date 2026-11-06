#!/usr/bin/env python3
"""Safe exact-match fix for grade-4 column division, v71 -> v72 candidate."""
from pathlib import Path
import hashlib,re
p=Path("index.html"); swp=Path("sw.js"); s=p.read_text("utf-8")
old='<div class="div-layout"><div class="div-rows">'+chr(36)+'{rows}</div><div class="div-side">'
new='<div class="div-layout" style="--mk-cols:'+chr(36)+'{cols};--mk-qcols:'+chr(36)+'{t.quotient.length};--mk-slots:'+chr(36)+'{cols+t.quotient.length+1}"><div class="div-rows">'+chr(36)+'{rows}</div><div class="div-side">'
if 'id="mk-mobile-column-division-v72"' in s:
    assert new in s
    print("Already patched");raise SystemExit(0)
assert s.count(old)==1,("division render mismatch",s.count(old))
assert s.count("</body>")==1
css=r"""
<!-- Mobile long division v72: proportionally size the COMPLETE arrangement -->
<style id="mk-mobile-column-division-v72">
.column-modal .div-layout{display:grid!important;grid-template-columns:max-content max-content!important;justify-content:center!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:3px!important;overflow:visible!important;container-type:inline-size}
.column-modal .div-layout .div-rows,.column-modal .div-layout .div-side{--mk-cell:max(13px,min(46px,calc((100cqw - 12px)/var(--mk-slots))));min-width:0!important;box-sizing:border-box!important}
.column-modal .div-layout .drow{grid-template-columns:calc(var(--mk-cell)*.78) repeat(var(--dcols),var(--mk-cell))!important;grid-auto-rows:var(--mk-cell)!important}
.column-modal .div-layout .div-top-row,.column-modal .div-layout .div-input-row{grid-auto-rows:var(--mk-cell)!important}
.column-modal .div-layout .div-line-row{grid-auto-rows:6px!important;height:6px!important;min-height:6px!important}
.column-modal .div-layout .div-fixed,.column-modal .div-layout .div-spacer{box-sizing:border-box!important;width:calc(var(--mk-cell) - 2px)!important;height:calc(var(--mk-cell) - 2px)!important;min-width:0!important;font-size:clamp(13px,calc(var(--mk-cell)*.61),28px)!important}
.column-modal .div-layout .div-work-in{box-sizing:border-box!important;width:calc(var(--mk-cell) - 3px)!important;height:calc(var(--mk-cell) - 3px)!important;min-width:0!important;font-size:clamp(13px,calc(var(--mk-cell)*.58),25px)!important;padding:0!important;border-radius:5px!important}
.column-modal .div-layout .div-rule{box-sizing:border-box!important;width:calc(var(--mk-cell) - 3px)!important;max-width:100%!important}
.column-modal .div-layout .div-op{box-sizing:border-box!important;width:calc(var(--mk-cell)*.76)!important;height:calc(var(--mk-cell) - 2px)!important;font-size:clamp(13px,calc(var(--mk-cell)*.60),26px)!important}
.column-modal .div-layout .inline-div-op{width:calc(var(--mk-cell) - 3px)!important}
.column-modal .div-layout .div-side{box-sizing:border-box!important;width:calc(var(--mk-cell)*var(--mk-qcols) + 8px)!important;min-width:0!important;font-size:clamp(13px,calc(var(--mk-cell)*.58),26px)!important}
.column-modal .div-layout .divisor-box{box-sizing:border-box!important;min-width:0!important;width:100%!important;height:var(--mk-cell)!important;padding:0 3px!important}
.column-modal .div-layout .quotient-inputs{box-sizing:border-box!important;display:flex!important;min-width:0!important;width:100%!important;gap:2px!important;padding:4px 3px 0!important;min-height:calc(var(--mk-cell) + 5px)!important}
.column-modal .div-layout .qin{box-sizing:border-box!important;flex:0 0 calc(var(--mk-cell) - 2px)!important;min-width:0!important;width:calc(var(--mk-cell) - 2px)!important;height:calc(var(--mk-cell) - 3px)!important;font-size:clamp(13px,calc(var(--mk-cell)*.57),24px)!important;padding:0!important}
@media(max-width:520px){.column-modal{box-sizing:border-box!important;width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;padding-left:8px!important;padding-right:8px!important}.column-modal .card{box-sizing:border-box!important;min-width:0!important;padding-left:5px!important;padding-right:5px!important}.column-modal .div-layout{padding-left:0!important;padding-right:0!important}}
</style>
"""
s=s.replace(old,new,1).replace("</body>",css+"\n</body>",1)
p.write_text(s,"utf-8")
h=hashlib.sha256(p.read_bytes()).hexdigest()
sw=swp.read_text("utf-8")
assert "matkvest-iphone-v71" in sw
sw=sw.replace("matkvest-iphone-v71","matkvest-iphone-v72")
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[a-f0-9]{64}(";)',lambda m:m[1]+h+m[2],sw)
assert n==1
swp.write_text(sw,"utf-8")
print("v72 candidate HTML SHA-256:",h)
