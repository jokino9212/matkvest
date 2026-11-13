#!/usr/bin/env python3
"""Force asset refresh for fifth-grade full-course content corrections (v132)."""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
html=h.read_bytes();sw=w.read_text('utf-8')
assert 'matkvest-iphone-v131' in sw or 'matkvest-iphone-v132' in sw, 'Unexpected PWA base version'
for src in ['g5-arithmetic-tiers-v123.js','g5-decimal-tiers-v127.js','g5-decimal-percent-v128.js','g5-fraction-concepts-v129.js']:
 assert ('"./'+src+'"') in sw, 'Missing modified source from PWA precache: '+src
digest=hashlib.sha256(html).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
assert n==1,'Missing HTML fingerprint'
sw,n=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'132'+m.group(2),sw)
assert n==1,'Missing cache version'
w.write_text(sw,'utf-8')
print('G5_V132_CONTENT_REFETCH_READY',digest)
