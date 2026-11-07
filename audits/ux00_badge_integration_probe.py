from pathlib import Path
import re,json
s=Path('index.html').read_text('utf-8')
need=['SHOP_CATALOG =','badges: [','function renderShop','function openShop','function openCollection','function renderItem','function shopIcon','function catalogItem','item.icon','mk872Collection','shop-icon','badge-icon','function renderProfile','function openProfile']
for k in need:
 print('\n==SEARCH',k,'count',s.count(k))
 for m in list(re.finditer(re.escape(k),s))[:5]:
  pos=m.start();print('POS',pos,'\n',s[max(0,pos-230):min(len(s),pos+650)].replace('\n','\\n'))
