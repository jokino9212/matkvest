from pathlib import Path
s=Path('index.html').read_text('utf-8')
for key in ["case 'frac_common_lcm':","function mk5Rational(","function mk5MixedAnswer(","function mk5Num(","function mk5Choose(","case 'frac_add':","case 'frac_sub':"]:
 p=0; positions=[]
 while True:
  i=s.find(key,p)
  if i<0:break
  positions.append(i);p=i+len(key)
 print('STAGE14B_SOURCE',key,'COUNT',len(positions))
 for i in positions[-2:]:
  print('STAGE14B_SOURCE_CONTEXT',key,repr(s[max(0,i-200):i+2800]))
