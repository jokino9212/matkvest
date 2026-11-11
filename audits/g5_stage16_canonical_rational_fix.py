from pathlib import Path
import hashlib,re
html=Path('index.html')
sw=Path('sw.js')
s=html.read_text('utf8')
old='''function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d),q=g5q(text,g5NewChoiceSet(n,d,errors),`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}'''
new='''function mk5Rational(text,n,d,why,variant,errors=[]){
 const [a,b]=g5NewRat(n,d);
 const options=g5NewChoiceSet(n,d,errors).map(item=>{
  const asWhole=String(item.key).match(/^(\\d+)\\/1$/);
  return asWhole?{...item,label:asWhole[1]}:item;
 });
 const q=g5q(text,options,`${a}/${b}`,why,variant);
 q.mk5Audit={type:'rational',numerator:n,denominator:d,expected:`${a}/${b}`};return q;
}'''
assert old in s or new in s, "mk5Rational signature has changed; review manually"
if old in s:
 assert s.count(old)==1
 s=s.replace(old,new,1)
 print('STAGE16_CANONICAL_RATIONAL_PATCH_APPLIED')
else:
 assert s.count(new)==1
 print('STAGE16_CANONICAL_RATIONAL_ALREADY_PRESENT')
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8')
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,w))==1
sw.write_text(re.sub(pat,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE16_CANONICAL_RATIONAL_SHA256',digest)
