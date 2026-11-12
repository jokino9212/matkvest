from pathlib import Path
import re
s=Path('index.html').read_text('utf8')
a=s.splitlines()
print('SRC_STATS',len(a),len(s))
for term in ['const G5_FRACTIONS','const G5_DECIMALS','function g5AllTopics','function g5DonorQuestion','function g5Lesson','function makeG5Question','function g5q(','function g5nums(','function g5NewRat(','const G5_FRACTIONS=']:
  hits=[i for i,l in enumerate(a) if term in l]
  print('ANCHOR',term,hits[:8])
  for i in hits[:1]:
    before=i
    after=i+45 if 'const G5_' in term or 'function g5DonorQuestion' in term else i+12
    print('\n'.join(f'{j+1}: {a[j][:1100]}' for j in range(before,min(after,len(a)))))
for term in ['frac_add_same','frac_compare','frac_subtract','frac_to_mixed','mixed_to_frac','frac_common','dec_add','dec_div','frac_unit','simple_fraction']:
  hits=[(i,l[:600]) for i,l in enumerate(a) if term in l]
  print('TERM',term,'count',len(hits),'example',hits[:4])
idx=next((i for i,l in enumerate(a) if 'function g5DonorQuestion' in l),-1)
if idx>=0:
 print('DONOR_BEGIN')
 for j in range(idx,min(idx+230,len(a))):print(f'{j+1}: {a[j][:600]}')
 print('DONOR_END')
idx=next((i for i,l in enumerate(a) if 'function makeG5Question' in l),-1)
if idx>=0:
 print('MAKE_BEGIN')
 for j in range(idx,min(idx+135,len(a))):print(f'{j+1}: {a[j][:700]}')
 print('MAKE_END')
