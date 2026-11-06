from pathlib import Path
import re
s=Path('index.html').read_text('utf-8')
pats=[
r'function startG[5678]\w*Stage\(',
r'function startG[5678]\w*Quiz\(',
r'function (?:checkQuizInput|quizInputEvaluation|quizInputRaw|mk872PersistDraft|mk872RestoreDraft|mk872ReadDraft|mk872RequestExit|mk872BlockActive|mk872HasActiveLearning)\(',
r'function (?:startG5|startG6|startG7|startG8|checkQuiz|nextQ)\(',
r'function (?:startTopicPractice|openGrade|mk872DraftKey)\(',
]
for pat in pats:
 matches=list(re.finditer(pat,s))
 print('PATTERN',pat,'matches',len(matches))
 for m in matches[:24]:print('DEF',m.group(),m.start(),repr(s[m.start():m.start()+420]))
for keyword in ['function mk872RestoreDraft(', 'function mk872ReadDraft(', 'function mk872BlockActive(', 'function mk872DraftKey(']:
 p=s.find(keyword)
 print('DETAIL',keyword,repr(s[p:p+2200]) if p>=0 else 'missing')
