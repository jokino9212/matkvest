#!/usr/bin/env python3
from pathlib import Path
import re
s=Path('index.html').read_text('utf-8')
queries={
 'grade card HTML':r'<section class="grade-card"',
 'grade card CSS':r'\.grade-card(?:\s*[:{>,]|\s*\{)',
 'grade card event':r'(?i)(?:grade-card[^\\n]{0,100}(?:onclick|addEventListener|cursor)|closest\([\'"\\]\.grade-card)',
 'topic card HTML':r'(?:class="[^"]*(?:topic-card|topic-item|course-card|grade-card)[^"]*")',
 'hover card CSS':r'(?i)(?:\.grade-card:hover|\.topic-card:hover|\.course-card:hover)',
 'grade open':r'function openGrade\(',
 'click delegation':r'addEventListener\([\'"\\]click',
 'menu CSS':r'(?i)(?:\.nav\w*:hover|\.menu\w*:hover)',
}
for label,pat in queries.items():
 matches=list(re.finditer(pat,s))
 print('QUERY',label,'TOTAL',len(matches))
 for m in matches[:15]:
  print('AT',m.start(),repr(s[max(0,m.start()-190):m.start()+370]))
for a,b,label in [(16000,21000,'base CSS'),(1647000,1652500,'grade cards code'),(6349000,6355200,'late UI')]:
 print('REGION',label,repr(s[a:b]))
