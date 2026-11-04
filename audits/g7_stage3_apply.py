#!/usr/bin/env python3
"""Stage 3 build. Reject unexpected input; never alter production."""
from pathlib import Path
from hashlib import sha256
ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/"index.html"
PATCH=ROOT/"audits"/"g7_stage3_patch.js"
MARK="/* МатКвест G7 этап 3: автономный патч тем 43 и 44 */"
STAGE2="f403ea8665f4a30cfc414d8f2e988b5ca1fcd454c8abf611a80244e81cee65c3"
src=HTML.read_text(encoding="utf-8")
patch=PATCH.read_text(encoding="utf-8")
assert src.rstrip().endswith("</body></html>"), "unexpected HTML tail"
assert "МатКвест G7 этап 2: автономный проверенный патч генераторов" in src
assert "const beforeStage3=makeG7Question;" in patch and "combined_factorization" in patch
if MARK in src:
    a=src.index(MARK); b=src.find("</script>",a)
    assert src.count(MARK)==1 and b>a
    fixed=src[:a]+MARK+"\n"+patch+"\n"+src[b:]
else:
    assert sha256(src.encode("utf-8")).hexdigest()==STAGE2, "stage 2 base checksum mismatch"
    at=src.rfind("</script>")
    assert at>0 and "</body>" in src[at:]
    fixed=src[:at]+MARK+"\n"+patch+"\n"+src[at:]
assert fixed.count(MARK)==1 and fixed.count("</script>")==src.count("</script>")
assert src.count("<script")==fixed.count("<script")
HTML.write_text(fixed,encoding="utf-8")
print("G7 #43/#44 stage 3 compiled, SHA-256:",sha256(fixed.encode("utf-8")).hexdigest())