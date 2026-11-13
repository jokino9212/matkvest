#!/usr/bin/env python3
"""Activate Grade 5 v123 core tiered arithmetic after v122; synchronize PWA."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-live-pedagogy-v122.js"></script>'
script='<script src="g5-arithmetic-tiers-v123.js"></script>'
assert html.count(anchor)==1 and html.count(script)<=1,'Missing or duplicated curriculum script'
if script not in html:html=html.replace(anchor,anchor+'\n'+script,1)
old='"./g5-live-pedagogy-v122.js",'
asset='"./g5-arithmetic-tiers-v123.js",'
assert sw.count(asset)<=1,'Duplicated precache asset'
if asset not in sw:
 assert sw.count(old)==1,'PWA anchor missing'
 sw=sw.replace(old,old+' '+asset,1)
hash=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+hash+m.group(2),sw)
assert n==1,'PWA hash absent'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'123'+m.group(2),sw)
assert n==1,'PWA version absent'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V123_CORE_TIER_ACTIVATION_PASS',hash)
