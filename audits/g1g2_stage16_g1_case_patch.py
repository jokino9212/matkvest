#!/usr/bin/env python3
"""Stage16 G1: fix accusative '1 книгу' after an action, preserving nominative 'было 1 книга'."""
from pathlib import Path
import hashlib,re
html=Path('index.html')
before=html.read_bytes()
expected='2252fe792fbef2ba6b1a4d0794ae674164f55f3260496af1156660b986b5ae16'
sha=hashlib.sha256(before).hexdigest()
if sha!=expected:
    raise SystemExit('REFUSE: expected exact verified stage16 G1/G2 candidate, got '+sha)
source=before.decode('utf-8')
anchor='function g1StorySentence(m,{name="У Маши"}={}){'
helper='function g1ActionNoun(n,o){return o.one==="книга"&&n%10===1&&n%100!==11?"книгу":g1Noun(n,o)}\n'
if source.count(anchor)!=1 or 'function g1ActionNoun(' in source:
    raise SystemExit('REFUSE: G1 generator source structure changed')
src=source.replace(anchor,helper+anchor,1)
updates={'g1Noun(m.b,o)':'g1ActionNoun(m.b,o)','g1Noun(m.b,m.obj)':'g1ActionNoun(m.b,m.obj)'}
for old,new in updates.items():
    if src.count(old)!=2:raise SystemExit(f'REFUSE: expected exactly two action noun calls: {old}, got {src.count(old)}')
    src=src.replace(old,new)
if src.count('function g1ActionNoun(')!=1 or src.count('g1ActionNoun(m.b,')!=4:
    raise SystemExit('REFUSE: G1 noun patch incomplete')
# Ensure original quantity remains in nominative where intended.
if src.count('g1Noun(m.a,o)')!=2 or src.count('g1Noun(m.a,m.obj)')<2:
    raise SystemExit('REFUSE: G1 original-count nominative accidentally changed')
updated=src.encode('utf-8')
newhash=hashlib.sha256(updated).hexdigest()
worker=Path('sw.js'); oldsw=worker.read_text('utf-8')
pattern=r'const APP_BUILD_HASH = "[0-9a-f]{64}";'
newsw,n=re.subn(pattern,f'const APP_BUILD_HASH = "{newhash}";',oldsw)
if n!=1 or 'matkvest-iphone-v40' not in newsw:
    raise SystemExit('REFUSE: unsafe SW fingerprint/cache state')
html.write_bytes(updated)
worker.write_text(newsw,encoding='utf-8')
print('STAGE16 G1 action noun patch: 4 localized call replacements; one helper; SW fingerprint synced')
print('BEFORE',sha)
print('AFTER',newhash)
