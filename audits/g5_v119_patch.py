#!/usr/bin/env python3
"""Idempotent Grade 5 UI v119 activation; service worker remains synchronized."""
from pathlib import Path
import hashlib,re
html_path=Path('index.html')
sw_path=Path('sw.js')
html=html_path.read_text('utf8')
sw=sw_path.read_text('utf8')
old='<script src="g5-textbook-navigation-v118.js"></script>'
new='<script src="g5-textbook-navigation-v119.js"></script>'
assert html.count(old)+html.count(new)==1,'Expected one textbook navigation script'
html=html.replace(old,new,1)
old_asset='"./g5-textbook-navigation-v118.js"'
new_asset='"./g5-textbook-navigation-v119.js"'
assert sw.count(old_asset)+sw.count(new_asset)==1,'Expected one PWA navigation asset'
sw=sw.replace(old_asset,new_asset,1)
digest=hashlib.sha256(html.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'PWA hash anchor not found'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'119'+m.group(2),sw)
assert n==1,'PWA cache version anchor not found'
html_path.write_text(html,'utf8')
sw_path.write_text(sw,'utf8')
print('G5_V119_SINGLE_SEARCH_COLLAPSE_ACTIVATED',digest)
