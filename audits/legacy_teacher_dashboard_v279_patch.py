#!/usr/bin/env python3
"""SHA-fenced v278->v279 teacher dashboard Vue + native fallback UI-only actions."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/"index.html",ROOT/"sw.js"
REPO="jokino9212/matkvest"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="9b6c8d68c94d178a69e5bad9403f7482f5dd7ebca7a2bffc081e3ee25e17c62e"
if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!=REF:
    raise SystemExit("REFUSING v279 patch outside test branch")
s=PAGE.read_text(encoding="utf8")
sha=hashlib.sha256(s.encode()).hexdigest()
if sha!=BASE:raise SystemExit("REFUSING unknown v278 HTML "+sha)
def section_replace(start,end,old,new,count=1):
    global s
    a=s.index(start)
    b=s.index(end,a+len(start))
    segment=s[a:b]
    if segment.count(old)!=count:
        raise SystemExit("REFUSING ambiguous v279 section anchor "+repr(start)+" / "+repr(old[:120])+" count "+str(segment.count(old)))
    s=s[:a]+segment.replace(old,new)+s[b:]
def once(old,new):
    global s
    if s.count(old)!=1:
        raise SystemExit("REFUSING ambiguous v279 anchor "+repr(old[:130])+" count "+str(s.count(old)))
    s=s.replace(old,new,1)
# Limit inline replacements strictly to this dashboard (do not disturb other teacher reports).
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'onclick="closeTeacherMode()"','data-teacher-dashboard-action="close"',2)
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'onclick="openProfiles()"','data-teacher-dashboard-action="profiles"',2)
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'onclick="openDataManager()"','data-teacher-dashboard-action="backup"')
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'oninput="teacherSetSearch(this.value)"','data-teacher-dashboard-input="search"')
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'onchange="teacherSetSort(this.value)"','data-teacher-dashboard-input="sort"')
# The shared teacherChoicesHtml is also used for reports: scope filter rendering here.
section_replace("function teacherDashboardHtml(","function renderTeacherView(",
    'teacherChoicesHtml(model.filters,model.filter,"teacherSetFilter")',
    'model.filters.map(({id,label})=>'+chr(96)+
    '<button type="button" class="teacher-filter ${id===model.filter?"active":""}" aria-pressed="${id===model.filter}" data-teacher-dashboard-action="filter" data-filter-id="${esc(id)}">${esc(label)}</button>'+chr(96)+').join("")')
section_replace("function teacherRosterCardHtml(","function teacherDashboardHtml(",
    'onclick="openTeacherStudentDetailById(this.dataset.profileId)"',
    'data-teacher-dashboard-action="open"')
once(
 ''' const teacherActions=window.MatKvestVueActions?.teacherViewActions?.({
  isCurrent,actions
 })||Object.fromEntries(Object.entries(actions||{}).map(([key,fn])=>[
  key,typeof fn==="function"?(...args)=>{if(isCurrent())return fn.apply(actions,args)}:fn
 ]));''',
 ''' const isDashboard=id==="teacherDashboardVue";
 const dashboardBounds=isDashboard?{
  filters:model.filters.map(item=>item.id),sorts:model.sorts.map(item=>item.id),
  profileIds:model.rows.map(item=>item.profileId)
 }:null;
 const fallbackTeacherActions=()=>Object.fromEntries(Object.entries(actions||{}).map(([key,fn])=>[
  key,typeof fn==="function"?(...args)=>{
   if(!isCurrent())return;
   if(isDashboard){
    if(key==="sort"&&!dashboardBounds.sorts.includes(args[0]))return;
    if(key==="filter"&&!dashboardBounds.filters.includes(args[0]))return;
    if(key==="open"&&!dashboardBounds.profileIds.includes(args[0]))return;
   }
   return fn.apply(actions,args);
  }:fn
 ]));
 const teacherActions=isDashboard
  ?(window.MatKvestVueActions?.teacherDashboardActions?.({
    isCurrent,actions,...dashboardBounds
   })||fallbackTeacherActions())
  :(window.MatKvestVueActions?.teacherViewActions?.({isCurrent,actions})
    ||fallbackTeacherActions());
 if(isDashboard){
  // Keep one delegated listener on the host through rerenders; update only
  // active callbacks. Vue handles its own events while data-v-app is present.
  host.__mk279DashboardActions=teacherActions;
  if(!host.__mk279DashboardDelegated){
   host.__mk279DashboardDelegated=true;
   host.addEventListener("click",event=>{
    if(host.hasAttribute("data-v-app"))return;
    const button=event.target.closest("button[data-teacher-dashboard-action]");
    if(!button||!host.contains(button))return;
    const key=button.dataset.teacherDashboardAction,active=host.__mk279DashboardActions;
    if(key==="filter")active?.filter(button.dataset.filterId);
    else if(key==="open")active?.open(button.dataset.profileId);
    else active?.[key]?.();
   });
   host.addEventListener("input",event=>{
    if(host.hasAttribute("data-v-app")||
       event.target?.dataset.teacherDashboardInput!=="search")return;
    host.__mk279DashboardActions?.search(event.target.value);
   });
   host.addEventListener("change",event=>{
    if(host.hasAttribute("data-v-app")||
       event.target?.dataset.teacherDashboardInput!=="sort")return;
    host.__mk279DashboardActions?.sort(event.target.value);
   });
  }
 }'''
)
for token in ("MatKvestVueActions?.teacherDashboardActions?.",
 'data-teacher-dashboard-action="close"',
 'data-teacher-dashboard-action="open"',
 'data-teacher-dashboard-action="filter"',
 "host.__mk279DashboardDelegated=true",
 "MatKvestVueActions?.analyticsViewActions?.",
 "MatKvestVueActions?.profileDialogActions?."):
 if token not in s:raise SystemExit("REFUSING v279 missing marker "+token)
if s.count("?v=278")<25 or "?v=279" in s:raise SystemExit("REFUSING asset version")
s=s.replace("?v=278","?v=279")
if "?v=278" in s:raise SystemExit("REFUSING mixed asset version")
sw=WORKER.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v278";'
new='const CACHE_NAME = "matkvest-iphone-v279";'
if sw.count(old)!=1 or new in sw:raise SystemExit("REFUSING unknown SW cache")
PAGE.write_text(s,encoding="utf8")
WORKER.write_text(sw.replace(old,new,1),encoding="utf8")
print("PASS_V279_SHA_FENCED_TEACHER_DASHBOARD",hashlib.sha256(s.encode()).hexdigest())
