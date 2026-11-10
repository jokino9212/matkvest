from pathlib import Path
s=Path('index.html').read_text('utf8')
for key in ['mixed_compare_0','mixed_sub_0','compare_same_den_0','compare_same_num_0','mixed_compare','mixed_sub']:
 print('\nSOURCE_PROBE',key,'COUNT',s.count(key))
 start=0
 for n in range(min(2,s.count(key))):
  i=s.find(key,start)
  print('CONTEXT',key,n,repr(s[max(0,i-1800):i+2600]))
  start=i+len(key)
