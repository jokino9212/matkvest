#!/usr/bin/env python3
from pathlib import Path
import re, hashlib
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf8');sw=w.read_text('utf8')
anchor='<script src="g5-fraction-arithmetic-v115.js"></script>'
marker='<script src="g5-decimals-v116.js"></script>'
assert html.count(anchor)==1 and html.count(marker)<=1,'Grade-five v116 HTML anchor mismatch'
if marker not in html:html=html.replace(anchor,anchor+'\n'+marker,1)
h.write_text(html,'utf8')
asset='"./g5-decimals-v116.js"'
assert sw.count(asset)<=1,'Duplicate v116 PWA asset'
if asset not in sw:
 preceding='"./g5-fraction-arithmetic-v115.js",'
 assert sw.count(preceding)==1,'Missing v115 PWA anchor'
 sw=sw.replace(preceding,preceding+' '+asset+',',1)
sha=hashlib.sha256(html.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1,'APP_BUILD_HASH location changed'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'116'+m.group(2),sw)
assert n==1,'PWA version location changed'
w.write_text(sw,'utf8')
print('G5_V116_DECIMAL_ACTIVATION_PASS',sha)
