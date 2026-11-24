#!/usr/bin/env python3
"""One-shot, idempotent, fail-closed edit of the v268 giant index.html on the CI runner.

Must NEVER be run on main or without the known base fingerprint.
The legacy wrappers remain in-place as fallback if the module is unavailable.
"""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
BASE = "4af21c318352fed8a91fb5caacfd5fb0ba12f509f761a36d3b5a227866d5ec0a"
TARGET = "388d92e221053d785e63522a4032d52225a866079ec29493eaaf91987a2690b1"
source = HTML.read_text(encoding="utf-8")
digest = lambda content: hashlib.sha256(content.encode("utf-8")).hexdigest()
def bump_worker_version():
    worker = ROOT / "sw.js"
    old = worker.read_text(encoding="utf-8")
    v268 = 'const CACHE_NAME = "matkvest-iphone-v268";'
    v269 = 'const CACHE_NAME = "matkvest-iphone-v269";'
    if old.count(v269) == 1:
        return
    if old.count(v268) != 1:
        raise SystemExit("REFUSING unexpected worker cache version")
    worker.write_text(old.replace(v268, v269, 1), encoding="utf-8")

before = digest(source)
if before == TARGET:
    bump_worker_version()
    print("UNCHANGED: v269 route core already integrated", before)
    sys.exit(0)
if before != BASE:
    raise SystemExit("REFUSING to patch index.html: unexpected v268 baseline " + before)

def replace_one(original, updated):
    global source
    matches = source.count(original)
    if matches != 1:
        raise SystemExit("REFUSING ambiguous integration anchor (" + str(matches) + "): " + original[:85])
    source = source.replace(original, updated, 1)

replace_one(
    '<meta charset="utf-8">\n',
    '<meta charset="utf-8">\n<!-- Optional route core: inline mk854 wrappers remain the fallback. -->\n'
    '<script src="./assets/ui/legacy-navigation-core.js?v=269"></script>\n')
replace_one(
    'function mk854Route(){\n const st=history.state;',
    'function mk854Route(){\n const core=window.MatKvestRouteCore;\n'
    ' if(core&&typeof core.currentRoute==="function")return core.currentRoute(history.state);\n'
    ' const st=history.state;')
replace_one(
    'function mk854Depth(){\n const st=history.state;',
    'function mk854Depth(){\n const core=window.MatKvestRouteCore;\n'
    ' if(core&&typeof core.currentDepth==="function")return core.currentDepth(history.state);\n'
    ' const st=history.state;')
replace_one(
    'function mk854SameRoute(a,b){\n try',
    'function mk854SameRoute(a,b){\n const core=window.MatKvestRouteCore;\n'
    ' if(core&&typeof core.sameRoute==="function")return core.sameRoute(a,b);\n try')
replace_one(
    'function mk854HistoryWrite(route,mode="push"){\n const current=',
    'function mk854HistoryWrite(route,mode="push"){\n const core=window.MatKvestRouteCore;\n'
    ' if(core&&typeof core.writeHistory==="function")return core.writeHistory(history,route,mode,e=>{\n'
    '  try{console.warn("МатКвест: History API недоступен в текущем окружении",e)}catch(_){}\n'
    ' });\n const current=')
replace_one(
    ' const route=st&&st.__matkvest854&&st.route?st.route:{screen:"home"};\n mk854RestoreRoute(route);',
    ' const route=window.MatKvestRouteCore?.currentRoute?.(st)||(st&&st.__matkvest854&&st.route?st.route:{screen:"home"});\n'
    ' mk854RestoreRoute(route);')
count = source.count("?v=268")
if count != 26:
    raise SystemExit("REFUSING unexpected version reference count: " + str(count))
source = source.replace("?v=268", "?v=269")
if source.count("legacy-navigation-core.js?v=269") != 1 or "?v=268" in source:
    raise SystemExit("REFUSING inconsistent module inclusion or script versions")
after = digest(source)
if after != TARGET:
    raise SystemExit("REFUSING unexpected candidate digest: " + after)
HTML.write_text(source, encoding="utf-8")
bump_worker_version()
print("PASS: integrated legacy-navigation-core.js with intact fallback; v269 index", after)
