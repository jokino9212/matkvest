#!/usr/bin/env python3
"""v80: restore collection avatar zoom without changing inventory/economy."""
from pathlib import Path
import hashlib
import re
html_path=Path("index.html")
sw_path=Path("sw.js")
s=html_path.read_text(encoding="utf-8")
patches=[
("""  if(collected&&/Питомцы/.test(collected.closest('.mk872-col-section')?.querySelector('h3')?.textContent||''))return {kind:'pet',node:collected};""",
"""  if(collected){
   const heading=collected.closest('.mk872-col-section')?.querySelector('h3')?.textContent||'';
   if(/Питомцы/.test(heading))return {kind:'pet',node:collected};
   if(/Аватары/.test(heading)||collected.matches('.mk868-final-hero-card'))return {kind:'avatar',node:collected};
  }"""),
("""  const name=orig.closest('.mk868-final-hero-card,.shop-card,.mk19g-pet-choice')?.querySelector('strong,.shop-name')
    ||orig.closest('.mk19g-pet-panel')?.querySelector('.mk19g-pet-name');""",
"""  const name=orig.closest('.mk872-col-card')?.querySelector('strong')
    ||orig.closest('.mk868-final-hero-card,.shop-card,.mk19g-pet-choice')?.querySelector('strong,.shop-name')
    ||orig.closest('.mk19g-pet-panel')?.querySelector('.mk19g-pet-name');"""),
(""" .mk30-visual.mk30-pet .stack-badge{font-size:.34em}""".strip(),
""" .mk30-visual.mk30-pet .stack-badge{font-size:.34em}
/* v80: collection avatars use the full visual area in the zoom dialog. */
.mk30-visual.mk30-avatar>.mk872-col-art{
 width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
 max-width:100%!important;max-height:100%!important;display:grid!important;place-items:center!important;
 padding:0!important;position:relative!important;inset:auto!important;margin:0!important;transform:none!important;
}
.mk30-visual.mk30-avatar>.mk872-col-art>.shop-icon{
 width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;
 display:grid!important;place-items:center!important;font-size:clamp(75px,24vw,165px)!important;
}
.mk30-visual.mk30-avatar>.mk872-col-art>.shop-icon img{
 width:95%!important;height:95%!important;object-fit:contain!important;
}""".strip())
]
for old,new in patches:
    if new in s:
        continue
    assert s.count(old)==1, f"Unsafe replacement count: {s.count(old)} for {old[:75]}"
    s=s.replace(old,new,1)
assert s.count('id="mk30-artwork-viewer-script"')==1
assert s.count('v80: collection avatars')==1
assert s.count("</body>")==1
html_path.write_text(s,encoding="utf-8")
digest=hashlib.sha256(html_path.read_bytes()).hexdigest()
sw=sw_path.read_text(encoding="utf-8")
sw,n=re.subn(r'const CACHE_NAME = "matkvest-iphone-v\d+";', 'const CACHE_NAME = "matkvest-iphone-v80";',sw,count=1)
assert n==1
sw,n=re.subn(r'const APP_BUILD_HASH = "[a-f0-9]{64}";', f'const APP_BUILD_HASH = "{digest}";',sw,count=1)
assert n==1
sw_path.write_text(sw,encoding="utf-8")
print("PASS: v80 viewer+cache",digest)
