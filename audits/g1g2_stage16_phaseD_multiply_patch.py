#!/usr/bin/env python3
"""Stage 16D second localized grammar correction: repeated additions in G2."""
from pathlib import Path
from hashlib import sha256
import re,json
p=Path('index.html'); original=p.read_bytes()
want='0954820458a758c8208eb3bea7b220abb40d712de428d1ed742fc5339ebe54ea'
before=sha256(original).hexdigest()
if before!=want:raise SystemExit('REFUSE: unexpected locked candidate '+before)
s=original.decode('utf-8')
if s.count('function g2StoryTimes(')!=1:raise SystemExit('REFUSE: g2StoryTimes missing')
replacements={
    '${model.groups} раза':'${model.groups} ${g2StoryTimes(model.groups)}',
    '${m.groups} раза':'${m.groups} ${g2StoryTimes(m.groups)}'
}
expected={'${model.groups} раза':2,'${m.groups} раза':1}
for old,n in expected.items():
    if s.count(old)!=n:raise SystemExit(f'REFUSE: expected {n} source matches of {old}; found {s.count(old)}')
for old,new in replacements.items():s=s.replace(old,new)
if s.count('function g1ExistVerb(')!=1 or s.count('function g2StoryAccNoun(')!=1:
    raise SystemExit('REFUSE: grammar helpers unexpectedly changed')
new=s.encode('utf-8')
after=sha256(new).hexdigest()
w=Path('sw.js');sw=w.read_text('utf-8')
if 'matkvest-iphone-v40' not in sw or ('const APP_BUILD_HASH = "'+before+'";') not in sw:
    raise SystemExit('REFUSE: SW state differs from input')
new_sw=sw.replace('const APP_BUILD_HASH = "'+before+'";',
                     'const APP_BUILD_HASH = "'+after+'";')
data={'phase':'16D-multiply-case','inputSha256':before,'outputSha256':after,
      'fixedSourceExpressions':sum(expected.values()),'oldCounts':expected,
      'modifiedFiles':['index.html','sw.js'],'mainUntouched':True}
Path('audits/g1g2_stage16_phaseD_multiply_patch_report.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p.write_bytes(new);w.write_text(new_sw,encoding='utf-8')
print('STAGE16D MULTIPLY PATCH',json.dumps(data,ensure_ascii=False))