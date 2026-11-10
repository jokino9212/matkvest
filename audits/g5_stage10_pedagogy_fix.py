from pathlib import Path
import hashlib,re
html=Path('index.html')
sw=Path('sw.js')
s=html.read_text('utf8')
patches=[
("""return mk5Sign(`Поставь знак между ${mk5Frac(numer,d)} и ${mk5Frac(c,d)}.`,numer,d,c,d,`Одинаковый знаменатель ${d}: сравниваем числители ${numer} и ${c}.`,'compare_same_den_'+mode);""",
"""const views=[`Поставь знак между ${mk5Frac(numer,d)} и ${mk5Frac(c,d)}.`,`У двух одинаковых полосок закрасили ${mk5Frac(numer,d)} и ${mk5Frac(c,d)}. Сравни закрашенные части знаком.`,`Две дроби со знаменателем ${d}: ${mk5Frac(numer,d)} и ${mk5Frac(c,d)}. Какой знак отношения между ними?`];
  return mk5Sign(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],numer,d,c,d,`Одинаковый знаменатель ${d}: сравниваем числители ${numer} и ${c}.`,'compare_same_den_'+mode);"""),
("""return mk5Sign(`Поставь знак между ${mk5Frac(numer,den)} и ${mk5Frac(numer,c)}.`,numer,den,numer,c,`При одинаковом числителе меньший знаменатель означает большую долю.`,'compare_same_num_'+mode);""",
"""const views=[`Поставь знак между ${mk5Frac(numer,den)} и ${mk5Frac(numer,c)}.`,`От одинаковых пирогов взяли ${mk5Frac(numer,den)} и ${mk5Frac(numer,c)}. Сравни величину взятых частей знаком.`,`Числитель у обеих дробей равен ${numer}. Сравни знаком ${mk5Frac(numer,den)} и ${mk5Frac(numer,c)}.`];
  return mk5Sign(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],numer,den,numer,c,`При одинаковом числителе меньший знаменатель означает большую долю.`,'compare_same_num_'+mode);"""),
("""return mk5Sign(`Сравни ${mk5Mixed(w1,numer,d)} и ${mk5Mixed(w2,c,d)}.`,w1*d+numer,d,w2*d+c,d,`Переводим в неправильные дроби со знаменателем ${d}: сравниваем ${w1*d+numer} и ${w2*d+c}.`,'mixed_compare_'+mode);""",
"""const views=[`Сравни ${mk5Mixed(w1,numer,d)} и ${mk5Mixed(w2,c,d)}.`,`На двух маршрутах прошли ${mk5Mixed(w1,numer,d)} км и ${mk5Mixed(w2,c,d)} км. Поставь знак сравнения для расстояний.`,`У двух отрезков длины ${mk5Mixed(w1,numer,d)} м и ${mk5Mixed(w2,c,d)} м. Сравни их длины знаком.`];
  return mk5Sign(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],w1*d+numer,d,w2*d+c,d,`Переводим в неправильные дроби со знаменателем ${d}: сравниваем ${w1*d+numer} и ${w2*d+c}.`,'mixed_compare_'+mode);"""),
("""return mk5MixedAnswer(`Вычисли ${mk5Mixed(w1,n1,d)} − ${mk5Mixed(w2,n2,d)}.`,diff,d,`Разность числителей неправильных дробей: (${w1*d+n1}−${w2*d+n2})/${d} = ${mk5Frac(diff,d)}.`,'mixed_sub_'+mode,[[diff+d,d],[diff-d,d],[diff+n2,d]]);""",
"""const views=[`Вычисли ${mk5Mixed(w1,n1,d)} − ${mk5Mixed(w2,n2,d)}.`,`Было ${mk5Mixed(w1,n1,d)} м ленты, отрезали ${mk5Mixed(w2,n2,d)} м. Сколько метров осталось?`,`Первый путь длиной ${mk5Mixed(w1,n1,d)} км, второй короче на неизвестную величину и равен ${mk5Mixed(w2,n2,d)} км. На сколько километров первый путь длиннее?`];
  return mk5MixedAnswer(views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)],diff,d,`Разность числителей неправильных дробей: (${w1*d+n1}−${w2*d+n2})/${d} = ${mk5Frac(diff,d)}.`,'mixed_sub_'+mode,[[diff+d,d],[diff-d,d],[diff+n2,d]]);""")
]
for old,new in patches:
 if s.count(old)!=1:raise RuntimeError('Missing/duplicate exact original '+old[:90]+' count='+str(s.count(old)))
 s=s.replace(old,new,1)
html.write_text(s,'utf8')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
w=sw.read_text('utf8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,w))==1
sw.write_text(re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),w,count=1),'utf8')
print("STAGE10_PEDAGOGICAL_PATCH_PASS",len(patches),digest)
