#!/usr/bin/env python3
"""UX-105: fail-closed integration of ten *NEW* pet IDs. Never touches production or user data."""
import argparse,hashlib,json,re,shutil,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"index.html"
SW=ROOT/"sw.js"
MANIFEST=ROOT/"audits/ux105_new_pets_manifest.json"
BASELINE=ROOT/"audits/ux105_baseline_pets.json"
CACHE_SOURCE="matkvest-iphone-v106"
CACHE_TARGET="matkvest-iphone-v107"

def digest(data):return hashlib.sha256(data).hexdigest()

def load(p):return json.loads(p.read_text(encoding="utf-8"))

def verify_contract():
 m=load(MANIFEST);baseline=load(BASELINE)["items"];items=m["items"]
 assert m["phase"]=="UX-105" and len(items)==10,"Exactly 10 new pets required"
 assert len(baseline)==21 and len({x["id"] for x in baseline})==21
 ids=[x["id"] for x in items]
 assert len(set(ids))==10 and not (set(ids)&{x["id"] for x in baseline}),"Duplicate/old ID"
 assert all(x["id"].startswith("pet_") for x in items)
 assert all(x["rarity"] in {"common","uncommon","rare","epic","legendary"} for x in items)
 assert all(1<=x["level"]<=20 and 1<=x["price"]<=1500 for x in items)
 assert all(x["rewardOnly"] is False and x["achievement"] is None for x in items)
 assert all(len(x["name"])<50 and len(x["desc"])<150 for x in items)
 assert len(set(x["name"] for x in items))==10
 for r in ("common","uncommon","rare","epic","legendary"):
  subset=sorted(x["price"] for x in items if x["rarity"]==r)
  assert subset==sorted(set(subset)),"Duplicate price in rarity "+r
 html=INDEX.read_bytes()
 sw=SW.read_text("utf-8")
 assert CACHE_SOURCE in sw and CACHE_TARGET not in sw,"Unexpected release baseline"
 marker=re.search(r'const APP_BUILD_HASH = "([0-9a-f]{64})"',sw)
 assert marker is not None and marker.group(1)==digest(html),"HTML/PWA digest mismatch"
 assert b'id="mk-ux105-ten-original-pets"' not in html,"App already modified"
 assert all(x["source_asset"].encode() not in html for x in items),"New pet source already active"
 return m,baseline,items,html,sw

def release_artwork(items,m):
 assert m["artwork"]["art_approval"]=="approved","Artwork requires explicit human approval"
 assert m["artwork"]["accepted_count"]==10,"Every original artwork must be approved"
 hashes=set()
 for x in items:
  assert x["status"]=="approved", "Art not approved: "+x["id"]
  allowed=x.get("approved_sha256")
  assert isinstance(allowed,str) and re.fullmatch("[0-9a-f]{64}",allowed),x["id"]+" missing approved digest"
  assert allowed==x["sha256"],"Approved SHA and manifest SHA disagree for "+x["id"]
  data=ROOT/x["asset"]
  assert data.is_file(),"Missing actual new pet WebP: "+x["id"]
  blob=data.read_bytes()
  assert blob[:4]==b"RIFF" and blob[8:12]==b"WEBP", "Not real WebP: "+x["id"]
  assert 20_000<=len(blob)<=350_000,"Suspicious artwork bytes: "+x["id"]
  assert digest(blob)==allowed, "Unexpected original artwork bytes: "+x["id"]
  assert allowed not in hashes, "Repeated artwork in new 10 pets"
  hashes.add(allowed)
  dst=ROOT/x["source_asset"]
  assert not dst.exists(),"Existing published asset would be overwritten: "+x["id"]

def render_script(items):
 public=[]
 for x in items:
  public.append({k:x[k] for k in ("id","name","price","level","rarity","desc","rewardOnly","achievement")})
 js=json.dumps(public,ensure_ascii=False,separators=(",",":")).replace("<","\\u003c")
 # Script executes *after* SHOP_CATALOG and previous UX-104 media source overrides.
 return ('\n<!-- UX-105: ten NEW unique pet items; SHA-reviewed media only -->\n'
  '<style id="mk-ux105-pet-art-style">'
  '.mk-ux105-pet-art{display:block;max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;aspect-ratio:1/1;vertical-align:middle}'
  '</style>\n'
  '<script id="mk-ux105-ten-original-pets">\n'
  '(function(){\n'
  'const items='+js+';\n'
  'if(!Array.isArray(SHOP_CATALOG.pets))throw Error("UX105: missing original catalog");\n'
  'for(const item of items){\n'
  'if(SHOP_CATALOG.pets.some(p=>p.id===item.id))throw Error("UX105: duplicate "+item.id);\n'
  'item.icon=\'<img class="mk-ux105-pet-art" alt="" loading="eager" decoding="async" src="assets/source/pets/\'+item.id+\'.webp">\';\n'
  'SHOP_CATALOG.pets.push(item);\n'
  '}\n'
  '})();\n'
  '</script>\n')

def apply():
 m,baseline,items,html,sw=verify_contract()
 release_artwork(items,m)
 script=render_script(items)
 current=html.decode("utf-8")
 assert current.count("</body>")==1
 next_html=current.replace("</body>",script+"</body>",1).encode("utf-8")
 digest_html=digest(next_html)
 new_sw=sw.replace(CACHE_SOURCE,CACHE_TARGET,1)
 new_sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda match:match.group(1)+digest_html+match.group(2),new_sw,count=1)
 assert n==1
 for x in items:
  src=x["source_asset"]
  assert './'+src not in new_sw, "Duplicate PWA asset "+src
  needle='const APP_FILES = ['
  assert new_sw.count(needle)==1
  new_sw=new_sw.replace(needle,'const APP_FILES = ["./'+src+'", ',1)
 # Ensure all remote source paths cached for installed PWA.
 assert all('./'+x["source_asset"] in new_sw for x in items)
 assert new_sw.count(CACHE_TARGET)==1
 # No change until *all* gates above have passed.
 for x in items:
  shutil.copyfile(ROOT/x["asset"],ROOT/x["source_asset"])
 INDEX.write_bytes(next_html)
 SW.write_text(new_sw,encoding="utf-8")
 assert re.search(r'const APP_BUILD_HASH = "([0-9a-f]{64})"',SW.read_text("utf-8")).group(1)==digest(INDEX.read_bytes())
 print("UX105_NEW_10_STAGING_V107_PREPARED",json.dumps({"new":len(items),"total_real_pets":30,"cache":CACHE_TARGET,"sha256":digest_html},ensure_ascii=False))

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--preflight",action="store_true",help="contract only; no writes")
 parser.add_argument("--apply",action="store_true",help="requires all ten approved genuine WebP files")
 a=parser.parse_args()
 if a.preflight:
  m,baseline,items,html,sw=verify_contract()
  print("UX105_CONTRACT_OK",json.dumps({"existing":len(baseline)-1,"planned":len(items),
   "asset_approval":m["artwork"]["art_approval"],
   "art_created_in_repo":sum((ROOT/i["asset"]).is_file() for i in items),
   "stage":"v106 unchanged; v107 blocked until exact original art"},ensure_ascii=False))
 elif a.apply:apply()
 else:parser.error("use --preflight or --apply")

if __name__=="__main__":
 try:main()
 except Exception as e:
  print("UX105_FAIL_CLOSED: "+str(e),file=sys.stderr)
  raise SystemExit(1)
