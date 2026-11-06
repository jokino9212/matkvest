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
