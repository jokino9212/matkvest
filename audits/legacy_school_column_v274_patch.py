#!/usr/bin/env python3
"""SHA-fenced v273->v274 column Vue gestures and safe legacy HTML fallback.

Business logic (checkColumn, newTask, rewards, attempt journal) is unchanged.
Never modify main or an unknown multi-MB HTML baseline.
"""
from pathlib import Path
import hashlib
import os

ROOT = Path(__file__).resolve().parent.parent
PAGE, WORKER = ROOT/"index.html",ROOT/"sw.js"
REPO = "jokino9212/matkvest"
REF = "refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE = "967f04c84004077278020fc8090f57c0b392b15a0c2f827d35e6530abaf21065"
if os.environ.get("GITHUB_REPOSITORY") != REPO or os.environ.get("GITHUB_REF") != REF:
    raise SystemExit("REFUSING v274 outside test branch")
source = PAGE.read_text(encoding="utf-8")
sha = hashlib.sha256(source.encode("utf-8")).hexdigest()
if sha != BASE:
    raise SystemExit("REFUSING unknown HTML baseline "+sha)

def replace_exact(old, new):
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit("REFUSING ambiguous anchor count "+str(count)+": "+repr(old[:90]))
    source = source.replace(old,new,1)

replace_exact(
    ' const actions={\n'
    '  primary:()=>{if(isCurrent())(columnSolved?newTask:checkColumn)()},\n'
    '  skip:()=>{\n'
    '   if(!isCurrent()||columnSolved)return;\n'
    '   if(attempt)mk872RequestExerciseSkip(host,newTask);\n'
    '   else newTask();\n'
    '  },\n'
    '  inputCell:columnCellInput,moveCell:workKey,toggleDot\n'
    ' };\n'
    ' host.onclick=event=>{',
    ' const fallbackActions={\n'
    '  primary:()=>{if(isCurrent())(columnSolved?newTask:checkColumn)()},\n'
    '  skip:()=>{\n'
    '   if(!isCurrent()||columnSolved)return;\n'
    '   if(attempt)mk872RequestExerciseSkip(host,newTask);\n'
    '   else newTask();\n'
    '  },\n'
    '  inputCell:el=>{if(isCurrent())return columnCellInput(el)},\n'
    '  moveCell:(event,el)=>{if(isCurrent())return workKey(event,el)},\n'
    '  toggleDot:el=>{if(isCurrent())return toggleDot(el)}\n'
    ' };\n'
    ' const actions=window.MatKvestVueActions?.schoolColumnActions?.({\n'
    '  isCurrent,isSolved:()=>columnSolved,hasAttempt:()=>!!attempt,\n'
    '  check:checkColumn,next:newTask,requestSkip:()=>mk872RequestExerciseSkip(host,newTask),\n'
    '  inputCell:columnCellInput,moveCell:workKey,toggleDot\n'
    ' })||fallbackActions;\n'
    ' host.onclick=event=>{'
)
for marker in (
    'MatKvestVueActions?.schoolColumnActions?.',
    'MatKvestVueActions?.schoolTableActions?.',
    'MatKvestVueActions?.schoolQuizActions?.',
    'MatKvestVueActions?.trainingPlanActions?.',
    'module.mountColumnExercise(host,model,actions);',
    'mountSchoolColumnExercise(host,view,actions);',
):
    if source.count(marker)!=1:
        raise SystemExit("REFUSING v274 missing/duplicate marker: "+marker)
if source.count("?v=273") < 25 or "?v=274" in source:
    raise SystemExit("REFUSING unknown v273 script versions")
source=source.replace("?v=273","?v=274")
if "?v=273" in source:raise SystemExit("REFUSING mixed script versions")
worker=WORKER.read_text(encoding="utf-8")
before='const CACHE_NAME = "matkvest-iphone-v273";'
after='const CACHE_NAME = "matkvest-iphone-v274";'
if worker.count(before)!=1 or after in worker:
    raise SystemExit("REFUSING unknown worker version")
PAGE.write_text(source,encoding="utf-8")
WORKER.write_text(worker.replace(before,after,1),encoding="utf-8")
print("PASS_V274_FENCED_COLUMN_PATCH",hashlib.sha256(source.encode("utf-8")).hexdigest())
