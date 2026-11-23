#!/usr/bin/env python3
"""Fail closed when extracting v272 plan actions in the isolated test branch.

The legacy plan/controller logic and all HTML fallbacks remain in index.html.
The known v271 HTML hash is checked BEFORE any files are written.
"""
from pathlib import Path
import hashlib
import os

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
WORKER = ROOT / "sw.js"
BRANCH = "refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO = "jokino9212/matkvest"
KNOWN_BASE = "040609f9f243d15702f11b498133adc75aead30a67361cdaa7d6ebc4da994809"
if os.environ.get("GITHUB_REF") != BRANCH or os.environ.get("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("REFUSING v272 HTML patch outside isolated test branch")

source = PAGE.read_text(encoding="utf-8")
fingerprint = hashlib.sha256(source.encode("utf-8")).hexdigest()
if fingerprint != KNOWN_BASE:
    raise SystemExit("REFUSING unknown giant v271 HTML baseline: " + fingerprint)

def replace_one(old, new):
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"REFUSING ambiguous v272 anchor ({count}): {old[:100]!r}")
    source = source.replace(old, new, 1)

# Do not edit plan state, rewards, or business logic. Wrap callbacks only for
# the currently displayed plan view, keeping original actions if module absent.
replace_one(
    ' const host=document.createElement("div");host.id="trainingPlanVue";host.style.display="contents";\n'
    ' const showFallback=()=>{',
    ' const host=document.createElement("div");host.id="trainingPlanVue";host.style.display="contents";\n'
    ' const fallbackActions=actions;\n'
    ' const planActions=window.MatKvestVueActions?.trainingPlanActions?.({\n'
    '  isCurrent:()=>host.parentNode===mainView&&host.isConnected,\n'
    '  isBlocked:()=>!!mk872Dialog,actions:fallbackActions\n'
    ' })||fallbackActions;\n'
    ' const showFallback=()=>{'
)
replace_one(
    '   if(button&&!button.disabled)actions[button.dataset.planAction]?.(button.dataset.planItem);',
    '   if(button&&!button.disabled)planActions[button.dataset.planAction]?.(button.dataset.planItem);'
)
replace_one(
    '  module.mountTrainingPlan(host,model,actions);',
    '  module.mountTrainingPlan(host,model,planActions);'
)
if source.count("MatKvestVueActions?.trainingPlanActions?.") != 1:
    raise SystemExit("REFUSING missing v272 plan action adapter")
if source.count("?v=271") < 25 or "?v=272" in source:
    raise SystemExit("REFUSING unexpected v271 asset version baseline")
source = source.replace("?v=271", "?v=272")
if "?v=271" in source:
    raise SystemExit("REFUSING mixed asset versions")
worker = WORKER.read_text(encoding="utf-8")
old = 'const CACHE_NAME = "matkvest-iphone-v271";'
new = 'const CACHE_NAME = "matkvest-iphone-v272";'
if worker.count(old) != 1 or new in worker:
    raise SystemExit("REFUSING unexpected PWA cache baseline")
PAGE.write_text(source, encoding="utf-8")
WORKER.write_text(worker.replace(old, new, 1), encoding="utf-8")
print("PASS_V272_FENCED_HTML_PATCH", hashlib.sha256(source.encode("utf-8")).hexdigest())
