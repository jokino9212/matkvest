from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
a=s.index(' if(raw==="written_subtract"){')
b=s.index(' if(raw==="written_multiply"){',a)
section=s[a:b]
assert section.count('d===1&&borrows<1')==1
assert section.count('[452,178]')==1
section=section.replace('d===1&&borrows<1','d===1&&borrows!==1')
section=section.replace('[452,178]','[452,137]')
s=s[:a]+section+s[b:]
p.write_text(s,encoding="utf-8")
print("Corrected training borrow count and fallback; source bytes",len(s))
