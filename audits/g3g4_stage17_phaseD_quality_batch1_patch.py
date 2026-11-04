#!/usr/bin/env python3
"""Stage17D batch1: source-locked semantic progression for three G3 topics."""
import hashlib,json,pathlib
from datetime import datetime,timezone
OLD="fa4db04c3a53351ed672b12daa577a2ea3bb1376932f13b821e50db95436cd9a"
hp=pathlib.Path("index.html");sp=pathlib.Path("sw.js")
raw=hp.read_bytes();actual=hashlib.sha256(raw).hexdigest()
if actual!=OLD:raise SystemExit("ABORT: expected approved v43 HTML, got "+actual)
sw=sp.read_text("utf8")
if sw.count("matkvest-iphone-v43")<1 or sw.count(f'const APP_BUILD_HASH = "{OLD}"')!=1:raise SystemExit("ABORT: invalid SW v43 fingerprint")
s=raw.decode("utf8")
def js(text):return text.replace("@BT@",chr(96)).replace("@DL@",chr(36))
start=' if(raw==="offtable_multiply"){'
end=' if(raw==="round_numbers"){'
rem_start=' if(raw==="division_remainder"){'
rem_end=' if(raw==="properties"){'
for a in (start,end,rem_start,rem_end):
 if s.count(a)!=1:raise SystemExit("ABORT: unexpected source marker "+a+" count "+str(s.count(a)))
off_old=s[s.index(start):s.index(end)]
rem_old=s[s.index(rem_start):s.index(rem_end)]
for key in ("g3OffMul","g3OffDiv","g3OfftableDivisionParts"):
 if key not in off_old:raise SystemExit("ABORT: old off-table implementation changed: "+key)
