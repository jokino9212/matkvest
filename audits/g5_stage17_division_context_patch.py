from pathlib import Path
import re,hashlib
html=Path('index.html')
sw=Path('sw.js')
source=html.read_text('utf-8')

def decode(s):
    return s.replace('@',chr(96)).replace('~{',chr(36)+'{')

def swap_line(marker, old_check, new_line):
    global source
    assert source.count(marker)==1, 'Stage17 generator anchor changed: '+marker
    i=source.index(marker)
    e=source.index('\n',i)
    old=source[i:e]
    candidate=decode(new_line)
    if old==candidate:
        return False
    assert old_check in old, 'Stage17 unexpected original generator: '+marker
    assert 'const views=' not in old, 'Stage17 partial patch detected'
    source=source[:i]+candidate+source[e:]
    return True

changes=0
changes+=swap_line("  if(mode===1&&div){const whole=", "'frac_div_integer'", r'''  if(mode===1&&div){const whole=ri(2,8+tier*3);const views=[@Ленту длиной ~{mk5Frac(numer,den)} м разделили поровну на ~{whole} частей. Какова длина одной части?@,@В сосуде ~{mk5Frac(numer,den)} л воды. Её разлили поровну в ~{whole} стаканов. Сколько литров в одном стакане?@,@Вычисли ~{mk5Frac(numer,den)} : ~{whole}.@];const view=views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)];return mk5Rational(view,numer,den*whole,@Деление на ~{whole} равно умножению на ~{mk5Frac(1,whole)}.@,'frac_div_integer',[[numer*whole,den],[numer,den]]);}''')
changes+=swap_line("  if(mode===2&&div){const n3=", "'frac_div_then_multiply'", r'''  if(mode===2&&div){const n3=ri(1,5),d3=ri(2,7);const views=[@Площадь прямоугольной грядки ~{mk5Frac(numer,den)} м², ширина ~{mk5Frac(e,c)} м. Найди ~{mk5Frac(n3,d3)} от длины грядки (в метрах).@,@Турист прошёл ~{mk5Frac(numer,den)} км со скоростью ~{mk5Frac(e,c)} км/ч. Сколько часов составляет ~{mk5Frac(n3,d3)} затраченного времени?@,@Вычисли (~{mk5Frac(numer,den)} : ~{mk5Frac(e,c)}) · ~{mk5Frac(n3,d3)}.@];const view=views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)];return mk5Rational(view,numer*c*n3,den*e*d3,@Первый делитель переворачиваем, перемножаем с ~{mk5Frac(numer,den)}, затем умножаем на ~{mk5Frac(n3,d3)}.@,'frac_div_then_multiply',[[numer*e*n3,den*c*d3],[numer*c,den*e]]);}''')
marker="  const top=div?numer*c:numer*e,bottom=div?den*e:den*c;"
assert source.count(marker)==1, 'shared fraction generator drift'
i=source.index(marker);e=source.index('\n',i)
line=source[i:e]
injection=decode(r'''if(div){const views=[@Площадь прямоугольника ~{mk5Frac(numer,den)} м², ширина ~{mk5Frac(e,c)} м. Чему равна его длина?@,@Турист прошёл ~{mk5Frac(numer,den)} км со скоростью ~{mk5Frac(e,c)} км/ч. Сколько часов он был в пути?@,@Вычисли ~{mk5Frac(numer,den)} : ~{mk5Frac(e,c)}.@];const view=views[blockSession&&blockSession.kind==='g5quiz'?blockSession.done%3:ri(0,2)];return mk5Rational(view,top,bottom,@Заменяем деление умножением на обратную дробь ~{mk5Frac(c,e)}.@,'frac_div_pair',[[numer+e,den+c],[numer*e,den*c]]);}''')
if injection not in line:
    assert line.startswith(marker+'return mk5Rational('), 'shared multiplication/division source drift'
    line=line.replace(marker,marker+injection,1)
    source=source[:i]+line+source[e:]
    changes+=1
assert changes in (0,3), 'Stage17 partial patch forbidden'
if changes:
    html.write_text(source,'utf-8')
print('STAGE17_DIVISION_CONTEXT', 'APPLIED' if changes else 'ALREADY_PRESENT')
digest=hashlib.sha256(html.read_bytes()).hexdigest()
work=sw.read_text('utf-8')
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,work))==1,'Service worker marker drift'
sw.write_text(re.sub(pat,lambda m:m.group(1)+digest+m.group(3),work,count=1),'utf-8')
print('STAGE17_HTML_SHA256',digest)
