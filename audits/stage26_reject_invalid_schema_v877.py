#!/usr/bin/env python3
"""Ensure parseable-but-malformed profile collections use safe legacy fallback too."""
from pathlib import Path
import hashlib,re
p=Path('index.html');sp=Path('sw.js')
s=p.read_text('utf8');sw=sp.read_text('utf8')
if 'mkV877CorruptProfiles)throw new Error("Bad profile schema")' in s:
 print('Invalid-schema guard already present');raise SystemExit(0)
old='''try{
  profiles=JSON.parse(localStorage.getItem("mq4_profiles")||"null")||{};'''
assert s.count(old)==1
new='''try{
  if(mkV877CorruptProfiles)throw new Error("Bad profile schema");
  profiles=JSON.parse(localStorage.getItem("mq4_profiles")||"null")||{};'''
s=s.replace(old,new,1)
p.write_text(s,'utf8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[a-f0-9]{64}(";)',lambda m:m.group(1)+sha+m.group(2),sw)
assert n==1 and 'matkvest-iphone-v77' in sw
sp.write_text(sw,'utf8')
print('CORRUPT_PROFILE_SCHEMA_GUARD_OK',sha)
