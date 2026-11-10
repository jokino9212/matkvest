from pathlib import Path
import re,hashlib
html=Path('index.html');sw=Path('sw.js')
s=html.read_text('utf8')
old="sig:'g5:frac_types:s18c:'+activeDifficulty()+':'+variant+':'+seedParts.join(':'),"
new="sig:'g5:frac_types:s18c:'+activeDifficulty()+':'+variant+':'+stripHtmlText(text)+':'+choicePlain(target),"
assert s.count(old)+s.count(new)==1,'Expected unique stage18c identity location'
if old in s:
 s=s.replace(old,new,1)
 print('STAGE09_FIX applied visible-question identity')
else:print('STAGE09_FIX already present')
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8');pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,w))==1,'PWA integrity marker changed'
sw.write_text(re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE09_HASH',digest)
