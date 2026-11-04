#!/usr/bin/env python3
"""Stage17D final corrective gate: strictly safer grade3 written multiplication/division progression."""
import hashlib,json,pathlib
from datetime import datetime,timezone
oldHash="04a719fe8c292d8fe42b9762fdca5b8b48c316042cbdb1709ac18fe5290eff21"
path=pathlib.Path("index.html")
original=path.read_bytes()
if hashlib.sha256(original).hexdigest()!=oldHash:raise SystemExit("ABORT: approved v49 source changed")
swpath=pathlib.Path("sw.js");sw=swpath.read_text("utf8")
if sw.count("matkvest-iphone-v49")!=1 or sw.count(f'const APP_BUILD_HASH = "{oldHash}"')!=1:raise SystemExit("ABORT: PWA source mismatch")
src=original.decode("utf8")
# Keep the three already approved written calculation generators intact except the two explicit blocks.
def replace_block(start,end,new,label,guards):
 global src
 if src.count(start)!=1 or src.count(end)!=1:raise SystemExit("ABORT unexpected source markers "+label)
 a=src.index(start);b=src.index(end)
 if b<=a:raise SystemExit("ABORT wrong source order "+label)
 existing=src[a:b]
 for keyword in guards:
  if keyword not in existing:raise SystemExit("ABORT unexpected original "+label+": "+keyword)
 src=src[:a]+new+src[b:]
 return len(existing)
mul=''' if(raw==="written_multiply"){
  let a=0,b=0,ans=0,carryCount=0,guard=0;
  const limit=d===0?99:d===1?299:999;
  do{
   a=ri(d===0?11:20,d===0?33:d===1?69:89);
   b=ri(d===2?3:2,d===0?4:d===1?7:9);
   ans=a*b;
   const unitCarry=Math.floor((a%10)*b/10);
   const tensCarry=Math.floor((Math.floor(a/10)*b+unitCarry)/10);
   carryCount=Number(unitCarry>0)+Number(tensCarry>0);
  }while((carryCount!==d||ans>limit)&&guard++<900);
  if(carryCount!==d||ans>limit){
   [a,b]=d===0?[12,3]:d===1?[27,3]:[47,8];
   ans=a*b;
   carryCount=d;
  }
  const cols=Math.max(String(a).length,String(ans).length);
  return {a,b,ans,op:"×",units:b,tens:0,cols,carry1:calcMulCarries(a,b,cols),singleDigitMultiplier:true,g3Topic:raw,
   audit:{type:"g3WrittenMul",a,b,answer:ans,carry:carryCount>0,carryCount}};
 }
'''
div=''' if(raw==="written_divide"){
  const divisor=ri(2,d===0?5:9);
  const maximum=Math.floor(999/divisor);
  let q;
  if(d===0)q=ri(11,24);
  else if(d===1)q=ri(25,Math.min(99,maximum));
  else if(Math.random()<.35)q=100+ri(1,Math.min(9,maximum-100));
  else q=ri(100,maximum);
  const dividend=q*divisor,steps=divisionSteps(dividend,divisor);
  return {a:dividend,b:divisor,ans:q,op:"÷",steps,quotient:steps.map(x=>x.qd).join(""),
   g3Topic:raw,audit:{type:"g3WrittenDiv",dividend,divisor,quotient:q,remainder:dividend%divisor,quotientDigits:String(q).length}};
 }
'''
n1=replace_block(' if(raw==="written_multiply"){',' if(raw==="written_divide"){',mul,"multiplication",["calcMulCarries","singleDigitMultiplier"])
start=' if(raw==="written_divide"){'
idx=src.index(start);end=' return null;\n}'
j=src.index(end,idx)
originalDiv=src[idx:j]
if not all(x in originalDiv for x in ["divisionSteps","g3WrittenDiv","quotient"]):raise SystemExit("ABORT: unexpected division engine")
src=src[:idx]+div+src[j:]
new=src.encode("utf8");sha=hashlib.sha256(new).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py");ct=checker.read_text("utf8")
if ct.count("matkvest-iphone-v49")!=1:raise SystemExit("ABORT: PWA guard changed")
newsw=sw.replace("matkvest-iphone-v49","matkvest-iphone-v50").replace(oldHash,sha)
if newsw.count(f'const APP_BUILD_HASH = "{sha}"')!=1:raise SystemExit("ABORT: SW patch fingerprint")
path.write_bytes(new);swpath.write_text(newsw,"utf8");checker.write_text(ct.replace("matkvest-iphone-v49","matkvest-iphone-v50"),"utf8")
r={"stage":"17D-final-column-progression","at":datetime.now(timezone.utc).isoformat(),"oldSha256":oldHash,"newSha256":sha,"cache":"matkvest-iphone-v50","priorMulBytes":n1,"priorDivBytes":len(originalDiv),"topics":["g3:written_multiply","g3:written_divide"],"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_final_written_patch_report.json").write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(r,ensure_ascii=False))
