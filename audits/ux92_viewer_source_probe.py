from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
terms=['mk872AvatarViewer','mk30-visual','mk30-pet','mk872ViewerTitle','mk872-col-art','mk30Resolve','Питомцы','Боба','Boba','resizeAvatar','renderPet','assetPreview']
for term in terms:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print('TERM',term,'COUNT',len(matches))
 for m in (matches[:2]+matches[-3:]):
  i=m.start();print('LOC',i,repr(s[max(0,i-530):i+1100]))

def excerpt(start,end,tag):
 i=s.index(start)
 j=s.index(end,i) if end else i+8000
 print('EXCERPT',tag,repr(s[i:j+len(end)] if end else s[i:j]))
for start,end,tag in [
 ('<style id="mk30-zoom-style">','</style>','ALL_VIEWER_CSS'),
 ('<script id="mk30-artwork-viewer-script">','</script>','ALL_VIEWER_JS'),
 ('<script id="mk872-avatar-zoom-script">','</script>','OLDER_VIEWER'),
 ('function avatarHtml(', '\n}', 'AVATAR_RENDER'),
 ('function petHtml(', '\n}', 'PET_RENDER')
]:
 try:excerpt(start,end,tag)
 except ValueError:print('NOT_FOUND',tag)
