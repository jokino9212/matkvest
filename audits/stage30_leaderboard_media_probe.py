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

for needle,n in [('function openLeaderboard(',5500),('function avatarBadge(',5000),('function previewAvatar(',4000),('function mk19e',3500),('Потрачено в магазине',2200),('function openCollection(',5000),('function openProfile(',4700),('function avatarHtml(',3500),('function renderAvatar(',3500)]:
 p=s.find(needle)
 if p!=-1:print('DETAIL',needle,p,repr(s[p:p+n]))
for phrase in ['pet-mini','previewAvatar','previewItem','pet-badge','avatar-badge','function itemPrice','function shopPrice','shopCatalog','SHOP_ITEMS','ITEMS=','rarity','inventory','p.items']:
 matches=list(re.finditer(re.escape(phrase),s,re.I))
 print('FOCUS',phrase,len(matches))
 for m in matches[-12:]:print('CTX',m.start(),repr(s[max(0,m.start()-180):m.start()+280]))

for start,length in [(4958000,6000),(4418500,2300),(3289000,1400),(6333500,3700),(6320000,4300),(1571000,1400),(1577000,1500)]:
 print('SLICE',start,'LEN',length,repr(s[start:start+length]))
for regex in [r'function catalogItem\(',r'function shopItemIcon\(',r'function shopPreview\(',r'function openLeaderboard\(',r'function mk19eProfileSummary\(',r'const SHOP_CATALOG\s*=',r'function avatarHtml\(',r'function mk868IsRasterAvatarItem\(']:
 for m in list(re.finditer(regex,s))[:4]:print('LOCATE',regex,m.start(),repr(s[m.start():m.start()+900]))
