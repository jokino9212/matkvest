#!/usr/bin/env python3
"""Stage18D: repair tagged Russian quantity and align whole-number cell."""
from pathlib import Path
import hashlib,json
index=Path("index.html");service=Path("sw.js")
s=index.read_text("utf8");sw=service.read_text("utf8")
old="1ea6040ac5cb2d07335f642a26d228a697434c17fc542b364742b6ffdd236d20"
tag='id="matkvest-stage18d-grammar"'
if tag in s:
 assert "matkvest-iphone-v54" in sw and hashlib.sha256(s.encode("utf8")).hexdigest() in sw
 print("Stage18D already patched");raise SystemExit(0)
assert hashlib.sha256(s.encode("utf8")).hexdigest()==old, "Unexpected source v53"
assert "matkvest-iphone-v53" in sw and old in sw
css='.stage18-frac-entry>.stage18-frac-part:first-child{padding-bottom:33px}'
css_marker='.stage18-frac-bar{height:3px;'
assert s.count(css_marker)==1
s=s.replace(css_marker,css+'\n'+css_marker,1)
js=r"""
<script id="matkvest-stage18d-grammar">
/* HTML formatting of numerals is preserved while correcting Russian agreement. */
(function(){
 function russianDetails(n){
   const u=Math.abs(n),ten=u%10,teens=u%100;
   return teens>=11&&teens<=14?'деталей':ten===1?'деталь':ten>=2&&ten<=4?'детали':'деталей';
 }
 const before=makeG6Question;
 makeG6Question=function(id){
   const q=before.apply(this,arguments);
   if(String(id||'').replace(/^g6:/,'')!=='ratio_value'||typeof q?.text!=='string')return q;
   const text=q.text.replace(/В одной коробке\s+((?:<b>\s*)?\d+(?:\s*<\/b>)?)\s+одинаковых деталей/g,
     (_all,countText)=>'В одной коробке '+countText+' '+russianDetails(Number(countText.replace(/<[^>]*>/g,''))));
   return text===q.text?q:{...q,text};
 };
})();
</script>
"""
assert s.count("</body>")==1
s=s.replace("</body>",js+"\n</body>",1)
sha=hashlib.sha256(s.encode("utf8")).hexdigest()
sw=sw.replace("matkvest-iphone-v53","matkvest-iphone-v54").replace(old,sha)
assert sha in sw and "matkvest-iphone-v54" in sw
index.write_text(s,"utf8");service.write_text(sw,"utf8")
result={"previous_sha256":old,"sha256":sha,"cache":"matkvest-iphone-v54","fixes":["HTML-tagged Russian quantity agreement","mixed whole-cell vertical centering"]}
Path("audits/g5g6_stage18_ui_polish_patch_report.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(result,ensure_ascii=False))
