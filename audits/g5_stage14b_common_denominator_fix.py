from pathlib import Path
import hashlib,re
html=Path('index.html');sw=Path('sw.js');s=html.read_text('utf8')
old="  return mk5Rational(`Приведи ${mk5Frac(numer,den)} к общему знаменателю ${common} и выбери получившуюся дробь.`,numer*mul,common,`Умножаем оба члена на ${mul}: ${mk5Frac(numer*mul,common)}.`,'common_fraction',[[numer+1,common],[numer*mul,common+1]]);"
new="  return mk5Choose(`Приведи ${mk5Frac(numer,den)} к общему знаменателю ${common} и выбери получившуюся дробь.`,mk5Frac(numer*mul,common),[mk5Frac(numer*mul+1,common),mk5Frac(numer*mul,common+1),mk5Frac(numer*mul+2,common)],`Умножаем числитель и знаменатель на ${mul}: ${mk5Frac(numer,den)} = ${mk5Frac(numer*mul,common)}. Ответ: ${mk5Frac(numer*mul,common)}.`,'common_fraction');"
if s.count(old)==1 and s.count(new)==0:
 s=s.replace(old,new,1);print('STAGE14B_COMMON_DENOM_FIX_APPLIED')
elif s.count(old)==0 and s.count(new)==1:
 print('STAGE14B_COMMON_DENOM_FIX_ALREADY_PRESENT')
else:raise RuntimeError('Unexpected source count '+str((s.count(old),s.count(new))))
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8');pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,w))==1
sw.write_text(re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE14B_PWA_HASH',digest)
