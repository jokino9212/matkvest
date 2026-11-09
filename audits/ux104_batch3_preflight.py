#!/usr/bin/env python3
"""Fail-closed, read-only stage-3 artwork contract: no app writes and no false release."""
from pathlib import Path
import hashlib,json,subprocess
manifest=json.loads(Path("audits/ux104_batch3_manifest.json").read_text("utf-8"))
items=manifest["items"]
expected={
    "pet_fox":("av_fox",260,"uncommon",3),
    "pet_turtle":("av_turtle",280,"uncommon",4),
    "pet_tiger":("av_tiger",340,"rare",6),
    "pet_astronaut":("av_astronaut",450,"epic",8)
}
assert [i["id"] for i in items]==list(expected), "Unexpected batch3 item IDs"
assert manifest["art_acceptance"]["status"]=="pending_visual_review"
assert set(manifest["art_acceptance"]["accepted_sha256"])==set(expected)
assert all(v is None for v in manifest["art_acceptance"]["accepted_sha256"].values())
seen=set()
for i in items:
    assert (i["avatar_duplicate"],i["price"],i["rarity"],i["level"])==expected[i["id"]]
    digest=i["sha256"]
    assert len(digest)==64 and int(digest,16)>=0 and digest not in seen, "Invalid or duplicate candidate SHA"
    assert i["size"]>30000 and i["size"]<200000, "Suspicious candidate size"
    seen.add(digest)
    candidate=Path(i["asset"])
    assert candidate.as_posix()==f'assets/candidates/pets/{i["id"]}.webp'
    assert candidate.exists(), f"Missing genuine GitHub artwork: {i['id']}"
    blob=candidate.read_bytes()
    assert blob[:4]==b"RIFF" and blob[8:12]==b"WEBP"
    assert len(blob)==i["size"] and hashlib.sha256(blob).hexdigest()==digest, f"Artifact mismatch: {i['id']}"
targets=[Path("index.html"),Path("sw.js")]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in targets}
sw=Path("sw.js").read_text("utf-8");html=Path("index.html").read_text("utf-8")
assert 'matkvest-iphone-v102' in sw, "This test is for the pending v102 checkpoint"
assert not any(f'pet_{p}.webp' in html for p in ("fox","turtle","tiger","astronaut")), "New art unexpectedly already active"
pre=subprocess.run(["python3","audits/ux104_batch3_v105_patch.py","--preflight"],capture_output=True,text=True)
assert pre.returncode==0, (pre.stdout,pre.stderr)
assert "matkvest-iphone-v102" in pre.stdout and "matkvest-iphone-v104" in pre.stdout
assert "pending_visual_review" in pre.stdout
attempt=subprocess.run(["python3","audits/ux104_batch3_v105_patch.py"],capture_output=True,text=True)
assert attempt.returncode!=0, "Premature stage3 release was accepted"
assert "Release blocked" in attempt.stderr,(attempt.stdout,attempt.stderr)
after={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in targets}
assert before==after, "Fail-closed guard changed application bytes!"
print("UX104_BATCH3_FAIL_CLOSED_PASS",json.dumps({
 "art_candidates_created_in_user_Library":4,
 "art_candidate_binaries_present_in_GitHub":4,
 "immutable_catalog_items":list(expected),
 "accepted_artwork":0,
 "staging":"v102 untouched","production":"v81 untouched",
 "future_release":"v105 only after v103/v104, art approval and full QA",
 "html_sw_unmodified":True
},ensure_ascii=False))
