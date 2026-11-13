#!/usr/bin/env python3
"""Grade 5 v122: real learner questions consume redesigned donors; PWA synced."""
from pathlib import Path
import hashlib,re
h=Path('index.html');s=Path('sw.js')
html=h.read_text('utf-8');sw=s.read_text('utf-8')
anchor='<script src="g5-textbook-navigation-v121.js"></script>'
added='<script src="g5-live-pedagogy-v122.js"></script>'
assert html.count(anchor)==1,'Grade 5 nav source absent'
assert html.count(added)<=1,'Duplicate live pedagogy script'
if added not in html:html=html.replace(anchor,anchor+'\n'+added,1)
asset_old='"./g5-textbook-navigation-v121.js",'
asset_new='"./g5-live-pedagogy-v122.js",'
assert sw.count(asset_new)<=1,'Duplicate PWA asset'
if asset_new not in sw:
 assert sw.count(asset_old)==1,'Missing PWA anchor'
 sw=sw.replace(asset_old,asset_old+' '+asset_new,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing service-worker digest'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'122'+m.group(2),sw)
assert n==1,'Missing service-worker version'
h.write_text(html,'utf-8');s.write_text(sw,'utf-8')
print('G5_V122_LIVE_PEDAGOGY_ACTIVATED',digest)
