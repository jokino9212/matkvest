#!/usr/bin/env python3
"""Stage 17D: read-only contexts for first pedagogical quality batch (3 topics)."""
import hashlib,json,pathlib,re
from datetime import datetime,timezone
P=pathlib.Path("index.html")
raw=P.read_bytes()
EXPECTED="fa4db04c3a53351ed672b12daa577a2ea3bb1376932f13b821e50db95436cd9a"
sha=hashlib.sha256(raw).hexdigest()
if sha!=EXPECTED:raise SystemExit("ABORT: unexpected source candidate "+sha)
sw=pathlib.Path("sw.js").read_text()
if "matkvest-iphone-v43" not in sw or f'const APP_BUILD_HASH = "{sha}"' not in sw:raise SystemExit("ABORT: PWA out of sync")
s=raw.decode("utf8")
tokens=["offtable_multiply","offtable_divide","division_remainder","g3OffMul","g3OffDiv","g3Remainder","function makeG3Question"]
result={"stage":"17D-quality-batch1-source","utc":datetime.now(timezone.utc).isoformat(),"sha256":sha,"bytes":len(raw),"tokens":{},"functions":[]}
for token in tokens:
 hits=[m.start() for m in re.finditer(re.escape(token),s,re.I)]
 result["tokens"][token]={"total":len(hits),"locations":hits[:24],"contexts":[{"pos":p,"text":s[max(0,p-250):p+6500]} for p in hits[:3]]}
for m in re.finditer(r'(?:function|const)\s+([a-zA-Z_$][\w$]*(?:Off|off|Remainder|remainder)[\w$]*)\b',s):
 result["functions"].append({"name":m.group(1),"pos":m.start(),"source":s[m.start():m.start()+9500]})
result["functions"]=result["functions"][-25:]
out=pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch1_source.json")
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({"stage":result["stage"],"sha":sha,"functions":[x["name"] for x in result["functions"]],"matches":{k:v["total"] for k,v in result["tokens"].items()}},ensure_ascii=False))
