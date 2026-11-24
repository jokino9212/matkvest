from pathlib import Path
s=Path("index.html").read_text().splitlines()
for start,end in [(10700,10745),(10810,10940),(27980,28095),(41600,41655),(26820,26890),(41035,41065)]:
 print("V288_SOURCE",start,end)
 for i in range(start-1,end): print(f"{i+1}: {s[i]}")
