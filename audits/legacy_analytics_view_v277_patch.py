#!/usr/bin/env python3
"""SHA-fenced generic analytics view Vue action dispatch and fallback guards."""
from pathlib import Path
import os,hashlib
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/"index.html",ROOT/"sw.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO="jokino9212/matkvest"
BASE="e89c5c30eec7cbc72f2ff542027b3ccd7273e9d4c019d441270d1bb59ed830c5"
if os.environ.get("GITHUB_REF")!=REF or os.environ.get("GITHUB_REPOSITORY")!=REPO:
    raise SystemExit("REFUSING v277 patch outside isolated test branch")
s=PAGE.read_text(encoding="utf8")
actual=hashlib.sha256(s.encode()).hexdigest()
if actual!=BASE:raise SystemExit("REFUSING unknown v276 HTML SHA "+actual)
def once(old,new):
    global s
    count=s.count(old)
    if count!=1:raise SystemExit("REFUSING ambiguous v277 anchor "+str(count)+": "+repr(old[:150]))
    s=s.replace(old,new,1)
once(
 """ const revision=++knowledgeMapRevision;
 loadVueModule().then(module=>{
  if(host.parentNode!==mainView||revision!==knowledgeMapRevision)return;
  module[mount](host,model,actions);
 }).catch(()=>{
  if(host.parentNode!==mainView||revision!==knowledgeMapRevision)return;""",
 """ const revision=++knowledgeMapRevision;
 const isCurrent=()=>host.parentNode===mainView&&host.isConnected&&revision===knowledgeMapRevision;
 const viewActions=window.MatKvestVueActions?.analyticsViewActions?.({
  isCurrent,actions
 })||Object.fromEntries(Object.entries(actions||{}).map(([key,fn])=>[
  key,typeof fn==="function"?(...args)=>{if(isCurrent())return fn.apply(actions,args)}:fn
 ]));
 loadVueModule().then(module=>{
  if(!isCurrent())return;
  module[mount](host,model,viewActions);
 }).catch(()=>{
  if(!isCurrent())return;"""
)
once(
 """  back.onclick=actions.back;
  host.querySelector(".knowledge-empty button").onclick=retry;
 });""",
 """  back.onclick=viewActions.back;
  host.querySelector(".knowledge-empty button").onclick=()=>{if(isCurrent())return retry()};
 });"""
)
for token in (
 "MatKvestVueActions?.analyticsViewActions?.",
 "MatKvestVueActions?.teacherViewActions?.",
 "MatKvestVueActions?.reportSurfaceActions?.",
 "module[mount](host,model,viewActions);",
 "back.onclick=viewActions.back;",
):
 if s.count(token)!=1:raise SystemExit("REFUSING v277 marker not unique: "+token)
if s.count("?v=276")<25 or "?v=277" in s:raise SystemExit("REFUSING unexpected asset version")
s=s.replace("?v=276","?v=277")
if "?v=276" in s:raise SystemExit("REFUSING mixed asset versions")
worker=WORKER.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v276";'
new='const CACHE_NAME = "matkvest-iphone-v277";'
if worker.count(old)!=1 or new in worker:raise SystemExit("REFUSING cache version mismatch")
PAGE.write_text(s,encoding="utf8")
WORKER.write_text(worker.replace(old,new,1),encoding="utf8")
print("PASS_V277_ANALYTICS_SHA_FENCED_PATCH",hashlib.sha256(s.encode()).hexdigest())
