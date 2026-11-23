#!/usr/bin/env python3
"""Isolated SHA-guarded v272 to v273 school Vue action wiring.

Do not change reward/persistence or legacy HTML fallback. Write both files
only after validating exact anchors, cache version and known 7.6 MB base.
"""
from pathlib import Path
import hashlib
import os

ROOT = Path(__file__).resolve().parent.parent
PAGE, WORKER = ROOT / "index.html", ROOT / "sw.js"
BRANCH = "refs/heads/refactor/route-vue-actions-from-7c14ce9"
REPO = "jokino9212/matkvest"
BASE = "f8d63cd1a0d2a6aba96f5dc5999dafbaa7d3303005a2af25210593672c0869ed"
if os.environ.get("GITHUB_REF") != BRANCH or os.environ.get("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("REFUSING v273 patch outside isolated test branch")
source = PAGE.read_text(encoding="utf-8")
actual = hashlib.sha256(source.encode("utf-8")).hexdigest()
if actual != BASE:
    raise SystemExit("REFUSING unknown v272 HTML base: "+actual)

def replace_one(old, new):
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit("REFUSING nonunique v273 anchor "+str(count)+": "+repr(old[:95]))
    source = source.replace(old, new, 1)

# Existing table HTML handlers still run if the adapter cannot load.
replace_one(
    ' const actions={\n'
    '  primary:()=>{if(isCurrent())(tableSolved?practice:checkTable)()},\n'
    '  skip:()=>{\n'
    '   if(!isCurrent()||tableSolved)return;\n'
    '   if(attempt)mk872RequestExerciseSkip(host,practice);\n'
    '   else practice();\n'
    '  }\n'
    ' };\n'
    ' host.onclick=event=>{',
    ' const fallbackActions={\n'
    '  primary:()=>{if(isCurrent())(tableSolved?practice:checkTable)()},\n'
    '  skip:()=>{\n'
    '   if(!isCurrent()||tableSolved)return;\n'
    '   if(attempt)mk872RequestExerciseSkip(host,practice);\n'
    '   else practice();\n'
    '  }\n'
    ' };\n'
    ' const actions=window.MatKvestVueActions?.schoolTableActions?.({\n'
    '  isCurrent,isSolved:()=>tableSolved,hasAttempt:()=>!!attempt,\n'
    '  check:checkTable,next:practice,requestSkip:()=>mk872RequestExerciseSkip(host,practice)\n'
    ' })||fallbackActions;\n'
    ' host.onclick=event=>{'
)
# Preserve original quiz handlers as the no-module Vue fallback.
replace_one(
    '  },{choose:pick,check:checkQuizInput,skip:requestQuizSkip,next:quizAdvanceResolved,keydown:quizKeyboard});',
    '  },window.MatKvestVueActions?.schoolQuizActions?.({\n'
    '   isCurrent:()=>host.parentNode===modal&&blockSession===attempt&&q===question&&overlay.classList.contains("show")&&!mk872Dialog,\n'
    '   choose:pick,check:checkQuizInput,skip:requestQuizSkip,next:quizAdvanceResolved,keydown:quizKeyboard\n'
    '  })||{choose:pick,check:checkQuizInput,skip:requestQuizSkip,next:quizAdvanceResolved,keydown:quizKeyboard});'
)
for marker in (
    "MatKvestVueActions?.schoolTableActions?.",
    "MatKvestVueActions?.schoolQuizActions?.",
    "MatKvestVueActions?.trainingPlanActions?.",
    "module.mountQuizExercise(host,",
    "module.mountTableExercise(host,",
):
    if source.count(marker) != 1:
        raise SystemExit("REFUSING missing or duplicated v273 marker: "+marker)
if source.count("?v=272") < 25 or "?v=273" in source:
    raise SystemExit("REFUSING unexpected v272 asset versions")
source = source.replace("?v=272", "?v=273")
if "?v=272" in source:
    raise SystemExit("REFUSING mixed v272/v273 script versions")
sw = WORKER.read_text(encoding="utf-8")
old = 'const CACHE_NAME = "matkvest-iphone-v272";'
new = 'const CACHE_NAME = "matkvest-iphone-v273";'
if sw.count(old) != 1 or new in sw:
    raise SystemExit("REFUSING unexpected worker baseline")
PAGE.write_text(source, encoding="utf-8")
WORKER.write_text(sw.replace(old, new, 1), encoding="utf-8")
print("PASS_V273_SCHOOL_HTML_PATCH",hashlib.sha256(source.encode("utf-8")).hexdigest())
