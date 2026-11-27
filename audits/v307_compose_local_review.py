"""Assemble isolated combined preview; do not mutate pinned v306 or publish."""
import hashlib,json,shutil,sys,re
from pathlib import Path
src=Path(sys.argv[1]);out=Path(sys.argv[2]);local=out/'local';local.mkdir(parents=True,exist_ok=True)
expected='7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318'
raw=(src/'index.html').read_bytes()
assert hashlib.sha256(raw).hexdigest()==expected
# Copy only runtime assets, not repository metadata or audit files.
for p in src.iterdir():
    if p.is_file() and (p.suffix in {'.js','.webmanifest','.ico','.png','.svg'} or p.name=='index.html'):shutil.copy2(p,local/p.name)
shutil.copytree(src/'assets',local/'assets',dirs_exist_ok=True)
html=raw.decode()
assert html.count('</body>')==1
# Outside Vue-managed header DOM: safe for both Vue and HTML fallback.
bridge='''<aside id="mk307-mode-bridge" style="position:fixed;right:12px;bottom:12px;z-index:90;max-width:calc(100vw - 24px);background:#fff;border:1px solid #bdd9cd;border-radius:12px;padding:8px;box-shadow:0 2px 8px #0002"><a href="../integrations/v307/account_review.html" id="mk307-account-link" style="display:inline-block;padding:10px;color:#147d64;font-weight:700">Серверный кабинет (тест)</a><small style="display:block;color:#46685c">Локальные профили остаются на устройстве</small></aside>'''
html=html.replace('</body>',bridge+'</body>')
(local/'index.html').write_text(html,encoding='utf-8')
# Keep v306 script version and fingerprints; only the HTML digest and cache namespace differ.
sw=(src/'sw.js').read_text(encoding='utf-8')
assert expected in sw
sw=sw.replace(expected,hashlib.sha256(html.encode()).hexdigest()).replace('matkvest-iphone-v','matkvest-v307-local-review-v')
(local/'sw.js').write_text(sw,encoding='utf-8')
(out/'index.html').write_text('''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>МатКвест v307 — тест</title><body style="font:18px system-ui;max-width:640px;margin:40px auto;padding:16px;background:#f1f8f4;color:#163d34"><h1>МатКвест v307</h1><p>Изолированная сборка. Только искусственные данные, реальные оплаты отключены.</p><p><a href="local/index.html">Локальные профили — МатКвест v306</a></p><p><a href="integrations/v307/account_review.html">Серверный кабинет</a></p></body></html>''',encoding='utf-8')
print('PASS_V307_COMPOSE_PINNED_LOCAL',hashlib.sha256((local/'index.html').read_bytes()).hexdigest())
