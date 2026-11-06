from pathlib import Path
import re
s=Path('index.html').read_text('utf-8')
patterns=[
 r'function (?:beginBlock|finishBlock|nextQ|skipNormalQuiz|mk872RequestExit|mk872PersistDraft|mk872RestoreDraft|mk872DraftUsable|mk872HasActiveLearning|mk872HasFinishedRecord|mk872PruneCompleted|mk872DeleteDraft|syncActiveAttempt|beginAttemptItem|finishAttemptItem|recordBlockItem|startG7QuizStage)\(',
 r'function (?:mk872ReadDraft|openGrade|renderHome|closeModal|mk872LearningDialog|mk872ProfileId)\(',
 r'mk872DraftKey',
 r'function (?:save|persistSilently|award|completeBlock)\(',
]
for pat in patterns:
 ms=list(re.finditer(pat,s))
 print('PATTERN',pat,len(ms))
 for m in ms[:50]:print('DEFINITION',m.group(),m.start(),repr(s[m.start():m.start()+250]))
for phrase,span in [('function beginBlock(',3300),('function finishBlock(',5800),('function mk872RequestExit(',4400),('function mk872RestoreDraft(',5200),('function mk872DraftUsable(',1800),('function mk872HasFinishedRecord(',1900),('function syncActiveAttempt(',2100),('function mk872DraftKey(',1800)]:
 p=s.find(phrase)
 if p>=0:print('DETAIL',phrase,repr(s[p:p+span]))
