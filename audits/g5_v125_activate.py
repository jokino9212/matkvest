#!/usr/bin/env python3
"""Activate Grade 5 v125 real textbook stage generators and versioned PWA."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-textbook-tiers-v124.js"></script>'
new='<script src="g5-natural-units-v125.js"></script>'
assert html.count(anchor)==1 and html.count(new)<=1,'Missing unique v124 tag'
if new not in html:html=html.replace(anchor,anchor+'\n'+new,1)
old_asset='"./g5-textbook-tiers-v124.js",'
new_asset='"./g5-natural-units-v125.js",'
assert sw.count(new_asset)<=1,'Duplicate worker precache asset'
if new_asset not in sw:
 assert sw.count(old_asset)==1,'Old worker asset missing'
 sw=sw.replace(old_asset,old_asset+' '+new_asset,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'No PWA HTML hash'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'125'+m.group(2),sw)
assert n==1,'No PWA cache number'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V125_NATURAL_COORDINATES_ACTIVATED',digest)
