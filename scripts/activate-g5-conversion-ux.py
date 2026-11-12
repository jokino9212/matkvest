#!/usr/bin/env python3
"""Activate Grade 5 conversion UX on a working branch, without rewriting history."""
from pathlib import Path
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
