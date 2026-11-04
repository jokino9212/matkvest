#!/usr/bin/env python3
"""Stage 17D, batch4: inspect approved v46 G3 comparing, mass, and money logic."""
import pathlib,hashlib,json,re
raw=pathlib.Path('index.html').read_bytes()
expected='4a9a597d34dfe8f7f48abb323e99784f7f0b529ceb5275b2bc1b94d64fe0bd7c'
sha=hashlib.sha256(raw).hexdigest()
if sha!=expected:raise SystemExit('ABORT unexpected index SHA '+sha)
sw=pathlib.Path('sw.js').read_text('utf8')
if 'matkvest-iphone-v46' not in sw or 'const APP_BUILD_HASH = "'+sha+'"' not in sw:raise SystemExit('ABORT PWA mismatch')
s=raw.decode('utf8')
funcs=['makeG3Question','g3CompareQuestion','g3MassQuestion','g3MoneyQuestion','g3UnitQuestion','g3UnitMixedQuestion','g3CompareOrderQuestion','g3CompareNumbersQuestion','g3StoryNumberQuestion','g3ChoiceQuestion','g6NumberInputQuestion','g6ChoiceQuestion']
out={'phase':'17D-quality-batch4-source','sha256':sha,'bytes':len(raw),'functions':{},'tokens':{}}
for name in funcs:
 hits=list(re.finditer(r'function\s+'+re.escape(name)+r'\s*\(',s))
 out['functions'][name]=[{'pos':m.start(),'text':s[m.start():m.start()+16000]} for m in hits[:1]]
for key in ('if(raw==="compare_order")','if(raw==="mass")','if(raw==="money")'):
 hits=[m.start() for m in re.finditer(re.escape(key),s)]
 out['tokens'][key]={'count':len(hits),'contexts':[s[max(0,p-800):p+8300] for p in hits[:2]]}
dest=pathlib.Path('audits/g3g4_stage17_phaseD_quality_batch4_source.json')
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf8')
print(json.dumps({'sha':sha,'funcHits':{k:len(v) for k,v in out['functions'].items()},'blocks':{k:v['count'] for k,v in out['tokens'].items()}},ensure_ascii=False))
