from pathlib import Path
import hashlib,re
html=Path('index.html')
sw=Path('sw.js')
s=html.read_text('utf8')
old='n1=mode===0?ri(n2,d-1):ri(1,n2-1);const diff=(w1-w2)*d+n1-n2;'
new="n1=(mode===0&&!(blockSession&&blockSession.kind==='g5quiz'&&blockSession.stageIndex===2))?ri(n2,d-1):ri(1,n2-1);const diff=(w1-w2)*d+n1-n2;"
assert s.count(old)+s.count(new)==1,(s.count(old),s.count(new))
if old in s:
 s=s.replace(old,new,1)
 print('STAGE11_BORROW_FIX_APPLIED')
else:print('STAGE11_BORROW_FIX_ALREADY_PRESENT')
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,w))==1
sw.write_text(re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE11_PWA_DIGEST',digest)
