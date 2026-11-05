#!/usr/bin/env python3
"""MatKvest 17D Release Gate: immutable main v40 to reviewed v50 source inventory.
Read-only: never changes production, deployments, or project files.
"""
import hashlib,json,pathlib,subprocess,re
from datetime import datetime,timezone
OLD_MAIN="e58d84f15eaeb71a3e4d904cfb316724b2fd678d"
NEW_SHA="0b64dc42f34e375fedce727720bb6475fcca63b2429c0d9fa8fd6539012e761d"
def git(*args):
 return subprocess.check_output(["git",*args],stderr=subprocess.STDOUT)
def digest(data):return hashlib.sha256(data).hexdigest()
def assert_check(name,condition,checks,detail=None):
 checks.append({"name":name,"pass":bool(condition),"detail":detail})
 if not condition:raise AssertionError(name+": "+str(detail))
out={"stage":"17D-release-preflight","date":datetime.now(timezone.utc).isoformat(),"checks":[],"mainSha":OLD_MAIN,"expectedHtmlSha256":NEW_SHA}
dest=pathlib.Path("audits/g3g4_stage17_release_preflight_report.json")
try:
 checks=out["checks"]
 head=git("rev-parse","HEAD").decode().strip()
 old_commit=git("rev-parse","main").decode().strip()
 assert_check("Main remains exact protected production commit",old_commit==OLD_MAIN,checks,old_commit)
 assert_check("Release preflight must run on audit branch, not production",head!=OLD_MAIN,checks,head)
 old_html=git("show",f"{OLD_MAIN}:index.html")
 old_sw=git("show",f"{OLD_MAIN}:sw.js").decode()
 candidate=pathlib.Path("index.html").read_bytes()
 sw=pathlib.Path("sw.js").read_text("utf8")
 main_digest=digest(old_html)
 assert_check("Production v40 SW matches its HTML",f'const APP_BUILD_HASH = "{main_digest}"' in old_sw and 'matkvest-iphone-v40' in old_sw,checks,main_digest)
 assert_check("Reviewed v50 HTML exact SHA256",digest(candidate)==NEW_SHA,checks,digest(candidate))
 assert_check("Reviewed v50 SW fingerprint",f'const APP_BUILD_HASH = "{NEW_SHA}"' in sw and 'matkvest-iphone-v50' in sw,checks)
 assert_check("SW install skipWaiting and activate clients claim",sw.count("self.skipWaiting()")==1 and sw.count("self.clients.claim()")==1,checks)
 assert_check("SW navigation network-first",sw.count('fetch(request, { cache: "no-store" })')==1,checks)
 assert_check("SW deletes obsolete matkvest-iphone caches",'key.startsWith("matkvest-iphone-")' in sw and "caches.delete(key)" in sw,checks)
 html=candidate.decode("utf8")
 assert_check("Exactly one automatic-update markup",html.count('id="mk-stage12-pwa-refresh"')==1,checks)
 assert_check("Existing manifest unchanged",git("show",f"{OLD_MAIN}:manifest.webmanifest")==pathlib.Path("manifest.webmanifest").read_bytes(),checks)
 manifest=json.loads(pathlib.Path("manifest.webmanifest").read_text("utf8"))
 assert_check("PWA manifest stays same origin",manifest.get("scope")=="./" and manifest.get("start_url")=="./index.html",checks,manifest)
 changed=git("diff","--name-status",OLD_MAIN,"HEAD").decode().splitlines()
 code=["index.html","sw.js","manifest.webmanifest"]
 modified={x.split("\t")[-1] for x in changed if x.strip()}
 mainFiles=[x for x in code if x in modified]
 assert_check("Deployment payload only index.html plus sw.js",set(mainFiles)=={"index.html","sw.js"},checks,mainFiles)
 out["branchAheadFiles"]=len(changed)
 out["deploymentPayload"]=mainFiles
 out["excludedFromDeployment"]=len(changed)-len(mainFiles)
 out["oldHtmlSha256"]=main_digest
 out["newHtmlSha256"]=NEW_SHA
 out["oldCache"]="matkvest-iphone-v40"
 out["newCache"]="matkvest-iphone-v50"
 patterns={
  "fetchCalls":r"\bfetch\s*\(",
  "XHRCalls":r"\bXMLHttpRequest\s*\(",
  "WebsocketCalls":r"\bnew\s+WebSocket\s*\(",
  "APIPathLiterals":r"['\"]/api/",
  "localStorage":r"\blocalStorage\b",
  "serviceWorker":r"\bserviceWorker\b",
 }
 out["frontendSignals"]={k:len(re.findall(p,html)) for k,p in patterns.items()}
 out["backendCompatibility"]="NOT VERIFIED: backend 9.4 source, deployed API and integration credentials are not in this frontend repo"
 out["status"]="PASS"
 print(json.dumps({"status":out["status"],"main":OLD_MAIN,"mainHtmlHash":main_digest,"candidate":NEW_SHA,"changedFiles":len(changed),"releaseAssets":mainFiles,"excludedAuditFiles":out["excludedFromDeployment"],"frontendSignals":out["frontendSignals"],"checks":len(checks)},ensure_ascii=False))
except BaseException as error:
 out["status"]="FAIL";out["error"]=str(error)
 print(json.dumps({"status":"FAIL","error":str(error),"checks":out["checks"]},ensure_ascii=False))
 raise
finally:
 dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n","utf8")
