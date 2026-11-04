from pathlib import Path
import re,hashlib
src=Path('index.html').read_text(encoding='utf-8')
assert hashlib.sha256(src.encode()).hexdigest() in {'3d93fc220d9a8e29b2a299a22036b1d50eefad65b40364e1de1e52b4d8d6de88','38bcef242723e7aba4d33c622a304c1f900d5e9254e2ffe291267d1bd436cf70'}
targets=['mk872PersistDraft','mk872RestoreDraft','mk872OfferResume','mk872ScheduleSave','mk872HasActiveLearning','mk872RequestExit','mk872RebindRestored','mk872StartOver','mk872Exit','mk872Draft','mk872GetDraft','mk872ReadDraft','mk872WriteDraft','mk872CloseDialog','mk872OpenDialog','mk872RestoreRoute','mk872Boot','mk872CanResume','beginBlock','syncActiveAttempt','startG7QuizStage','openG7Quiz','freshQuiz','pick','checkQuizInput','nextQ']
chunks=[]
for name in targets:
  starts=list(re.finditer(r'(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(|(?:const|let|var)\s+'+re.escape(name)+r'\s*=|(?:^|\n)\s*'+re.escape(name)+r'\s*=\s*function',src))
  if not starts:
    j=src.find(name)
    if j>=0:starts=[type('M',(),{'start':lambda self:j})()]
  for ix,m in enumerate(starts[:2]):
    st=m.start()
    tail=src[st:st+7500]
    lines=[f'===== {name} #{ix+1} OFFSET={st} =====\n',tail,'\n']
    chunks.extend(lines)
out='\n'.join(chunks)
Path('audits/g7_stage12_source_snippets.txt').write_text(out,encoding='utf-8')
print('extract:',len(out),'characters; functions',len(chunks)//3)
print('start sample:',out[:3300])
