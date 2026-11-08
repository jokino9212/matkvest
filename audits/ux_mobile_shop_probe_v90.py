from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
terms=["Магазин наград","shop-head","shop-tabs","shop-tab","shopToolbar","shopNav","openShop(","function openShop","renderShop","shop-help","shop-help-btn","help-shop"]
for term in terms:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print("\nTERM",repr(term),"COUNT",len(matches))
 for m in matches[-4:]:
  i=m.start()
  print("OFFSET",i,"SNIPPET",repr(s[max(0,i-650):i+980]))
print("HEAD END",s.find("</head>"),"TOTAL",len(s))

for term in ['function shopTabs','shopTabs=function','shopTabs =','class="shop-tabs"','.shop-tabs{','.shop-tab{','.mk872-help-heading{','.mk872-help-trigger{','.mtop{']:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print('DEEPTERM',repr(term),'COUNT',len(matches))
 for m in matches[:3]:
  i=m.start();print('DEEP SNIPPET',repr(s[max(0,i-400):i+1500]))
