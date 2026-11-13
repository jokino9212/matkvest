#!/usr/bin/env python3
"""Idempotent Grade 5 textbook navigation UI release v118; PWA stays synchronized."""
from pathlib import Path
import hashlib
import re

html_path=Path('index.html')
sw_path=Path('sw.js')
html=html_path.read_text('utf-8')
sw=sw_path.read_text('utf-8')
old='<script src="g5-textbook-navigation-v117.js"></script>'
new='<script src="g5-textbook-navigation-v118.js"></script>'
assert html.count(old)+html.count(new)==1, 'Unexpected Grade 5 textbook navigation script tags'
html=html.replace(old,new,1)
old_asset='"./g5-textbook-navigation-v117.js"'
new_asset='"./g5-textbook-navigation-v118.js"'
assert sw.count(old_asset)+sw.count(new_asset)==1, 'Unexpected Grade 5 PWA navigation asset list'
sw=sw.replace(old_asset,new_asset,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1, 'Missing service worker HTML digest'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'118'+m.group(2),sw)
assert n==1, 'Missing service worker cache version'
html_path.write_text(html,'utf-8')
sw_path.write_text(sw,'utf-8')
print('G5_V118_NAV_UI_ACTIVATION_PASS',digest)
