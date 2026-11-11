from pathlib import Path
import hashlib,re
html=Path('index.html');sw=Path('sw.js')
s=html.read_text('utf8')
old='Какой числитель будет у неправильной дроби, равной ${mk5Mixed(whole,rem,den)}?'
new='Какой числитель у неправильной дроби со знаменателем ${den}, равной ${mk5Mixed(whole,rem,den)}?'
if s.count(old)==1 and new not in s:
 s=s.replace(old,new,1)
 print('STAGE14B_UNAMBIGUOUS_NUMERATOR_PATCH_APPLIED')
elif s.count(old)==0 and s.count(new)==1:print('STAGE14B_UNAMBIGUOUS_NUMERATOR_ALREADY_PRESENT')
else:raise RuntimeError('unexpected source occurrence',s.count(old),s.count(new))
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8')
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,w))==1
sw.write_text(re.sub(pat,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE14B_UPDATED_PWA_FINGERPRINT',digest)
