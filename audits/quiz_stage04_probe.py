from pathlib import Path
import re
s=Path("index.html").read_text("utf-8")
needles=[
 "function closeModal(", "function openPet", "function showPet", "function closePet",
 "petPreview","pet-preview","petZoom","petLightbox","petFullscreen","pet-fullscreen",
 "function mk872RequestExit(", "function mk872TrainingDialog(", "function mk872HasActiveLearning(",
 "function openAvatar","function closeAvatar","image-viewer",
 "popstate","Escape","keydown","pet-modal","petModal","petViewer"
]
for needle in needles:
 found=[x.start() for x in re.finditer(re.escape(needle),s,re.I)]
 print("STAGE04_MATCH",needle,len(found),found[:16])
 for pos in found[:5]:
  print("STAGE04_SOURCE",needle,"AT",pos,repr(s[max(0,pos-260):pos+1350]))

for a,b in [(4969000,4980500),(5063500,5067600),(5231750,5234300),(6398000,6401000)]:
 print("STAGE04_DETAIL",a,b,repr(s[a:b]))
for k in ["mk872AvatarViewer","mk872-open","mk872CloseViewer","viewer.addEventListener","function openZoom","imageZoom","asset-viewer","pet-card"]:
 print("STAGE04_EXTRA",k,[m.start() for m in re.finditer(re.escape(k),s,re.I)][:20])

for a,b in [(6393500,6400550),(5007800,5008980)]:
 print("STAGE04_TARGET",a,b,repr(s[a:b]))
