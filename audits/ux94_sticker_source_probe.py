from pathlib import Path
import re
s=Path('index.html').read_text('utf-8')
terms=['stickers:[','function favoriteStickersHtml','function toggleFavoriteSticker','favorite-stickers','favorite-sticker','leader-stickers','mk872-col-section','function openCollection','function openShop','function renderShopMedia','case "stickers"','shop-tab']
for term in terms:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print('TERM',term,'COUNT',len(matches))
 for x in (matches[:2]+matches[-2:]):
  i=x.start()
  print('OFFSET',i,'CODE',repr(s[max(0,i-400):i+1450]))
print('TOTAL_HTML_BYTES',len(s))
