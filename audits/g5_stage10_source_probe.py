from pathlib import Path
s=Path('index.html').read_text('utf8')
for key in ["mixed_compare","mixed_sub","frac_compare_den","frac_compare_num","function makeG5Question("]:
 offsets=[];pos=0
 while True:
  i=s.find(key,pos)
  if i<0:break
  offsets.append(i);pos=i+len(key)
 print("SOURCE_PROBE",key,"COUNT",len(offsets))
 for k,i in list(enumerate(offsets))[-4:]:
  print("GENERATOR_CONTEXT",key,k,repr(s[max(0,i-1100):i+2300]))
