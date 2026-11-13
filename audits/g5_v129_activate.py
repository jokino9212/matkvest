#!/usr/bin/env python3
"""Enable Grade 5 five fraction topics and a decimal duplicate repair."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf-8');sw=w.read_text('utf-8')
anchor='<script src="g5-decimal-percent-v128.js"></script>'
new='<script src="g5-fraction-progress-v129.js"></script>'
assert html.count(anchor)==1 and html.count(new)<=1,'Missing v128 script tag'
if new not in html:html=html.replace(anchor,anchor+'\n'+new,1)
old='"./g5-decimal-percent-v128.js",'
asset='"./g5-fraction-progress-v129.js",'
assert sw.count(asset)<=1,'Duplicate PWA cache entry'
if asset not in sw:
 assert sw.count(old)==1,'Missing old worker entry'
 sw=sw.replace(old,old+' '+asset,1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing HTML hash'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'129'+m.group(2),sw)
assert n==1,'Missing PWA cache version'
h.write_text(html,'utf-8');w.write_text(sw,'utf-8')
print('G5_V129_FRACTION_TOPICS_ACTIVATED',digest)
