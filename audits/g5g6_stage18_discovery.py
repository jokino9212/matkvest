#!/usr/bin/env python3
"""Read-only inventory of stage18 grade5/6 fraction/mixed-answer UI and generators."""
from pathlib import Path
import re, hashlib, collections
s=Path("index.html").read_text("utf-8")
patterns={
 "fraction/mixed identifiers":r"(?i)\b(?:[\w$]*(?:fraction|frac|mixed|numerator|denominator)[\w$]*)\b",
 "answer input identifiers":r"(?i)\b[\w$]*(?:answer|answerinput|checkanswer|submitanswer|freeinput|typedanswer)[\w$]*\b",
 "input html":r"<input\b[^>]{0,600}>",
 "fraction html":r"(?i)<(?:span|div)[^>]{0,150}(?:fraction|frac|mixed)[^>]{0,150}>",
 "quiz functions":r"(?:async\s+)?function\s+[\w$]*(?:Answer|Input|Quiz|Training|Fraction|Mixed|Check|Submit|Validate)[\w$]*\s*\(",
 "const handlers":r"(?m)^\s*(?:const|let)\s+[\w$]*(?:Answer|Input|Quiz|Training|Fraction|Mixed|Check|Submit|Validate)[\w$]*\s*=",
 "Grade 5 generator refs":r"(?:g5:|\bfrac_(?:to_mixed|read|add|sub|equal)|mixed_(?:to_frac|add|sub|compare))",
 "Grade 6 generator refs":r"(?:g6:|fraction_(?:add|divide|multiply)|mixed_(?:add|multiply))",
 "answer presentation messages":r"(?i)(?:введи|запиши|напиши|укажи|впиши|ответ)[^\n]{0,90}(?:дроб|смешан|числит|знаменател|слэш|через\s+/)",
}
out=["# Stage18 discovery: grade 5–6 fractions and answers","",f"size_bytes: {len(s.encode('utf8'))}",f"sha256: {hashlib.sha256(s.encode('utf8')).hexdigest()}",f"total_lines: {s.count(chr(10))+1}",""]
for label,pattern in patterns.items():
    matches=list(re.finditer(pattern,s))
    out.extend(["## "+label,f"total: {len(matches)}",""])
    if label=="fraction/mixed identifiers" or label=="answer input identifiers":
        counts=collections.Counter(m.group(0) for m in matches)
        out.append("Most frequent identifiers: "+", ".join(f"{w} ({n})" for w,n in counts.most_common(50)))
        sampled=[];used=set()
        for m in matches:
            word=m.group(0)
            if word.lower() in used:continue
            used.add(word.lower());sampled.append(m)
            if len(sampled)>=35:break
    else:
        sampled=matches[:50]
    for m in sampled:
        pos=m.start()
        st=max(0,pos-210);en=min(len(s),m.end()+250)
        snippet=s[st:en].replace(chr(10),"\\n")
        out.append(f"- L{s.count(chr(10),0,pos)+1} @ {pos}: `{snippet.replace(chr(96),chr(39))[:650]}`")
    out.append("")
Path("audits/g5g6_stage18_discovery_report.md").write_text("\n".join(out)+"\n","utf8")
print("Stage18 discovery saved",len(out),"lines",len(s),"chars")

# Targeted semantic extraction for implementing fraction UI without disturbing legacy engines.
targets=["quizAnswerMarkup","quizFractionAnswerHtml","focusQuizInput","bindQuizKeyboard","parseRationalInput","g6FractionInputQuestion","g5q","renderQuiz","checkQuiz","checkQuizAnswer","quizAnswerKey","quizPromptHtml","g5FractionChoices"]
focus=["# Stage18 focus: quiz input and answer pipeline",""]
functions=list(re.finditer(r"(?m)^function\\s+([A-Za-z_$][\\w$]*)\\s*\\(",s))
for m in functions:
    name=m.group(1)
    if name in targets or (("quiz" in name.lower() or "answer" in name.lower()) and any(x in name.lower() for x in ("check","read","input","markup","focus","render","validate","key","fraction"))):
        j=next((x.start() for x in functions if x.start()>m.start()),len(s))
        snippet=s[m.start():min(j,m.start()+11000)]
        focus.append(f"## {name}, line {s.count(chr(10),0,m.start())+1}, offset {m.start()}, function_span {j-m.start()} chars")
        focus.append("~~~javascript\\n"+snippet+"\\n~~~")
for needle in ["answerMode===\"fraction\"","answerMode === \"fraction\"","q.answerMode","quizAnswerMarkup(","quizFractionAnswerHtml(","parseRationalInput(","quiz-input-hint","quiz-input"]:
    locs=[m.start() for m in re.finditer(re.escape(needle),s)]
    focus.append(f"## needle {needle} count {len(locs)}")
    for pos in locs[:14]:
        focus.append(f"- line {s.count(chr(10),0,pos)+1}\\n~~~javascript\\n{s[max(0,pos-700):pos+950]}\\n~~~")
Path("audits/g5g6_stage18_focus_report.md").write_text("\\n".join(focus),"utf8")
print("Stage18 focus saved",len(focus),"blocks")
