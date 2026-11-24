#!/usr/bin/env python3
"""SHA-fenced v277 -> v278 student profile dialog actions migration.

Only presentation/dispatch is changed; createProfile/selectProfile and all
storage, scores, rewards, route logic stay owned by index.html.
"""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/"index.html",ROOT/"sw.js"
REPO="jokino9212/matkvest"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="d6504e2c24427bfc4d80ed4f303ec824a588a0b4e365593a7123d788679f2757"
if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!=REF:
    raise SystemExit("REFUSING v278 patch outside private test branch")
s=PAGE.read_text(encoding="utf8")
actual=hashlib.sha256(s.encode()).hexdigest()
if actual!=BASE:raise SystemExit("REFUSING unknown index.html source "+actual)
a=s.index("function openProfiles(){")
b=s.index("function selectProfile(i){",a)
section=s[a:b]
def once(old,new):
    global section
    n=section.count(old)
    if n!=1:raise SystemExit("REFUSING v278 ambiguous profile anchor "+str(n)+": "+repr(old[:130]))
    section=section.replace(old,new,1)

once('onclick="selectProfile(${i})"', 'data-profile-action="select" data-profile-index="${i}"')
once('onclick="closeModal()"','data-profile-action="close" aria-label="Закрыть окно"')
once('onclick="openShop()"','data-profile-action="shop"')
once('onclick="openCollection()"','data-profile-action="collection"')
once('onkeydown="if(event.key===\\'Enter\\')createProfile()"','data-profile-enter')
once('onclick="createProfile()"','data-profile-action="create"')
once(
 '''  showVueReport("mountStudentProfiles",model,{close:()=>closeModal(),shop:()=>openShop(),collection:()=>openCollection(),
   edit:()=>openProfileEdit854(),select:index=>selectProfile(index),create:()=>createProfile()},fallback);''',
 '''  let profilesHost=null;
  const isCurrentProfile=()=>profilesHost?.parentNode===modal&&profilesHost.isConnected&&
   overlay.classList.contains("show")&&!mk872Dialog;
  const rawProfileActions={
   close:closeModal,shop:openShop,collection:openCollection,edit:openProfileEdit854,
   select:selectProfile,create:createProfile
  };
  const profileActions=window.MatKvestVueActions?.profileDialogActions?.({
   isCurrent:isCurrentProfile,profileCount:names.length,...rawProfileActions
  })||{
   close:()=>{if(isCurrentProfile())return closeModal()},
   shop:()=>{if(isCurrentProfile())return openShop()},
   collection:()=>{if(isCurrentProfile())return openCollection()},
   edit:()=>{if(isCurrentProfile())return openProfileEdit854()},
   select:index=>{
    if(!isCurrentProfile()||!Number.isInteger(index)||index<0||index>=names.length)return;
    return selectProfile(index);
   },
   create:()=>{if(isCurrentProfile())return createProfile()}
  };
  showVueReport("mountStudentProfiles",model,profileActions,fallback);
  profilesHost=modal.querySelector(":scope > .vue-report");
  profilesHost.addEventListener("click",event=>{
   if(profilesHost.hasAttribute("data-v-app"))return;
   const button=event.target.closest("button[data-profile-action]");
   if(!button||!profilesHost.contains(button))return;
   const action=button.dataset.profileAction;
   if(action==="select")profileActions.select(Number(button.dataset.profileIndex));
   else profileActions[action]?.();
  });
  profilesHost.addEventListener("keydown",event=>{
   if(profilesHost.hasAttribute("data-v-app")||event.key!=="Enter"||
      event.target?.id!=="newProfileName")return;
   event.preventDefault();
   profileActions.create();
  });'''
)
for marker in ('data-profile-action="select"','data-profile-action="close"',
 'data-profile-action="shop"','data-profile-action="collection"',
 'data-profile-action="create"','data-profile-enter',
 'MatKvestVueActions?.profileDialogActions?.','profileActions.select(Number(button.dataset.profileIndex))'):
 if section.count(marker)!=1:raise SystemExit("REFUSING v278 missing/duplicated marker "+marker)
s=s[:a]+section+s[b:]
if s.count("?v=277")<25 or "?v=278" in s:raise SystemExit("REFUSING unknown HTML asset versions")
s=s.replace("?v=277","?v=278")
if "?v=277" in s:raise SystemExit("REFUSING mixed assets")
worker=WORKER.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v277";'
new='const CACHE_NAME = "matkvest-iphone-v278";'
if worker.count(old)!=1 or new in worker:raise SystemExit("REFUSING unknown SW cache version")
PAGE.write_text(s,encoding="utf8")
WORKER.write_text(worker.replace(old,new,1),encoding="utf8")
print("PASS_V278_SHA_FENCED_PROFILE_DIALOG",hashlib.sha256(s.encode()).hexdigest())
