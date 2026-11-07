from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
terms=['Таблица лидеров','Потрачено в магазине','Потрачено','Стоимость склада','Стоимость коллекции','shopSpent','spentCoins','shopSpend','leaderboard','openAvatar','openPet','previewAvatar','previewPet','avatarModal','petModal','petImg','avatarImg','openCollect','openProfile','showAvatar','showPet','fullScreen','lightbox']
for needle in terms:
 matches=list(re.finditer(re.escape(needle),s,re.I))
 print('TERM',repr(needle),'COUNT',len(matches))
 for m in matches[:12]:print('MATCH',m.start(),repr(s[max(0,m.start()-250):m.start()+400]))
for pat in [r'function \w*(?:Leader|Avatar|Pet|Collect|Inventory|Shop|Preview|Lightbox|FullScreen|Profile)\w*\(',r'(?:onclick|addEventListener)\s*=\s*[\x22\x27][^\n]{0,220}(?:Avatar|Pet|avatar|pet)',r'const \w*(?:avatar|pet)\w*=']:
 found=list(re.finditer(pat,s,re.I));print('PATTERN',pat,'COUNT',len(found))
 for m in found[:90]:print('DEF',m.start(),repr(s[m.start():m.start()+320]))