if "g3RemainderInputQuestion" not in rem_old:raise SystemExit("ABORT: old remainder implementation changed")
off_new=js("""
 if(raw==="offtable_multiply"){
  if(d===0){
   const tens=ri(1,4)*10,k=ri(2,Math.min(7,Math.floor(100/tens))),answer=tens*k;
   return g6NumberInputQuestion(@BT@<b>@DL@{tens} · @DL@{k}</b> = ?@BT@,answer,@BT@@DL@{tens/10} дес. · @DL@{k} = @DL@{(tens/10)*k} дес. = <b>@DL@{answer}</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:tens:@DL@{tens}:@DL@{k}@BT@,{audit:{type:"g3OffMul",variant:"tens",n:tens,k,tens,ones:0,answer:rational(answer,1)}});
  }
  if(d===1){
   let n=0,k=0,answer=0,guard=0;
   do{guard++;n=ri(11,32);k=ri(2,4);answer=n*k}while(answer>100&&guard<300);
   if(answer>100){n=23;k=3;answer=69}
   const tens=Math.floor(n/10)*10,ones=n%10,story=Math.random()<.45,variant=story?"equalGroups":"decomp";
   const text=story?@BT@В @DL@{k} коробках по @DL@{g3Qty(n,"pencil")}. Сколько карандашей во всех коробках?@BT@:@BT@<b>@DL@{n} · @DL@{k}</b> = ?@BT@;
   const ex=@BT@В каждой группе @DL@{n}, групп @DL@{k}. Раскладываем @DL@{n} = @DL@{tens} + @DL@{ones}.<br>@DL@{tens} · @DL@{k} = @DL@{tens*k}; @DL@{ones} · @DL@{k} = @DL@{ones*k}.<br>@DL@{tens*k} + @DL@{ones*k} = <b>@DL@{answer}</b>.@BT@;
   return g6NumberInputQuestion(text,answer,ex,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{n}:@DL@{k}@BT@,{audit:{type:"g3OffMul",variant,n,k,tens,ones,answer:rational(answer,1)}});
  }
  const n=ri(21,45),k=ri(2,4),product=n*k,delta=ri(3,Math.min(18,product-1)),plus=Math.random()<.5,variant=plus?"multiplyThenAdd":"multiplyThenSubtract",answer=product+(plus?delta:-delta);
  const text=plus?@BT@На @DL@{k} полках по @DL@{g3Qty(n,"book")}. Принесли ещё @DL@{g3Qty(delta,"book")}. Сколько книг стало всего?@BT@:@BT@На @DL@{k} полках по @DL@{g3Qty(n,"book")}. С полок забрали @DL@{g3Qty(delta,"book")}. Сколько книг осталось?@BT@;
  const tens=Math.floor(n/10)*10,ones=n%10;
  const ex=@BT@Сначала находим количество на полках: @DL@{n} = @DL@{tens} + @DL@{ones}; @DL@{tens} · @DL@{k} = @DL@{tens*k}; @DL@{ones} · @DL@{k} = @DL@{ones*k}.<br>@DL@{tens*k} + @DL@{ones*k} = @DL@{product}.<br>Затем @DL@{plus?"прибавляем":"вычитаем"}: @DL@{product} @DL@{plus?"+":"−"} @DL@{delta} = <b>@DL@{answer}</b>.@BT@;
  return g6NumberInputQuestion(text,answer,ex,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{n}:@DL@{k}:@DL@{delta}@BT@,{audit:{type:"g3OffMul",variant,n,k,tens,ones,product,delta,answer:rational(answer,1)}});
 }
 if(raw==="offtable_divide"){
  if(d===0){
   const divisor=g6RandomFrom([2,3,4,5]),unit=ri(1,Math.max(1,Math.floor(9/divisor))),quotient=unit*10,dividend=quotient*divisor;
   return g6NumberInputQuestion(@BT@<b>@DL@{dividend} : @DL@{divisor}</b> = ?@BT@,quotient,@BT@@DL@{dividend/10} дес. : @DL@{divisor} = @DL@{quotient/10} дес. = <b>@DL@{quotient}</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:tens:@DL@{dividend}:@DL@{divisor}@BT@,{audit:{type:"g3OffDiv",variant:"tens",dividend,divisor,quotient,tens:dividend,ones:0,answer:rational(quotient,1)}});
  }
  const divisor=g6RandomFrom(d===1?[2,3,4]:[2,3,4,5,6]),parts=g3OfftableDivisionParts(divisor,d)||g3OfftableDivisionParts(2,d),{tens,ones,dividend,quotient}=parts;
  const baseEx=@BT@Разложим @DL@{dividend} = @DL@{tens} + @DL@{ones}.<br>@DL@{tens} : @DL@{divisor} = @DL@{tens/divisor}; @DL@{ones} : @DL@{divisor} = @DL@{ones/divisor}.<br>@DL@{tens/divisor} + @DL@{ones/divisor} = @DL@{quotient}.@BT@;
  if(d===1){
   const story=Math.random()<.45,variant=story?"equalSharing":"decomp";
   const text=story?@BT@@DL@{g3Qty(dividend,"pencil")} разложили поровну в @DL@{g3Qty(divisor,"box")}. Сколько карандашей в каждой коробке?@BT@:@BT@<b>@DL@{dividend} : @DL@{divisor}</b> = ?@BT@;
   return g6NumberInputQuestion(text,quotient,@BT@@DL@{baseEx}<br>Ответ: <b>@DL@{quotient}</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{dividend}:@DL@{divisor}@BT@,{audit:{type:"g3OffDiv",variant,dividend,divisor,quotient,tens,ones,answer:rational(quotient,1)}});
  }
  const delta=ri(2,Math.min(8,quotient-1)),plus=Math.random()<.5,variant=plus?"divideThenAdd":"divideThenSubtract",answer=quotient+(plus?delta:-delta);
  const text=plus?@BT@@DL@{g3Qty(dividend,"pencil")} разложили поровну в @DL@{g3Qty(divisor,"box")}. В каждую коробку добавили ещё @DL@{g3Qty(delta,"pencil")}. Сколько карандашей теперь в одной коробке?@BT@:@BT@@DL@{g3Qty(dividend,"pencil")} разложили поровну в @DL@{g3Qty(divisor,"box")}. Из каждой коробки взяли @DL@{g3Qty(delta,"pencil")}. Сколько карандашей осталось в одной коробке?@BT@;
  const ex=@BT@@DL@{baseEx}<br>Затем @DL@{plus?"прибавляем":"вычитаем"} @DL@{delta}: @DL@{quotient} @DL@{plus?"+":"−"} @DL@{delta} = <b>@DL@{answer}</b>.@BT@;
  return g6NumberInputQuestion(text,answer,ex,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{dividend}:@DL@{divisor}:@DL@{delta}@BT@,{audit:{type:"g3OffDiv",variant,dividend,divisor,quotient,tens,ones,delta,answer:rational(answer,1)}});
 }
""")
rem_new=js("""
 if(raw==="division_remainder"){
  const divisor=ri(2,9),qv=ri(d===0?2:3,d===0?9:d===1?15:25),rem=ri(1,divisor-1),dividend=divisor*qv+rem;
  const base=@BT@@DL@{divisor} · @DL@{qv} = @DL@{divisor*qv}.<br>@DL@{dividend} − @DL@{divisor*qv} = @DL@{rem}.<br>Проверка: @DL@{dividend} = @DL@{divisor} · @DL@{qv} + @DL@{rem}, причём @DL@{rem} меньше @DL@{divisor}.@BT@;
  if(d===0)return g3RemainderInputQuestion(dividend,divisor,qv,rem,@BT@@DL@{base}<br>Ответ: <b>@DL@{qv} (ост. @DL@{rem})</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:numeric:@DL@{dividend}:@DL@{divisor}@BT@,{stage:d,variant:"numeric"});
  if(d===1){
   const apples=Math.random()<.5,variant=apples?"packApples":"packPencils";
   const question=g3RemainderInputQuestion(dividend,divisor,qv,rem,@BT@@DL@{base}<br>Получилось <b>@DL@{qv} полных упаковок</b>, осталось <b>@DL@{rem}</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{dividend}:@DL@{divisor}@BT@,{stage:d,variant});
   question.text=apples?@BT@@DL@{g3Qty(dividend,"apple")} раскладывают по @DL@{g3Qty(divisor,"apple")} в пакет. Сколько полных пакетов получится и сколько яблок останется?@BT@:@BT@@DL@{g3Qty(dividend,"pencil")} раскладывают по @DL@{g3Qty(divisor,"pencil")} в коробку. Сколько полных коробок получится и сколько карандашей останется?@BT@;
   return question;
  }
  const taken=ri(3,12),total=dividend+taken,variant="subtractThenDivide";
  const question=g3RemainderInputQuestion(dividend,divisor,qv,rem,@BT@Сначала найдём, сколько осталось после выдачи: @DL@{total} − @DL@{taken} = @DL@{dividend}.<br>Делим оставшиеся по @DL@{divisor}.<br>@DL@{base}<br>Ответ: <b>@DL@{qv} полных коробок, @DL@{rem} карандашей осталось</b>.@BT@,@BT@g3:@DL@{raw}:@DL@{d}:@DL@{variant}:@DL@{total}:@DL@{taken}:@DL@{divisor}@BT@,{stage:d,variant,total,taken});
  question.text=@BT@Было @DL@{g3Qty(total,"pencil")}. @DL@{g3Qty(taken,"pencil")} отдали. Остальные раскладывают по @DL@{g3Qty(divisor,"pencil")} в коробку. Сколько полных коробок получится и сколько карандашей останется?@BT@;
  return question;
 }
""")
new=s[:s.index(start)]+off_new+s[s.index(end):]
new=new[:new.index(rem_start)]+rem_new+new[new.index(rem_end):]
nb=new.encode("utf8");NEW=hashlib.sha256(nb).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py")
ct=checker.read_text("utf8")
if ct.count("matkvest-iphone-v43")!=1:raise SystemExit("ABORT: unexpected cache checker version")
if sw.count("matkvest-iphone-v43")<1:raise SystemExit("ABORT: SW version not found")
sw_new=sw.replace("matkvest-iphone-v43","matkvest-iphone-v44").replace(OLD,NEW)
if sw_new.count(f'const APP_BUILD_HASH = "{NEW}"')!=1:raise SystemExit("ABORT: new SW fingerprint bad")
hp.write_bytes(nb);sp.write_text(sw_new,"utf8")
checker.write_text(ct.replace("matkvest-iphone-v43","matkvest-iphone-v44"),"utf8")
report={"phase":"17D-quality-batch1","at":datetime.now(timezone.utc).isoformat(),"baseSha256":OLD,"newSha256":NEW,"bytes":len(nb),"cache":"matkvest-iphone-v44","topics":["offtable_multiply","offtable_divide","division_remainder"],"changes":["medium: decomposition plus interpretation of equal groups/sharing","advanced: multi-operation word problems, verified using independent models","remainder advanced: first subtract items then divide remainder, preserving two-field answer"],"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_quality_batch1_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
