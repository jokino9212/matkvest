#!/usr/bin/env python3
"""Activate Grade 5 conversion UX on a working branch, without rewriting history."""
from pathlib import Path
import hashlib
import re
html=Path("index.html")
text=html.read_text(encoding="utf-8")
marker='<script src="g5-conversion-ux.js"></script>'
if text.count(marker)>1:
    raise SystemExit("Duplicate conversion UX script")
if marker not in text:
    anchor="</body></html>"
    if text.count(anchor)!=1:
        raise SystemExit("Unexpected HTML footer")
    text=text.replace(anchor, marker+"\n"+anchor)
    html.write_text(text,encoding="utf-8")
assert text.count(marker)==1
assert text.index(marker)>text.index('id="mk-stage02-fraction-input"')
print("G5_CONVERSION_UX_ACTIVATED")

# PWA must cache the new external script and invalidate the previous HTML version.
sw_path=Path("sw.js")
sw=sw_path.read_text(encoding="utf-8")
sw=sw.replace('"./index.html",', '"./index.html", "./g5-conversion-ux.js",') if '"./g5-conversion-ux.js"' not in sw else sw
digest=hashlib.sha256(text.encode("utf-8")).hexdigest()
sw,hash_count=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(";)',lambda m:m.group(1)+digest+m.group(2),sw)
if hash_count!=1: raise SystemExit("PWA hash not found")
sw,cache_count=re.subn(r'(const CACHE_NAME = "matkvest-iphone-v)\d+(";)',lambda m:m.group(1)+'108'+m.group(2),sw)
if cache_count!=1: raise SystemExit("PWA cache name not found")
assert sw.count('"./g5-conversion-ux.js"')==1
sw_path.write_text(sw,encoding="utf-8")
print("G5_CONVERSION_PWA_HASH",digest)
