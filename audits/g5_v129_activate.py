#!/usr/bin/env python3
"""Activate v129 learner-facing fraction topic concepts and sync service-worker."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-decimal-percent-v128.js"></script>'
new='<script src="g5-fraction-concepts-v129.js"></script>'
assert html.count(anchor)==1 and html.count(new)<=1,'Missing unique v128 script'
if new not in html:html=html.replace(anchor,anchor+'\n'+new,1)
old_asset='"./g5-decimal-percent-v128.js",'
new_asset='"./g5-fraction-concepts-v129.js",'
assert sw.count(new_asset)<=1,'Repeated v129 PWA script'
if new_asset not in sw:
 assert sw.count(old_asset)==1,'Missing precache anchor'
 sw=sw.replace(old_asset,old_asset+' '+new_asset,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing HTML digest'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'129'+m.group(2),sw)
assert n==1,'Missing cache version'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V129_FRACTION_CONCEPTS_ACTIVATED',digest)
