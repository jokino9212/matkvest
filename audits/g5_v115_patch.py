#!/usr/bin/env python3
from pathlib import Path
import hashlib,re
html_path=Path("index.html");sw_path=Path("sw.js")
html=html_path.read_text("utf8");sw=sw_path.read_text("utf8")
previous='<script src="g5-fractions-v114.js"></script>'
marker='<script src="g5-fraction-arithmetic-v115.js"></script>'
assert html.count(previous)==1 and html.count(marker)<=1,"Missing or duplicated v115 HTML script"
if marker not in html:html=html.replace(previous,previous+'\n'+marker,1)
html_path.write_text(html,"utf8")
asset='"./g5-fraction-arithmetic-v115.js"'
assert sw.count(asset)<=1,"Duplicate v115 service-worker asset"
if asset not in sw:
 prevAsset='"./g5-fractions-v114.js",'
 assert sw.count(prevAsset)==1,"Missing v114 PWA asset"
 sw=sw.replace(prevAsset,prevAsset+' '+asset+',',1)
digest=hashlib.sha256(html.encode("utf8")).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,"APP_BUILD_HASH mismatch"
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+"115"+m.group(2),sw)
assert n==1,"Cache marker drift"
sw_path.write_text(sw,"utf8")
print("G5_V115_ACTIVATION_PASS",digest)
