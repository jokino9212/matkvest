#!/usr/bin/env python3
"""SHA-fenced v286 -> v287: sale UI row/topic dispatch tied to live host/model."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW,ACTIONS=ROOT/"index.html",ROOT/"sw.js",ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="0e4f66c7f3deb7bf297c14929deb0f25251c42ca561ab7a6cdce0b77d36051a9"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING v287 patch outside isolated test branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise SystemExit("REFUSING v287 unexpected source HTML SHA")
a=s.index("function mk865RunSaleButton(")
b=s.index("function mk865CloseSaleOverlay(",a)
chunk=s[a:b]
def exact(old,new):
 global chunk
 n=chunk.count(old)
 if n!=1:raise SystemExit("REFUSING unknown sale UI source anchor "+repr(old)+" count "+str(n))
 chunk=chunk.replace(old,new,1)
exact("onclick=\"mk865RunSaleTopic('+index+')\"", "data-mk865-sale-topic=\"'+index+'\"")
exact("onclick=\"mk865RunSaleButton('+index+','+column+')\"",
      "data-mk865-sale-row=\"'+index+'\" data-mk865-sale-column=\"'+column+'\"")
exact(''' const closeActions=window.MatKvestVueActions?.saleDialogCloseActions?.({
  isCurrent,close:mk865CloseSaleOverlay
 })||{close:()=>{if(isCurrent())return mk865CloseSaleOverlay()}};
 host.addEventListener("click",event=>{
  if(!isCurrent()||host.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-mk865-sale-close]");
  if(button&&host.contains(button))closeActions.close();
 });''',
''' const closeActions=window.MatKvestVueActions?.saleDialogCloseActions?.({
  isCurrent,close:mk865CloseSaleOverlay
 })||{close:()=>{if(isCurrent())return mk865CloseSaleOverlay()}};
 // v287: a detached button/topic from an earlier sale dialog must never
 // dispatch the currently visible dialog's action (including a sale/refund).
 const dispatchActions=window.MatKvestVueActions?.saleDialogDispatchActions?.({
  isCurrent,run:mk865RunSaleButton,choose:mk865RunSaleTopic
 })||{
  run:(row,column)=>{if(isCurrent())return mk865RunSaleButton(row,column)},
  choose:index=>{if(isCurrent())return mk865RunSaleTopic(index)}
 };
 host.addEventListener("click",event=>{
  if(!isCurrent()||host.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button");
  if(!button||!host.contains(button)||button.disabled)return;
  if(button.matches("[data-mk865-sale-close]"))return closeActions.close();
  if(button.hasAttribute("data-mk865-sale-row")&&button.hasAttribute("data-mk865-sale-column"))
   return dispatchActions.run(Number(button.dataset.mk865SaleRow),Number(button.dataset.mk865SaleColumn));
  if(button.hasAttribute("data-mk865-sale-topic"))
   return dispatchActions.choose(Number(button.dataset.mk865SaleTopic));
 });''')
exact("module.mountStoreSaleDialog(host,model,{close:closeActions.close,run:mk865RunSaleButton,choose:mk865RunSaleTopic});",
      "module.mountStoreSaleDialog(host,model,{close:closeActions.close,run:dispatchActions.run,choose:dispatchActions.choose});")
s=s[:a]+chunk+s[b:]
if s.count("?v=286")<25 or "?v=287" in s:raise SystemExit("REFUSING unexpected asset versions")
s=s.replace("?v=286","?v=287")
ad=ACTIONS.read_text(encoding="utf8")
needle="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
if ad.count(needle)!=1 or "function saleDialogDispatchActions(" in ad:raise SystemExit("REFUSING action module anchor")
ad=ad.replace(needle,'''  // V287: checks only current visible sale host/model before forwarding existing
  // row/topic callbacks. Does not implement or modify economy transactions.
  function saleDialogDispatchActions({isCurrent,run,choose}){
    return {
      run:(row,column)=>{if(isCurrent())return run(row,column)},
      choose:index=>{if(isCurrent())return choose(index)}
    };
  }
'''+needle,1)
needle="teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions,artworkViewerActions,saleDialogCloseActions};"
if ad.count(needle)!=1:raise SystemExit("REFUSING v286 actions export anchor")
ad=ad.replace(needle,"teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions,artworkViewerActions,saleDialogCloseActions,saleDialogDispatchActions};")
sw=SW.read_text(encoding="utf8")
needle='const CACHE_NAME = "matkvest-iphone-v286";'
if sw.count(needle)!=1 or "matkvest-iphone-v287" in sw:raise SystemExit("REFUSING unexpected SW cache")
sw=sw.replace(needle,'const CACHE_NAME = "matkvest-iphone-v287";')
for marker,n in (
 ("MatKvestVueActions?.saleDialogDispatchActions?.",1),
 ("data-mk865-sale-row",2),
 ("data-mk865-sale-topic",2),
 ("run:dispatchActions.run,choose:dispatchActions.choose",1)):
 if s.count(marker)!=n:raise SystemExit("REFUSING patched sale UI marker "+repr(marker)+" count "+str(s.count(marker)))
PAGE.write_text(s,encoding="utf8")
SW.write_text(sw,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
print("PASS_V287_SHA_FENCED_SALE_DISPATCH",hashlib.sha256(s.encode()).hexdigest())
