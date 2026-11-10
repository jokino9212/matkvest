from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
for name in ["skipNormalQuiz","skipQuiz","nextQ","quizAnswerMarkup","finishAttemptItem","quizInputEvaluation"]:
 hits=list(re.finditer(r"function\s+"+re.escape(name)+r"\s*\(",s))
 print("STAGE03_SOURCE",name,"COUNT",len(hits))
 for hit in hits[:3]:
  idx=hit.start()
  print("INDEX",idx,"SNIPPET",s[idx:idx+5500])
for name in ["function skipNormalQuiz(", "const earlierSkipNormalQuiz", "skipNormalQuiz=function"]:
 print("STAGE03_OCCURRENCES",name,[m.start() for m in re.finditer(re.escape(name),s)][:15])
