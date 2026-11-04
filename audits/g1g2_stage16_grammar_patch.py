#!/usr/bin/env python3
"""Stage16: targeted grammatical correction for book objects in G2 word problems.
Write only the audited HTML and keep SW fingerprint synchronized; never touch main.
"""
from pathlib import Path
import hashlib
import re

html=Path('index.html')
source=html.read_text(encoding='utf-8')
expected='f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36'
if hashlib.sha256(html.read_bytes()).hexdigest()!=expected:
    raise SystemExit('REFUSE: input HTML must be exact published stage15 build')

needle='function g2StoryNoun(n,o){return g1Noun(n,o)}'
replacement=needle+'\nfunction g2StoryAccNoun(n,o){return o.one==="книга"&&n%10===1&&n%100!==11?"книгу":g2StoryNoun(n,o)}\\nfunction g2StoryTimes(n){return n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"раза":"раз"}'
if source.count(needle)!=1:
    raise SystemExit('REFUSE: g2StoryNoun definition unexpected')
source=source.replace(needle,replacement,1)
needles={
  'g2StoryNoun(m.b,m.obj)':2,
  'g2StoryNoun(model.b,o)':2,
  'g2StoryNoun(model.c,o)':2
}
for item,count in needles.items():
    if source.count(item)!=count:
        raise SystemExit('REFUSE: expected exactly %s appearances of %s'%(count,item))
    source=source.replace(item,item.replace('g2StoryNoun','g2StoryAccNoun'))
extra='\u0024{m.each} повторяется \u0024{m.groups} раза:'
if source.count(extra)!=1:
    raise SystemExit('REFUSE: expected one wrong раза explanation')
source=source.replace(extra,'\u0024{m.each} повторяется \u0024{m.groups} \u0024{g2StoryTimes(m.groups)}:')
if source.count('function g2StoryAccNoun')!=1:
    raise SystemExit('REFUSE: bad patch')
html.write_text(source,encoding='utf-8')
newhash=hashlib.sha256(html.read_bytes()).hexdigest()
worker=Path('sw.js')
sw=worker.read_text(encoding='utf-8')
updated,count=re.subn(r'const APP_BUILD_HASH = "[0-9a-f]{64}";',f'const APP_BUILD_HASH = "{newhash}";',sw)
if count!=1 or 'matkvest-iphone-v40' not in sw:
    raise SystemExit('REFUSE: unsafe SW source')
worker.write_text(updated,encoding='utf-8')
print('STAGE16 PATCHED HTML SHA256',newhash)
print('STAGE16 EXACT SOURCE REPLACEMENTS:',sum(needles.values())+1)
