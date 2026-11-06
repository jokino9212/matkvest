#!/usr/bin/env python3
"""Release candidate 8.74: responsive fraction-answer cells, no gameplay changes."""
from pathlib import Path
import hashlib,re
p=Path('index.html'); sp=Path('sw.js')
html=p.read_text('utf-8'); sw=sp.read_text('utf-8')
assert html.count('</body>')==1
assert html.count('id="mk-v74-responsive-fraction-answers"')==0
assert ".stage18-frac-entry{flex-wrap:nowrap" in html, "Original fraction widget not found"
style="""
<!-- v8.74: responsive fraction answer cells; preserve semantic inputs and keyboard handling -->
<style id="mk-v74-responsive-fraction-answers">
.stage18-frac-wrap{max-width:100%;min-width:0;box-sizing:border-box}
.stage18-frac-entry{
 display:flex;flex-wrap:wrap!important;justify-content:center;align-items:flex-end;
 min-width:0;max-width:100%;box-sizing:border-box;column-gap:clamp(6px,2vw,12px)!important;row-gap:9px
}
.stage18-frac-entry > *{min-width:0;max-width:100%;box-sizing:border-box}
.stage18-frac-stack{width:clamp(48px,17vw,74px);min-width:0;max-width:100%;box-sizing:border-box}
.stage18-frac-stack > .stage18-frac-cell{
 display:block;box-sizing:border-box;width:100%!important;max-width:100%;min-width:0;
 padding-inline:2px!important;font-weight:500
}
.stage18-frac-entry .stage18-frac-cell{box-sizing:border-box;min-width:0;font-weight:500}
.stage18-frac-entry .stage18-frac-bar{box-sizing:border-box;width:100%!important;max-width:100%}
.stage18-frac-entry .stage18-frac-whole .stage18-frac-cell{width:clamp(48px,17vw,74px)!important;max-width:100%}
@media(max-width:360px){.stage18-frac-label{font-size:12px;line-height:1.3}}
</style>
"""
html=html.replace('</body>',style+'</body>')
assert html.count('id="mk-v74-responsive-fraction-answers"')==1
assert html.count('8.73')>=1
html=html.replace('8.73','8.74')
p.write_text(html,'utf-8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
assert 'matkvest-iphone-v73' in sw
sw=sw.replace('matkvest-iphone-v73','matkvest-iphone-v74')
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[a-f0-9]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1
sp.write_text(sw,'utf-8')
print('PATCH SUCCESS',sha,'fraction cell style + version 8.74 + cache v74')
