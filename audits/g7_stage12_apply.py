from pathlib import Path
import re,hashlib
root=Path('.')
html=root/'index.html';worker=root/'sw.js'
old_sha='3d93fc220d9a8e29b2a299a22036b1d50eefad65b40364e1de1e52b4d8d6de88'
source=html.read_text(encoding='utf-8')
old='''<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
</script>'''
replacement=(root/'audits/g7_stage12_autoupdate.html').read_text(encoding='utf-8').strip()
marker='<script id="mk-stage12-pwa-refresh">'
if marker not in source:
    assert hashlib.sha256(source.encode()).hexdigest()==old_sha,'Unexpected stage11 base'
    assert source.count(old)==1,'Registration script not found exactly once'
    source=source.replace(old,replacement,1)
    assert source.count(marker)==1
    html.write_text(source,encoding='utf-8')
else:
    assert source.count(marker)==1,'Duplicated update handler'
newsha=hashlib.sha256(source.encode()).hexdigest()
sw=worker.read_text(encoding='utf-8')
if 'matkvest-iphone-v39' in sw:
    assert sw.count('matkvest-iphone-v39')==1
    sw=sw.replace('matkvest-iphone-v39','matkvest-iphone-v40',1)
if 'const APP_BUILD_HASH' in sw:
    sw,n=re.subn(r'const APP_BUILD_HASH = "[a-f0-9]{64}";',f'const APP_BUILD_HASH = "{newsha}";',sw)
    assert n==1,'Cannot update SW build hash'
else:
    assert 'const CACHE_NAME = "matkvest-iphone-v40";' in sw,'Unexpected SW base'
    sw=sw.replace('const CACHE_NAME = "matkvest-iphone-v40";','const CACHE_NAME = "matkvest-iphone-v40";\nconst APP_BUILD_HASH = "'+newsha+'";',1)
worker.write_text(sw,encoding='utf-8')
print('STAGE12 HTML_SHA256',newsha)
print('STAGE12 SW_SHA256',hashlib.sha256(sw.encode()).hexdigest())
print('STAGE12 SW_CACHE',re.search(r'const CACHE_NAME = "[^"]+";',sw).group())
assert source.count(marker)==1 and source.count('<script')==source.count('</script>'),'Script tags unbalanced'
