#!/usr/bin/env python3
"""UX-105 guard: 6 real candidate artworks may exist but no release until ten accepted SHA-locked originals."""
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
assert manifest["artwork"]["candidate_count"]==6
assert len({x["id"] for x in items})==10
expected={"pet_axolotl","pet_capybara","pet_squirrel","pet_raccoon","pet_chameleon","pet_mole"}
seen=set()
for item in items:
    p=Path(item["asset"]);dst=Path(item["source_asset"])
    assert not dst.exists(),f"Premature deployed artwork: {item['id']}"
    assert item["approved_sha256"] is None
    if item["id"] in expected:
        assert item["status"]=="candidate_art_created_pending_review",item["id"]
        assert p.is_file(),f"Missing real candidate {item['id']}"
        blob=p.read_bytes()
        assert blob[:4]==b"RIFF" and blob[8:12]==b"WEBP"
        sha=hashlib.sha256(blob).hexdigest()
        assert sha==item["sha256"],f"Art changed {item['id']}"
        assert len(blob)==item["candidate_size_bytes"] and 20000<len(blob)<350000
        assert sha not in seen,f"Duplicate art {item['id']}"
        seen.add(sha)
    else:
        assert item["status"]=="planned" and not p.exists(),f"Unregistered art {item['id']}"
        assert item["sha256"] is None
assert len(seen)==6
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p):digest(p) for p in (index,sw)}
ok=subprocess.run(["python3","audits/ux105_stage_v107.py","--preflight"],capture_output=True,text=True)
assert ok.returncode==0 and "UX105_CONTRACT_OK" in ok.stdout,(ok.stdout,ok.stderr)
bad=subprocess.run(["python3","audits/ux105_stage_v107.py","--apply"],capture_output=True,text=True)
assert bad.returncode!=0 and "Artwork requires explicit human approval" in bad.stderr,(bad.stdout,bad.stderr)
assert before=={str(p):digest(p) for p in (index,sw)},"Unapproved attempt changed app bytes"
assert all(not Path(i["source_asset"]).exists() for i in items)
print("UX105_SIX_REAL_ART_CANDIDATES_FAIL_CLOSED_PASS",json.dumps({
 "new_unique_ids":10,"artwork_candidates_in_GitHub":6,"approved_artwork":0,
 "new_art_remaining":4,"staging":"v106 untouched","production":"v106 untouched",
 "unapproved_publish_rejected":True,"old_save_data_untouched":True
},ensure_ascii=False))
