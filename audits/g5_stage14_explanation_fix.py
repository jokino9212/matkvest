from pathlib import Path
import hashlib,re
html=Path('index.html');sw=Path('sw.js')
s=html.read_text('utf-8')
old1="return mk5Num(`Три дроби с числителем ${numer} имеют знаменатели ${dens.join(', ')}. Какой знаменатель у самой большой дроби?`,smallest,`При равном числителе ${numer} меньший знаменатель даёт большую дробь.`,'compare_num_three',dens.filter(v=>v!==smallest));"
new1="return mk5Num(`Три дроби с числителем ${numer} имеют знаменатели ${dens.join(', ')}. Какой знаменатель у самой большой дроби?`,smallest,`При равном числителе ${numer} меньший знаменатель даёт большую дробь. Среди ${dens.join(', ')} наименьший знаменатель ${smallest}, это и есть ответ.`,'compare_num_three',dens.filter(v=>v!==smallest));"
old2="return mk5MixedAnswer(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],diff,d,`Разность числителей неправильных дробей: (${w1*d+n1}−${w2*d+n2})/${d} = ${mk5Frac(diff,d)}.`,'mixed_sub_'+mode,[[diff+d,d],[diff-d,d],[diff+n2,d]]);"
new2="""const [simpleNum,simpleDen]=g5NewRat(diff,d),whole=Math.floor(simpleNum/simpleDen),rem=simpleNum%simpleDen;
  const reducedText=simpleDen===1?String(simpleNum):mk5Frac(simpleNum,simpleDen),finalText=rem?mk5Mixed(whole,rem,simpleDen):String(whole);
  const conversion=reducedText===finalText?reducedText:`${reducedText} = ${finalText}`;
  return mk5MixedAnswer(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],diff,d,`Разность числителей неправильных дробей: (${w1*d+n1}−${w2*d+n2})/${d} = ${mk5Frac(diff,d)}. Сокращаем дробь, при необходимости выделяем целую часть: ${conversion}. Ответ: ${finalText}.`,'mixed_sub_'+mode,[[diff+d,d],[diff-d,d],[diff+n2,d]]);"""
for old,new in [(old1,new1),(old2,new2)]:
 if s.count(old)==1 and s.count(new)==0:
  s=s.replace(old,new,1)
 elif s.count(old)==0 and s.count(new)==1:
  print('STAGE14_EXPLANATION_FIX_ALREADY_PRESENT')
 else:
  raise RuntimeError('Unexpected ambiguous generator count: '+str((s.count(old),s.count(new)))+' '+old[:70])
html.write_text(s,'utf-8')
sha=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf-8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
if len(re.findall(pattern,w))!=1:raise RuntimeError('PWA fingerprint not unique')
sw.write_text(re.sub(pattern,lambda m:m.group(1)+sha+m.group(3),w,count=1),'utf-8')
print('STAGE14_EXPLANATION_PATCH_PASS',sha)
