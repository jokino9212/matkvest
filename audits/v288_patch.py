#!/usr/bin/env python3
from pathlib import Path
import os, hashlib
root=Path(__file__).resolve().parent.parent
page=root/"index.html"; sw=root/"sw.js"; adapter=root/"assets/ui/legacy-vue-actions.js"
assert os.environ.get("GITHUB_REPOSITORY")=="jokino9212/matkvest"
assert os.environ.get("GITHUB_REF")=="refs/heads/refactor/route-vue-actions-from-7c14ce9"
s=page.read_text(encoding="utf8")
assert hashlib.sha256(s.encode()).hexdigest()=="6a0004d4589d0bf5a8d299aa492c460e87c668db7c9484df1da92b490b992109"
def replace(old,new):
 global s
 n=s.count(old)
 if n!=1: raise SystemExit("REFUSING anchor "+repr(old[:150])+" count "+str(n))
 s=s.replace(old,new,1)

# Shared UI guard; no persistence or economy logic.
replace('function showStoreSurface(topic,{beforePreview="",content}){','''function mk288GuardStoreActions(isCurrent,actions){
 return window.MatKvestVueActions?.storeSurfaceActions?.({isCurrent,actions})||
  Object.fromEntries(Object.entries(actions).map(([key,fn])=>[key,(...args)=>{if(isCurrent())return fn(...args)}]));
}
function showStoreSurface(topic,{beforePreview="",content}){''')
replace('aria-label="Справка: ${topic}" onclick="mk872HelpOpen(\'${topic}\',this)">ⓘ</button></h2><button type="button" class="x" aria-label="Закрыть окно" onclick="closeModal()">','aria-label="Справка: ${topic}">ⓘ</button></h2><button type="button" class="x" aria-label="Закрыть окно">')
replace(' const heading=modal.querySelector(":scope > [data-store-heading]"),card=modal.querySelector(":scope > [data-store-preview]");\n loadVueModule().then(module=>{',''' const heading=modal.querySelector(":scope > [data-store-heading]"),card=modal.querySelector(":scope > [data-store-preview]");
 const profileId=state.profileId;
 const isCurrent=()=>heading?.parentNode===modal&&heading.isConnected&&overlay.classList.contains("show")&&state.profileId===profileId;
 const headerActions=mk288GuardStoreActions(isCurrent,{close:closeModal,help:button=>mk872HelpOpen(topic,button)});
 heading.addEventListener("click",event=>{
  if(!isCurrent()||heading.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button");
  if(!button||!heading.contains(button)||button.disabled)return;
  if(button.matches(".x"))return headerActions.close();
  if(button.matches(".mk872-help-trigger"))return headerActions.help(button);
 });
 loadVueModule().then(module=>{''')
replace('if(heading.parentNode!==modal||card.parentNode!==modal||!overlay.classList.contains("show"))return;','if(!isCurrent()||card.parentNode!==modal)return;')
replace('module.mountStoreSurfaceHeader(heading,{title,topic},{close:closeModal,help:button=>mk872HelpOpen(topic,button)});','module.mountStoreSurfaceHeader(heading,{title,topic},headerActions);')
# Catalog action is bound to the exact live catalog/profile and permitted model actions.
replace('onclick="runShopCardAction(\'${type}\',\'${card.id}\',\'${action}\')"','data-mk288-shop-id="${esc(card.id)}" data-mk288-shop-action="${esc(action)}"')
replace(''' const host=modal.querySelector(":scope > .shop-grid");
 loadVueModule().then(module=>{
  if(host?.parentNode===modal&&overlay.classList.contains("show"))module.mountStoreCatalog(host,{cards},{
   run:(action,id)=>runShopCardAction(category,id,action)
  });
 }).catch(()=>{ /* Keep the existing store controls usable when Vue cannot load. */ });''',''' const host=modal.querySelector(":scope > .shop-grid"),profileId=state.profileId;
 const isCurrent=()=>host?.parentNode===modal&&host.isConnected&&overlay.classList.contains("show")&&state.profileId===profileId;
 const catalogActions=mk288GuardStoreActions(isCurrent,{run:(action,id)=>{
  const card=cards.find(item=>item.id===id);
  if(!card||!action||!(card.button.action===action||(action==="sell"&&card.sale?.allowed)))return;
  return runShopCardAction(category,id,action);
 }});
 host?.addEventListener("click",event=>{
  if(!isCurrent()||host.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-mk288-shop-action]");
  if(button&&host.contains(button)&&!button.disabled)return catalogActions.run(button.dataset.mk288ShopAction,button.dataset.mk288ShopId);
 });
 loadVueModule().then(module=>{
  if(isCurrent())module.mountStoreCatalog(host,{cards},catalogActions);
 }).catch(()=>{ /* Keep the existing store controls usable when Vue cannot load. */ });''')
# Navigation remains valid across section rerenders, not across modal/profile replacements.
replace(' aria-controls="mk872CollectionContent" onclick="mk872CollectionSwitch(\'${section.id}\')"',' aria-controls="mk872CollectionContent"')
replace(''' const tabs=mk872CollectionNavigationModel(type,archive.count);
 if(!navigation.hasAttribute("data-v-app")){''',''' const tabs=mk872CollectionNavigationModel(type,archive.count),profileId=state.profileId;
 const isCurrent=()=>root.parentNode===modal&&root.isConnected&&navigation.parentNode===root&&overlay.classList.contains("show")&&state.profileId===profileId;
 const navigationActions=mk288GuardStoreActions(isCurrent,{select:id=>{
  if(tabs.sections.some(section=>section.id===id))return mk872CollectionSwitch(id);
 }});
 navigation.onclick=event=>{
  if(!isCurrent()||navigation.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-mk872-collection-tab]");
  if(button&&navigation.contains(button)&&!button.disabled)return navigationActions.select(button.dataset.mk872CollectionTab);
 };
 if(!navigation.hasAttribute("data-v-app")){''')
replace('module.mountCollectionNavigation(navigation,tabs,{select:mk872CollectionSwitch});','module.mountCollectionNavigation(navigation,tabs,navigationActions);')
assert s.count("?v=287")>=25 and "?v=288" not in s
s=s.replace("?v=287","?v=288")
a=adapter.read_text(encoding="utf8")
old="  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,"
assert a.count(old)==1
a=a.replace(old,'''  // V288: UI callbacks belong to the originating live store surface/profile.
  function storeSurfaceActions({isCurrent,actions}){
    return Object.fromEntries(Object.entries(actions).map(([key,fn])=>[
      key,(...args)=>{if(isCurrent())return fn(...args)}
    ]));
  }
'''+old)
assert a.count("saleDialogDispatchActions};")==1
a=a.replace("saleDialogDispatchActions};","saleDialogDispatchActions,storeSurfaceActions};")
w=sw.read_text(encoding="utf8")
assert w.count('const CACHE_NAME = "matkvest-iphone-v287";')==1
w=w.replace('const CACHE_NAME = "matkvest-iphone-v287";','const CACHE_NAME = "matkvest-iphone-v288";')
page.write_text(s,encoding="utf8"); adapter.write_text(a,encoding="utf8"); sw.write_text(w,encoding="utf8")
print("PASS_V288_PATCH",hashlib.sha256(s.encode()).hexdigest())
