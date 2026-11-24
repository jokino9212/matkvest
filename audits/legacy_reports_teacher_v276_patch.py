#!/usr/bin/env python3
"""Guard UI-only Vue report and teacher actions without touching business logic.

Only the exact verified 7.6 MB v275 index is eligible, only in the test branch.
"""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,SW=ROOT/"index.html",ROOT/"sw.js"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO="jokino9212/matkvest"
BASE="18791a0eadd7c29c925852455319ef58f2aca5c8b53e1d5c448029a20e238cf0"
if os.environ.get("GITHUB_REF")!=REF or os.environ.get("GITHUB_REPOSITORY")!=REPO:
    raise SystemExit("REFUSING v276 patch outside dedicated test branch")
source=PAGE.read_text(encoding="utf-8")
actual=hashlib.sha256(source.encode("utf-8")).hexdigest()
if actual!=BASE:raise SystemExit("REFUSING unknown v275 HTML base "+actual)
def once(a,b):
    global source
    n=source.count(a)
    if n!=1:raise SystemExit("REFUSING non-unique v276 anchor "+str(n)+": "+repr(a[:110]))
    source=source.replace(a,b,1)

# The existing teacher async mount guard must also protect its Vue actions.
once(
 ''' const revision=++knowledgeMapRevision;
 const isCurrent=()=>host.parentNode===mainView&&revision===knowledgeMapRevision&&teacherUnlocked;
 loadVueModule().then(module=>{
  if(isCurrent())module[mount](host,model,actions);''',
 ''' const revision=++knowledgeMapRevision;
 const isCurrent=()=>host.parentNode===mainView&&revision===knowledgeMapRevision&&teacherUnlocked;
 const teacherActions=window.MatKvestVueActions?.teacherViewActions?.({
  isCurrent,actions
 })||Object.fromEntries(Object.entries(actions||{}).map(([key,fn])=>[
  key,typeof fn==="function"?(...args)=>{if(isCurrent())return fn.apply(actions,args)}:fn
 ]));
 // Keep HTML fallback and its native Enter/Space controls. Drop stale
 // keyboard/click/form events on a replaced teacher view.
 host.__mk276Current=isCurrent;
 if(!host.__mk276Guard){
  host.__mk276Guard=true;
  for(const kind of ["click","keydown","input","change","submit"]){
   host.addEventListener(kind,event=>{
    if(host.__mk276Current?.())return;
    event.preventDefault();
    event.stopImmediatePropagation();
   },true);
  }
 }
 loadVueModule().then(module=>{
  if(isCurrent())module[mount](host,model,teacherActions);'''
)

# A default report's inline close handler could affect an unrelated overlay.
# Delegate it to the active report, without changing supplied fallback markup.
old_fallback=' const fallback=content||'+chr(96)+'<div class="mtop"><h2>'+chr(36)+'{esc(model.title)}</h2><button type="button" class="x" onclick="closeModal()">×</button></div><p class="knowledge-empty" role="status">Загружаем…</p>'+chr(96)+';'
new_fallback=' const fallback=content||'+chr(96)+'<div class="mtop"><h2>'+chr(36)+'{esc(model.title)}</h2><button type="button" class="x" aria-label="Закрыть окно" data-report-close>×</button></div><p class="knowledge-empty" role="status">Загружаем…</p>'+chr(96)+';'
once(old_fallback,new_fallback)
once(
 ''' const isOpen=()=>host.parentNode===modal&&overlay.classList.contains("show");
 let mounting=false;
 loadVueModule().then(module=>{''',
 ''' const isOpen=()=>host.parentNode===modal&&host.isConnected&&overlay.classList.contains("show");
 const isCurrentReport=()=>isOpen()&&!mk872Dialog;
 const reportActions=window.MatKvestVueActions?.reportSurfaceActions?.({
  isCurrent:isCurrentReport,actions
 })||Object.fromEntries(Object.entries(actions||{}).map(([key,fn])=>[
  key,typeof fn==="function"?(...args)=>{
   if(isCurrentReport())return fn.apply(actions,args)
  }:fn
 ]));
 // Block interactions on a detached report host without breaking native
 // Enter/Space and existing HTML fallback while the host is current.
 for(const kind of ["click","keydown","input","change","submit"]){
  host.addEventListener(kind,event=>{
   if(isOpen())return;
   event.preventDefault();
   event.stopImmediatePropagation();
  },true);
 }
 host.addEventListener("click",event=>{
  if(!isCurrentReport()||!event.target.closest("[data-report-close]"))return;
  if(typeof reportActions.close==="function")reportActions.close();
  else closeModal();
 });
 let mounting=false;
 loadVueModule().then(module=>{'''
)
once(
 '''  module[mount](host,model,actions);
 }).catch(()=>{''',
 '''  module[mount](host,model,reportActions);
 }).catch(()=>{'''
)
for marker in (
 "MatKvestVueActions?.teacherViewActions?.",
 "MatKvestVueActions?.reportSurfaceActions?.",
 "MatKvestVueActions?.schoolAttemptFrameActions?.",
 "MatKvestVueActions?.attemptJournalActions?.",
 "MatKvestVueActions?.schoolColumnActions?.",
 'host.__mk276Current=isCurrent;',
 'module[mount](host,model,teacherActions);',
 'module[mount](host,model,reportActions);',
):
    if source.count(marker)!=1:raise SystemExit("REFUSING missing/duplicated v276 marker: "+marker)
if source.count("?v=275")<25 or "?v=276" in source:raise SystemExit("REFUSING asset version mismatch")
source=source.replace("?v=275","?v=276")
if "?v=275" in source:raise SystemExit("REFUSING mixed asset versions")
worker=SW.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v275";'
new='const CACHE_NAME = "matkvest-iphone-v276";'
if worker.count(old)!=1 or new in worker:raise SystemExit("REFUSING unknown PWA baseline")
PAGE.write_text(source,encoding="utf8")
SW.write_text(worker.replace(old,new,1),encoding="utf8")
print("PASS_V276_REPORT_TEACHER_FENCED_PATCH",hashlib.sha256(source.encode()).hexdigest())
