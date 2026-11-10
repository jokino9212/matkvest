"""Stage06 preflight guard: protect v107 assets, PWA version and economy."""
from pathlib import Path
import hashlib,json,re
h=Path('index.html');sw=Path('sw.js')
assert h.is_file() and sw.is_file()
html=h.read_bytes();code=html.decode('utf-8')
worker=sw.read_text('utf-8')
digest=hashlib.sha256(html).hexdigest()
assert re.search(r'const APP_BUILD_HASH = "([0-9a-f]{64})"',worker).group(1)==digest
assert 'matkvest-iphone-v107' in worker,'Do not reset PWA cache version'
m=json.loads(Path('audits/ux105_new_pets_manifest.json').read_text('utf-8'))
assert m['artwork']['art_approval']=='approved'
assert m['artwork']['accepted_count']==10
assert len(m['items'])==10
for element in [
 'mk30-artwork-viewer-script',
 'mk872AvatarViewer',
 'mk-stage02-fraction-input',
 'function skipNormalQuiz',
 'mk876-grade5-quality',
]:
 assert element in code,'Missing '+element
assert 'const level=Math.min(2,Math.max(0,stage-1+phase));' in code
assert '${raw}:${topic}:${qq.templateId}:${promptKey}' not in code
assert '${raw}:${topic}:${promptKey}' in code
print('STAGE06_STATIC_PREFLIGHT_PASS',dict(html_sha256=digest,pet_manifest_count=len(m['items']),pwa_cache='v107'))
