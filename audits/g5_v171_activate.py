#!/usr/bin/env python3
"""Stamp Grade 5 §35 v171 without touching user data. Safe to run twice."""
from pathlib import Path
import hashlib
import re
import sys

ROOT=Path(__file__).resolve().parent.parent
HTML=ROOT/'index.html'
WORKER=ROOT/'sw.js'

def build():
    before=HTML.read_text(encoding='utf-8')
    matches=re.findall(r'(<script src="g5-[\w-]+\.js)\?v=(?:170|171)("></script>)',before)
    if len(matches)!=19:
        raise SystemExit(f'Expected 19 versioned g5 scripts, got {len(matches)}')
    after=re.sub(r'(<script src="g5-[\w-]+\.js)\?v=(?:170|171)("></script>)',
                 r'\g<1>?v=171\g<2>',before)
    if after.count('?v=171')<19:
        raise SystemExit('Missing version tags in output')
    old=WORKER.read_text(encoding='utf-8')
    new,count=re.subn(r'const CACHE_NAME = "matkvest-iphone-v(?:170|171)";',
                      'const CACHE_NAME = "matkvest-iphone-v171";',old)
    if count!=1:
        raise SystemExit('Missing previous v170/v171 PWA cache')
    for required in ['request.destination === "script"','fetch(request, {cache: "no-store"})',
                     'self.clients.claim()']:
        if required not in new:raise SystemExit('Missing safe PWA updater '+required)
    digest=hashlib.sha256(after.encode('utf-8')).hexdigest()
    new,count=re.subn(r'const APP_BUILD_HASH = "[0-9a-f]{64}";',
                      f'const APP_BUILD_HASH = "{digest}";',new)
    if count!=1:raise SystemExit('Missing SW build hash')
    return before,after,old,new,digest

def main():
    before,after,old,new,digest=build()
    if '--check' in sys.argv:
        if before!=after or old!=new:
            raise SystemExit('v171 activation incomplete')
    else:
        if before!=after:HTML.write_text(after,encoding='utf-8')
        if old!=new:WORKER.write_text(new,encoding='utf-8')
    print('G5_V171_ACTIVATION_PASS',{'scripts':19,'cache':'v171',
        'htmlSha256':digest,'networkFirstScripts':True,'userDataUntouched':True})
if __name__=='__main__':
    main()
