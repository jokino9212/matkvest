#!/usr/bin/env python3
"""Produce canonical topic-ID candidates; never auto-publish a Free entitlement policy."""
from pathlib import Path
import json,re,math
source=Path('audits/stage29_frontend_topic_inventory.json')
inventory=json.loads(source.read_text('utf8'))
assert inventory['schema']=='matkvest-stage29-topic-inventory-v1'
output={'schema':'matkvest-stage29-topic-candidates-v1','policy_status':'UNAPPROVED',
        'warning':'These are UI catalog entries, NOT yet a verified practical-topic whitelist. Never use automatically as an active Free 25% policy.',
        'grades':{}}
total=0
for grade_str,group in inventory['grades'].items():
 grade=int(grade_str);values=[]
 for row in group['topics']:
  rid=row['id']
  if rid is None:continue
  assert re.fullmatch(r'[A-Za-z0-9_]+(?::[A-Za-z0-9_]+)?',rid),repr(rid)
  pid='g'+str(grade)+':'
  if re.match(r'g\d+:',rid):
   assert rid.startswith(pid),rid
   cid=rid
  else:cid=pid+rid
  values.append({'id':cid,'source_id':rid,'title':row['title'],'implemented':row['implemented']})
 ids=[x['id'] for x in values]
 assert len(ids)==len(set(ids)),f'Grade {grade} duplicate canonical IDs'
 total+=len(ids)
 count=len(ids)
 output['grades'][grade_str]={
  'source':group['source'],'catalog_entries':count,
  'candidate_25pct_ceil':math.ceil(count/4),
  'practical_topic_ids_verified':False,
  'eligibility_note':'Grade 4 DOM provides broad sections rather than audited per-practice topics' if grade==4 else 'Needs manual classification of practical topics and policy curation',
  'topics':values
 }
 print('STAGE29_POLICY_CANDIDATES',json.dumps({'grade':grade,'entries':count,
       'ceil_quarter':math.ceil(count/4),'grade4_needs_breakdown':grade==4},ensure_ascii=False))
assert total==404,total
dest=Path('audits/stage29_canonical_topic_candidates.json')
dest.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('STAGE29_CATALOG_POLICY_PREVIEW_OK',total,'entries',dest.stat().st_size,'bytes')
