from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
pats=[
 r'function (?:createProfile|switchProfile|selectProfile|addProfile|deleteProfile|loadProfile|saveProfile|profileKey|profileId|mk872ProfileId|mk872DraftKey|mk872ReadDraft|mk872DeleteDraft|mk872OfferResume|mk872PersistDraft|openProfiles|renderProfiles|openProfileManager|openProfileSwitcher)\(',
 r'(?i)function \w*(?:Profile|Student|Pupil)\w*\(',
 r'(?i)\.profile-pill|profile-switch|профил[ьи]|сменить ученика',
]
for pat in pats:
 ms=list(re.finditer(pat,s))
 print('PATTERN',pat,'COUNT',len(ms))
 for m in ms[:50]:print('MATCH',m.start(),repr(s[max(0,m.start()-120):m.start()+280]))
for needle in ['function switchProfile(', 'function createProfile(', 'function mk872ProfileId(', 'function mk872DraftKey(', 'function mk872ReadDraft(', 'function mk872PersistDraft(', 'function mk872OfferResume(', 'function renderProfiles(', 'function loadProfile(']:
 m=re.search(re.escape(needle),s)
 if m: print('DETAIL',needle,repr(s[m.start():m.start()+3800]))

for needle in ['function selectProfile(', 'function openProfiles(', 'const mk872ProfileId=', 'mk872ProfileId=', 'mk872DraftKey=', 'function save(', 'function persistSilently(', 'const EMPTY_STATE=', 'let profiles=', 'let currentProfile=', 'function mk872HasFinishedRecord(']:
 p=s.find(needle);print('TARGET',needle,'pos',p,'ctx',repr(s[max(0,p-400):p+3600]) if p>=0 else '')
