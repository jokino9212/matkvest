#!/usr/bin/env python3
from pathlib import Path
from hashlib import sha256
import re,json
s=Path('index.html').read_text(encoding='utf-8')
h=sha256(s.encode()).hexdigest()
expected='0954820458a758c8208eb3bea7b220abb40d712de428d1ed742fc5339ebe54ea'
if h!=expected:raise SystemExit('Unknown stage16D candidate: '+h)
res={'htmlSha256':h,'interpolatedRaza':[],'nearRaza':[],'functionHeaders':[]}
for m in re.finditer(r'\$\{([^{}\n]+)\}\s+раза',s):
 res['interpolatedRaza'].append({'offset':m.start(),'variable':m[1],'context':s[max(0,m.start()-220):m.end()+240]})
for m in list(re.finditer(r'раза',s))[:110]:
 context=s[max(0,m.start()-140):m.end()+140]
 if 'function g2' in context or 'g2:' in context or 'повторяется' in context or 'складываем' in context:
  res['nearRaza'].append({'offset':m.start(),'context':context})
for m in re.finditer(r'function\s+(g2\w*(?:Mul|Groups|Times|Divide)\w*)\s*\(',s):
 res['functionHeaders'].append({'name':m[1],'context':s[m.start():m.start()+230]})
Path('audits/g1g2_stage16_phaseD_multiply_source_report.json').write_text(json.dumps(res,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('MATCHES',len(res['interpolatedRaza']))
for x in res['interpolatedRaza']:print('SOURCE',json.dumps(x,ensure_ascii=False))
print('FUNCTIONS',json.dumps(res['functionHeaders'][:30],ensure_ascii=False))