#!/usr/bin/env python3
"""Stage 17D batch3: exact read-only G3 geometry and area generator source."""
import hashlib,json,pathlib,re
b=pathlib.Path("index.html").read_bytes()
expected="fa3810ac65800b14dfaf5b041598c1a3c21a93e92c71fccc9b00899b3dabf741"
sha=hashlib.sha256(b).hexdigest()
if sha!=expected:raise SystemExit("ABORT: approved HTML hash mismatch "+sha)
sw=pathlib.Path("sw.js").read_text("utf8")
if "matkvest-iphone-v45" not in sw or f'const APP_BUILD_HASH = "{sha}"' not in sw:raise SystemExit("ABORT: PWA mismatch")
s=b.decode("utf8")
funcs=["g3GeometryFiguresQuestion","g3GeometryConstructionQuestion","g3AreaCellsShape","g3AreaMeasureQuestion","g3GeometrySvg","g3GeoChoice","g3GeoNumber","g3GeometryTheoryHtml"]
out={"phase":"17D-batch3-source","sha256":sha,"bytes":len(b),"functions":{}}
for f in funcs:
 matches=list(re.finditer(r"function\s+"+re.escape(f)+r"\s*\(",s))
 blocks=[]
 for m in matches:
  end=re.search(r"\nfunction\s+[a-zA-Z_$][\w$]*\s*\(",s[m.start()+10:])
  pos=m.start()+10+end.start() if end else min(len(s),m.start()+24000)
  blocks.append({"start":m.start(),"end":pos,"source":s[m.start():min(pos,m.start()+22000)]})
 out["functions"][f]=blocks
dest=pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch3_source.json")
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({"sha":sha,"sizes":{k:[len(x["source"]) for x in v] for k,v in out["functions"].items()}},ensure_ascii=False))
