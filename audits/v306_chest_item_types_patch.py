#!/usr/bin/env python3
"""Stage v306 chest result category labels without touching reward economics."""
from pathlib import Path
import hashlib
p=Path("index.html")
assert hashlib.sha256(p.read_bytes()).hexdigest()=="1e225be71d2aeed493be494c150f2ebaedda392c9f90701f331923ad5b7d6227", "unexpected v305 runtime"
s=p.read_text(encoding="utf-8")
def once(a,b):
    global s
    assert s.count(a)==1, ("anchor mismatch", a, s.count(a))
    s=s.replace(a,b)
# The result body is shared by the Vue component and the HTML fallback.
# Keep the rarity and item name visible; explicitly identify its catalog category.
once('const body=(result.compensation?', '''const typeLabel=({avatars:"Аватар",frames:"Рамка",pets:"Питомец",titles:"Титул",backgrounds:"Фон",badges:"Значок",stickers:"Наклейка",effects:"Аура (эффект)",nicknameStyles:"Оформление имени",accessories:"Аксессуар"})[result.type];
 const body=(result.compensation?"":(typeLabel?"Тип: "+typeLabel+" · ":""))+(result.compensation?''')
assert s.count("?v=305")>=26, "missing v305 asset stamps"
s=s.replace("?v=305","?v=306")
p.write_text(s,encoding="utf-8")
w=Path("sw.js")
s=w.read_text(encoding="utf-8")
once('const CACHE_NAME = "matkvest-iphone-v305";','const CACHE_NAME = "matkvest-iphone-v306";')
w.write_text(s,encoding="utf-8")
print("PASS: v306 type labels staged; no economic changes")
