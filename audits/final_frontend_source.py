from pathlib import Path
import hashlib,re,collections
s=Path('index.html').read_text('utf8')
assert hashlib.sha256(s.encode()).hexdigest()=='0f70384de5feb13a77570a18d35cc1d5f40969a7c999feb0dde9eefb60d97c84'
names=['openDataManager','readBackupFile','readImportFile','importBackupFile','showImportPreview','showImportError','mergePendingImport','showNextImportConflict','resolveImportConflict','applySmartImport','showSmartImportResult','confirmReplaceImport','replaceWithPendingImport','showStorageWarning','mkV877AuthorizeExplicitRecovery','renderProfileEdit854','showVueReport']
for name in names:
 matches=list(re.finditer(r'(?m)^\s*(?:async\s+)?function\s+'+name+r'\s*\(',s))
 print('FINAL_SOURCE',name,'count',len(matches))
 for m in matches:
  start=m.start(); nxt=re.search(r'(?m)^\s*(?:async\s+)?function\s+\w+\s*\(',s[m.end():])
  end=m.end()+nxt.start() if nxt else start+6000
  print(s[start:min(end,start+11000)])
for m in re.finditer(r'(?m)^.*(?:\.text\(\)|FileReader|mountBackupDialog|mountStorageRecovery|mountStudentProfileEditor).*$',s):
 line=m.group(0)
 if len(line)<14000 and re.search(r'backup|import|file|mountBackup|mountStorage|mountStudentProfileEditor',line,re.I):
  print('FINAL_BINDING',s.count('\n',0,m.start())+1,line[:3500])
print('FINAL_SOURCE_END')
