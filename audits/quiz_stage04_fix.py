"""Stage04: fix pet zoom viewer event propagation + Android browser Back safely."""
from pathlib import Path
import hashlib,re
h=Path('index.html'); w=Path('sw.js')
s=h.read_text('utf8')
tag='<script id="mk30-artwork-viewer-script">'
assert s.count(tag)==1, 'Expected exactly one pet viewer'
# Document capture runs BEFORE the viewer click handler. Treat viewer clicks
# as internal child-dialog actions rather than top-level training navigation.
exit_old="""document.addEventListener('click',event=>{
 if(mk872Dialog)return;
 if(!mk872HasActiveLearning())return;"""
exit_new="""document.addEventListener('click',event=>{
 if(mk872Dialog)return;
 if(event.target?.closest?.('#mk872AvatarViewer'))return;
 if(!mk872HasActiveLearning())return;"""
assert s.count(exit_old)+s.count(exit_new)==1,'Unexpected training click interception layout'
s=s.replace(exit_old,exit_new,1)

prefix,after=s.split(tag,1)
body,suffix=after.split('</script>',1)
assert 'const popup=document.getElementById' in body
old=''' let previousFocus=null;
 function select(node){'''
new=''' let previousFocus=null;
 let pendingViewerPop=false;
 function select(node){'''
assert body.count(old)+body.count(new)==1, 'Unknown viewer state layout'
body=body.replace(old,new,1)
old="""  closeButton.focus({preventScroll:true});
 }
 function close(){"""
new="""  closeButton.focus({preventScroll:true});
  if(!history.state?.__mk30PetViewer){
   try{history.pushState({...history.state,__mk30PetViewer:true},'')}catch(e){}
  }
 }
 function close(){"""
assert body.count(old)+body.count(new)==1, 'Unknown viewer opening layout'
body=body.replace(old,new,1)
old="""  previousFocus=null;
 }
 window.addEventListener('click',e=>{"""
new="""  previousFocus=null;
  if(history.state?.__mk30PetViewer){
   pendingViewerPop=true;
   try{history.back()}catch(e){pendingViewerPop=false}
  }
 }
 // Capture on the zoom surface prevents old avatar handlers or training-exit
 // handlers from treating a close/backdrop click as closing the learning modal.
 popup.addEventListener('click',e=>{
  if(e.target===popup||e.target===closeButton||closeButton.contains(e.target)){
   e.preventDefault();e.stopImmediatePropagation();close();
  }
 },true);
 // Browser/Android Back closes only zoom, never the underlying active attempt.
 // Capturing popstate must run before the pre-existing route restoration handler.
 window.addEventListener('popstate',e=>{
  if(!popup.classList.contains('mk872-open')&&!pendingViewerPop)return;
  e.stopImmediatePropagation();
  pendingViewerPop=false;
  if(popup.classList.contains('mk872-open'))close();
 },true);
 window.addEventListener('click',e=>{"""
assert body.count(old)+body.count(new)==1, 'Unknown viewer closing layout'
body=body.replace(old,new,1)
# Existing popstate route listener is earlier; intercept via its late-bound function.
route_needle=" window.addEventListener('click',e=>{"
route_insert=" // Existing history handler was registered before this viewer. Its late-bound\n // route function must not destroy the active quiz when consuming the zoom entry.\n const previousRestoreRoute=mk854RestoreRoute;\n mk854RestoreRoute=function(route){\n  if(popup.classList.contains('mk872-open')||pendingViewerPop){\n   pendingViewerPop=false;\n   if(popup.classList.contains('mk872-open'))close();\n   return;\n  }\n  return previousRestoreRoute.apply(this,arguments);\n };\n window.addEventListener('click',e=>{"
assert body.count(route_needle)==1,'Missing pet viewer click handler'
body=body.replace(route_needle,route_insert,1)
updated=prefix+tag+body+'</script>'+suffix
if updated!=s:
 h.write_text(updated,'utf8');print('STAGE04_VIEWER_FIX_APPLIED')
else: print('STAGE04_ALREADY_PATCHED')
digest=hashlib.sha256(h.read_bytes()).hexdigest()
sw=w.read_text('utf8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,sw))==1,'Service-worker build hash changed'
sw=re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,'utf8')
print('STAGE04_HTML_SHA256',digest)
