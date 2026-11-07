#!/usr/bin/env python3
"""Normalize fullscreen collection pet artwork without touching card sizing."""
from pathlib import Path
import hashlib,re
html=Path('index.html'); swpath=Path('sw.js')
s=html.read_text(encoding='utf-8')
anchor='/* v80: collection avatars use the full visual area in the zoom dialog. */'
assert s.count(anchor)==1, 'v80 viewer marker missing or duplicated'
css='''/* v81: prevent collection pet art inheriting the tiny inventory thumbnail geometry. */
.mk30-visual.mk30-pet>.mk872-col-art{
 width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
 max-width:100%!important;max-height:100%!important;display:grid!important;
 place-items:center!important;padding:0!important;margin:0!important;
 position:relative!important;inset:auto!important;transform:none!important;
}
.mk30-visual.mk30-pet>.mk872-col-art>.shop-icon{
 width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
 max-width:100%!important;max-height:100%!important;display:grid!important;
 place-items:center!important;font-size:clamp(75px,24vw,165px)!important;
}
.mk30-visual.mk30-pet>.mk872-col-art>.shop-icon img,
.mk30-visual.mk30-pet>.mk872-col-art>.shop-icon svg{
 width:95%!important;height:95%!important;max-width:95%!important;
 max-height:95%!important;object-fit:contain!important;
}
'''
assert s.count('v81: prevent collection pet art') in (0,1)
if 'v81: prevent collection pet art' not in s:
 s=s.replace(anchor, css+anchor,1)
assert s.count('id="mk30-artwork-viewer-script"')==1
assert s.count('</body>')==1
html.write_text(s,encoding='utf-8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
sw=swpath.read_text(encoding='utf-8')
sw,n=re.subn(r'const CACHE_NAME = "matkvest-iphone-v\d+";', 'const CACHE_NAME = "matkvest-iphone-v81";', sw,count=1)
assert n==1
sw,n=re.subn(r'const APP_BUILD_HASH = "[0-9a-f]{64}";',f'const APP_BUILD_HASH = "{digest}";',sw,count=1)
assert n==1
swpath.write_text(sw,encoding='utf-8')
print('PASS v81 pet modal geometry, sha256:',digest)
