from pathlib import Path
import hashlib,re
html=Path('index.html')
sw=Path('sw.js')
source=html.read_text('utf8')
old=r''' case 'mixed_add':{
  const w1=ri(1,4+tier*2),w2=ri(1,3+tier),n1=ri(1,d-1),n2=mode===0?ri(1,Math.max(1,d-n1-1)):ri(Math.max(1,d-n1),d-1);let sum=(w1+w2)*d+n1+n2;
  if(mode===2){const n3=ri(1,d-1);sum+=n3;return mk5MixedAnswer(`Сложи ${mk5Mixed(w1,n1,d)} + ${mk5Mixed(w2,n2,d)} + ${mk5Frac(n3,d)}.`,sum,d,`Общее число долей ${w1*d+n1}+${w2*d+n2}+${n3}=${sum}; переводим в смешанное число.`,'mixed_add_three',[[sum+d,d],[sum-d,d]]);}
  return mk5MixedAnswer(`Вычисли ${mk5Mixed(w1,n1,d)} + ${mk5Mixed(w2,n2,d)}.`,sum,d,`Целые части ${w1}+${w2}; дробные части ${n1}+${n2} долей со знаменателем ${d}.`,'mixed_add_'+mode,[[sum+d,d],[sum-d,d]]);
 }'''
new=r''' case 'mixed_add':{
  const w1=ri(1,4+tier*2),w2=ri(1,3+tier),n1=ri(1,d-1),n2=mode===0?ri(1,Math.max(1,d-n1-1)):ri(Math.max(1,d-n1),d-1);let sum=(w1+w2)*d+n1+n2;
  if(mode===2){const n3=ri(1,d-1);sum+=n3;const views=[`В первый день турист прошёл ${mk5Mixed(w1,n1,d)} км, во второй — ${mk5Mixed(w2,n2,d)} км, в третий — ${mk5Frac(n3,d)} км. Сколько километров он прошёл за три дня?`,`Для трёх изделий использовали ${mk5Mixed(w1,n1,d)} м, ${mk5Mixed(w2,n2,d)} м и ${mk5Frac(n3,d)} м ткани. Сколько метров ткани использовали всего?`,`Сложи ${mk5Mixed(w1,n1,d)} + ${mk5Mixed(w2,n2,d)} + ${mk5Frac(n3,d)}.`];const view=views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)];return mk5MixedAnswer(view,sum,d,`Общее число долей ${w1*d+n1}+${w2*d+n2}+${n3}=${sum}; переводим в смешанное число.`,'mixed_add_three',[[sum+d,d],[sum-d,d]]);}
  const views=[`В первый день турист прошёл ${mk5Mixed(w1,n1,d)} км, во второй — ${mk5Mixed(w2,n2,d)} км. Сколько километров он прошёл за два дня?`,`На две поделки понадобилось ${mk5Mixed(w1,n1,d)} м и ${mk5Mixed(w2,n2,d)} м ленты. Сколько метров ленты понадобилось всего?`,`Вычисли ${mk5Mixed(w1,n1,d)} + ${mk5Mixed(w2,n2,d)}.`];const view=views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)];return mk5MixedAnswer(view,sum,d,`Целые части ${w1}+${w2}; дробные части ${n1}+${n2} долей со знаменателем ${d}.`,'mixed_add_'+mode,[[sum+d,d],[sum-d,d]]);
 }'''
assert source.count(old)==1 or source.count(new)==1, 'Stage16C generator drift; abort'
if old in source:
 assert source.count(old)==1
 source=source.replace(old,new,1)
 html.write_text(source,'utf8')
 print('STAGE16C_CONTEXTUAL_MIXED_ADD_APPLIED')
else:
 print('STAGE16C_CONTEXTUAL_MIXED_ADD_ALREADY_PRESENT')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8')
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,w))==1
sw.write_text(re.sub(pat,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print('STAGE16C_HTML_SHA256',digest)
