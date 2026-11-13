#!/usr/bin/env python3
"""Idempotently activate Grade 5 two-volume textbook navigation with PWA integrity."""
from pathlib import Path
import hashlib
import re

html_path=Path('index.html')
sw_path=Path('sw.js')
html=html_path.read_text('utf-8')
sw=sw_path.read_text('utf-8')
anchor='<script src="g5-decimals-v116.js"></script>'
new='<script src="g5-textbook-navigation-v117.js"></script>'
assert html.count(anchor)==1, 'v116 script is missing or repeated'
assert html.count(new)<=1, 'v117 navigation repeated'
if new not in html:
    html=html.replace(anchor,anchor+'\n'+new,1)
asset='"./g5-textbook-navigation-v117.js"'
assert sw.count(asset)<=1, 'v117 PWA precache repeated'
if asset not in sw:
    preceding='"./g5-decimals-v116.js",'
    assert sw.count(preceding)==1, 'v116 PWA anchor drifted'
    sw=sw.replace(preceding,preceding+' '+asset+',',1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1, 'PWA digest marker missing'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'117'+m.group(2),sw)
assert n==1, 'PWA version marker missing'
html_path.write_text(html,'utf-8')
sw_path.write_text(sw,'utf-8')
print('G5_TEXTBOOK_V117_ACTIVATION_PASS',digest)
