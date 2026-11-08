#!/usr/bin/env python3
"""Never ship merely-valid images: UX-104 release requires exact reviewed SHA."""
from pathlib import Path
import subprocess,hashlib,json,shutil

page=Path('index.html')
sw=Path('sw.js')
script='audits/ux104_batch1_v103_patch.py'
manifest=json.loads(Path('audits/ux104_batch1_manifest.json').read_text('utf8'))
expected={'pet_bot','pet_owl','pet_penguin'}
assert set(manifest['art_acceptance']['accepted_sha256'])==expected
assert manifest['art_acceptance']['status']=='pending_visual_review'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
before={str(p):digest(p) for p in [page,sw]}
pre=subprocess.run(['python3',script,'--preflight'],capture_output=True,text=True)
assert pre.returncode==0,(pre.stdout,pre.stderr)
assert 'pending_visual_review' in pre.stdout
created=[]
try:
 for id,src in [('pet_bot','pet_phoenix'),('pet_owl','pet_orb'),('pet_penguin','pet_ghost')]:
  p=Path('assets/source/pets/'+id+'.webp')
  assert not p.exists(),f'Could overwrite actual approved pet: {p}'
  shutil.copyfile(Path('assets/source/pets/'+src+'.webp'),p)
  created.append(p)
 blocked=subprocess.run(['python3',script],capture_output=True,text=True)
 assert blocked.returncode!=0,'Staging update unexpectedly allowed without visual review!'
 assert 'UX104 visual art approval missing' in blocked.stderr+blocked.stdout,(blocked.stdout,blocked.stderr)
 assert {str(p):digest(p) for p in [page,sw]}==before,'Blocked update modified production-facing files'
 print('UX104_ART_APPROVAL_GATE_PASS',json.dumps({
   'pending':True,'fake_genuine_webps':3,'approved_hashes':0,
   'no_staging_side_effect':True,'staging':'v102','production':'v81'}))
finally:
 for p in created:
  if p.exists():p.unlink()
