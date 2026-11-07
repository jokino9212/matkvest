from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
terms=['const SHOP_CATALOG','badges:[','badges: [','bd_star','bd_equations','coinGain','coins +=','coins+=','state.coins+=','state.coins +=','reward.coins','coinReward','coinsPer','coins:','function shopCard','function filteredShopItems','function achievementCatalogRewardItems','function buyShopItem']
for term in terms:
 matches=list(re.finditer(re.escape(term),s))
 print('TERM',repr(term),'MATCHES',len(matches))
 for match in matches[:4]:
  i=match.start();before=500 if term.startswith('bd_') else 240;after=1800 if term in ['bd_star','bd_equations','const SHOP_CATALOG','function buyShopItem'] else 700
  print('SNIPPET_START',i, s[max(0,i-before):i+after].replace('\n','\\n')[:2400])

for term in ['function buyShopItem','function shopCard','function isOwned','function save','function priceFor','function spend']:
 i=s.find(term)
 if i>=0:print('DEEP',term,'POSITION',i,'CODE',s[i:i+3800].replace('\\n','\\\\n'))
