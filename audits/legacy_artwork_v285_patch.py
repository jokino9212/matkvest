#!/usr/bin/env python3
"""SHA-fenced v284 to v285: artwork viewer close actions scoped to their own host."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW,ACTIONS=ROOT/"index.html",ROOT/"sw.js",ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="eed085c9fd5a97d00cb3ba40f64287f33a951502f5f377631410cd09cc772416"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING v285 patch outside isolated test branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise SystemExit("REFUSING v285 unexpected v284 source HTML SHA")
a=s.index('<script id="mk30-artwork-viewer-script">')
b=s.index("</script>",a)
chunk=s[a:b]
def replace_exact(old,new):
 global chunk
 if chunk.count(old)!=1:raise SystemExit("REFUSING unexpected artwork marker "+repr(old)+" count "+str(chunk.count(old)))
 chunk=chunk.replace(old,new,1)
replace_exact(
"  host.className='mk872-viewer-content';",
"""  host.className='mk872-viewer-content';
  // Only the current live viewer may consume its own close button. The shared
  // Escape/Back handlers below still close the active popup as before.
  const isCurrent=()=>host.parentNode===popup&&host.isConnected&&
    popup.classList.contains('mk872-open');
  const viewerActions=window.MatKvestVueActions?.artworkViewerActions?.({
   isCurrent,close
  })||{close:()=>{if(isCurrent())return close()}};
""")
replace_exact("   host.querySelector('.mk872-viewer-close').onclick=close;",
              "   host.querySelector('.mk872-viewer-close').onclick=viewerActions.close;")
replace_exact("try{module.mountArtworkViewer(host,model,{close})}",
              "try{module.mountArtworkViewer(host,model,{close:viewerActions.close})}")
s=s[:a]+chunk+s[b:]
if s.count("?v=284")<25 or "?v=285" in s:raise SystemExit("REFUSING unexpected asset version count")
s=s.replace("?v=284","?v=285")
ad=ACTIONS.read_text(encoding="utf8")
needle="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
if ad.count(needle)!=1 or "function artworkViewerActions(" in ad:raise SystemExit("REFUSING v284 action module shape")
ad=ad.replace(needle,'''  // V285: old detached artwork close callbacks cannot dismiss a later preview.
  // Browser Back, Escape, and focused artwork controls remain legacy-owned.
  function artworkViewerActions({isCurrent,close}){
    return {close:()=>{if(isCurrent())return close()}};
  }
'''+needle,1)
old="teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions};"
if ad.count(old)!=1:raise SystemExit("REFUSING v284 action exports")
ad=ad.replace(old,"teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions,artworkViewerActions};")
sw=SW.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v284";'
if sw.count(old)!=1 or 'matkvest-iphone-v285' in sw:raise SystemExit("REFUSING v284 service worker cache")
sw=sw.replace(old,'const CACHE_NAME = "matkvest-iphone-v285";')
for marker,count in (
 ("MatKvestVueActions?.artworkViewerActions?.",1),
 ("onclick=viewerActions.close",1),
 ("mountArtworkViewer(host,model,{close:viewerActions.close})",1)):
 if s.count(marker)!=count:raise SystemExit("REFUSING unexpected patch marker "+marker+" "+str(s.count(marker)))
PAGE.write_text(s,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
SW.write_text(sw,encoding="utf8")
print("PASS_V285_SHA_FENCED_ARTWORK_CLOSE",hashlib.sha256(s.encode()).hexdigest())
