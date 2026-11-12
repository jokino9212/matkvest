from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
source=h.read_text('utf8');worker=w.read_text('utf8')
marker='<script src="g5-textbook-v111.js"></script>'
if source.count(marker)>1: raise SystemExit('Duplicate v111 script')
if marker not in source:
 anchor='<script src="g5-textbook-core.js"></script>'
 assert source.count(anchor)==1,'Missing v110 core script'
 source=source.replace(anchor,anchor+'\n'+marker,1)
h.write_text(source,'utf8')
if '"./g5-textbook-v111.js"' not in worker:
 anchor='"./g5-textbook-core.js",'
 assert worker.count(anchor)==1
 worker=worker.replace(anchor,anchor+' "./g5-textbook-v111.js",',1)
assert worker.count('"./g5-textbook-v111.js"')==1
digest=hashlib.sha256(source.encode('utf8')).hexdigest()
worker,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),worker)
assert n==1
worker,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'111'+m.group(2),worker)
assert n==1
w.write_text(worker,'utf8')
print('G5_V111_ACTIVATION_PASS',digest)
