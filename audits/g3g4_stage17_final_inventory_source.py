#!/usr/bin/env python3
"""Read-only source evidence for stage17D final inventory: every special grade3/4 renderer."""
import pathlib,hashlib,json,re
raw=pathlib.Path("index.html").read_bytes();sha=hashlib.sha256(raw).hexdigest()
required="04a719fe8c292d8fe42b9762fdca5b8b48c316042cbdb1709ac18fe5290eff21"
assert sha==required,("HTML SHA changed",sha)
sw=pathlib.Path("sw.js").read_text("utf8")
assert 'matkvest-iphone-v49' in sw and f'const APP_BUILD_HASH = "{sha}"' in sw
s=raw.decode("utf8")
names=["generateG3ColumnTask","startG3QuizStage","g3AllTopics","openGrade","startQuizStage","makeQ","generateColumnTask","makeColumnTask","startColumn","showColumn","generateG3Column","g3ColumnTask","startG3","renderG3","g3Topic","drawColumn","buildG3Column","g3CompareQuestion","g3GeometrySvg"]
out={"phase":"17D-final-inventory-source","sha256":sha,"bytes":len(raw),"functions":{},"specialOccurrences":{}}
for name in names:
 matches=list(re.finditer(r"function\s+"+re.escape(name)+r"\s*\(",s))
 chunks=[]
 for m in matches[:1]:
  nxt=re.search(r"\nfunction\s+[a-zA-Z_$][\w$]*\s*\(",s[m.start()+15:])
  pos=m.start()+15+nxt.start() if nxt else m.start()+14000
  chunks.append({"pos":m.start(),"source":s[m.start():min(pos,m.start()+24000)]})
 out["functions"][name]=chunks
for key in ['written_add','written_subtract','written_multiply','written_divide','rendererType','g3-column','g3Column','columnWork','buildColumn','startColumnStage','startColumnQuiz','makeG3Question','renderColumnTask','activeGrade','case "column"','if(t.id==="table")']:
 hits=[m.start() for m in re.finditer(re.escape(key),s)]
 out["specialOccurrences"][key]={"count":len(hits),"selected":[s[max(0,p-250):min(len(s),p+700)] for p in hits[:4]]}
dest=pathlib.Path("audits/g3g4_stage17_final_inventory_source.json")
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps({"sha":sha,"functions":{k:len(v) for k,v in out["functions"].items()},"occurrences":{k:v["count"] for k,v in out["specialOccurrences"].items()}},ensure_ascii=False))
