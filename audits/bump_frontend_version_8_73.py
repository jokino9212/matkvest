#!/usr/bin/env python3
"""Update visible frontend version independently of old internal mobile test name."""
from pathlib import Path
import re, hashlib

html_file = Path("index.html")
sw_file = Path("sw.js")
html = html_file.read_text("utf-8")
sw = sw_file.read_text("utf-8")

old = "8.72"
new = "8.73"
total = html.count(old)
already = html.count(new)
print(f"Visible frontend version occurrences: old={total} new={already}")
for match in list(re.finditer(re.escape(old), html))[:16]:
    p = match.start()
    print("OLD_CONTEXT:", repr(html[max(0,p-110):p+100]))

if total:
    assert total <= 100, f"Unexpected {total} occurrences; review before replacing"
    html = html.replace(old, new)
else:
    assert already > 0, "Neither version 8.72 nor 8.73 found: fail closed"
assert "8.72" not in html
assert "8.73" in html
html_file.write_text(html, encoding="utf-8")
sha = hashlib.sha256(html_file.read_bytes()).hexdigest()
sw, count_cache = re.subn(r'matkvest-iphone-v72', 'matkvest-iphone-v73', sw)
assert count_cache > 0 or 'matkvest-iphone-v73' in sw, "PWA cache not found"
sw, count_hash = re.subn(r'(const APP_BUILD_HASH\s*=\s*")[a-f0-9]{64}(";)', lambda m: m.group(1) + sha + m.group(2), sw)
assert count_hash == 1, f"Expected one APP_BUILD_HASH, got {count_hash}"
assert 'matkvest-iphone-v73' in sw
assert sha in sw
sw_file.write_text(sw, encoding="utf-8")
print(f"PASS version 8.73; HTML SHA256={sha}; cache v73; replaced occurrences={total}")
