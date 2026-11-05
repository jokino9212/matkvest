#!/usr/bin/env python3
"""Generate source-locked, temporary Release Gate regression test scripts for exact v50.
Does not modify audited source, production files, or committed historical tests.
"""
from pathlib import Path
import hashlib,json
OLD_SHA="f188d39a3a16fc54dfb32238fc34d3dfe6cc3c4416cd475579bf3ed65a7e1e36"
NEW_SHA="0b64dc42f34e375fedce727720bb6475fcca63b2429c0d9fa8fd6539012e761d"
MAIN="e58d84f15eaeb71a3e4d904cfb316724b2fd678d"
h=hashlib.sha256(Path("index.html").read_bytes()).hexdigest()
if h!=NEW_SHA:raise SystemExit("ABORT unexpected v50 HTML "+h)
if f'const APP_BUILD_HASH = "{NEW_SHA}"' not in Path("sw.js").read_text("utf8"):raise SystemExit("ABORT SW mismatch")
out={}
def source(name):
 p=Path("audits/"+name+".mjs")
 if not p.is_file():raise SystemExit("Missing historical regression "+str(p))
 return p.read_text("utf8")
def exact(s,a,b,label):
 if a==b:return s
 count=s.count(a)
 if count<1:raise SystemExit("ABORT unexpected baseline contract "+label+": "+a)
 return s.replace(a,b)
def write(name,s,origin):
 p=Path("audits/_release50_"+name+".mjs")
 p.write_text(s,"utf8");out[name]={"source":origin,"temporary":str(p),"bytes":len(s)}
def version(s):
 return exact(s,"matkvest-iphone-v40","matkvest-iphone-v50","PWA version")
# Real main v40 HTML and service worker, not a mocked old HTML.
s=source("g7_stage15_legacy_upgrade")
s=exact(s,"aec894d39ee4e389c616d265e9fe219f10399f5c",MAIN,"main fixture")
s=exact(s,OLD_SHA,NEW_SHA,"candidate SHA")
s=exact(s,"matkvest-iphone-v39","matkvest-iphone-v40","old live PWA fixture")
# Previous operation created v40 for old fixture. Replace current target v40 references selectively.
s=exact(s,"keys.includes('matkvest-iphone-v40') &&","keys.includes('matkvest-iphone-v50') &&","new cache wait") if "keys.includes('matkvest-iphone-v40') &&" in s else s
s=exact(s,"if(!newer.caches.includes('matkvest-iphone-v40'))","if(!newer.caches.includes('matkvest-iphone-v50'))","new cache result")
s=exact(s,"'audits/g7_stage15_legacy_upgrade_report.json'","'audits/g3g4_stage17_release_real_v40_v50_report.json'","upgrade report")
# Fix exact wait: original v40 needs an active worker v40, new version must be v50.
# First old assertion is still v40. Old cache removal must be v40.
# Add an explicit source main baseline check, before starting the browser.
needle="if(!oldSw.toString('utf8').includes('matkvest-iphone-v40'))"
if needle not in s:raise SystemExit("ABORT missing verified old v40 SW guard")
s=exact(s,needle,"if(sha(oldHtml)!=='"+OLD_SHA+"')throw Error('Unexpected old main HTML SHA');\n"+needle,"old main HTML guard")
write("real_v40_v50",s,"g7_stage15_legacy_upgrade.mjs")
# v49 -> v50 synthetic worker update: preserves exact draft in active G7 block.
s=source("g7_stage15_release_gate")
s=exact(s,OLD_SHA,NEW_SHA,"release candidate SHA")
s=version(s)
s=exact(s,"matkvest-iphone-v39","matkvest-iphone-v49","synthetic previous worker")
s=exact(s,"'audits/g7_stage13_strict_report.json'","'audits/g3g4_stage17_final_semantics_report.json'","semantic QA")
old_check="strict.sha256===expected&&strict.catalog===107&&strict.sessions===963&&strict.questions===7062&&['duplicates','errors','exhaustions','pageErrors'].every(k=>Array.isArray(strict[k])&&strict[k].length===0)"
new_check="strict.summary?.grade3Topics===48&&strict.summary?.grade4Topics===8&&strict.summary?.valid===13500&&strict.summary?.defects===0&&strict.summary?.jsErrors===0&&strict.htmlSha256===expected"
s=exact(s,old_check,new_check,"grade 3/4 strict summary")
s=exact(s,"'audits/g7_stage15_release_gate_report.json'","'audits/g3g4_stage17_release_auto_resume_report.json'","release report")
write("auto_resume",s,"g7_stage15_release_gate.mjs")
s=version(source("g7_stage12_sw_update_test"))
s=exact(s,"'audits/g7_stage12_sw_update_report.json'","'audits/g3g4_stage17_release_sw_update_report.json'","SW upgrade report")
write("sw_update",s,"g7_stage12_sw_update_test.mjs")
s=source("g7_stage12_e2e")
s=exact(s,"matkvest-iphone-v40","matkvest-iphone-v50","E2E current PWA cache")
s=exact(s,"'audits/g7_stage12_e2e_report.json'","'audits/g3g4_stage17_release_e2e_report.json'","E2E report")
write("e2e",s,"g7_stage12_e2e.mjs")
s=exact(source("g7_stage14_grade4_test"),OLD_SHA,NEW_SHA,"G4 SHA")
s=exact(s,"'audits/g7_stage14_grade4_report.json'","'audits/g3g4_stage17_release_grade4_report.json'","G4 report")
write("grade4",s,"g7_stage14_grade4_test.mjs")
s=exact(source("g7_stage14_crossgrade_test"),OLD_SHA,NEW_SHA,"crossgrade SHA")
s=exact(s,"'audits/g7_stage14_crossgrade_report.json'","'audits/g3g4_stage17_release_crossgrade_report.json'","crossgrade report")
write("crossgrade",s,"g7_stage14_crossgrade_test.mjs")
Path("audits/g3g4_stage17_release_adapted_test_manifest.json").write_text(json.dumps({"stage":"17D-release-Gate","html_sha256":NEW_SHA,"main_commit":MAIN,"test_sources":out},indent=2,ensure_ascii=False)+"\n","utf8")
print(json.dumps({"candidate":NEW_SHA,"source_tests":list(out)},ensure_ascii=False))
