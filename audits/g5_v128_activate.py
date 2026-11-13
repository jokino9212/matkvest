#!/usr/bin/env python3
"""Activate 6 decimal/percent/mean topics and sync PWA v128."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-decimal-tiers-v127.js"></script>'
new='<script src="g5-decimal-percent-v128.js"></script>'
assert html.count(anchor)==1 and html.count(new)<=1,'Expected one decimal v127 script'
if new not in html:html=html.replace(anchor,anchor+'\n'+new,1)
old_asset='"./g5-decimal-tiers-v127.js",'
new_asset='"./g5-decimal-percent-v128.js",'
assert sw.count(new_asset)<=1,'Repeated v128 asset'
if new_asset not in sw:
 assert sw.count(old_asset)==1,'Missing PWA anchor'
 sw=sw.replace(old_asset,old_asset+' '+new_asset,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing app digest'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'128'+m.group(2),sw)
assert n==1,'Missing PWA cache'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V128_DECIMAL_PERCENT_ACTIVATED',digest)
