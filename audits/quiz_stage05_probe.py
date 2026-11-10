from pathlib import Path
import re
s=Path("index.html").read_text("utf-8")
for needle in ["function g5InfoById(", "function makeG5Question(", "function activeDifficulty(", "function g5DonorQuestion(", "const G5", "let G5", "const g5", "function g5Lesson(", "function g5q("]:
 idx=s.find(needle)
 print("STAGE05_SOURCE",needle,idx,repr(s[idx:idx+3400] if idx>=0 else ""))
for pat in [r"\bg5InfoById\(",r"\bg5Topic",r"\bg5Info",r"\bfrac_to_mixed\b"]:
 ms=list(re.finditer(pat,s,re.I))
 print("STAGE05_MATCHES",pat,len(ms),[m.start() for m in ms[:15]])
