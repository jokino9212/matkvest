#!/usr/bin/env python3
"""UX-104 controlled owner-requested release: exact 10 original WebPs, staged v102 -> v105, no economy changes."""
import hashlib,json,re,shutil,subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
assert Path.cwd().resolve()==ROOT, "Run at repository root only"
html=Path("index.html");sw=Path("sw.js")
base_html=hashlib.sha256(html.read_bytes()).hexdigest()
base_sw=sw.read_text("utf-8")
assert 'const CACHE_NAME = "matkvest-iphone-v102"' in base_sw, "Refuse changes on anything except v102"
assert re.search(r'const APP_BUILD_HASH = "([a-f0-9]{64})"',base_sw).group(1)==base_html,"Starting v102 hash not valid"
first={
 "pet_bot":"f352dd29dbbcea07e15d5a8b69ae03e7f4286a977c490e2672badbc625efc113",
 "pet_owl":"4bfaaa6e118047f59081c679bf7161217f8ddb8f0e9d2996468ae5aa84e6ad1d",
 "pet_penguin":"96c726213840a2b03db6f3f000b80d236f3a09e7fc16c16ba313f7d236127ec2"
}
data=[]
all_ids=set()
for n,prop in [(1,"items"),(2,"candidates"),(3,"items")]:
 p=Path(f"audits/ux104_batch{n}_manifest.json")
 m=json.loads(p.read_text("utf8"))
 for item in m[prop]:
  pid=item["id"];sha=item.get("sha256",first.get(pid))
  assert pid not in all_ids and sha and len(sha)==64, pid
  all_ids.add(pid)
  candidate=Path("assets/candidates/pets")/(pid+".webp")
  blob=candidate.read_bytes()
  assert len(blob)>=20000 and blob[:4]==b"RIFF" and blob[8:12]==b"WEBP",pid
  assert hashlib.sha256(blob).hexdigest()==sha,"Candidate bytes changed: "+pid
  if item.get("size"): assert item["size"]==len(blob),pid
  active=Path("assets/source/pets")/(pid+".webp")
  assert not active.exists(),"Already deployed or unexpected overwrite: "+pid
  data.append((n,p,m,pid,sha,candidate,active))
assert len(all_ids)==10
assert len({x[4] for x in data})==10,"Art reused across pets"
assert all(x[0] in (1,2,3) for x in data)
# Gate all content before mutating any file.
for n,p,m,pid,sha,candidate,active in data:
 active.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(candidate,active)
 assert active.read_bytes()==candidate.read_bytes()
for n in [1,2,3]:
 p=Path(f"audits/ux104_batch{n}_manifest.json")
 m=json.loads(p.read_text("utf8"))
 m["art_acceptance"]["status"]="approved"
 m["art_acceptance"]["required"]=True
 m["art_acceptance"]["accepted_sha256"]={pid:sha for batch,_,_,pid,sha,_,_ in data if batch==n}
 m["art_acceptance"]["approval_basis"]="Owner asked to see all ten pre-reviewed premium pet artworks on production, 2026-11-09. Exact original WebP bytes are SHA-256 locked."
 m["art_acceptance"]["review_artifact"]="audits/UX104_ALL10_VISUAL_REVIEW.md"
 if n>1:m["status"]="owner_requested_release_sha256_approved"
 p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n","utf-8")
for stage,script in [
 ("v103","audits/ux104_batch1_v103_patch.py"),
 ("v104","audits/ux104_batch2_v104_patch.py"),
 ("v105","audits/ux104_batch3_v105_patch.py")
]:
 result=subprocess.run(["python3",script],capture_output=True,text=True)
 if result.returncode:
  raise RuntimeError(f"Failed to prepare {stage}:\n{result.stdout}\n{result.stderr}")
 assert f'matkvest-iphone-{stage}' in sw.read_text("utf-8"),"Wrong stage "+stage
 print("UX104_APPLIED",stage,result.stdout.strip())
new_html=html.read_bytes();new_sw=sw.read_text("utf-8")
assert re.search(r'const APP_BUILD_HASH = "([a-f0-9]{64})"',new_sw).group(1)==hashlib.sha256(new_html).hexdigest()
assert new_sw.count("matkvest-iphone-v105")==1
for n in (1,2,3):
 assert new_html.count(f'id="mk-ux104-premium-pets-{n}"'.encode())==1, f"missing or duplicate script {n}"
for _,_,_,pid,sha,_,active in data:
 assert hashlib.sha256(active.read_bytes()).hexdigest()==sha
 assert ('./'+active.as_posix()) in new_sw,"Missing offline precache: "+pid
 assert active.as_posix().encode() in new_html, "Missing active source: "+pid
print("UX104_V105_STAGING_PREPARED",json.dumps({
 "version":"v105","pet_originals":len(data),
 "approved_art_exact_sha":{pid:sha for _,_,_,pid,sha,_,_ in data},
 "html_sha256":hashlib.sha256(new_html).hexdigest(),
 "production_mutated":False
},ensure_ascii=False))
