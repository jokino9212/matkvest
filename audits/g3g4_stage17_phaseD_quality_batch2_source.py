#!/usr/bin/env python3
"""Read-only extracts for stage 17D quality batch 2: fractions and broken lines."""
import pathlib,hashlib,json,re
P=pathlib.Path('index.html');b=P.read_bytes();sha=hashlib.sha256(b).hexdigest()
expected='409381a4c087d9118f9334505ad3ae2b5662fa6570d8e244d97579e35adca046'
if sha!=expected:raise SystemExit('Unexpected HTML hash: '+sha)
sw=pathlib.Path('sw.js').read_text(encoding='utf-8')
if f'const APP_BUILD_HASH = "{sha}"' not in sw or 'matkvest-iphone-v44' not in sw:raise SystemExit('PWA mismatch')
s=b.decode('utf-8')
names=['g3BrokenLineQuestion','g3PartsIntroQuestion','g3PartsCompareQuestion','g3UnitPartsVisualHtml','g3AttachPartsVisual','g3UnitFractionName','g3EqualPartsPhrase','g3GeometrySvg','g3GeoMeasure','g3ChoiceQuestion','g3StoryChoiceQuestion','g3BrokenLine','g3GeoGridLines','g3UnitFractionHtml','g3GeometryTheoryHtml']
found={}
for name in names:
 hits=list(re.finditer(r'function\s+'+re.escape(name)+r'\s*\(',s))
 found[name]={'occurrences':len(hits),'excerpts':[{'pos':m.start(),'source':s[m.start():m.start()+min(9200 if name=='g3GeometrySvg' else 6000,len(s)-m.start())]} for m in hits[:2]]}
extra={}
for name in ('broken_line_length','parts_intro','parts_compare','g3UnitParts','g3geometry'):
 hits=[m.start() for m in re.finditer(re.escape(name),s)]
 extra[name]={'count':len(hits),'snippets':[s[max(0,p-200):p+1200] for p in hits[-4:]]}
out={'kind':'17D-quality-batch2-source','sha256':sha,'bytes':len(b),'functions':found,'extra':extra}
dest=pathlib.Path('audits/g3g4_stage17_phaseD_quality_batch2_source.json')
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'sha':sha,'functions':{k:v['occurrences'] for k,v in found.items()},'extra':{k:v['count'] for k,v in extra.items()}},ensure_ascii=False))
