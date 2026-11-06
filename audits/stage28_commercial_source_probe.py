#!/usr/bin/env python3
from pathlib import Path
import re,hashlib
s=Path('index.html').read_text('utf-8')
print('BUILD',len(s),hashlib.sha256(s.encode('utf-8')).hexdigest())
terms=[
 'Student Full','Teacher','Free','Пробный','пробный','подписк','тариф','оплат',
 '10/24','10 трениров','24 час','25%','автопродл','регистрац','авторизац','аккаунт',
 'fetch(','indexedDB','localStorage','navigator.onLine','serviceWorker',
 'function openShop(', 'function buyItem(', 'function shopBuy(', 'function startG7QuizStage(', 'function startG8QuizStage(',
 'function mk872PersistDraft(', 'function mk872ReadDraft(',
 'teacherSettings','accessToken','Bearer','apiBase','/api/','payment','subscription','license','платн',
]
for term in terms:
 exact=not term.islower() and '(' in term
 matches=list(re.finditer(re.escape(term),s,re.I if not exact else 0))
 print('TERM',repr(term),'COUNT',len(matches))
 for m in matches[:4]:
  print(' SAMPLE',m.start(),repr(s[max(0,m.start()-150):m.start()+280]))
for p in [
 r'function \w*(?:Shop|Buy|Purchase|Paid|Price|Free|Limit|Subscription|Teacher|Tutor|Account|Login|Auth|Trial|License)\w*\(',
 r'function \w*(?:Export|Import|Backup|Resume)\w*\(',
 r'localStorage\.setItem\(',
 r'fetch\('
]:
 found=list(re.finditer(p,s,re.I));print('PATTERN',p,'COUNT',len(found))
 for m in found[:40]:print(' DEF',m.start(),repr(s[m.start():m.start()+165]))
