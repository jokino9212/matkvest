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
