#!/usr/bin/env python3
from pathlib import Path
import re,hashlib
h=Path('index.html');w=Path('sw.js')
html=h.read_text('utf8');worker=w.read_text('utf8')
marker='<script src="g5-pedagogy-v113.js"></script>'
anchor='<script src="g5-textbook-v112.js"></script>'
assert html.count(anchor)==1 and html.count(marker)<=1,'v113 HTML anchor drift'
if marker not in html:html=html.replace(anchor,anchor+'\n'+marker,1)
h.write_text(html,'utf8')
asset='"./g5-pedagogy-v113.js"'
assert worker.count(asset)<=1,'v113 PWA duplication'
if asset not in worker:
 prev='"./g5-textbook-v112.js",'
 assert worker.count(prev)==1,'v112 PWA anchor drift'
 worker=worker.replace(prev,prev+' '+asset+',',1)
digest=hashlib.sha256(html.encode('utf8')).hexdigest()
worker,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),worker)
assert n==1
worker,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'113'+m.group(2),worker)
assert n==1
w.write_text(worker,'utf8')
print('G5_PEDAGOGY_V113_PATCH_PASS',digest)
