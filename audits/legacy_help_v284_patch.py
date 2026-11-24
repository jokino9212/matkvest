#!/usr/bin/env python3
"""SHA-locked v283 to v284 isolated help-popup guard. No route or reward changes."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW,ACTIONS=ROOT/"index.html",ROOT/"sw.js",ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="7d05de5da14684d128f0ac25eaf43a96b676195c15d935f96c6f56cfd4e62789"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING v284 patch outside isolated test branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:
 raise SystemExit("REFUSING v284 source HTML SHA mismatch")
a=s.index("function mk872HelpOpen(key,source){")
b=s.index("\ndocument.addEventListener('keydown',function(e){",a)
chunk=s[a:b]
def swap(old,new):
 global chunk
 if chunk.count(old)!=1:
  raise SystemExit("REFUSING unknown help source anchor "+repr(old)+" count "+str(chunk.count(old)))
 chunk=chunk.replace(old,new,1)
swap(" const layer=document.createElement('div');layer.id='mk872-help-layer';layer.className='mk872-help-layer';",
""" const layer=document.createElement('div');layer.id='mk872-help-layer';layer.className='mk872-help-layer';
 const isCurrent=()=>layer.isConnected&&document.getElementById('mk872-help-layer')===layer;
 const helpActions=window.MatKvestVueActions?.helpDialogActions?.({
  isCurrent,close:mk872HelpClose
 })||{close:()=>{if(isCurrent())return mk872HelpClose()}};""")
swap('aria-label="Закрыть справку" onclick="mk872HelpClose()"','aria-label="Закрыть справку" data-mk872-help-close')
swap(" layer.addEventListener('click',e=>{if(e.target===layer)mk872HelpClose()});",
""" layer.addEventListener('click',e=>{
  if(!isCurrent())return;
  if(e.target===layer)return helpActions.close();
  // Only native HTML fallback uses delegated close; Vue dispatches its own action.
  if(!host.hasAttribute('data-v-app')&&
     e.target.closest('[data-mk872-help-close]'))helpActions.close();
 });""")
swap("module.mountStoreHelpDialog(host,topic,{close:mk872HelpClose});focus();",
     "module.mountStoreHelpDialog(host,topic,{close:helpActions.close});focus();")
s=s[:a]+chunk+s[b:]
if s.count("?v=283")<25 or "?v=284" in s:raise SystemExit("REFUSING unexpected HTML asset versions")
s=s.replace("?v=283","?v=284")
ad=ACTIONS.read_text(encoding="utf8")
needle="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
if ad.count(needle)!=1 or "function helpDialogActions(" in ad:
 raise SystemExit("REFUSING unexpected actions module")
ad=ad.replace(needle,'''  // V284: help popup close gesture belongs only to its originating visible layer.
  // The global help overlay, keyboard and focus rules stay in the legacy UI.
  function helpDialogActions({isCurrent,close}){
    return {close:()=>{if(isCurrent())return close()}};
  }
'''+needle,1)
needle="teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions};"
if ad.count(needle)!=1:raise SystemExit("REFUSING unknown v283 export table")
ad=ad.replace(needle,"teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions,helpDialogActions};")
sw=SW.read_text(encoding="utf8")
needle='const CACHE_NAME = "matkvest-iphone-v283";'
if sw.count(needle)!=1 or 'matkvest-iphone-v284' in sw:raise SystemExit("REFUSING unknown SW cache")
sw=sw.replace(needle,'const CACHE_NAME = "matkvest-iphone-v284";')
for marker,count in (('MatKvestVueActions?.helpDialogActions?.',1),
 ('data-mk872-help-close',2),('module.mountStoreHelpDialog(host,topic,{close:helpActions.close})',1)):
 if s.count(marker)!=count:raise SystemExit("REFUSING marker count "+marker+" "+str(s.count(marker)))
PAGE.write_text(s,encoding="utf8")
SW.write_text(sw,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
print("PASS_V284_SHA_FENCED_HELP_ACTIONS",hashlib.sha256(s.encode()).hexdigest())
