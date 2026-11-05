#!/usr/bin/env python3
"""Stage18G small pedagogical copy fix: Russian plural of sectors in Grade5 chart quiz."""
from pathlib import Path
import hashlib,json
idx=Path("index.html");swp=Path("sw.js")
s=idx.read_text("utf8");sw=swp.read_text("utf8")
expected="29e750205c4549e2c9d6105b49002ba1c505876518a2139e3da0ce5644e15859"
if 'id="matkvest-stage18g-sectors"' in s:
 assert 'matkvest-iphone-v55' in sw and hashlib.sha256(s.encode("utf8")).hexdigest() in sw
 raise SystemExit(0)
assert hashlib.sha256(s.encode("utf8")).hexdigest()==expected, "Source is not verified v54"
assert "matkvest-iphone-v54" in sw and expected in sw
script=r"""
<script id="matkvest-stage18g-sectors">
/* "2 равных сектора", "5 равных секторов", "21 равный сектор". */
(function(){
 function sectorPhrase(number){
   const n=Math.abs(Number(number)),t=n%10,h=n%100;
   if(h>=11&&h<=14)return 'равных секторов';
   if(t===1)return 'равный сектор';
   if(t>=2&&t<=4)return 'равных сектора';
   return 'равных секторов';
 }
 const original=makeG5Question;
 makeG5Question=function(id){
   const question=original.apply(this,arguments);
   if(id!=='charts'||typeof question?.text!=='string')return question;
   const text=question.text.replace(/(\d+)\s+равных\s+секторов/gi,(_,n)=>n+' '+sectorPhrase(n));
   return text===question.text?question:{...question,text,
     sig:String(question.sig||'')+':s18g-sector-copy'};
 };
})();
</script>
"""
assert s.count("</body>")==1
s=s.replace("</body>",script+"\n</body>",1)
new=hashlib.sha256(s.encode("utf8")).hexdigest()
sw=sw.replace("matkvest-iphone-v54","matkvest-iphone-v55").replace(expected,new)
assert "matkvest-iphone-v55" in sw and new in sw
idx.write_text(s,"utf8");swp.write_text(sw,"utf8")
p={"previous_sha256":expected,"sha256":new,"new_cache":"matkvest-iphone-v55","scope":"Grade5 chart sector inflection; all other generators unchanged"}
Path("audits/g5g6_stage18_sector_grammar_patch_report.json").write_text(json.dumps(p,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(p,ensure_ascii=False))
