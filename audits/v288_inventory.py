from pathlib import Path
import re, hashlib, collections, json
p=Path("index.html")
s=p.read_text(encoding="utf-8")
assert hashlib.sha256(s.encode()).hexdigest()=="6a0004d4589d0bf5a8d299aa492c460e87c668db7c9484df1da92b490b992109"
lines=s.splitlines()
# Lexical inventory, including inactive and repeated templates; do not equate occurrences with active defects.
pattern=re.compile(r'\bon(click|keydown|input|change|submit|pointerdown|mousedown|touchstart)\s*=',re.I)
owner_re=re.compile(r'^\s*(?:async\s+)?function\s+([\w$]+)\s*\(')
owner="top-level"; grouped=collections.defaultdict(collections.Counter); detail=collections.defaultdict(list)
for i,line in enumerate(lines,1):
 m=owner_re.match(line)
 if m: owner=m.group(1)
 for event in pattern.finditer(line):
  grouped[owner][event.group(1).lower()]+=1
  detail[owner].append((i,line[max(0,event.start()-70):event.start()+230]))
print("V288_LEXICAL_TOTAL",json.dumps(dict(sum(grouped.values(),collections.Counter()))))
for name,counts in grouped.items(): print("OWNER",name,dict(counts))
print("V288_UI_MOUNTS")
for i,line in enumerate(lines,1):
 if re.search(r'\bmount\w+\s*\(',line) and re.search(r'store|shop|pet|collection|cosmetic|avatar|badge|sticker',line,re.I):
  print(i,line[:1700])
print("V288_TARGET_INLINE")
for name,items in detail.items():
 if re.search(r'store|shop|pet|collection|cosmetic|avatar|badge|sticker|sale|equip|buy',name,re.I):
  for i,line in items: print(name,i,line)
print("V288_REMAINING_AREA_COUNTS",len(grouped))
