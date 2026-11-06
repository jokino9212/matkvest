from pathlib import Path
import re
s=Path("index.html").read_text("utf8")
terms=["let profiles={};","function save(){","function persistSilently(){","function reportStorageError(","function mk872ReadDraft(","function mk872DraftUsable(","function mk872RestoreDraft(","function migrateAllUnifiedData(","localStorage.setItem(\"mq4_profiles\"","function cleanupLegacyImport"]
for term in terms:
 p=s.find(term)
 print("TERM",term,"INDEX",p)
 if p>=0:print("SOURCE",repr(s[max(0,p-220):p+4900]))
