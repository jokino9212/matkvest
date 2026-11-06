from pathlib import Path
s=Path('index.html').read_text('utf-8')
for needle in ['function mk872PersistDraft','mk872PersistDraft=function','function mk872RequestExit','function closeModal','const modal=','let modal=','id="modal"']:
 p=s.find(needle)
 print('NEEDLE',needle,'INDEX',p)
 if p>=0:print('CONTEXT',repr(s[max(0,p-750):p+2600]))
