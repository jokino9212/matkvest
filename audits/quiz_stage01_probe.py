"""Stage01 diagnostic: inspect code actually shipped on the working branch.
Read only, no changes to student data or app. Prints bounded code excerpts to Actions logs.
"""
from pathlib import Path
import re
html=Path("index.html").read_text(encoding="utf-8")
needles=[
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
