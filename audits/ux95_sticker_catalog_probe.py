from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
start=s.index(' stickers:[',s.index('const SHOP_CATALOG'))
end=s.index('\n ],',start)
seg=s[start:end]
for m in re.finditer(r'\{id:"(st_[^"]+)",name:"([^"]+)",icon:',seg):
 print('STICKER_CATALOG_ITEM',m.group(1),m.group(2))
print('TOTAL',len(re.findall(r'\{id:"st_',seg)))
