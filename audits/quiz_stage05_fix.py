"""Stage05: canonicalize displayed-question identity, improve difficulty ramp.
Idempotent patch of checked-out full HTML and PWA fingerprint.
"""
from pathlib import Path
import hashlib,re
h=Path('index.html');w=Path('sw.js')
s=h.read_text('utf-8')
old_sig='${raw}:${topic}:${qq.templateId}:${promptKey}:${String(qq.correct)}'
new_sig='${raw}:${topic}:${promptKey}:${String(qq.correct)}'
assert s.count(old_sig)+s.count(new_sig)==1,'stage05 visible signature pattern differs'
if old_sig in s:
 s=s.replace(old_sig,new_sig,1)
 print('STAGE05_VISIBLE_IDENTITY_PATCH_APPLIED')
else:print('STAGE05_VISIBLE_IDENTITY_ALREADY_PATCHED')
old_level='const level=Math.min(2,Math.floor((stage+phase)/2));'
new_level='const level=Math.min(2,Math.max(0,stage-1+phase));'
assert s.count(old_level)+s.count(new_level)==1,'stage05 difficulty selection pattern differs'
if old_level in s:
 s=s.replace(old_level,new_level,1)
 print('STAGE05_DIFFICULTY_RAMP_APPLIED')
else:print('STAGE05_DIFFICULTY_RAMP_ALREADY_PATCHED')
h.write_text(s,'utf-8')
digest=hashlib.sha256(h.read_bytes()).hexdigest()
sw=w.read_text('utf-8')
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,sw))==1
sw=re.sub(pat,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,'utf-8')
print('STAGE05_HTML_SHA256',digest)
