#!/usr/bin/env python3
"""Activate §23 as v159 and atomically update all PWA version markers.

The new worker retains v158's online-first JS and offline fallback. This
script only updates the 19 first-refresh cache-busting Grade 5 URLs, the
versioned cache and the exact HTML fingerprint. Never touches user data.
"""
from pathlib import Path
import hashlib
import re
import sys
ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/"index.html";SW=ROOT/"sw.js"
def build():
    html=HTML.read_text(encoding="utf-8")
    pat=r'(<script src="g5-[\w-]+\.js)\?v=(?:158|159)("></script>)'
    paths=re.findall(pat,html)
    if len(paths)!=19:raise SystemExit("Expected exactly 19 Grade 5 versioned scripts, found "+str(len(paths)))
    changed=re.sub(pat,r'\g<1>?v=159\g<2>',html)
    worker=SW.read_text(encoding="utf-8")
    updated,count=re.subn(r'const CACHE_NAME = "matkvest-iphone-v(?:158|159)";',
         'const CACHE_NAME = "matkvest-iphone-v159";',worker)
    if count!=1:raise SystemExit("Expected v158/v159 cache tag")
    if 'request.destination === "script"' not in updated:raise SystemExit("Lost network-first JS PWA fix #91")
    fingerprint=hashlib.sha256(changed.encode('utf-8')).hexdigest()
    updated,count=re.subn(r'const APP_BUILD_HASH = "[0-9a-f]{64}";',
             f'const APP_BUILD_HASH = "{fingerprint}";',updated)
    if count!=1:raise SystemExit("Cannot update SW fingerprint")
    return html,changed,worker,updated,fingerprint
def main():
    before,after,sw,latest,hash_hex=build()
    if '--check' in sys.argv:
        if before!=after or sw!=latest:raise SystemExit("v159 release activation is incomplete")
    else:
        if before!=after:HTML.write_text(after,encoding="utf-8")
        if sw!=latest:SW.write_text(latest,encoding="utf-8")
    print("G5_V159_CUBOID_ACTIVATION_PASS",{"cache":"v159","g5Scripts":19,
      "htmlSha256":hash_hex,"onlineFirstJavascript":True,"userStorageUntouched":True})
if __name__=='__main__':main()
