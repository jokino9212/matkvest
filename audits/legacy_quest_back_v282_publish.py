#!/usr/bin/env python3
"""Publish only tested HTML, worker and quest adapter in the isolated test branch.

Avoids the large index.html connector transport limit and depends on no Git working tree.
Fail closed on ref, run SHA, PWA hash or concurrent branch changes.
"""
from pathlib import Path
import base64
import hashlib
import json
import os
import re
import sys
import urllib.request

REPO = "jokino9212/matkvest"
BRANCH = "refactor/route-vue-actions-from-7c14ce9"
EXPECTED_REF = "refs/heads/" + BRANCH
ROOT = Path(__file__).resolve().parent.parent
if os.environ.get("GITHUB_REF") != EXPECTED_REF:
    raise SystemExit("REFUSING publish outside isolated test branch")
if os.environ.get("GITHUB_REPOSITORY") != REPO:
    raise SystemExit("REFUSING publish outside MatKvest repo")
TOKEN = os.environ.get("GH_TOKEN")
if not TOKEN:
    raise SystemExit("REFUSING publish without GitHub Actions branch-scoped token")

def api(method, relative, payload=None):
    url = "https://api.github.com/repos/" + REPO + "/" + relative
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "MatKvest-v282-test-only",
    })
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)

html = (ROOT / "index.html").read_bytes()
sw = (ROOT / "sw.js").read_bytes()
actions = (ROOT / "assets/ui/legacy-vue-actions.js").read_bytes()
expected_html = hashlib.sha256(html).hexdigest()
# Final publisher runs after all tests on the same SHA-fenced v272-to-v282 candidate.
html_source = html.decode("utf-8")
if (html_source.count("legacy-navigation-core.js?v=281") != 1
        or html_source.count("legacy-vue-actions.js?v=281") != 1
        or html_source.count("MatKvestVueActions?.headerActions?.") != 1
        or html_source.count("MatKvestVueActions?.quickSetupActions?.") != 1
        or html_source.count("MatKvestVueActions?.quickResultActions?.") != 1
        or html_source.count("MatKvestVueActions?.trainingPlanActions?.") != 1
        or html_source.count("MatKvestVueActions?.schoolTableActions?.") != 1
        or html_source.count("MatKvestVueActions?.schoolQuizActions?.") != 1
        or html_source.count("MatKvestVueActions?.schoolColumnActions?.") != 1
        or html_source.count("MatKvestVueActions?.schoolAttemptFrameActions?.") != 1
        or html_source.count("MatKvestVueActions?.attemptJournalActions?.") != 1
        or html_source.count("MatKvestVueActions?.attemptReviewActions?.") != 1
        or html_source.count("MatKvestVueActions?.reportSurfaceActions?.") != 1
        or html_source.count("MatKvestVueActions?.teacherViewActions?.") != 1
        or html_source.count("MatKvestVueActions?.analyticsViewActions?.") != 1
        or html_source.count("MatKvestVueActions?.profileDialogActions?.") != 1
        or html_source.count("MatKvestVueActions?.teacherDashboardActions?.") != 1
        or html_source.count("MatKvestVueActions?.storeTabActions?.") != 2
        or html_source.count("MatKvestVueActions?.achievementFilterActions?.") != 1
        or html_source.count("MatKvestVueActions?.questBackActions?.") != 1
        or html_source.count('data-quest-action="back"') != 1
        or 'data-achievement-action="view"' not in html_source
        or 'data-achievement-action="category"' not in html_source
        or 'data-achievement-action="sort"' not in html_source
        or html_source.count("liveStoreActions.select(id)") != 1
        or html_source.count("mk280StoreTabActions?.select(button.dataset.storeCategory)") != 1
        or html_source.count("profiles:()=>MK854_CORE_OPEN_PROFILES(),backup:()=>openDataManager()") != 1
        or html_source.count('data-teacher-dashboard-action="open"') != 1
        or html_source.count('data-teacher-dashboard-action="filter"') != 1
        or html_source.count("host.__mk279DashboardDelegated=true") != 1
        or html_source.count('data-profile-action="select"') != 1
        or html_source.count('data-profile-action="create"') != 1
        or html_source.count("core.dispatchRoute(r,{") != 1
        or html_source.count("core.shouldDeferRestore(route)") != 1
        or "?v=281" in html_source):
    raise SystemExit("REFUSING publish: v282 route integration/fallback missing")
if hashlib.sha256(html).hexdigest() != expected_html:
    raise SystemExit("REFUSING publish: HTML fingerprint is not the tested v282 candidate")
source = sw.decode("utf-8")
if 'const CACHE_NAME = "matkvest-iphone-v282";' not in source:
    raise SystemExit("REFUSING publish: wrong worker cache version")
if 'const APP_BUILD_HASH = "' + expected_html + '";' not in source:
    raise SystemExit("REFUSING publish: worker HTML hash mismatch")
if '"assets/ui/legacy-navigation-core.js"' not in source:
    raise SystemExit("REFUSING publish: route module missing from cache fingerprints")
if '"assets/ui/legacy-vue-actions.js"' not in source:
    raise SystemExit("REFUSING publish: Vue actions module missing from cache fingerprints")
if b'function questBackActions({isCurrent,back})' not in actions:
    raise SystemExit("REFUSING publish: quest UI adapter not included")

ref = api("GET", "git/ref/heads/" + BRANCH)
head = ref["object"]["sha"]
if head != os.environ.get("GITHUB_SHA"):
    raise SystemExit("REFUSING publish: test branch moved during CI; expected " +
                     str(os.environ.get("GITHUB_SHA")) + ", actual " + head)
base = api("GET", "git/commits/" + head)["tree"]["sha"]

entries = []
for name, body in (("index.html", html), ("sw.js", sw), ("assets/ui/legacy-vue-actions.js", actions)):
    blob = api("POST", "git/blobs", {
        "content": base64.b64encode(body).decode("ascii"),
        "encoding": "base64",
    })
    entries.append({"path": name, "mode": "100644", "type": "blob", "sha": blob["sha"]})

tree = api("POST", "git/trees", {"base_tree": base, "tree": entries})["sha"]
commit = api("POST", "git/commits", {
    "message": "test(pwa): verified quest-back Vue/HTML navigation adapter PWA v282",
    "tree": tree, "parents": [head],
})["sha"]

# Check the branch a final time before attempting the non-force ref update.
if api("GET", "git/ref/heads/" + BRANCH)["object"]["sha"] != head:
    raise SystemExit("REFUSING publish: concurrent branch update")
api("PATCH", "git/refs/heads/" + BRANCH, {"sha": commit, "force": False})
print("PASS_PUBLISHED_TEST_BRANCH_ONLY", REPO, BRANCH, commit)
