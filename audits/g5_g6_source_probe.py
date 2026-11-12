from pathlib import Path
import re
s=Path("index.html").read_text(encoding="utf-8")
lines=s.splitlines()
print("SOURCE_TOTAL",len(lines),len(s))
terms=["const G5_CORE","G5_CORE =","function g5AllTopics","function g6AllTopics","function makeG5Question","function makeG6Question","function search","topicSearch","searchTopics","function makeG5","g5:operations","case 'operations'","id:'operations'","id: 'operations'","function startG5QuizStage","function freshQuiz"]
for term in terms:
 hits=[(i,l) for i,l in enumerate(lines) if term in l]
 print("ANCHOR",repr(term),"HITS",len(hits))
 for i,l in hits[:5]:
  print("AT",i+1,l[:300])
  for j in range(max(0,i-3),min(len(lines),i+12)):
   print(f"LINE {j+1}: {lines[j][:500]}")
for term in ["Деление с остатком","Раскрытие скобок","Упрощение выражений","Остаток при делении","searchInput","searchQuery","filterTopics"]:
 print("TEXT_MATCH",term,len(list(re.finditer(re.escape(term),s,re.I))))
