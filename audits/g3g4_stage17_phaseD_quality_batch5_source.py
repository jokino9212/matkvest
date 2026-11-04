#!/usr/bin/env python3
"""Stage 17D batch5: read-only extract for multiplication, division, area."""
import pathlib,hashlib,json,re
b=pathlib.Path('index.html').read_bytes();sha=hashlib.sha256(b).hexdigest()
expected="fcbfe6dc439330704e8865930d1dbf9962fda48039e59b6e467e7fc07bfae55b"
if sha!=expected:raise SystemExit("ABORT: html changed: "+sha)
sw=pathlib.Path('sw.js').read_text('utf8')
if 'matkvest-iphone-v47' not in sw or f'const APP_BUILD_HASH = "{sha}"' not in sw:raise SystemExit("ABORT PWA mismatch")
s=b.decode('utf8')
markers=['if(raw==="multiplication_table")','if(raw==="division_table")','function g3RectangleSquareAreaQuestion(d)','function g3GeoNumber','function g3GeometrySvg','function g3StoryNumberQuestion','function g3StoryItem']
out={'phase':'17D-quality-batch5','sha256':sha,'bytes':len(b),'contexts':{}}
for name in markers:
 locs=[m.start() for m in re.finditer(re.escape(name),s)]
 length=9800 if name.startswith("if") else 4400
 out['contexts'][name]={'count':len(locs),'positions':locs,'sources':[s[p:p+length] for p in locs[:1]]}
p=pathlib.Path('audits/g3g4_stage17_phaseD_quality_batch5_source.json')
p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf8')
print(json.dumps({'sha':sha,'markers':{k:v['count'] for k,v in out['contexts'].items()}},ensure_ascii=False))
