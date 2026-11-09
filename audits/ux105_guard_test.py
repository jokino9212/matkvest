#!/usr/bin/env python3
"""UX-105 gate: ten genuine source art candidates, zero accepted, reject any premature v107 release."""
from pathlib import Path
import hashlib,json,subprocess
m=json.loads(Path("audits/ux105_new_pets_manifest.json").read_text("utf8"))
base=json.loads(Path("audits/ux105_baseline_pets.json").read_text("utf8"))
items=m["items"]
assert len(base["items"])==21 and len(items)==10
assert len({x["id"] for x in items})==10
assert m["artwork"]["candidate_count"]==10 and m["artwork"]["accepted_count"]==0
assert m["artwork"]["art_approval"]=="pending"
sha_set=set()
for x in items:
    source=Path(x["asset"]);published=Path(x["source_asset"])
    assert x["status"]=="candidate_art_created_pending_review" and x["approved_sha256"] is None
    assert source.is_file() and not published.exists(),x["id"]
    b=source.read_bytes()
    assert b[:4]==b"RIFF" and b[8:12]==b"WEBP" and 20_000<len(b)<350_000,x["id"]
    assert len(b)==x["candidate_size_bytes"],x["id"]
    dig=hashlib.sha256(b).hexdigest()
    assert dig==x["sha256"] and dig not in sha_set,x["id"]
    sha_set.add(dig)
assert len(sha_set)==10
html=Path("index.html");sw=Path("sw.js")
def hashfile(p):return hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p):hashfile(p) for p in (html,sw)}
assert "matkvest-iphone-v106" in sw.read_text("utf8")
pre=subprocess.run(["python3","audits/ux105_stage_v107.py","--preflight"],capture_output=True,text=True)
assert pre.returncode==0 and "UX105_CONTRACT_OK" in pre.stdout,(pre.stdout,pre.stderr)
apply=subprocess.run(["python3","audits/ux105_stage_v107.py","--apply"],capture_output=True,text=True)
assert apply.returncode!=0 and "Artwork requires explicit human approval" in apply.stderr,(apply.stdout,apply.stderr)
assert {str(p):hashfile(p) for p in (html,sw)}==before
assert not any(Path(x["source_asset"]).exists() for x in items)
print("UX105_TEN_REAL_WEBP_FAIL_CLOSED_PASS",json.dumps({"art_candidates":10,"unique_sha256":10,"approved":0,"production_unchanged":True,"app_release_rejected":True}))
