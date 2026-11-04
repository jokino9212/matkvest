#!/usr/bin/env python3
"""Read-only source inspection to localize G1 noun-case bug; no frontend changes."""
from pathlib import Path
from hashlib import sha256
import json, re
p=Path('index.html'); text=p.read_text(encoding='utf-8')
got=sha256(p.read_bytes()).hexdigest()
expected='2252fe792fbef2ba6b1a4d0794ae674164f55f3260496af1156660b986b5ae16'
if got!=expected: raise SystemExit('Unexpected source SHA '+got)
needles=[r'function g1Noun',r'function g1Story',r'g1Noun\(',r'Ей дали ещё',r'Убрали ',r'function makeG1Question',r'g1:word_problems']
matches={}
for q in needles:
  a=list(re.finditer(q,text))
  samples=[]
  for m in a[:32]:
    samples.append({'offset':m.start(),'context':text[max(0,m.start()-240):m.start()+480]})
  matches[q]={'total':len(a),'samples':samples}
out={'sha256':got,'matches':matches}
Path('audits/g1g2_stage16_g1_source_inspect.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for q,v in matches.items():
  print('PATTERN',q,'TOTAL',v['total'])
  for s in v['samples'][:5]:print('SOURCE',q,json.dumps(s,ensure_ascii=False))
