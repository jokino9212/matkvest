from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
terms=["let profiles={};","function save(){","function persistSilently(){","function reportStorageError(","function mk872ReadDraft(","function mk872DraftUsable(","function mk872RestoreDraft(","function migrateAllUnifiedData(","localStorage.setItem(\"mq4_profiles\"","function cleanupLegacyImport"]
for term in terms:
 p=s.find(term)
 print("TERM",term,"INDEX",p)
 if p>=0:print("SOURCE",repr(s[max(0,p-220):p+4900]))

for pat in ['function finalizeImport(', 'function applyImport(', 'function confirmImport(', 'function importBackup(', 'function loadBackup(', 'function importProfiles(', 'Резервная копия восстановлена','pendingImport=null;pendingImportPlan=null;', 'function openBackup(', 'function openImport(']:
 p=s.find(pat)
 if p>=0: print('IMPORT',pat,'at',p,repr(s[max(0,p-1900):p+2100]))
