#!/usr/bin/env python3
"""Activate v131 stage-aware mixed/improper conversions and synchronize offline PWA."""
from pathlib import Path
import re,hashlib
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-fraction-applications-v130.js"></script>'
new='<script src="g5-conversion-stage-v131.js"></script>'
assert html.count(anchor)==1 and html.count(new)<=1,'Expected a single v130 lesson script'
if new not in html:html=html.replace(anchor,anchor+'\n'+new,1)
asset_anchor='"./g5-fraction-applications-v130.js",'
asset_new='"./g5-conversion-stage-v131.js",'
assert sw.count(asset_new)<=1,'Duplicate v131 SW asset'
if asset_new not in sw:
 assert sw.count(asset_anchor)==1,'Missing prior PWA asset'
 sw=sw.replace(asset_anchor,asset_anchor+' '+asset_new,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing service worker HTML hash'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'131'+m.group(2),sw)
assert n==1,'Missing service worker cache name'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V131_TWO_CONVERSIONS_ACTIVATED',digest)
