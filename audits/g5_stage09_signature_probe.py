from pathlib import Path
s=Path('index.html').read_text('utf8')
for term in ['s18c_types_', 'function freshQuiz(', 'const sig=', 'usedSignatures', 'function makeG5Question(']:
 print('\n=== LOOKUP',term,'===')
 offsets=[];start=0
 while True:
  i=s.find(term,start)
  if i<0:break
  offsets.append(i);start=i+len(term)
 print('COUNT',len(offsets))
 for i in offsets[:8]:print('AT',i, '\n',s[max(0,i-650):i+1200].replace('\n',' '))
