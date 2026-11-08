from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
terms=['mk872AvatarViewer','mk30-visual','mk30-pet','mk872ViewerTitle','mk872-col-art','mk30Resolve','Питомцы','Боба','Boba','resizeAvatar','renderPet','assetPreview']
for term in terms:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print('TERM',term,'COUNT',len(matches))
 for m in (matches[:2]+matches[-3:]):
  i=m.start();print('LOC',i,repr(s[max(0,i-530):i+1100]))
