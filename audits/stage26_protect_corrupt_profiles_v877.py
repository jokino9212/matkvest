#!/usr/bin/env python3
"""Protect malformed multi-student profile storage from destructive empty-profile writes."""
from pathlib import Path
import hashlib,re
p=Path('index.html')
sp=Path('sw.js')
s=p.read_text('utf8')
sw=sp.read_text('utf8')
assert "matkvest-iphone-v76" in sw and "mkV877CorruptProfiles" not in s
needle='let profiles={};\nlet currentProfile="Ученик";\nlet state={...EMPTY_STATE};\ntry{'
assert s.count(needle)==1, "Profile bootstrap changed"
prelude='''let profiles={};
let currentProfile="Ученик";
let state={...EMPTY_STATE};
/* v8.77: Never overwrite an unreadable multi-student profile document. */
let mkV877CorruptProfiles=false;
try{
 const raw=localStorage.getItem("mq4_profiles");
 if(raw!==null){
  const data=JSON.parse(raw);
  if(!data||typeof data!=="object"||Array.isArray(data)||Object.values(data).some(v=>!v||typeof v!=="object"||Array.isArray(v))){
   throw new Error("Invalid profile collection shape");
  }
 }
}catch(e){mkV877CorruptProfiles=true}
function mkV877ProtectedSet(key,value){
 if(mkV877CorruptProfiles&&(key==="mq4_profiles"||key==="mq4_current_profile"||key==="mq4"))return;
 return localStorage.setItem(key,value);
}
try{'''
s=s.replace(needle,prelude,1)
old='}catch(e){profiles={"Ученик":{...EMPTY_STATE}};currentProfile="Ученик";state={...EMPTY_STATE}}'
assert s.count(old)==1
new='''}catch(e){
 // On broken multi-profile JSON, recover the most recent *valid* legacy current-profile snapshot in memory.
 // Do not overwrite the damaged multi-profile document or its legacy fallback.
 let legacy=null;
 try{
  const parsed=JSON.parse(localStorage.getItem("mq4")||"null");
  if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))legacy=parsed;
 }catch(ignore){}
 currentProfile=localStorage.getItem("mq4_current_profile")||"Ученик";
 profiles={[currentProfile]:{...EMPTY_STATE,...(legacy||{})}};
 state={...EMPTY_STATE,...(legacy||{})};
 state.courseProgress=state.courseProgress||{};
 state.questionHistory=state.questionHistory||{};
}'''
s=s.replace(old,new,1)
# Strictly intercept only the three app-profile storage slots, never drafts, cache or arbitrary app keys.
counts={}
for key in ('mq4_profiles','mq4_current_profile','mq4'):
 pattern=r'localStorage\.setItem\(\s*([\'"])'+re.escape(key)+r'\1\s*,'
 matches=list(re.finditer(pattern,s))
 counts[key]=len(matches)
 assert matches, f'Expected explicit save points for {key}'
 s=re.sub(pattern,lambda m:'mkV877ProtectedSet('+m.group(1)+key+m.group(1)+',',s)
assert counts['mq4_profiles']>=2
# Persistent, accessible banner; does not tamper with raw storage.
marker='</body>'
assert s.count(marker)==1
notice='''
<style id="mk-v877-storage-recovery-style">
#mk-v877-storage-recovery{position:fixed;z-index:2147483000;top:0;left:0;right:0;
 padding:12px 16px;background:#fff3cf;color:#513800;border-bottom:2px solid #b98925;
 font:600 14px/1.5 system-ui,sans-serif;text-align:center;box-sizing:border-box}
#mk-v877-storage-recovery a{color:inherit;text-decoration:underline}
body.mk-v877-storage-risk{padding-top:86px!important}
@media(max-width:390px){body.mk-v877-storage-risk{padding-top:120px!important}}
</style>
<script id="mk-v877-storage-recovery">
if(mkV877CorruptProfiles){
 const showStorageWarning=()=>{
  if(document.getElementById('mk-v877-storage-recovery'))return;
  const node=document.createElement('div');node.id='mk-v877-storage-recovery';
  node.setAttribute('role','alert');node.textContent='⚠️ Данные профилей повреждены. Автосохранение профилей остановлено, чтобы не уничтожить исходные данные. Восстановите учеников из резервной копии через раздел профилей.';
  document.body.prepend(node);
  document.body.classList.add('mk-v877-storage-risk');
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showStorageWarning,{once:true});
 else showStorageWarning();
}
</script>
'''
s=s.replace(marker,notice+marker)
assert '8.76' in s
s=s.replace('8.76','8.77')
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
sw=sw.replace('matkvest-iphone-v76','matkvest-iphone-v77')
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[a-f0-9]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1
sp.write_text(sw,'utf8')
print('PATCH_OK',sha,'protected writes',counts)
