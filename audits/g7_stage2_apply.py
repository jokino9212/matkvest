#!/usr/bin/env python3
"""Apply audited G7 patch to index.html. Safe, deterministic, no deployment."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'
PATCH = ROOT / 'audits' / 'g7_stage2_patch.js'
MARK = '/* МатКвест G7 этап 2: автономный проверенный патч генераторов */'
OLD = 'if(!targeted.has(raw)||Math.random()<0.08)return previousG7(id,stageOverride);'
NEW = 'if(!targeted.has(raw))return previousG7(id,stageOverride);'

src = INDEX.read_text(encoding='utf-8')
patch = PATCH.read_text(encoding='utf-8')
assert (src.count(OLD)==1 and MARK not in src) or (src.count(MARK)==1 and OLD not in src), 'Unknown HTML base; aborting'
assert src.rstrip().endswith('</body></html>'), 'Unexpected HTML end'
assert patch.count('g7BeforeAudit2')>=2 and "if(raw==='geo_side_angle_relation')" in patch
at = src.rfind('</script>')
assert at>0 and src.find('</body>',at)>0, 'Last inline JS not found'
fixed = src.replace(OLD,NEW)
if MARK in fixed:
    fixed = fixed[:fixed.index(MARK)].rstrip('\n') + '\n' + MARK + '\n' + patch + '\n' + fixed[fixed.rfind('</script>'):]
else:
    at = fixed.rfind('</script>')
    fixed = fixed[:at] + '\n' + MARK + '\n' + patch + '\n' + fixed[at:]
assert fixed.count(MARK)==1 and OLD not in fixed
INDEX.write_text(fixed,encoding='utf-8')
print(f'OK: updated {INDEX.name}; codepoints {len(src)} -> {len(fixed)}, only G7 stage 2 appended')
