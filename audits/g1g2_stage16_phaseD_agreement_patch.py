#!/usr/bin/env python3
"""Stage16 D: change only Russian existential agreement before counted G1/G2 nouns."""
from pathlib import Path
from hashlib import sha256
from collections import Counter
import re
import json

html=Path('index.html')
raw=html.read_bytes()
expected='2be11af0d9ca5db18d45bc10011388f502803a12b0f92ca474ee11ba97939d03'
actual=sha256(raw).hexdigest()
if actual!=expected:
    raise SystemExit('REFUSE: unknown frontend SHA '+actual)
s=raw.decode('utf-8')
anchor='function g1StorySentence(m,{name="У Маши"}={}){'
if s.count(anchor)!=1 or 'function g1ExistVerb(' in s:
    raise SystemExit('REFUSE: unexpected function layout')
helper=(
    'function g1ExistVerb(n,o,upper=false){'
    'const v=n%10===1&&n%100!==11?'
    '(o.one==="книга"||o.one==="тетрадь"?"была":"был"):"было";'
    'return upper?v[0].toUpperCase()+v.slice(1):v'
    '}\n'
)
# Replace only generated existential phrases with counted nouns, never explanations.
pattern=re.compile(
    r'(?P<verb>\b[Бб]ыло) (?P<nounNum>\$\{(?P<variable>(?:m|model)\.a)\}) '
    r'(?P<noun>\$\{(?P<func>g1Noun|g2StoryNoun)\((?P=variable),(?P<obj>[\w.]+)\)\})'
)
replaced=[]
def apply(m):
    var=m.group('variable')
    obj=m.group('obj')
    upper=',true' if m.group('verb')=='Было' else ''
    replaced.append({'variable':var,'nounFn':m.group('func'),'obj':obj,'before':m.group(0)})
    return '${g1ExistVerb('+var+','+obj+upper+')} '+m.group('nounNum')+' '+m.group('noun')
new,count=pattern.subn(apply,s)
counts=Counter(x['nounFn'] for x in replaced)
if counts['g1Noun']!=4 or counts['g2StoryNoun']<2 or count>20:
    raise SystemExit('REFUSE: expected four G1 and at least two G2 counted-noun constructions; got '+str(counts))
new=new.replace(anchor,helper+anchor,1)
if new.count('function g1ExistVerb(')!=1:
    raise SystemExit('REFUSE: helper inserted incorrectly')
if new.count('function g1ActionNoun(')!=1 or new.count('function g2StoryAccNoun(')!=1:
    raise SystemExit('REFUSE: existing accusative fix was disturbed')
newbytes=new.encode('utf-8')
newhash=sha256(newbytes).hexdigest()
swfile=Path('sw.js');sw=swfile.read_text(encoding='utf-8')
new_sw,n=re.subn(r'const APP_BUILD_HASH = "[0-9a-f]{64}";',
                 'const APP_BUILD_HASH = "'+newhash+'";',sw)
if n!=1 or 'matkvest-iphone-v40' not in new_sw:
    raise SystemExit('REFUSE: invalid isolated SW fingerprint')
out={'stage':'16D-agreement-patch','inputSha256':actual,'outputSha256':newhash,
     'replacementCount':count,'counts':dict(counts),'changes':replaced,
     'mainUntouched':True}
Path('audits/g1g2_stage16_phaseD_agreement_patch_report.json').write_text(
    json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
html.write_bytes(newbytes)
swfile.write_text(new_sw,encoding='utf-8')
print('STAGE16 D LOCALIZED AGREEMENT PATCH',json.dumps(out,ensure_ascii=False))