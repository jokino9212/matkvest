from pathlib import Path
import re,hashlib
h=Path('index.html'); w=Path('sw.js')
html=h.read_text('utf8');worker=w.read_text('utf8')
marker='<script src="g5-fractions-v114.js"></script>'
prev='<script src="g5-pedagogy-v113.js"></script>'
assert html.count(prev)==1 and html.count(marker)<=1,'G5 v114 HTML anchor drift'
if marker not in html:
 html=html.replace(prev,prev+'\n'+marker,1)
h.write_text(html,'utf8')
asset='"./g5-fractions-v114.js"'
assert worker.count(asset)<=1,'G5 v114 precache duplication'
if asset not in worker:
 prevAsset='"./g5-pedagogy-v113.js",'
 assert worker.count(prevAsset)==1,'G5 v113 asset anchor drift'
 worker=worker.replace(prevAsset,prevAsset+' '+asset+',',1)
digest=hashlib.sha256(html.encode('utf8')).hexdigest()
worker,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),worker)
assert n==1,'Missing APP_BUILD_HASH'
worker,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'114'+m.group(2),worker)
assert n==1,'Missing CACHE_NAME'
w.write_text(worker,'utf8')
print('G5_V114_FRACTIONS_PATCH_PASS',digest)
