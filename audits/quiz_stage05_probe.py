from pathlib import Path
import re
s=Path("index.html").read_text("utf-8")
for needle in ["function g5InfoById(", "function makeG5Question(", "function activeDifficulty(", "function g5DonorQuestion(", "const G5", "let G5", "const g5", "function g5Lesson(", "function g5q("]:
 idx=s.find(needle)
 print("STAGE05_SOURCE",needle,idx,repr(s[idx:idx+3400] if idx>=0 else ""))
for pat in [r"\bg5InfoById\(",r"\bg5Topic",r"\bg5Info",r"\bfrac_to_mixed\b"]:
 ms=list(re.finditer(pat,s,re.I))
 print("STAGE05_MATCHES",pat,len(ms),[m.start() for m in ms[:15]])

for id in ["angles","charts","frac_shapes","frac_parts","frac_ray","frac_common_lcm","dec_to_common"]:
 for style in [f'if(id==="{id}")',f"if(id==='{id}')",f'case "{id}"',f'case \'{id}\'']:
  pos=s.find(style)
  if pos!=-1:
   print("STAGE05_TARGET",id,style,pos,repr(s[max(0,pos-350):pos+3600]))

for needle in ["function mk5Fractions(", "function mk5Core(", "const mk5Previous", "g5DonorQuestion=function", "const MK5", "function mk5Donor", "function g5DonorQuestion(", "function stage18ConvertG5Fraction("]:
 matches=[m.start() for m in re.finditer(re.escape(needle),s)]
 print("STAGE05_BINDING",needle,matches)
 for pos in matches[-3:]: print("STAGE05_BINDING_SNIP",needle,repr(s[max(0,pos-250):pos+1600]))

for needle in ["function freshQuiz(", "function nextQ(", "function startG5QuizStage(", "function mk5PromptHash(", "function mk5ScoreVariant("]:
 hits=[m.start() for m in re.finditer(re.escape(needle),s)]
 print("STAGE05_LIFECYCLE",needle,hits)
 for at in hits[-2:]: print("STAGE05_LIFECYCLE_SOURCE",needle,repr(s[at:at+4500]))
