#!/usr/bin/env python3
"""Read-only smoke/regression against actual GitHub Pages, not file:// fixtures.

Test scripts are copied into temporary files with only the page URL substituted.
The original tests, source, and production are never modified.
"""
from pathlib import Path
from subprocess import run
from hashlib import sha256
from urllib.request import Request,urlopen
import os,re,sys,time

ROOT=Path(__file__).resolve().parents[1]
AUDITS=ROOT/'audits'
LIVE=os.getenv('MATKVEST_LIVE_URL','https://jokino9212.github.io/matkvest/')
SCRIPTS=[
 'quiz_stage01_fraction_browser.cjs',
 'quiz_stage01_navigation_browser.cjs',
 'quiz_stage02_input_browser.cjs',
 'quiz_stage03_skip_browser.cjs',
 'quiz_stage03_completion_browser.cjs',
 'quiz_stage04_pet_browser.cjs',
 'quiz_stage05_fresh_browser.cjs',
 'stage24_attempt_lifecycle_browser.cjs',
]
expected=sha256((ROOT/'index.html').read_bytes()).hexdigest()
sw=(ROOT/'sw.js').read_text('utf-8')
assert 'const APP_BUILD_HASH = "'+expected+'"' in sw,'Repository HTML and worker disagree'
def get(url):
 req=Request(url,headers={'User-Agent':'MatKvest-stage08-live-audit','Cache-Control':'no-cache'})
 with urlopen(req,timeout=40) as resp:
  body=resp.read();return body,resp.status
for attempt in range(1,13):
 try:
  body,status=get(LIVE+'?stage08='+str(attempt)+'-'+expected[:12])
  worker,swstatus=get(LIVE+'sw.js?stage08='+str(attempt)+'-'+expected[:12])
  remote=sha256(body).hexdigest()
  ok=(status==200 and swstatus==200 and remote==expected and ('const APP_BUILD_HASH = "'+expected+'"').encode() in worker)
  print('STAGE08_LIVE_HASH',{'attempt':attempt,'http':status,'sw_http':swstatus,'expected':expected,'remote':remote,'pass':ok},flush=True)
  if ok:break
 except Exception as e:
  print('STAGE08_LIVE_FETCH_ERROR',str(e),flush=True)
 if attempt==12:sys.exit('Published HTML/SW not matching repository; do not certify')
 time.sleep(5)
else:sys.exit('Live assets not ready')
for name in SCRIPTS:
 source=(AUDITS/name).read_text('utf-8')
 needle="'file://'+path.resolve('index.html')"
 if needle not in source:sys.exit('Unrecognized source URL fixture in '+name)
 assert source.count(needle)>=1
 # Only replace the static local location. Test logic and assertions stay unchanged.
 rewritten=source.replace(needle,'process.env.MATKVEST_LIVE_URL')
 destination=AUDITS/('.stage08_live_'+name)
 destination.write_text(rewritten,'utf-8')
 try:
  print('STAGE08_LIVE_TEST_START',name,flush=True)
  env={**os.environ,'MATKVEST_LIVE_URL':LIVE+'?stage08=test-'+expected[:12]}
  ret=run(['timeout','220s','node',str(destination)],cwd=str(ROOT),env=env,check=False)
  if ret.returncode:sys.exit('STAGE08_LIVE_TEST_FAIL '+name+' exit='+str(ret.returncode))
  print('STAGE08_LIVE_TEST_PASS',name,flush=True)
 finally:
  destination.unlink(missing_ok=True)
print('STAGE08_LIVE_ALL_PASS',len(SCRIPTS),'html_sha256',expected,flush=True)
