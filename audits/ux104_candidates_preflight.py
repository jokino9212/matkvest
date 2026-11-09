#!/usr/bin/env python3
"""UX-104 read-only candidate preflight. Intentionally does not publish art or mutate PWA."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "pet_bot": ("av_robot", 240, "uncommon", 3),
    "pet_owl": ("av_owl", 270, "uncommon", 4),
    "pet_penguin": ("av_penguin", 300, "rare", 5),
    "pet_dino": ("av_dino", 360, "rare", 6),
    "pet_cat": ("av_cat", 390, "rare", 7),
    "pet_dragon": ("av_dragon", 500, "epic", 9),
    "pet_fox": ("av_fox", 260, "uncommon", 3),
    "pet_turtle": ("av_turtle", 280, "uncommon", 4),
    "pet_tiger": ("av_tiger", 340, "rare", 6),
    "pet_astronaut": ("av_astronaut", 450, "epic", 8),
}
FIRST_BATCH_HASHES = {
    "pet_bot": "f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113",
    "pet_owl": "4bfaaa6e118047f59081c679bf7161217f8ddb8f0e9d2996468ae5aa84e6ad1d",
    "pet_penguin": "96c726213840a2b03db6f3f000b80d236f3a09e7fc16c16ba313f7d236127ec2",
}
def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def main():
    batches = [
        load("audits/ux104_batch1_manifest.json"),
        load("audits/ux104_batch2_manifest.json"),
        load("audits/ux104_batch3_manifest.json"),
    ]
    rows = batches[0]["items"] + batches[1]["candidates"] + batches[2]["items"]
    actual = {item["id"]:item for item in rows}
    assert len(rows) == len(actual) == len(EXPECTED) == 10, "Missing or duplicate original pet ID"
    assert set(actual) == set(EXPECTED), "Wrong set of 10 original pet IDs"
    for pid, (avatar, price, rarity, level) in EXPECTED.items():
        item = actual[pid]
        assert (item["avatar_duplicate"],item["price"],item["rarity"],item["level"]) == (avatar,price,rarity,level), "Metadata mismatch "+pid
    for batch in batches:
        gate = batch["art_acceptance"]
        assert gate["status"] == "pending_visual_review", "Human art acceptance was bypassed"
        for pid,sha in gate["accepted_sha256"].items():
            assert pid in actual and sha is None, "Unexpected artwork approval SHA: "+pid
    sw = (ROOT/"sw.js").read_text(encoding="utf-8")
    html = (ROOT/"index.html").read_text(encoding="utf-8")
    assert 'matkvest-iphone-v102' in sw, "Unexpected PWA release; this is a read-only v102 preflight"
    assert "assets/candidates/pets/" not in html + sw, "Candidate art leaked into live HTML/PWA"
    found, missing, hashes = [], [], set()
    for pid,item in actual.items():
        path = ROOT / "assets/candidates/pets" / (pid+".webp")
        if not path.is_file():
            missing.append(pid)
            continue
        blob = path.read_bytes()
        assert blob[:4] == b"RIFF" and blob[8:12] == b"WEBP", "Not a genuine WebP: "+pid
        assert len(blob) > 20000, "Suspiciously small WebP: "+pid
        digest = hashlib.sha256(blob).hexdigest()
        expected_hash = FIRST_BATCH_HASHES.get(pid) if pid in FIRST_BATCH_HASHES else item.get("sha256")
        if pid in FIRST_BATCH_HASHES or pid in {"pet_dino","pet_cat","pet_dragon"}:
            assert expected_hash == digest, "Approved technical candidate bytes changed: "+pid
        elif expected_hash is not None:
            assert expected_hash == digest, "Batch3 candidate bytes do not match manifest: "+pid
        assert digest not in hashes, "Artwork reused for more than one pet: "+pid
        hashes.add(digest)
        found.append(pid)
    assert len(found)==len(EXPECTED)==10 and not missing, "All ten approved-for-review candidate files must exist; still unapproved for release"
    print(json.dumps({
        "result":"PASS — read-only pipeline preflight, not an art-approval or release",
        "existing_candidate_count":len(found),"existing_candidate_ids":found,
        "batch3_candidate_ids":list(EXPECTED)[6:],"missing_ids":missing,"art_approved_count":0,
        "staging":"v102 unchanged","production":"v81 unchanged"
    },ensure_ascii=False,indent=2))
if __name__=="__main__":
    try: main()
    except Exception as exc:
        print("UX104 PRE-FLIGHT FAIL: "+str(exc),file=sys.stderr)
        sys.exit(1)
