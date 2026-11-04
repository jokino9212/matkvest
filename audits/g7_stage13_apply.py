from pathlib import Path
import hashlib,subprocess
p=Path('index.html')
src=p.read_text(encoding='utf-8')
patch=Path('audits/g7_stage13_patch.js').read_text(encoding='utf-8')
base='38bcef242723e7aba4d33c622a304c1f900d5e9254e2ffe291267d1bd436cf70'
marker='/* МатКвест G7 этап 13: без содержательных повторов во всех 107 темах */'
assert patch.startswith(marker)
if marker not in src:
    actual=hashlib.sha256(src.encode()).hexdigest()
    assert actual==base,f'Unexpected stage12 HTML: {actual}'
    at=src.rfind('</script>')
    assert at>0
    src=src[:at]+'\n'+patch+'\n'+src[at:]
    assert src.count(marker)==1
    assert src.count('<script')==src.count('</script>'),'Unbalanced scripts'
    p.write_text(src,encoding='utf-8')
else:
    assert src.count(marker)==1,'Duplicate stage13 patch'
subprocess.run(['python3','audits/g7_stage12_sync_pwa.py'],check=True)
print('STAGE13_HTML_SHA256',hashlib.sha256(src.encode()).hexdigest())
