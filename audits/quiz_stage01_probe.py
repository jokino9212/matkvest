"""Stage01 diagnostic: inspect code actually shipped on the working branch.
Read only, no changes to student data or app. Prints bounded code excerpts to Actions logs.
"""
from pathlib import Path
import re
html=Path("index.html").read_text(encoding="utf-8")
needles=[
  "function stage18UsesFractionBoxes",
  "function stage18ParseFractionFields",
  "function stage18FractionStudentText",
  "function quizInputEvaluation",
  "function stage18AnswerForm",
  "function numberRatFromCorrect",
  "function exactFromQuestion",
  "frac_to_mixed",
  "mixed_to_frac",
  "function checkQuizInput",
]
print("INDEX_CHARS",len(html))
for needle in needles:
  starts=[m.start() for m in re.finditer(re.escape(needle),html)]
  print("\\n=== NEEDLE",needle,"COUNT",len(starts),"===")
  for idx in starts[:3]:
    print("OFFSET",idx)
    print(html[max(0,idx-320):min(len(html),idx+4500)])

print("\\n=== GRADE5 GENERATOR ENCLOSING CONTEXT ===")
for needle in ['if(id==="frac_to_mixed")','if(id==="mixed_to_frac")','function g5q(']:
 idx=html.find(needle)
 if idx<0:continue
 prior=html.rfind('function ',max(0,idx-30000),idx)
 defs=[html[prior:prior+110]] if prior>=0 else []
 print("MARKER",needle,"IDX",idx,"ENCLOSING",defs[-3:] if defs else "NONE")
 print(html[max(0,idx-1800):idx+400])

for needle in ['function startG5QuizStage(', 'function openG5Quiz(', 'function nextG5Quiz(', 'function nextG5Q(', 'function startNextQuizQuestion(']:
 idx=html.find(needle)
 print('NAV_SOURCE',needle,idx,repr(html[idx:idx+5500] if idx>=0 else ''))
