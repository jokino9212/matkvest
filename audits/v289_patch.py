#!/usr/bin/env python3
from pathlib import Path
import hashlib, os
root=Path(__file__).resolve().parent.parent
assert os.environ.get("GITHUB_REPOSITORY")=="jokino9212/matkvest"
assert os.environ.get("GITHUB_REF")=="refs/heads/refactor/route-vue-actions-from-7c14ce9"
page=root/"index.html"; worker=root/"sw.js"
raw=page.read_bytes()
assert hashlib.sha256(raw).hexdigest()=="b06b8c407f827596eca66083dea4bd93e9831056793feb47a57cde7491310504"
assert raw.count(b"?v=288")>=25 and b"?v=289" not in raw
page.write_bytes(raw.replace(b"?v=288",b"?v=289"))
sw=worker.read_bytes()
assert sw.count(b'const CACHE_NAME = "matkvest-iphone-v288";')==1
worker.write_bytes(sw.replace(b'const CACHE_NAME = "matkvest-iphone-v288";',b'const CACHE_NAME = "matkvest-iphone-v289";'))
print("PASS_V289_VERSION_ONLY",hashlib.sha256(page.read_bytes()).hexdigest())
