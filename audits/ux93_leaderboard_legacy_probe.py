from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
terms=['function openLeaderboard','function avatarHtml','function renderLeader','leader-table','mk868-avatar-img','avatar-core','function normalizeProfileCosmetics','function catalogItem','mk872-viewer-image','mk30-artwork-viewer-script']
for term in terms:
 m=list(re.finditer(re.escape(term),s))
 print('TERM',term,'COUNT',len(m))
 for x in m[:2]:
  i=x.start();print('OFFSET',i,'CODE',repr(s[max(0,i-250):i+2600]))
