#!/usr/bin/env python3
"""Fail-closed stage protection for UX104 batch2; no user data or app writes."""
from pathlib import Path
import hashlib,json,subprocess
manifest=json.loads(Path('audits/ux104_batch2_manifest.json').read_text('utf-8'))
assert len(manifest['candidates'])==3
assert manifest['art_acceptance']['status']=='pending_visual_review'
files={}
for row in manifest['candidates']:
 f=Path(row['asset'])
 b=f.read_bytes()
 assert len(b)==row['size'] and b[:4]==b'RIFF' and b[8:12]==b'WEBP'
 assert hashlib.sha256(b).hexdigest()==row['sha256'],row['id']
 files[row['id']]=len(b)
assert set(files)=={'pet_dino','pet_cat','pet_dragon'}
targets=[Path('index.html'),Path('sw.js')]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in targets}
status=subprocess.run(['python3','audits/ux104_batch2_v104_patch.py','--preflight'],
                      capture_output=True,text=True)
assert status.returncode==0,(status.stdout,status.stderr)
assert 'matkvest-iphone-v102' in status.stdout
assert 'matkvest-iphone-v103' in status.stdout
assert 'pending_visual_review' in status.stdout
attempt=subprocess.run(['python3','audits/ux104_batch2_v104_patch.py'],
                       capture_output=True,text=True)
assert attempt.returncode!=0,'Unapproved candidate unexpectedly committed into staging!'
assert 'Release blocked:' in attempt.stderr,(attempt.stdout,attempt.stderr)
after={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in targets}
assert before==after,'Release guard touched application!'
print('UX104_BATCH2_INTEGRATION_GUARD_PASS',json.dumps({
 'real_verified_candidate_webps':files,
 'current_staging':'v102',
 'required_prior_staging':'v103',
 'human_art_approval':'pending',
 'publish_blocked':True,
 'html_sw_not_modified':True,
 'main_production':'untouched'
}))
