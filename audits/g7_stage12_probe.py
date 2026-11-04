from pathlib import Path
import re, json, hashlib
src=Path("index.html").read_text(encoding="utf-8")
sha=hashlib.sha256(src.encode("utf-8")).hexdigest()
assert sha=="3d93fc220d9a8e29b2a299a22036b1d50eefad65b40364e1de1e52b4d8d6de88",sha
terms=[
  "serviceWorker", "sw.js", "controllerchange", "updatefound", "skipWaiting",
  "beforeunload", "pagehide", "visibilitychange", "localStorage", "sessionStorage",
  "blockSession", "resumeAttempt", "restoreAttempt", "saveAttempt", "unfinished",
  "restoreTraining", "restoreQuiz", "persist", "lastAttempt", "storageKey",
  "quizResume", "attempt", "checkQuizInput", "openG7Quiz", "startG7QuizStage",
  "quizAdvanceResolved", "nextQ", "freshQuiz"
]
found={}
for term in terms:
  all_hits=[m.start() for m in re.finditer(re.escape(term),src,re.IGNORECASE)]
  segments=[]
  for pos in all_hits[:24]:
    lo=max(0,pos-170); hi=min(len(src),pos+220)
    excerpt=src[lo:hi]
    excerpt=re.sub(r"data:image/[^\s\"']{300,}", "<LARGE_IMAGE_DATA>",excerpt)
    segments.append({"position":pos,"snippet":excerpt})
  found[term]={"count":len(all_hits),"samples":segments}
func_names=re.findall(r"(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(",src)
funcs=[n for n in func_names if re.search(r"(?i)(session|resume|restore|attempt|autosave|sw|update|cache|quiz|progress|persist)",n)]
output={"sha":sha,"length":len(src),"functionCandidates":list(dict.fromkeys(funcs))[:250],"hits":found}
Path("audits/g7_stage12_probe.json").write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding="utf-8")
print("SHA",sha,"LEN",len(src))
print("FUNCTION CANDIDATES",json.dumps(output["functionCandidates"][:150],ensure_ascii=False))
print("TERM_COUNTS",json.dumps({k:v["count"] for k,v in found.items()},ensure_ascii=False))
for term in ["serviceWorker","controllerchange","updatefound","skipWaiting","pagehide","visibilitychange","resumeAttempt","restoreAttempt","saveAttempt","openG7Quiz","startG7QuizStage"]:
  print("\n===",term,"===")
  for hit in found[term]["samples"][:5]:print(hit["position"],hit["snippet"].replace("\n"," ")[:300])
