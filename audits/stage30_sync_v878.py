#!/usr/bin/env python3
"""Sync updated stage30 script blocks into already-patched v8.78 without doubling handlers."""
from pathlib import Path
import ast,hashlib,re
source=Path('audits/stage30_patch_v878.py').read_text('utf8')
tree=ast.parse(source)
values={}
for node in tree.body:
 if isinstance(node,ast.Assign):
  for target in node.targets:
   if isinstance(target,ast.Name) and target.id in ('script','extra'):
    values[target.id]=ast.literal_eval(node.value)
assert len(values)==2,values.keys()
p=Path('index.html')
s=p.read_text('utf8')
assert 'mk30CollectionWorth' in s
patterns=[
 r'<script id="mk30-artwork-viewer-script">.*?</script>',
 r'<style id="mk30-collection-worth-style">.*?</style>\s*<script id="mk30-collection-worth-script">.*?</script>'
]
for pat,key in zip(patterns,('script','extra')):
 replacement=values[key]
 s,count=re.subn(pat,lambda m:replacement,s,count=1,flags=re.S)
 assert count==1,(key,count)
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
swp=Path('sw.js')
sw=swp.read_text('utf8')
assert 'matkvest-iphone-v78' in sw
sw,n=re.subn(r'(?<=APP_BUILD_HASH = ")[a-f0-9]{64}(?=";)',sha,sw,count=1)
assert n==1
swp.write_text(sw,'utf8')
print('STAGE30_REFRESH_OK',sha)
