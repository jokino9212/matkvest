#!/usr/bin/env python3
"""Read-only index.html UI source census for targeted fix; log bounded contexts."""
from pathlib import Path
import re
s=Path('index.html').read_text('utf-8')
print('HTML LENGTH',len(s))
pats=[
 ('fraction CSS',r'(?i)\.\w*(?:frac|fraction|mixed)\w*\s*\{'),
 ('fraction JS',r'(?i)(?:renderFraction|renderFrac|fracHtml|mixedNum|fractionHtml)'),
 ('shop sort',r'(?i)(?:shopItems\.sort|sort\([^\n]{0,100}(?:price|rarity)|rarityOrder|rarityRank|sortShop)'),
 ('inventory sort',r'(?i)(?:inventoryItems\.sort|collectionItems\.sort|renderInventory|renderCollection|showCollection)'),
 ('shop functions',r'(?i)function\s+(?:renderShop|openShop|showShop|renderMarket|renderCollection|renderInventory)'),
 ('progress',r'(?i)(?:topicsCompleted|completedTopics|topicsDone|sectionProgress|chapterProgress|progressBySection)'),
 ('UI fraction text',r'(?i)(?:числител|знаменател|целая часть|смешанн)'),
 ('store markup',r'(?:Моя коллекция|Обычные|Легендарные|Магазин|Обыкновенные дроби)'),
]
for label,pat in pats:
 matches=list(re.finditer(pat,s))
 print('\n###',label,'TOTAL',len(matches))
 for m in matches[:min(12,len(matches))]:
  print('AT',m.start(),repr(s[max(0,m.start()-260):m.start()+420]))

print("\n### TARGETED REGIONS")
for needle,before,after,lim in [
 ("function openCollection(",120,4500,2),
 ("openCollection=function",120,3500,2),
 ("function filteredShopItems(",50,2200,2),
 ("filteredShopItems=function",60,1800,4),
 ("function mk872ModernCatalog(",120,2400,2),
 ("function mk872Collection",80,2800,2),
 ("function mk872",0,1200,8),
 (".mixed-input",80,2200,4),
 (".fraction-input",80,2000,4),
 ("frac-input",80,2000,4),
 ("mk872Fraction",120,2500,4),
]:
 points=list(re.finditer(re.escape(needle),s))
 print("TARGET",needle,"COUNT",len(points))
 for m in points[:lim]:print("AT",m.start(),repr(s[max(0,m.start()-before):m.start()+after]))

for label,a,b in [
 ("LATEST_SORT_IMPLEMENTATION",6357400,6360800),
 ("FRACTION_GLOBAL_STYLES",48900,50200),
 ("COLLECTION_OVERRIDES",4960000,4974000),
]:
 print("\nREGION",label,repr(s[a:b]))
