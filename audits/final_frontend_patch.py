from pathlib import Path
import hashlib,os
assert os.environ.get('GITHUB_REPOSITORY')=='jokino9212/matkvest'
assert os.environ.get('GITHUB_REF')=='refs/heads/refactor/route-vue-actions-from-7c14ce9'
page=Path('index.html'); worker=Path('sw.js')
s=page.read_text('utf8')
assert hashlib.sha256(s.encode()).hexdigest()=='0f70384de5feb13a77570a18d35cc1d5f40969a7c999feb0dde9eefb60d97c84'
old='''function readBackupFile(file){
 if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
   try{
     const data=JSON.parse(String(reader.result||""));
     const err=validateBackupObject(data);
     if(err){showImportError(err);return}
     pendingImport=data;pendingImportFilename=file.name||"";pendingConflictResolutions={};
     showImportPreview(data,file.name);
   }catch(e){showImportError("Не удалось прочитать JSON-файл. Возможно, файл повреждён.")}
 };
 reader.onerror=()=>showImportError("Браузер не смог прочитать выбранный файл.");
 reader.readAsText(file,"utf-8");
}'''
new='''let mkFinalBackupReadRevision=0;
function readBackupFile(file){
 if(!file)return;
 const host=modal.querySelector(":scope > .vue-report");
 if(!host||!host.isConnected||!overlay.classList.contains("show")||!host.querySelector("#backupFileInput"))return;
 const revision=++mkFinalBackupReadRevision;
 const profileId=state.profileId;
 const isCurrent=()=>revision===mkFinalBackupReadRevision&&host.isConnected&&host.parentNode===modal&&
   overlay.classList.contains("show")&&!!host.querySelector("#backupFileInput")&&state.profileId===profileId&&!mk872Dialog;
 const reader=new FileReader();
 reader.onload=()=>{
   if(!isCurrent())return;
   try{
     const data=JSON.parse(String(reader.result||""));
     const err=validateBackupObject(data);
     if(err){showImportError(err);return}
     pendingImport=data;pendingImportFilename=file.name||"";pendingConflictResolutions={};
     showImportPreview(data,file.name);
   }catch(e){showImportError("Не удалось прочитать JSON-файл. Возможно, файл повреждён.")}
 };
 reader.onerror=()=>{if(isCurrent())showImportError("Браузер не смог прочитать выбранный файл.")};
 reader.readAsText(file,"utf-8");
}'''
assert s.count(old)==1
s=s.replace(old,new,1)
assert s.count('?v=289')>=25 and '?v=290' not in s
s=s.replace('?v=289','?v=290')
sw=worker.read_text('utf8')
assert sw.count('const CACHE_NAME = "matkvest-iphone-v289";')==1
page.write_text(s,'utf8');worker.write_text(sw.replace('const CACHE_NAME = "matkvest-iphone-v289";','const CACHE_NAME = "matkvest-iphone-v290";'),'utf8')
print('PASS_FINAL_IMPORT_PATCH',hashlib.sha256(s.encode()).hexdigest())
