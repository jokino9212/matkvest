"""Test-only transfer of public v304 answer focus to verified v302 site."""
import hashlib, json, re, sys
from pathlib import Path
OLD_BUILD='79f623135898e27feb8f7ee2457de1bb891955c1d92062f208f2e09ff91c924a'
OLD='#modal .answers button.answer:focus-visible{\n  outline:3px solid rgba(23,107,84,.36);outline-offset:2px\n}'
NEW='#modal .answers button.answer:focus-visible,\n#modal button.quick-answer:focus-visible{\n  outline:3px solid #2563eb;outline-offset:2px\n}'
def sha(data): return hashlib.sha256(data).hexdigest()
def need(condition,message):
    if not condition: raise RuntimeError(message)
def one(s,a,b):
    need(s.count(a)==1,'Expected one source anchor: '+a[:120]); return s.replace(a,b)
def apply(root):
    root=Path(root).resolve()
    html=root/'index.html'; worker=root/'sw.js'
    old=html.read_bytes().decode('utf-8'); sw=worker.read_bytes().decode('utf-8')
    need(sha(old.encode())==OLD_BUILD,'Wrong v302 base')
    need(old.count('?v=302')==30,'Wrong index version count')
    need(old.count('retiredPet:true')==3 and old.count('id="mk-pet-cleanup-reward-art"')==1,'Missing pet cleanup')
    match=re.search(r'const SCRIPT_HASHES = (\{[^\n]+\});',sw)
    need(match is not None,'Missing script hash fence'); hashes=json.loads(match[1])
    changed={}
    for name,digest in hashes.items():
        p=(root/name).resolve(); need(p.is_relative_to(root) and p.is_file(),'Unsafe or missing file '+name)
        raw=p.read_bytes(); need(sha(raw)==digest,'Wrong hash '+name)
        if name.startswith('integration/') and name.endswith('.mjs'):
            src=raw.decode('utf-8'); next_src=src.replace('?v=302','?v=305')
            if next_src!=src: changed[p]=next_src.encode(); hashes[name]=sha(changed[p])
    need(len(changed)==4,'Unexpected integration import changes')
    new=one(old,OLD,NEW).replace('?v=302','?v=305')
    need(new.replace('?v=305','?v=302').replace(NEW,OLD)==old,'Unexpected HTML delta')
    sw=one(sw,'const CACHE_NAME = "matkvest-integration95-v302";','const CACHE_NAME = "matkvest-integration95-v305";')
    sw=one(sw,'const APP_BUILD_HASH = "'+OLD_BUILD+'";','const APP_BUILD_HASH = "'+sha(new.encode())+'";')
    sw=one(sw,match[0],'const SCRIPT_HASHES = '+json.dumps(hashes)+';')
    for p,data in changed.items(): p.write_bytes(data)
    html.write_bytes(new.encode());worker.write_bytes(sw.encode())
    need(sha(new.encode())=='233b38def492eecc64cb45e13a72834084d23099bf6a29ac186698c016bc4c6f','Unexpected candidate HTML')
    need(sha(sw.encode())=='953c2057bf661dbe179ec06db54f8e79d149d052dafd8d7806b5d5b3ec947357','Unexpected candidate worker')
    print('PASS_V305_FOCUS_ONLY',sha(new.encode()),sha(sw.encode()),flush=True)
if __name__=='__main__': apply(sys.argv[1])
