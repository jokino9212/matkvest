#!/usr/bin/env python3
"""Stage17D batch6: source-locked read-only extraction for area units, tables and bar charts."""
import hashlib,json,pathlib,re
b=pathlib.Path("index.html").read_bytes();sha=hashlib.sha256(b).hexdigest()
expected="5c079a595763241ee1a816f029543b2383980e9770e27317c5a712260fcad069"
if sha!=expected:raise SystemExit("ABORT HTML SHA "+sha)
sw=pathlib.Path("sw.js").read_text("utf8")
if "matkvest-iphone-v48" not in sw or f'const APP_BUILD_HASH = "{sha}"' not in sw:raise SystemExit("ABORT PWA mismatch")
s=b.decode("utf8")
names=["if(raw===\"area_units\")","function g3TablesQuestion","function g3BarChartsQuestion","function g3Tables","function g3BarChart","function g3Table","function g3Chart","function g3StoryChoice","function g3StoryNumber","function g3UnitNumber","function g3UnitInteger","function makeG3Question"]
out={"phase":"17D-quality-batch6-source","sha256":sha,"bytes":len(b),"contexts":{}}
for needle in names:
 hits=[m.start() for m in re.finditer(re.escape(needle),s)]
 out["contexts"][needle]={"positions":hits[:3],"count":len(hits),"excerpts":[s[p:p+(8500 if "area_units" in needle or "Tables" in needle or "Chart" in needle else 2000)] for p in hits[:2]]}
dyn=[]
for m in re.finditer(r'function\s+(g3[A-Za-z0-9_]*(?:Table|Chart|Graph)[A-Za-z0-9_]*)\s*\(',s):
 dyn.append({"name":m.group(1),"pos":m.start(),"excerpt":s[m.start():m.start()+10000]})
out["discovered"]=dyn[:25]
p=pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch6_source.json")
p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps({"sha":sha,"contexts":{k:v["count"] for k,v in out["contexts"].items()},"discovered":[x["name"] for x in dyn]},ensure_ascii=False))
