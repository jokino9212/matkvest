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
if 'matkvest-iphone-v46' not in source:
    raise SystemExit("ERROR: expected stage12 SW v40 format")
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
