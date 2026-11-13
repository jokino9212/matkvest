#!/usr/bin/env python3
"""Grade 5 direct lesson navigation v121: idempotent HTML and PWA activation."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
old='<script src="g5-textbook-navigation-v120.js"></script>'
new='<script src="g5-textbook-navigation-v121.js"></script>'
assert html.count(old)+html.count(new)==1, 'Grade-five navigation scripts drifted'
html=html.replace(old,new,1)
asset_old='"./g5-textbook-navigation-v120.js"'
asset_new='"./g5-textbook-navigation-v121.js"'
assert sw.count(asset_old)+sw.count(asset_new)==1,'PWA Grade-five assets drifted'
sw=sw.replace(asset_old,asset_new,1)
sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1,'PWA hash marker drifted'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'121'+m.group(2),sw)
assert n==1,'PWA cache marker drifted'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V121_DIRECT_LESSON_ACTIVATION_PASS',sha)
