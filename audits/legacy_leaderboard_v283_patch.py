#!/usr/bin/env python3
"""SHA-fenced v282 to v283 leaderboard help and close UI-only migration."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW,ACTIONS=ROOT/"index.html",ROOT/"sw.js",ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="1138afcfade8185d1aae5fd0b15162637c2e0143573a47f4385647fe368d6ea9"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING outside isolated v283 test branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:
 raise SystemExit("REFUSING unexpected source HTML")
start=s.index("function openLeaderboard(){")
end=s.index("\nlet currentGrade=null;",start)
chunk=s[start:end]
def one(old,new):
 global chunk
 if chunk.count(old)!=1:raise SystemExit("REFUSING leaderboard anchor "+repr(old)+" count "+str(chunk.count(old)))
 chunk=chunk.replace(old,new,1)
one('showVueReport("mountLeaderboard",{title,rows},{close:()=>closeModal(),help:opener=>mk872HelpOpen("leader",opener)},',
'''let leaderboardHost=null;
 const isCurrent=()=>leaderboardHost?.parentNode===modal&&leaderboardHost.isConnected&&
  overlay.classList.contains("show")&&!mk872Dialog;
 const leaderboardActions=window.MatKvestVueActions?.leaderboardDialogActions?.({
  isCurrent,close:closeModal,help:opener=>mk872HelpOpen("leader",opener)
 })||{
  close:()=>{if(isCurrent())return closeModal()},
  help:opener=>{if(isCurrent())return mk872HelpOpen("leader",opener)}
 };
 showVueReport("mountLeaderboard",{title,rows},leaderboardActions,''')
one('onclick="mk872HelpOpen('+chr(39)+'leader'+chr(39)+',this)"','data-leaderboard-action="help"')
one('class="x" onclick="closeModal()"','class="x" data-leaderboard-action="close"')
old='   <tbody>'+chr(36)+'{fallback}</tbody></table></div>'+chr(96)+');'
new='''   <tbody>'''+chr(36)+'''{fallback}</tbody></table></div>'''+chr(96)+''');
 leaderboardHost=modal.firstElementChild;
 // Native fallback click and keyboard; Vue keeps its existing component events.
 leaderboardHost.addEventListener("click",event=>{
  if(!isCurrent()||leaderboardHost.hasAttribute("data-v-app"))return;
  const button=event.target.closest('button[data-leaderboard-action]');
  if(!button||!leaderboardHost.contains(button))return;
  if(button.dataset.leaderboardAction==="help")leaderboardActions.help(button);
  else if(button.dataset.leaderboardAction==="close")leaderboardActions.close();
 });'''
one(old,new)
s=s[:start]+chunk+s[end:]
if s.count("?v=282")<25 or "?v=283" in s:raise SystemExit("REFUSING unexpected version")
s=s.replace("?v=282","?v=283")
ad=ACTIONS.read_text(encoding="utf8")
old="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
if ad.count(old)!=1 or "leaderboardDialogActions" in ad:raise SystemExit("REFUSING adapter mismatch")
ad=ad.replace(old,'''  // V283: leaderboard help/close UI only, without profile or reward changes.
  function leaderboardDialogActions({isCurrent,close,help}){
    return {
      close:()=>{if(isCurrent())return close()},
      help:opener=>{if(isCurrent())return help(opener)}
    };
  }
'''+old,1)
old="teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions};"
if ad.count(old)!=1:raise SystemExit("REFUSING exports mismatch")
ad=ad.replace(old,"teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions,leaderboardDialogActions};")
sw=SW.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v282";'
if sw.count(old)!=1 or 'matkvest-iphone-v283' in sw:raise SystemExit("REFUSING service worker mismatch")
sw=sw.replace(old,'const CACHE_NAME = "matkvest-iphone-v283";')
for k,n in (('MatKvestVueActions?.leaderboardDialogActions?.',1),('data-leaderboard-action="help"',1),('data-leaderboard-action="close"',1),('leaderboardActions.help(button)',1),('leaderboardActions.close()',1)):
 if s.count(k)!=n:raise SystemExit("REFUSING marker "+k+" count "+str(s.count(k)))
PAGE.write_text(s,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
SW.write_text(sw,encoding="utf8")
print("PASS_V283_SHA_FENCED_LEADERBOARD_ACTIONS",hashlib.sha256(s.encode()).hexdigest())
