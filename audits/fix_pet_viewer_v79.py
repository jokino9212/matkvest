#!/usr/bin/env python3
"""Targeted v8.78 pet viewer repair. Refuse to patch unexpected upstream."""
from pathlib import Path
import hashlib

html_path=Path("index.html")
sw_path=Path("sw.js")
s=html_path.read_text(encoding="utf-8")
before=hashlib.sha256(html_path.read_bytes()).hexdigest()
EXPECTED="862df88a21fe6ab90721f3f294d2ab2ad42dade15fd7dc107c5a1a2caffa8e73"
if before != EXPECTED:
    raise SystemExit(f"Refusing patch: unexpected index.html SHA256 {before}")
def replace_once(old,new):
    global s
    n=s.count(old)
    if n != 1: raise SystemExit(f"Expected one match, got {n}: {old[:90]}")
    s=s.replace(old,new,1)
replace_once(".mk30-visual .pet-mini{width:21%!important;height:21%!important;right:-8px!important;bottom:-8px!important;font-size:22px!important}", """.mk30-visual.mk30-avatar .pet-mini{width:21%!important;height:21%!important;right:-8px!important;bottom:-8px!important;font-size:22px!important}
/* A pet thumbnail in its own zoom must not inherit the avatar's 21% overlay badge size. */
.mk30-visual.mk30-pet>.pet-mini,
.mk30-visual.mk30-pet>.study-pet,
.mk30-visual.mk30-pet>.mk19g-pet-icon,
.mk30-visual.mk30-pet>.mk19g-pet-art,
.mk30-visual.mk30-pet>.mk872-col-art{
 width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
 max-width:100%!important;max-height:100%!important;
 display:grid!important;place-items:center!important;
 font-size:clamp(88px,25vw,175px)!important;line-height:1!important;
 position:relative!important;inset:auto!important;transform:none!important;margin:0!important;
 overflow:visible!important;
}
.mk30-visual.mk30-pet>*>.emoji-fallback-img,
.mk30-visual.mk30-pet>*>img{width:85%!important;height:85%!important;max-width:85%!important;max-height:85%!important;object-fit:contain!important}
.mk30-visual.mk30-pet .stack-badge{font-size:.34em}""")
replace_once("""const row=orig.closest('.leader-identity');
  const name=orig.closest('.mk868-final-hero-card,.shop-card,.mk19g-pet-choice')?.querySelector('strong,.shop-name');
  title.textContent=name?.textContent?.trim()||img?.alt?.trim()||(item.kind==='pet'?'Питомец':'Аватар');""", """const name=orig.closest('.mk868-final-hero-card,.shop-card,.mk19g-pet-choice')?.querySelector('strong,.shop-name')
    ||orig.closest('.mk19g-pet-panel')?.querySelector('.mk19g-pet-name');
  const petFromCatalog=item.kind==='pet' ? SHOP_CATALOG.pets.find(p=>p.id!=='pet_none'&&
    (p.icon===orig.innerHTML||p.icon===orig.textContent.trim())) : null;
  title.textContent=item.kind==='pet'
    ? (name?.textContent?.trim()||petFromCatalog?.name||'Питомец')
    : (name?.textContent?.trim()||img?.alt?.trim()||'Аватар');""")
html_path.write_text(s,encoding="utf-8",newline="")
new_hash=hashlib.sha256(html_path.read_bytes()).hexdigest()
sw=sw_path.read_text(encoding="utf-8")
assert sw.count("matkvest-iphone-v78")==1
assert sw.count(EXPECTED)==1
sw=sw.replace("matkvest-iphone-v78","matkvest-iphone-v79").replace(EXPECTED,new_hash)
sw_path.write_text(sw,encoding="utf-8",newline="")
assert new_hash in sw_path.read_text(encoding="utf-8")
assert s.count("A pet thumbnail in its own zoom")==1
assert s.count("const petFromCatalog=item.kind==='pet'")==1
print(f"PATCH_PASS {before} -> {new_hash} (PWA cache v79)")
