from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
a=s.index(' if(raw==="offtable_divide"){')
b=s.index(' if(raw==="round_numbers"){',a)
assert 'variant:"tens"' in s[a:b]
replacement=''' if(raw==="offtable_divide"){
  const live=stageOverride===null&&blockSession?.kind==="g3quiz"&&blockSession.key==="g3:offtable_divide";
  return g3OfftableDivideQuestion(d,live?blockSession.done:null);
 }
'''
helper='''
const G3_OFFTABLE_DIV_VARIANTS=[
 ["tens","check"],
 ["decomp","share","groupSize","missingDivisor"],
 ["addBefore","subtractBefore","changeEach","compareShares"]
];
function g3OfftableDivideQuestion(d,slot=null){
 const variants=G3_OFFTABLE_DIV_VARIANTS[d],variant=slot===null?g6RandomFrom(variants):variants[slot%variants.length];
 const sig=key=>"g3:offtable_divide:"+d+":"+variant+":"+key;
 const input=(text,answer,ex,key,data={})=>g6NumberInputQuestion(text,answer,ex,sig(key),{
  inputHint:"Введи целое число.",audit:{type:"g3OffDiv",variant,...data,answer:rational(answer,1)}
 });
 if(d===0){
  const divisor=ri(2,9),quotient=ri(1,Math.floor(9/divisor))*10,dividend=quotient*divisor;
  if(variant==="tens")return input("<b>"+dividend+" : "+divisor+"</b> = ?",quotient,
   (dividend/10)+" дес. : "+divisor+" = <b>"+(quotient/10)+" дес.</b> = "+quotient+".",
   dividend+":"+divisor,{dividend,divisor,quotient});
  const right=ri(0,1)===0,shown=right?quotient:quotient+10;
  return g6ChoiceQuestion("Верно ли равенство <b>"+dividend+" : "+divisor+" = "+shown+"</b>?",
   right?"Верно":"Неверно",["Верно","Неверно"],
   "Верное частное: "+dividend+" : "+divisor+" = <b>"+quotient+"</b>.",
   sig(dividend+":"+divisor+":"+shown),
   {type:"g3OffDiv",variant,dividend,divisor,quotient,shown,answer:right?"Верно":"Неверно"});
 }
 const divisor=g6RandomFrom(d===1?[2,3,4,5]:[2,3,4,5,6]);
 let parts=g3OfftableDivisionParts(divisor,d);
 if(!parts)throw Error("No suitable off-table division parts");
 const {tens,ones,dividend,quotient}=parts;
 const baseEx=dividend+" = "+tens+" + "+ones+".<br>"+tens+" : "+divisor+" = "+(tens/divisor)+
  "; "+ones+" : "+divisor+" = "+(ones/divisor)+".<br>"+(tens/divisor)+" + "+(ones/divisor)+" = "+quotient+".";
 const base={dividend,divisor,quotient,tens,ones};
 if(d===1){
  if(variant==="decomp")return input("<b>"+dividend+" : "+divisor+"</b> = ?",quotient,
   baseEx,dividend+":"+divisor,base);
  if(variant==="share")return input(g3Qty(dividend,"pencil")+" разложили поровну в "+g3Qty(divisor,"box")+
   ". Сколько карандашей в одной коробке?",quotient,baseEx,
   dividend+":"+divisor,base);
  if(variant==="groupSize")return input("Есть "+g3Qty(dividend,"notebook")+
   ". В одну стопку кладут по "+g3Qty(divisor,"notebook")+". Сколько стопок получится?",
   quotient,baseEx,dividend+":"+divisor,base);
  return input("<b>"+dividend+" : □ = "+quotient+"</b>. Найди делитель.",divisor,
   "Делимое делим на частное: "+dividend+" : "+quotient+" = <b>"+divisor+"</b>.",
   dividend+":"+divisor,base);
 }
 if(variant==="addBefore"||variant==="subtractBefore"){
  let chosen=parts;
  if(variant==="addBefore"){
   for(let i=0;i<100 && chosen.dividend+divisor*2>100;i++)chosen=g3OfftableDivisionParts(divisor,d);
   if(chosen.dividend+divisor*2>100)throw Error("No room for adding equal groups");
  }
  const extra=variant==="addBefore"?ri(1,Math.min(3,Math.floor((100-chosen.dividend)/divisor))):
   ri(1,Math.min(3,chosen.quotient-1));
  const change=extra*divisor,plus=variant==="addBefore",newTotal=chosen.dividend+(plus?change:-change);
  const answer=newTotal/divisor;
  return input("Было "+g3Qty(chosen.dividend,"pencil")+". "+(plus?"Добавили ":"Убрали ")+
   g3Qty(change,"pencil")+". Всё количество разделили поровну между "+
   g3Qty(divisor,"child")+". Сколько карандашей получил каждый ребёнок?",
   answer,chosen.dividend+(plus?" + ":" − ")+change+" = "+newTotal+
   ".<br>"+newTotal+" : "+divisor+" = <b>"+answer+"</b>.",
   chosen.dividend+":"+divisor+":"+change,
   {dividend:chosen.dividend,divisor,quotient:chosen.quotient,extra,change,newTotal});
 }
 if(variant==="changeEach"){
  const plus=ri(0,1)===0,delta=ri(1,Math.min(5,quotient-1)),answer=quotient+(plus?delta:-delta);
  return input(g3Qty(dividend,"pencil")+" разложили поровну в "+g3Qty(divisor,"box")+
   ". В каждой коробке "+(plus?"добавили ":"убрали ")+g3Qty(delta,"pencil")+
   ". Сколько карандашей теперь в одной коробке?",
   answer,baseEx+"<br>"+quotient+(plus?" + ":" − ")+delta+" = <b>"+answer+"</b>.",
   dividend+":"+divisor+":"+delta+":"+plus,{...base,delta,plus});
 }
 let second=g3OfftableDivisionParts(divisor,d);
 for(let guard=0;guard<100&&second.quotient===quotient;guard++)second=g3OfftableDivisionParts(divisor,d);
 if(second.quotient===quotient)throw Error("No distinct quotient");
 const answer=Math.abs(quotient-second.quotient);
 return input("В первом классе "+g3Qty(dividend,"pencil")+" разделили поровну между "+
   g3Qty(divisor,"child")+", во втором — "+g3Qty(second.dividend,"pencil")+
   " между таким же числом детей. На сколько карандашей отличается количество на одного ребёнка?",
   answer,dividend+" : "+divisor+" = "+quotient+"; "+second.dividend+" : "+divisor+
   " = "+second.quotient+".<br>"+Math.max(quotient,second.quotient)+" − "+
   Math.min(quotient,second.quotient)+" = <b>"+answer+"</b>.",
   dividend+":"+second.dividend+":"+divisor,{...base,secondDividend:second.dividend,secondQuotient:second.quotient});
}
'''
s=s[:a]+replacement+s[b:]
anchor="function g3DivisionTableQuestion(d,slot=null){"
assert s.count(anchor)==1
s=s.replace(anchor,helper+"\n"+anchor)
assert s.count("function g3OfftableDivideQuestion")==1
p.write_text(s,encoding="utf-8")
print("patched length",len(s))
