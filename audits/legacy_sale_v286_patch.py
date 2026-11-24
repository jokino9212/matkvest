#!/usr/bin/env python3
"""SHA-fenced v285 -> v286: sale dialog close gesture only, never mutate sale/economy actions."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW,ACTIONS=ROOT/"index.html",ROOT/"sw.js",ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="e75007dd6af16c07d4b678a14f2156344b203e64c3fb23a819ffea2907739b1a"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING v286 patch outside test branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise SystemExit("REFUSING v286 source SHA mismatch")
a=s.index("function mk865SaleOverlay(){")
b=s.index("function mk865SaleButton(",a)
chunk=s[a:b]
def exact(old,new):
 global chunk
 n=chunk.count(old)
 if n!=1:raise SystemExit("REFUSING unexpected sale UI anchor "+repr(old)+" count "+str(n))
 chunk=chunk.replace(old,new,1)
exact('aria-label="Закрыть окно продажи" onclick="mk865CloseSaleOverlay()"',
      'aria-label="Закрыть окно продажи" data-mk865-sale-close')
exact(
' if(!el.classList.contains("show"))mk865SaleReturnFocus=document.activeElement;',
''' if(!el.classList.contains("show"))mk865SaleReturnFocus=document.activeElement;
 // Only the live host/model may dispatch its close action. This guard never
 // authorizes any run/choose sale operations; they remain legacy-owned.
 const isCurrent=()=>host.parentNode===box&&host.isConnected&&
  el.classList.contains("show")&&mk865CurrentSaleDialog===model;
 const closeActions=window.MatKvestVueActions?.saleDialogCloseActions?.({
  isCurrent,close:mk865CloseSaleOverlay
 })||{close:()=>{if(isCurrent())return mk865CloseSaleOverlay()}};
 host.addEventListener("click",event=>{
  if(!isCurrent()||host.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-mk865-sale-close]");
  if(button&&host.contains(button))closeActions.close();
 });''')
exact(
'module.mountStoreSaleDialog(host,model,{close:mk865CloseSaleOverlay,run:mk865RunSaleButton,choose:mk865RunSaleTopic});',
'module.mountStoreSaleDialog(host,model,{close:closeActions.close,run:mk865RunSaleButton,choose:mk865RunSaleTopic});')
s=s[:a]+chunk+s[b:]
if s.count("?v=285")<25 or "?v=286" in s:raise SystemExit("REFUSING unexpected source versions")
s=s.replace("?v=285","?v=286")
ad=ACTIONS.read_text(encoding="utf8")
needle="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
if ad.count(needle)!=1 or "function saleDialogCloseActions(" in ad:
 raise SystemExit("REFUSING action module anchor")
ad=ad.replace(needle,'''  // V286: guard informational sale dialog close only. Never wrap sale, refund
  // mission, choice, training or transaction callbacks.
  function saleDialogCloseActions({isCurrent,close}){
    return {close:()=>{if(isCurrent())return close()}};
  }
'''+needle,1)
needle="teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions,artworkViewerActions};"
if ad.count(needle)!=1:raise SystemExit("REFUSING v285 action exports")
ad=ad.replace(needle,"teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions,artworkViewerActions,saleDialogCloseActions};")
sw=SW.read_text(encoding="utf8")
needle='const CACHE_NAME = "matkvest-iphone-v285";'
if sw.count(needle)!=1 or 'matkvest-iphone-v286' in sw:raise SystemExit("REFUSING unexpected PWA cache")
sw=sw.replace(needle,'const CACHE_NAME = "matkvest-iphone-v286";')
for mark,n in (
 ('MatKvestVueActions?.saleDialogCloseActions?.',1),
 ('data-mk865-sale-close',2),
 ('close:closeActions.close,run:mk865RunSaleButton,choose:mk865RunSaleTopic',1)):
 if s.count(mark)!=n:raise SystemExit("REFUSING v286 patched UI marker "+mark+" "+str(s.count(mark)))
PAGE.write_text(s,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
SW.write_text(sw,encoding="utf8")
print("PASS_V286_SHA_FENCED_SALE_CLOSE",hashlib.sha256(s.encode()).hexdigest())
