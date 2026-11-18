from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
a=s.index(' if(raw==="offtable_multiply"){')
b=s.index(' if(raw==="offtable_divide"){',a)
assert 'variant:"tens"' in s[a:b]
replacement=''' if(raw==="offtable_multiply"){
  const live=stageOverride===null&&blockSession?.kind==="g3quiz"&&blockSession.key==="g3:offtable_multiply";
  return g3OfftableMultiplyQuestion(d,live?blockSession.done:null);
 }
'''
helper='''
const G3_OFFTABLE_MUL_VARIANTS=[
 ["tens","check"],
 ["decomp","groups","missingPart"],
 ["addBooks","removeBooks","twoBatches","compareBatches"]
];
function g3OfftableMultiplyQuestion(d,slot=null){
 const vlist=G3_OFFTABLE_MUL_VARIANTS[d],v=slot===null?g6RandomFrom(vlist):vlist[slot%vlist.length];
 const sig=(key)=>"g3:offtable_multiply:"+d+":"+v+":"+key;
 const input=(txt,answer,ex,key,extra={})=>g6NumberInputQuestion(txt,answer,ex,sig(key),{
   inputHint:"Введи целое число.",audit:{type:"g3OffMul",variant:v,...extra,answer:rational(answer,1)}
 });
 if(d===0){
  const tens=ri(2,9)*10,k=ri(2,9),product=tens*k;
  if(v==="tens")return input("<b>"+tens+" · "+k+"</b> = ?",product,
    (tens/10)+" дес. · "+k+" = "+((tens/10)*k)+" дес. = <b>"+product+"</b>.",tens+":"+k,{tens,k,product});
  const right=ri(0,1)===0,shown=right?product:product+k;
  return g6ChoiceQuestion("Верно ли равенство <b>"+tens+" · "+k+" = "+shown+"</b>?",
   right?"Верно":"Неверно",["Верно","Неверно"],
   tens+" · "+k+" = <b>"+product+"</b>.",sig(tens+":"+k+":"+shown),
   {type:"g3OffMul",variant:v,tens,k,product,shown,answer:right?"Верно":"Неверно"});
 }
 if(d===1){
  let n=ri(11,89);while(n%10===0)n=ri(11,89);
  const k=ri(2,9),tens=Math.floor(n/10)*10,ones=n%10,part=tens*k,last=ones*k,product=n*k;
  const ex=n+" = "+tens+" + "+ones+".<br>"+tens+" · "+k+" = "+part+"; "+ones+" · "+k+" = "+last+".<br>"+part+" + "+last+" = <b>"+product+"</b>.";
  const data={n,k,tens,ones,part,last,product};
  if(v==="decomp")return input("<b>"+n+" · "+k+"</b> = ?",product,ex,n+":"+k,data);
  if(v==="groups")return input("В "+k+" коробках лежит по "+g3Qty(n,"pencil")+". Сколько карандашей во всех коробках?",
   product,ex,n+":"+k,data);
  return input("<b>"+tens+" · "+k+" + □ = "+product+"</b>. Найди пропущенное число.",last,
   "Недостающая часть: "+ones+" · "+k+" = <b>"+last+"</b>.<br>"+ex,n+":"+k,data);
 }
 if(v==="addBooks"||v==="removeBooks"){
  const n=ri(21,79),k=ri(2,6),delta=ri(2,19),product=n*k,plus=v==="addBooks",answer=product+(plus?delta:-delta);
  const text="На "+k+" полках лежит по "+g3Qty(n,"book")+". "+
   (plus?"Принесли ещё "+g3Qty(delta,"book")+". Сколько книг стало?":
          "Забрали "+g3Qty(delta,"book")+". Сколько книг осталось?");
  return input(text,answer,"Сначала "+n+" · "+k+" = "+product+". Затем "+product+(plus?" + ":" − ")+delta+" = <b>"+answer+"</b>.",
   n+":"+k+":"+delta,{n,k,delta,product});
 }
 let a=ri(12,39),b=ri(14,41),ka=ri(2,5),kb=ri(2,5),first=a*ka,second=b*kb;
 const data=()=>({a,b,ka,kb,first,second});
 if(v==="twoBatches")return input("В "+ka+" коробках по "+g3Qty(a,"pencil")+
   ", а в других "+kb+" коробках по "+g3Qty(b,"pencil")+". Сколько карандашей в обеих партиях?",
   first+second,a+" · "+ka+" = "+first+"; "+b+" · "+kb+" = "+second+".<br>"+first+" + "+second+" = <b>"+(first+second)+"</b>.",
   a+":"+ka+":"+b+":"+kb,data());
 while(first===second){b=ri(14,41);kb=ri(2,5);second=b*kb}
 const answer=Math.abs(first-second);
 return input("В первой партии "+ka+" коробок по "+g3Qty(a,"pencil")+
   ", во второй — "+kb+" коробок по "+g3Qty(b,"pencil")+". На сколько карандашей отличаются партии?",
   answer,a+" · "+ka+" = "+first+"; "+b+" · "+kb+" = "+second+".<br>"+
   Math.max(first,second)+" − "+Math.min(first,second)+" = <b>"+answer+"</b>.",
   a+":"+ka+":"+b+":"+kb,data());
}
'''
s=s[:a]+replacement+s[b:]
anchor="function g3DivisionTableQuestion(d,slot=null){"
assert s.count(anchor)==1
s=s.replace(anchor,helper+"\n"+anchor)
assert s.count("function g3OfftableMultiplyQuestion")==1
p.write_text(s,encoding="utf-8")
print("patched length",len(s))
