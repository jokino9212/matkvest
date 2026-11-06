#!/usr/bin/env python3
"""Allow only explicit verified backup replacement to leave v8.77 storage safe mode."""
from pathlib import Path
import re,hashlib
p=Path('index.html');sp=Path('sw.js')
s=p.read_text('utf8');sw=sp.read_text('utf8')
assert 'mkV877CorruptProfiles' in s
if 'mkV877AuthorizeExplicitRecovery' in s:
 print('Stage26 explicit recovery already present')
 raise SystemExit(0)
target='''function mkV877ProtectedSet(key,value){
 if(mkV877CorruptProfiles&&(key==="mq4_profiles"||key==="mq4_current_profile"||key==="mq4"))return;
 return localStorage.setItem(key,value);
}'''
assert s.count(target)==1
replacement=target+'''
let mkV877RecoveryExported=false;
function mkV877AuthorizeExplicitRecovery(imported){
 if(!mkV877CorruptProfiles)return true;
 if(!imported||typeof imported!=="object"||!Object.keys(imported).length)return false;
 const raw=localStorage.getItem("mq4_profiles");
 // Preserve original corrupt bytes before any replacement.
 try{
  if(raw!==null)localStorage.setItem("mk_v877_corrupt_profiles_rescue",raw);
 }catch(e){
  if(!mkV877RecoveryExported){
   alert("Недостаточно места для резервной копии повреждённых данных. Сначала скачайте их кнопкой в предупреждении.");
   return false;
  }
 }
 try{
  localStorage.setItem("mq4_profiles",JSON.stringify(imported));
 }catch(e){
  alert("Не удалось записать восстановленную резервную копию: закончилось место в браузере. Исходные повреждённые данные сохранены.");
  return false;
 }
 mkV877CorruptProfiles=false;
 document.getElementById("mk-v877-storage-recovery")?.remove();
 document.body.classList.remove("mk-v877-storage-risk");
 return true;
}'''
s=s.replace(target,replacement,1)
target='''function replaceWithPendingImport(){
 const data=pendingImport;if(!data)return openDataManager();'''
assert s.count(target)==1
s=s.replace(target,target+'''
 // User already confirmed "replace all data" in the import confirmation screen.
 // For corrupted storage, this is the sole route to unlock guarded profile writes.
''',1)
target=''' profiles=imported;
 if(data?.scope==="all"'''
assert s.count(target)==1
s=s.replace(target,''' if(!mkV877AuthorizeExplicitRecovery(imported))return;
 profiles=imported;
 if(data?.scope==="all"''',1)
target='''function applySmartImport(){
 if(!pendingImportPlan)return openDataManager();'''
assert s.count(target)==1
s=s.replace(target,'''function applySmartImport(){
 if(mkV877CorruptProfiles){
  alert("Сначала сохраните повреждённые данные, затем восстановите полную резервную копию через «Заменить все данные». Умное объединение с повреждённой базой запрещено.");
  return;
 }
 if(!pendingImportPlan)return openDataManager();''',1)
marker='</body>'
assert s.count(marker)==1
actions='''
<script id="mk-v877-storage-recovery-actions">
(function(){
 if(!mkV877CorruptProfiles)return;
 const attach=()=>{
  const banner=document.getElementById('mk-v877-storage-recovery');
  if(!banner||banner.querySelector('button'))return;
  const actions=document.createElement('span');actions.style.cssText='display:block;margin-top:6px';
  const download=document.createElement('button');
  download.type='button';download.textContent='Скачать повреждённые исходные данные';
  download.style.cssText='font:600 13px system-ui;padding:7px 12px;margin:3px;border:1px solid #7b5a14;border-radius:6px;background:white;color:#513800';
  download.onclick=()=>{
   const raw=localStorage.getItem('mq4_profiles');
   if(raw===null)return;
   const blob=new Blob([raw],{type:'text/plain;charset=utf-8'});
   const link=document.createElement('a'),url=URL.createObjectURL(blob);
   link.href=url;link.download='matkvest_corrupt_profiles_rescue.txt';
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);
   mkV877RecoveryExported=true;
  };
  const manager=document.createElement('button');
  manager.type='button';manager.textContent='Восстановить из полной копии';
  manager.style.cssText=download.style.cssText;
  manager.onclick=()=>{if(typeof openDataManager==='function')openDataManager()};
  actions.append(download,manager);banner.append(actions);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});
 else attach();
})();
</script>
'''
s=s.replace(marker,actions+marker)
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[a-f0-9]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1 and 'matkvest-iphone-v77' in sw
sp.write_text(sw,'utf8')
print('STORAGE_RECOVERY_ACTIONS_OK',sha)
