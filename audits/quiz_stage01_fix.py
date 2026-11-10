"""Stage01: prevent false 'improper fraction' requirements for integer-answer prompts.

Run on the full checked-out index.html (too large for GitHub contents API).
Idempotent and narrowly scoped to stage18b prepareFraction. NEVER deploy directly to main.
"""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
source=h.read_text('utf-8')
old="stage18AnswerForm:{kind:expectMixed?'mixed':'improper'}"
new="""stage18AnswerForm:(parsed.rat.d===1&&!/class=["'](?:frac|mixed)["']/.test(String(r.correctLabel||r.correctHtml||'')))?null:{kind:expectMixed?'mixed':'improper'}"""
assert source.count(old) in (0,1), 'unexpected form-validator copies'
assert source.count(new) in (0,1), 'unexpected fixed-form copies'
if old in source:
  source=source.replace(old,new)
  h.write_text(source,'utf-8')
  print('STAGE01_FORM_PATCH_APPLIED')
else:
  assert new in source, 'Expected original or fixed form validator absent'
  print('STAGE01_FORM_PATCH_ALREADY_PRESENT')
sw=w.read_text('utf-8')
digest=hashlib.sha256(h.read_bytes()).hexdigest()
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,sw))==1, 'SW build hash marker mismatch'
sw=re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,'utf-8')
assert hashlib.sha256(h.read_bytes()).hexdigest() in w.read_text('utf-8')
print('STAGE01_FORM_SHA256',digest)
