#!/usr/bin/env python3
from pathlib import Path
import re,hashlib
h=Path('index.html'); w=Path('sw.js')
html=h.read_text(encoding='utf-8'); sw=w.read_text(encoding='utf-8')
marker='<script src="g5-textbook-v112.js"></script>'
previous='<script src="g5-textbook-v111.js"></script>'
assert html.count(previous)==1,'v111 script anchor missing'
assert html.count(marker)<=1,'duplicate v112 script'
if marker not in html:
    html=html.replace(previous,previous+'\n'+marker,1)
h.write_text(html,encoding='utf-8')
filetag='"./g5-textbook-v112.js"'
assert sw.count(filetag)<=1,'duplicate PWA asset'
if filetag not in sw:
    anchor='"./g5-textbook-v111.js",'
    assert sw.count(anchor)==1,'PWA precache anchor drift'
    sw=sw.replace(anchor,anchor+' '+filetag+',',1)
digest=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'PWA integrity marker not found'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'112'+m.group(2),sw)
assert n==1,'PWA version marker not found'
w.write_text(sw,encoding='utf-8')
print('G5_V112_ACTIVATION_PASS',digest)
