#!/usr/bin/env python3
"""Fail-closed v269 -> v270 HTML patch. Only the isolated GitHub Actions test branch."""
from pathlib import Path
import hashlib
import os

BRANCH = "refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO = "jokino9212/matkvest"
BASE_SHA256 = "388d92e221053d785e63522a4032d52225a866079ec29493eaaf91987a2690b1"
if os.getenv("GITHUB_REF") != BRANCH or os.getenv("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("REFUSING to edit giant HTML outside isolated test-branch CI")
root = Path(__file__).resolve().parent.parent
page = root / "index.html"
worker = root / "sw.js"
source = page.read_text(encoding="utf-8")
actual = hashlib.sha256(source.encode("utf-8")).hexdigest()
if actual != BASE_SHA256:
    raise SystemExit("REFUSING unknown index.html v269 baseline: " + actual)

def replace_one(old, new):
    global source
    n = source.count(old)
    if n != 1:
        raise SystemExit("REFUSING ambiguous index.html anchor (" + str(n) + "): " + old[:105])
    source = source.replace(old, new, 1)

# Move route selection into a pure external dispatcher while the entire original
# inline implementation stays untouched as the fallback when the module is blocked.
replace_one(
    ' mk854RunRestoring(()=>{\n  MK854_CORE_CLOSE_MODAL();\n  if(r.screen==="home")',
    ' mk854RunRestoring(()=>{\n  MK854_CORE_CLOSE_MODAL();\n'
    '   const core=window.MatKvestRouteCore;\n'
    '   if(core&&typeof core.dispatchRoute==="function")return core.dispatchRoute(r,{\n'
    '    home:()=>MK854_CORE_RENDER_HOME(),\n'
    '    grade:x=>MK854_CORE_OPEN_GRADE(Number(x.grade)),\n'
    '    topic:x=>mk854RenderTopicCore(x),\n'
    '    trainer:x=>{\n'
    '     const setup=history.state?.quickSetup;\n'
    '     const selection=setup?.profileId===state.profileId&&setup?.trainerId===x.trainerId?setup.selection:null;\n'
    '     return MK854_CORE_OPEN_QUICK(x.trainerId,x.planRun,selection,savedQuickResult(x.trainerId));\n'
    '    },\n'
    '    store:x=>openShop(x.category||"avatars"),\n'
    '    leaderboard:()=>MK854_CORE_OPEN_LEADERBOARD(),\n'
    '    quests:()=>renderQuestBoard(),\n'
    '    profiles:()=>{MK854_CORE_OPEN_PROFILES();mk854AfterProfilesOpen();},\n'
    '    other:x=>mk854ExtraRouteRenderer(x)\n'
    '   });\n'
    '   if(r.screen==="home")'
)
# Lifecycle-sensitive mount actions are created afresh for every Vue render.
# No cached/stale callback closures. Inline action shapes remain the fallback.
replace_one(
    '  try{module.mountHomeDashboard(host,model,{run:runHomeAction})}catch(error){mainView.replaceChildren(...fallback);throw error}',
    '   const vueActions=window.MatKvestRouteCore?.homeVueActions?.(runHomeAction)||{run:runHomeAction};\n'
    '   try{module.mountHomeDashboard(host,model,vueActions)}catch(error){mainView.replaceChildren(...fallback);throw error}'
)
replace_one(
    '  module.mountTrainingPlanReturn(host,{note},{returnToPlan:returnToTrainingPlan});',
    '   const vueActions=window.MatKvestRouteCore?.trainingPlanReturnVueActions?.(returnToTrainingPlan)||{returnToPlan:returnToTrainingPlan};\n'
    '   module.mountTrainingPlanReturn(host,{note},vueActions);'
)
defer_old = ' if(["store","chest","quests","profiles"].includes(route.screen)||([1,2,3,4,5,6,7,8].includes(Number(route.grade))&&(route.screen==="grade"||route.screen==="topic"))){'
replace_one(
    defer_old,
    ' const core=window.MatKvestRouteCore;\n'
    ' const defer=core&&typeof core.shouldDeferRestore==="function"?core.shouldDeferRestore(route):'
    '(["store","chest","quests","profiles"].includes(route.screen)||'
    '([1,2,3,4,5,6,7,8].includes(Number(route.grade))&&(route.screen==="grade"||route.screen==="topic")));\n'
    ' if(defer){'
)
count = source.count("?v=269")
if count != 27:
    raise SystemExit("REFUSING unexpected v269 script count " + str(count))
source = source.replace("?v=269", "?v=270")
if "?v=269" in source or source.count("legacy-navigation-core.js?v=270") != 1:
    raise SystemExit("REFUSING broken route module version")
if source.count('core.dispatchRoute(r,{') != 1 or source.count('core.shouldDeferRestore(route)') != 1:
    raise SystemExit("REFUSING missing route dispatch/restore integration")
previous = worker.read_text(encoding="utf-8")
old_name = 'const CACHE_NAME = "matkvest-iphone-v269";'
new_name = 'const CACHE_NAME = "matkvest-iphone-v270";'
if previous.count(old_name) != 1 or new_name in previous:
    raise SystemExit("REFUSING unknown service-worker cache")
# Perform all validation before writing any files. SW hashes are synced separately.
page.write_text(source, encoding="utf-8")
worker.write_text(previous.replace(old_name, new_name, 1), encoding="utf-8")
print("PASS_PATCHED_TEST_ONLY_V270", hashlib.sha256(source.encode("utf-8")).hexdigest())
