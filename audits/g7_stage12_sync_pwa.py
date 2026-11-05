#!/usr/bin/env python3
"""Synchronize a tiny Service Worker build fingerprint with the deployed HTML.
The worker source must change on every frontend release so browser update checks
can detect and activate a new service worker without a hard refresh.
"""
from pathlib import Path
import hashlib
import re
import sys

html=Path("index.html").read_bytes()
expected=hashlib.sha256(html).hexdigest()
worker=Path("sw.js")
source=worker.read_text(encoding="utf-8")
# Keep cache versions independent from the release number. A release may be
# v40, v55, or any later numeric PWA build, but must retain exactly one declaration.
cache_pattern=r'const CACHE_NAME = "matkvest-iphone-v[0-9]+";'
matches=re.findall(cache_pattern,source)
if len(matches)!=1:
    raise SystemExit("ERROR: expected exactly one MatKvest versioned CACHE_NAME")
cache_name=re.search(r'matkvest-iphone-v[0-9]+',matches[0]).group(0)
pattern=r'const APP_BUILD_HASH = "[a-f0-9]{64}";'
updated,count=re.subn(pattern,f'const APP_BUILD_HASH = "{expected}";',source)
if count!=1:
    raise SystemExit("ERROR: missing or duplicate PWA fingerprint")
if "--check" in sys.argv:
    if source != updated:
        raise SystemExit("ERROR: SW build fingerprint differs from index.html")
    print("PASS: SW fingerprint matches HTML SHA256",expected)
elif source != updated:
    worker.write_text(updated,encoding="utf-8")
    print("UPDATED: SW fingerprint",expected)
else:
    print("UNCHANGED: SW fingerprint",expected)
