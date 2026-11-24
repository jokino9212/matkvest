#!/usr/bin/env python3
"""Strict v281 -> v282 quest-back UI bridge only; reward logic untouched."""
from pathlib import Path
import hashlib, os
ROOT=Path(__file__).resolve().parent.parent
PAGE=ROOT/"index.html"
WORKER=ROOT/"sw.js"
ACTIONS=ROOT/"assets/ui/legacy-vue-actions.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="b4d818184329a2c45c2de702479c0f9389846132d9ddaa82337b3af1609c82ab"
if os.getenv("GITHUB_REPOSITORY")!="jokino9212/matkvest" or os.getenv("GITHUB_REF")!=REF:
 raise SystemExit("REFUSING v282 changes outside isolated PR branch")
s=PAGE.read_text(encoding="utf8")
if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise SystemExit("REFUSING source HTML SHA mismatch")
a=s.index("function questBoardFallback(model,historyOpen=false){")
b=s.index("\nfunction migratePersonalizationProfiles()",a)
chunk=s[a:b]
def swap(old,new):
 global chunk
 if chunk.count(old)!=1:raise SystemExit("REFUSING nonunique quest bridge anchor "+repr(old)+" "+str(chunk.count(old)))
 chunk=chunk.replace(old,new,1)
swap('class="home-back-btn" onclick="renderHome()"','class="home-back-btn" data-quest-action="back"')
swap(' const isCurrent=()=>host.parentNode===mainView&&knowledgeMapRevision===revision;',
''' const isCurrent=()=>host.parentNode===mainView&&host.isConnected&&knowledgeMapRevision===revision;
 const backActions=window.MatKvestVueActions?.questBackActions?.({
  isCurrent,back:renderHome
 })||{back:()=>{if(isCurrent())return renderHome()}};
 // Native delegated fallback preserves Enter/Space; a detached host cannot act.
 host.addEventListener("click",event=>{
  if(host.hasAttribute("data-v-app")||!isCurrent())return;
  const button=event.target.closest('button[data-quest-action="back"]');
  if(button&&host.contains(button))backActions.back();
 });''')
swap('module.mountQuestBoard(host,model,{back:()=>renderHome(),claim:claimQuest,replace:requestQuestReroll});',
     'module.mountQuestBoard(host,model,{back:backActions.back,claim:claimQuest,replace:requestQuestReroll});')
s=s[:a]+chunk+s[b:]
if s.count("?v=281")<25 or "?v=282" in s:raise SystemExit("REFUSING unexpected HTML asset version")
s=s.replace("?v=281","?v=282")
ad=ACTIONS.read_text(encoding="utf8")
old='  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,'
if ad.count(old)!=1 or "questBackActions" in ad:raise SystemExit("REFUSING unknown actions adapter")
ad=ad.replace(old,'''  // V282: quest navigation-only UI action. Claim/reroll and all rewards remain legacy-owned.
  function questBackActions({isCurrent,back}){
    return {back:()=>{if(isCurrent())return back()}};
  }
'''+old,1)
old='teacherDashboardActions,storeTabActions,achievementFilterActions};'
if ad.count(old)!=1:raise SystemExit("REFUSING unknown export list")
ad=ad.replace(old,'teacherDashboardActions,storeTabActions,achievementFilterActions,questBackActions};')
sw=WORKER.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v281";'
if sw.count(old)!=1 or 'matkvest-iphone-v282' in sw:raise SystemExit("REFUSING unknown service worker")
sw=sw.replace(old,'const CACHE_NAME = "matkvest-iphone-v282";')
for key in ('data-quest-action="back"','MatKvestVueActions?.questBackActions?.',
            'back:backActions.back,claim:claimQuest,replace:requestQuestReroll'):
 if s.count(key)!=1:raise SystemExit("REFUSING missing v282 marker "+key)
PAGE.write_text(s,encoding="utf8")
ACTIONS.write_text(ad,encoding="utf8")
WORKER.write_text(sw,encoding="utf8")
print("PASS_V282_QUEST_BACK_PATCH",hashlib.sha256(s.encode()).hexdigest())
