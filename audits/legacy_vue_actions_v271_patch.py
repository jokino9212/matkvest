#!/usr/bin/env python3
"""Fail-closed giant HTML v270->v271 migration in MatKvest test-branch CI only.

The original actions stay as inline fallbacks; only their Vue-facing adapter
uses a new separately cached module. No backend, main or production changes.
"""
from pathlib import Path
import hashlib
import os

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
WORKER = ROOT / "sw.js"
REF = "refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO = "jokino9212/matkvest"
KNOWN_BASE = "4466259120ab27c79930f317832a4aa9d57549d6bbfd5735523be0ca7b9908f6"
if os.environ.get("GITHUB_REF") != REF or os.environ.get("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("REFUSING v271 patch outside isolated test branch")
source = PAGE.read_text(encoding="utf-8")
actual = hashlib.sha256(source.encode("utf-8")).hexdigest()
if actual != KNOWN_BASE:
    raise SystemExit("REFUSING unknown giant HTML v270 baseline: " + actual)

def replace_one(old, new):
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"REFUSING ambiguous v271 edit anchor ({count}): {old[:115]!r}")
    source = source.replace(old, new, 1)

# Preload before any old inline/controller code; both are optional and retain fallback.
replace_one(
    '<script src="./assets/ui/legacy-navigation-core.js?v=270"></script>',
    '<script src="./assets/ui/legacy-navigation-core.js?v=270"></script>\n'
    '<script src="./assets/ui/legacy-vue-actions.js?v=271"></script>'
)
# Header: preserve all seven original handlers as fallback. Recreate the factory
# on each mount, not only once at initial page load.
replace_one(
    '   const actions={home:()=>mk872BrandGoHome(),profile:()=>openProfiles(),wallet:()=>window.mk19eWallet(),\n'
    '    shop:()=>openShop(),data:()=>openDataManager(),journal:()=>openAttemptJournal(),leaders:()=>openLeaderboard()};\n'
    '   const fallback=[...host.childNodes];',
    '   const fallbackActions={home:()=>mk872BrandGoHome(),profile:()=>openProfiles(),wallet:()=>window.mk19eWallet(),\n'
    '    shop:()=>openShop(),data:()=>openDataManager(),journal:()=>openAttemptJournal(),leaders:()=>openLeaderboard()};\n'
    '   const actions=window.MatKvestVueActions?.headerActions?.(fallbackActions)||fallbackActions;\n'
    '   const fallback=[...host.childNodes];'
)
# Quick setup: leave the complete old action routing intact for absent module.
replace_one(
    ' const actions={\n  run(action){',
    ' const fallbackActions={\n  run(action){'
)
replace_one(
    ' };\n const activeControl=()=>host.contains(document.activeElement)?document.activeElement.dataset.quickSetup:null;',
    ' };\n'
    ' const actions=window.MatKvestVueActions?.quickSetupActions?.({\n'
    '  isCurrent,isBlocked:()=>!!mk872Dialog,\n'
    '  choice:value=>quickMeta(trainerId).config.type!=="multiTables"?quickChooseMode(value):\n'
    '   value==="all"?quickSelectAll():quickToggleTable(Number(value)),\n'
    '  smart:quickChooseSmartMode,start:startQuickTraining,trainAll:quickFallbackAll,home:quickTrainerGoHome\n'
    ' })||fallbackActions;\n'
    ' const activeControl=()=>host.contains(document.activeElement)?document.activeElement.dataset.quickSetup:null;'
)
# Quick result: guard stale results and plan context at click-time.
replace_one(
    ' const actions={\n  again:()=>{if(isCurrent())quickAgain(s.selectedConfig)},\n'
    '  home:()=>{if(isCurrent())mk854Route().planRun?mk872BrandGoHome():quickTrainerGoHome()},\n'
    '  returnToPlan:()=>{if(isCurrent()&&trainingPlanRunContext)returnToTrainingPlan()}\n'
    ' };',
    ' const fallbackActions={\n  again:()=>{if(isCurrent())quickAgain(s.selectedConfig)},\n'
    '  home:()=>{if(isCurrent())mk854Route().planRun?mk872BrandGoHome():quickTrainerGoHome()},\n'
    '  returnToPlan:()=>{if(isCurrent()&&trainingPlanRunContext)returnToTrainingPlan()}\n'
    ' };\n'
    ' const actions=window.MatKvestVueActions?.quickResultActions?.({\n'
    '  isCurrent,selection:s.selectedConfig,again:quickAgain,\n'
    '  home:()=>mk854Route().planRun?mk872BrandGoHome():quickTrainerGoHome(),\n'
    '  hasPlan:()=>!!trainingPlanRunContext,returnToPlan:returnToTrainingPlan\n'
    ' })||fallbackActions;'
)
if source.count("?v=270") != 27:
    raise SystemExit("REFUSING unexpected v270 script-reference count " + str(source.count("?v=270")))
source = source.replace("?v=270", "?v=271")
for marker in ("legacy-vue-actions.js?v=271", "MatKvestVueActions?.headerActions?.",
               "MatKvestVueActions?.quickSetupActions?.", "MatKvestVueActions?.quickResultActions?."):
    if source.count(marker) != 1:
        raise SystemExit("REFUSING incomplete v271 action migration: " + marker)
if "?v=270" in source:
    raise SystemExit("REFUSING mixed v270/v271 asset references")
sw = WORKER.read_text(encoding="utf-8")
old = 'const CACHE_NAME = "matkvest-iphone-v270";'
new = 'const CACHE_NAME = "matkvest-iphone-v271";'
if sw.count(old) != 1 or new in sw:
    raise SystemExit("REFUSING unexpected worker cache version")
# Only after every anchor and worker check succeeds do we write either file.
PAGE.write_text(source, encoding="utf-8")
WORKER.write_text(sw.replace(old, new, 1), encoding="utf-8")
print("PASS_V271_HTML_PATCH_WITH_INLINE_FALLBACK", hashlib.sha256(source.encode("utf-8")).hexdigest())
