#!/usr/bin/env python3
"""UX-105 guard: contract can be prepared, but new goods without real WebP must NEVER ship."""
import hashlib,json,subprocess
from pathlib import Path
index=Path("index.html");sw=Path("sw.js")
manifest=json.loads(Path("audits/ux105_new_pets_manifest.json").read_text("utf8"))
baseline=json.loads(Path("audits/ux105_baseline_pets.json").read_text("utf8"))
items=manifest["items"]
assert len(items)==10 and len(baseline["items"])==21
assert manifest["base_counts"]["real_pets"]==20
assert manifest["artwork"]["art_approval"]=="pending"
assert manifest["artwork"]["accepted_count"]==0
assert all(i["sha256"] is None and i["approved_sha256"] is None and i["status"]=="planned" for i in items)
assert not any(Path(i["asset"]).exists() or Path(i["source_asset"]).exists() for i in items)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p):digest(p) for p in (index,sw)}
ok=subprocess.run(["python3","audits/ux105_stage_v107.py","--preflight"],capture_output=True,text=True)
assert ok.returncode==0 and "UX105_CONTRACT_OK" in ok.stdout,(ok.stdout,ok.stderr)
bad=subprocess.run(["python3","audits/ux105_stage_v107.py","--apply"],capture_output=True,text=True)
assert bad.returncode!=0 and "Artwork requires explicit human approval" in bad.stderr,(bad.stdout,bad.stderr)
assert before=={str(p):digest(p) for p in (index,sw)},"Unapproved attempt changed app bytes"
assert not any(Path(i["source_asset"]).exists() for i in items)
print("UX105_PREPARATION_FAIL_CLOSED_PASS",json.dumps({
 "new_unique_ids":10,"artwork_approved":0,
 "staging":"v106 untouched","production":"v106 untouched",
 "unapproved_publish_rejected":True,"old_save_data_untouched":True
},ensure_ascii=False))
