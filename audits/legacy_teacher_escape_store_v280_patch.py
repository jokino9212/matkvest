#!/usr/bin/env python3
"""SHA-fenced v279->v280: teacher modal back fix and safe shop-tab UI delegation."""
from pathlib import Path
import hashlib,os,re
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/'index.html',ROOT/'sw.js'
REPO='jokino9212/matkvest'
REF='refs/heads/refactor/route-vue-actions-from-7c14ce9'
BASE='a9d3033e7b1b65351b3d0755e45a0be1f46f6acbc7432221f036fb8ed10cf38b'
if os.environ.get('GITHUB_REPOSITORY')!=REPO or os.environ.get('GITHUB_REF')!=REF:
    raise SystemExit('REFUSING v280 patch outside isolated test branch')
s=PAGE.read_text(encoding='utf8')
if hashlib.sha256(s.encode()).hexdigest()!=BASE:
    raise SystemExit('REFUSING unknown v279 HTML SHA')
def once(old,new):
    global s
    count=s.count(old)
    if count!=1:raise SystemExit('REFUSING nonunique v280 anchor '+repr(old[:110])+' count='+str(count))
    s=s.replace(old,new,1)
# Normal header profiles keep the original route push. Teacher-only modal
# should not push the route "profiles" on top of the ephemeral dashboard.
# The alias is the *original* profile renderer captured by legacy history.
if s.count('MK854_CORE_OPEN_PROFILES')<2:raise SystemExit('REFUSING missing original profile renderer')
once('profiles:()=>openProfiles(),backup:()=>openDataManager()',
     'profiles:()=>MK854_CORE_OPEN_PROFILES(),backup:()=>openDataManager()')
# Keep openStoreTab(), purchase, inventory and rewards entirely in legacy JS.
bridge='''let mk280StoreTabActions=null;
function mk280EnsureStoreTabHandlers(){
 const isCurrent=()=>overlay.classList.contains("show")&&!!modal.querySelector(".shop-tabs");
 mk280StoreTabActions=window.MatKvestVueActions?.storeTabActions?.({
  isCurrent,categories:storeTabs.map(tab=>tab.id),
  actions:{select:openStoreTab}
 })||{
  select:category=>{
   if(isCurrent()&&storeTabs.some(tab=>tab.id===category))return openStoreTab(category)
  }
 };
 // A single delegated handler serves every fresh shop/collection rendering,
 // keeping Enter/Space and select native and detached nodes inert.
 if(modal.__mk280StoreTabsBound)return;
 modal.__mk280StoreTabsBound=true;
 modal.addEventListener("click",event=>{
  const button=event.target.closest("button.shop-tab[data-store-category]");
  if(!button||!modal.contains(button))return;
  mk280StoreTabActions?.select(button.dataset.storeCategory);
 });
 modal.addEventListener("change",event=>{
  const select=event.target.closest("select.mk-ux91-category-select");
  if(!select||!modal.contains(select))return;
  mk280StoreTabActions?.select(select.value);
 });
}
'''
once('function shopTabs(active){',bridge+'function shopTabs(active){\n mk280EnsureStoreTabHandlers();')
# Existing UX-91 Vue mount keeps callback closures on detached tab nodes.
# Route Vue and native HTML gestures through a per-host live/whitelisted adapter.
once(
 '''   const model={tabs:storeTabs,active:host.dataset.storeActive,picker};
   loadVueModule().then(module=>{''',
 '''   const model={tabs:storeTabs,active:host.dataset.storeActive,picker};
   const isCurrentTabHost=()=>host.parentNode===modal&&host.isConnected&&
    overlay.classList.contains("show");
   const liveStoreActions=window.MatKvestVueActions?.storeTabActions?.({
    isCurrent:isCurrentTabHost,categories:storeTabs.map(tab=>tab.id),
    actions:{select:openStoreTab}
   })||{
    select:id=>{
     if(isCurrentTabHost()&&storeTabs.some(tab=>tab.id===id))return openStoreTab(id)
    }
   };
   loadVueModule().then(module=>{'''
)
once(
 '''   module.mountStoreTabs(host,model,{open:(id,fromPicker)=>{
     openStoreTab(id);''',
 '''   module.mountStoreTabs(host,model,{open:(id,fromPicker)=>{
     if(!isCurrentTabHost())return;
     liveStoreActions.select(id);'''
)
a=s.index('function shopTabs(active){')
b=s.index('let shopRarityFilter=',a)
part=s[a:b]
part,n=re.subn(r'onclick="openStoreTab\(.+?\)"','',part)
if n!=1:raise SystemExit('REFUSING unexpected shop tab onclick count '+str(n))
if part.count('onchange="openStoreTab(this.value)"')!=1:raise SystemExit('REFUSING shop select onchange count')
part=part.replace('onchange="openStoreTab(this.value)"','',1)
if 'onclick="openStoreTab(' in part or 'onchange="openStoreTab(' in part:
    raise SystemExit('REFUSING remaining inline navigation in shopTabs')
s=s[:a]+part+s[b:]
for marker in (
    'profiles:()=>MK854_CORE_OPEN_PROFILES(),backup:()=>openDataManager()',
    'MatKvestVueActions?.storeTabActions?.',
    'modal.__mk280StoreTabsBound=true',
    'mk280StoreTabActions?.select(button.dataset.storeCategory)',
    'mk280StoreTabActions?.select(select.value)',
    'MatKvestVueActions?.teacherDashboardActions?.',
):
 if s.count(marker)!=(2 if marker=='MatKvestVueActions?.storeTabActions?.' else 1):
  raise SystemExit('REFUSING missing or repeated marker '+marker+' / '+str(s.count(marker)))
if s.count('?v=279')<25 or '?v=280' in s:raise SystemExit('REFUSING unexpected HTML asset versions')
s=s.replace('?v=279','?v=280')
if '?v=279' in s:raise SystemExit('REFUSING mixed asset versions')
sw=WORKER.read_text(encoding='utf8')
old='const CACHE_NAME = "matkvest-iphone-v279";'
new='const CACHE_NAME = "matkvest-iphone-v280";'
if sw.count(old)!=1 or new in sw:raise SystemExit('REFUSING unknown service worker cache')
PAGE.write_text(s,encoding='utf8')
WORKER.write_text(sw.replace(old,new,1),encoding='utf8')
print('PASS_V280_SHA_FENCED_TEACHER_ESCAPE_STORE_TAB',hashlib.sha256(s.encode()).hexdigest())
