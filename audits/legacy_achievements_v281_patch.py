#!/usr/bin/env python3
"""SHA-fenced v280->v281 achievement UI filters; no reward/controller changes."""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/"index.html",ROOT/"sw.js"
REPO="jokino9212/matkvest"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="7c5d047f7150f976958fa630d279e9796fe3c4b936ae3d4f0b1f0acef4653e4b"
if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!=REF:
    raise SystemExit("REFUSING v281 patch outside isolated test branch")
s=PAGE.read_text(encoding="utf8")
actual=hashlib.sha256(s.encode()).hexdigest()
if actual!=BASE:raise SystemExit("REFUSING unknown source HTML "+actual)
dollar=lambda value:value.replace("@{",chr(36)+"{")
a=s.index("function achievementCatalogHtml(model){")
b=s.index("function openAchievements(){",a)
chunk=s[a:b]
def swap(old,new,count=1):
    global chunk
    old,new=dollar(old),dollar(new)
    n=chunk.count(old)
    if n!=count:raise SystemExit("REFUSING achievement HTML anchor "+repr(old)+" "+str(n))
    chunk=chunk.replace(old,new)
swap('onclick="achievementSetView(' + chr(39) + '@{id}' + chr(39) + ')"',
     'data-achievement-action="view" data-achievement-value="@{esc(id)}"')
swap('onchange="achievementSetCategory(this.value)"','data-achievement-action="category"')
swap('onchange="achievementSetSort(this.value)"','data-achievement-action="sort"')
s=s[:a]+chunk+s[b:]
start=s.index("function openAchievements(){")
end=s.index("\nfunction grantAchievementCatalogRewards(",start)
old=s[start:end]
for marker in ('if(checkAchievementRewards().length)persistSilently()',
               'module.mountAchievementCatalog(host,model,actions)',
               'achievementViewFilter=value;refresh()',
               'achievementCategoryFilter=value;refresh()',
               'achievementSortMode=value;refresh()'):
    if old.count(marker)!=1:raise SystemExit("REFUSING old Vue bridge "+marker)
replacement=dollar('''function openAchievements(){
 normalizeShop();
 if(checkAchievementRewards().length)persistSilently();
 const model=achievementCatalogModel();
 show(`<div class="mtop"><h2>🏆 Достижения</h2><button class="x" onclick="closeModal()">×</button></div>
  @{shopPreview()}@{shopTabs("achievements")}<div class="achievement-screen">@{achievementCatalogHtml(model)}</div>`);
 const host=modal.querySelector(".achievement-screen");
 const isCurrent=()=>host?.parentNode===modal&&host.isConnected&&
  overlay.classList.contains("show")&&!mk872Dialog;
 // Each rerender revokes callbacks from the preceding Vue tree.
 let revision=0,vueModule=null,filterActions=null;
 const changeView=value=>{achievementViewFilter=value;refresh()};
 const changeCategory=value=>{achievementCategoryFilter=value;refresh()};
 const changeSort=value=>{achievementSortMode=value;refresh()};
 const callbacks={view:changeView,category:changeCategory,sort:changeSort};
 const bindActions=fresh=>{
  const mine=++revision;
  const live=()=>isCurrent()&&mine===revision;
  const allowed={
   view:fresh.views.map(item=>item.id),
   category:fresh.categories.map(item=>item.id),
   sort:fresh.sorts.map(item=>item.id)
  };
  filterActions=window.MatKvestVueActions?.achievementFilterActions?.({
   isCurrent:live,views:allowed.view,categories:allowed.category,
   sorts:allowed.sort,actions:callbacks
  })||Object.fromEntries(Object.entries(allowed).map(([key,ids])=>[
   key,value=>{
    if(live()&&typeof value==="string"&&ids.includes(value))
     return callbacks[key](value);
   }
  ]));
 };
 const refresh=()=>{
  if(!isCurrent())return;
  const next=achievementCatalogModel();
  const focused=host.contains(document.activeElement)?document.activeElement:null;
  const kind=focused?.dataset.achievementAction;
  const value=focused?.dataset.achievementValue;
  bindActions(next);
  if(vueModule){
   vueModule.mountAchievementCatalog(host,next,filterActions);
   return;
  }
  host.innerHTML=achievementCatalogHtml(next);
  const target=kind==="view"
   ?[...host.querySelectorAll('button[data-achievement-action="view"]')]
      .find(button=>button.dataset.achievementValue===value)
   :kind==="category"||kind==="sort"
     ?host.querySelector('select[data-achievement-action="'+kind+'"]'):null;
  target?.focus({preventScroll:true});
 };
 bindActions(model);
 host.addEventListener("click",event=>{
  if(host.hasAttribute("data-v-app"))return;
  const button=event.target.closest('button[data-achievement-action="view"]');
  if(!button||!host.contains(button))return;
  filterActions?.view(button.dataset.achievementValue);
 });
 host.addEventListener("change",event=>{
  if(host.hasAttribute("data-v-app"))return;
  const control=event.target;
  if(!host.contains(control))return;
  const kind=control?.dataset.achievementAction;
  if(kind==="category"||kind==="sort")filterActions?.[kind](control.value);
 });
 loadVueModule().then(module=>{
  if(!isCurrent())return;
  vueModule=module;
  refresh();
 }).catch(()=>{
  if(!isCurrent())return;
  vueModule=null;
  refresh();
 });
}
''')
s=s[:start]+replacement+s[end:]
for marker in ('MatKvestVueActions?.achievementFilterActions?.',
               'data-achievement-action="view"',
               'data-achievement-action="category"',
               'data-achievement-action="sort"',
               'host.addEventListener("click",event=>{'):
    if marker not in s:raise SystemExit("REFUSING missing v281 marker "+marker)
if s.count("?v=280")<25 or "?v=281" in s:
    raise SystemExit("REFUSING unexpected HTML asset versions")
s=s.replace("?v=280","?v=281")
sw=WORKER.read_text(encoding="utf8")
old='const CACHE_NAME = "matkvest-iphone-v280";'
new='const CACHE_NAME = "matkvest-iphone-v281";'
if sw.count(old)!=1 or new in sw:raise SystemExit("REFUSING unknown SW cache")
PAGE.write_text(s,encoding="utf8")
WORKER.write_text(sw.replace(old,new,1),encoding="utf8")
print("PASS_V281_SHA_FENCED_ACHIEVEMENT_FILTERS",hashlib.sha256(s.encode()).hexdigest())
