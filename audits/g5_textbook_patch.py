from pathlib import Path
import hashlib,re
html=Path('index.html');sw_file=Path('sw.js')
source=html.read_text('utf-8');worker=sw_file.read_text('utf-8')
marker='<script src="g5-textbook-topics.js"></script>'
core_marker='<script src="g5-textbook-core.js"></script>'
if source.count(marker)>1 or source.count(core_marker)>1: raise SystemExit('Duplicate Grade 5 textbook script')
if marker not in source:
 anchor='</body></html>'
 assert source.count(anchor)==1,'HTML footer drift'
 assert source.count('<script src="g5-conversion-ux.js"></script>')==1,'Conversion patch missing'
 source=source.replace(anchor,marker+'\n'+anchor,1)
 assert source.index(marker)>source.index('<script src="g5-conversion-ux.js"></script>')
if core_marker not in source:
 assert source.count(marker)==1
 source=source.replace(marker,marker+'\n'+core_marker,1)
html.write_text(source,'utf-8')
if '"./g5-textbook-topics.js"' not in worker:
 anchor='"./g5-conversion-ux.js",'
 assert worker.count(anchor)==1,'PWA file-list drift'
 worker=worker.replace(anchor,anchor+' "./g5-textbook-topics.js",',1)
assert worker.count('"./g5-textbook-topics.js"')==1
if '"./g5-textbook-core.js"' not in worker:
  worker=worker.replace('"./g5-textbook-topics.js",','"./g5-textbook-topics.js", "./g5-textbook-core.js",',1)
assert worker.count('"./g5-textbook-core.js"')==1
digest=hashlib.sha256(source.encode('utf-8')).hexdigest()
worker,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),worker)
assert n==1
worker,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'110'+m.group(2),worker)
assert n==1
sw_file.write_text(worker,'utf-8')
print('G5_TEXTBOOK_PATCH_PASS',digest)
