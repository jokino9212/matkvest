"""Stage02 candidate patch: feedback per fraction cell + keyboard focus flow.
Idempotent, limited to one appended script, PWA fingerprint synchronized.
"""
from pathlib import Path
import hashlib,re
h=Path("index.html"); w=Path("sw.js")
html=h.read_text("utf-8")
marker='id="mk-stage02-fraction-input"'
script=r'''
<script id="mk-stage02-fraction-input">
/* Grade-5/6 fraction cells: per-field feedback and predictable keyboard progression. */
(function(){
"use strict";
const fieldIds=["quizFracWhole","quizFracNum","quizFracDen"];
const getField=id=>document.getElementById(id);
function applicable(){
  return typeof stage18UsesFractionBoxes==="function" && stage18UsesFractionBoxes(q);
}
function desiredParts(question){
  if(!question)return null;
  const tmp=document.createElement("div");
  tmp.innerHTML=String(question.correctHtml||"");
  const fraction=tmp.querySelector(".frac");
  const wholeNode=tmp.querySelector(".mixed .whole");
  if(fraction){
    return {
      quizFracWhole:wholeNode?String(wholeNode.textContent||"").trim():"",
      quizFracNum:String(fraction.querySelector(".num")?.textContent||"").trim(),
      quizFracDen:String(fraction.querySelector(".den")?.textContent||"").trim()
    };
  }
  const text=String(question.correctText||"").trim();
  if(/^[+-]?\d+$/.test(text))return {quizFracWhole:text,quizFracNum:"",quizFracDen:""};
  return null;
}
function clearClasses(el){el?.classList.remove("good","bad")}
function sameCell(a,b){
  if(a===""||b==="")return a===b;
  return /^[+-]?\d+$/.test(a)&&/^[+-]?\d+$/.test(b)?Number(a)===Number(b):a===b;
}
function markCells(){
  if(!applicable()||answered)return;
  const expected=desiredParts(q);
  if(!expected)return;
  for(const id of fieldIds){
    const el=getField(id);if(!el)continue;
    const got=String(el.value||"").trim(),target=String(expected[id]||"").trim();
    clearClasses(el);
    if(!got&&!target)continue;
    el.classList.add(sameCell(got,target)?"good":"bad");
  }
}
const previousCheck=checkQuizInput;
checkQuizInput=function(){
  const result=previousCheck.apply(this,arguments);
  if(!answered&&applicable())markCells();
  return result;
};
document.addEventListener("input",event=>{
  const el=event.target;
  if(!fieldIds.includes(el?.id)||!applicable())return;
  clearClasses(el);
  const expected=desiredParts(q),value=String(el.value||"").trim();
  if(!expected||!value||!/^[+-]?\d+$/.test(value))return;
  const next=el.id==="quizFracWhole"?"quizFracNum":el.id==="quizFracNum"?"quizFracDen":null;
  if(!next)return;
  const correct=String(expected[el.id]||"").replace(/^[+-]/,"");
  const typed=value.replace(/^[+-]/,"");
  if(correct&&typed.length>=correct.length)getField(next)?.focus();
});
document.addEventListener("keydown",event=>{
  const el=event.target,idx=fieldIds.indexOf(el?.id);
  if(idx<0||!applicable())return;
  if(event.key==="Backspace"&&!String(el.value||"").length&&idx>0){
    event.preventDefault();getField(fieldIds[idx-1])?.focus();return;
  }
  if((event.key==="Enter"||event.key==="ArrowRight")&&idx<2){
    event.preventDefault();getField(fieldIds[idx+1])?.focus();
  }
  if(event.key==="ArrowLeft"&&idx>0&&el.selectionStart===0){
    event.preventDefault();getField(fieldIds[idx-1])?.focus();
  }
});
})();
</script>
'''
if marker not in html:
    assert html.count("</body>")==1, "Expected unique body closing tag"
    html=html.replace("</body>",script+"\n</body>")
    h.write_text(html,"utf-8")
    print("STAGE02_INPUT_PATCH_APPLIED")
else:
    assert html.count(marker)==1, "Duplicate stage02 patch"
    print("STAGE02_INPUT_PATCH_ALREADY_PRESENT")
sw=w.read_text("utf-8")
digest=hashlib.sha256(h.read_bytes()).hexdigest()
pat=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pat,sw))==1
sw=re.sub(pat,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
w.write_text(sw,"utf-8")
print("STAGE02_HTML_SHA256",digest)
