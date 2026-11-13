/* Grade 5 v131 — advance mixed/improper fraction conversions by actual stage,
   preserving original fixed-denominator cell entry and conversion regressions.
   Earlier UI patch varied by question number but repeated warmup types on every tier. */
(function(){
'use strict';
if(typeof makeG5Question!=='function'||typeof mixed!=='function'||typeof frac!=='function'||typeof rational!=='function'||typeof g5NewChoiceSet!=='function'||typeof g5NewRat!=='function')throw Error('v131 conversion prerequisites missing');
const prior=makeG5Question;
const TOPICS=['frac_to_mixed','mixed_to_frac'];
const tier=()=>Math.min(2,Math.max(0,Number(activeDifficulty())||0));
const slot=()=>Math.max(0,Number(blockSession?.done)||0)%5;
const V=n=>['v',n],A=(...v)=>['add',...v],S=(a,b)=>['sub',a,b],M=(a,b)=>['mul',a,b],D=(a,b)=>['div',a,b],Mod=(a,b)=>['mod',a,b];
function value(node){
 const [op,...x]=node,E=value;
 if(op==='v')return x[0];
 if(op==='add')return x.reduce((s,n)=>s+E(n),0);
 if(op==='sub')return E(x[0])-E(x[1]);
 if(op==='mul')return E(x[0])*E(x[1]);
 if(op==='div'){const v=E(x[0]),d=E(x[1]);if(!d||v%d!==0)throw Error('v131 noninteger division');return v/d;}
 if(op==='mod'){const v=E(x[0]),d=E(x[1]);if(v<0||d<=0)throw Error('v131 bad remainder');return v%d;}
 throw Error('v131 unsupported computation '+op);
}
function spec(id,t,p,N,D,W,R){
 const improper=frac(N,D),oldMixed=mixed(W,R,D);
 const gap=D-R,extra=D+gap+1;
 let data;
 if(id==='frac_to_mixed'){
  if(t===1){
   if(p===0)data=['После увеличения числителя дроби '+improper+' на '+D+' запиши результат смешанным числом.',A(V(N),V(D)),'mixed',2,'Увеличение числителя на знаменатель добавляет одну целую.'];
   if(p===1)data=['К дроби '+improper+' прибавили '+frac(gap,D)+'. Сколько целых получилось? Введи только число.',Dfn(A(V(N),V(gap)),V(D)),'number',3,'Сначала сложим числители, затем выполним деление на знаменатель.'];
   if(p===2)data=['Числитель дроби '+improper+' увеличили вдвое, затем прибавили 1. Найди остаток от деления нового числителя на '+D+'. Введи только остаток.',Mod(A(M(V(N),V(2)),V(1)),V(D)),'number',3,'Новый числитель равен 2·'+N+' + 1; найдём его остаток при делении.'];
   if(p===3)data=['Лента длиной '+improper+' м стала длиннее на 1 м и ещё на '+frac(gap+1,D)+' м. Запиши новую длину смешанным числом.',A(V(N),V(D),V(gap+1)),'mixed',4,'Выразим прибавленные метры в долях знаменателя '+D+' и выделим целую часть.'];
   if(p===4)data=['Сложи две неправильные дроби '+improper+' и '+frac(extra,D)+'. Ответ запиши смешанным числом.',A(V(N),V(extra)),'mixed',3,'Складываем числители при общем знаменателе, затем выделяем целую часть.'];
  }else{
   const shift0=(1-(2*R%D)+D)%D;
   const shift=shift0===0?D:shift0;
   if(p===0)data=['У неправильной дроби '+improper+' из числителя вычли остаток '+R+', результат удвоили и прибавили обратно '+R+'. Запиши новую дробь смешанным числом.',A(M(S(V(N),V(R)),V(2)),V(R)),'mixed',4,'Отделим полные доли, удвоим их, вернём остаток и выделим целую часть.'];
   if(p===1)data=['К дроби '+improper+' прибавили '+frac(2*D-R,D)+'. Сколько полных целых содержится в сумме? Введи только число.',Dfn(A(V(N),V(2*D-R)),V(D)),'number',4,'Найдём новый числитель суммы и разделим на знаменатель.'];
   if(p===2)data=['Числитель дроби '+improper+' удвоили, прибавили '+D+' и вычли 1. Каков остаток при делении нового числителя на '+D+'?',Mod(S(A(M(V(N),V(2)),V(D)),V(1)),V(D)),'number',4,'Выполним изменения числителя и найдём остаток от деления.'];
   if(p===3)data=['Длину '+improper+' м удвоили и прибавили ещё '+frac(shift,D)+' м. Запиши полученную длину смешанным числом.',A(M(V(N),V(2)),V(shift)),'mixed',4,'Сначала удвоим число долей, затем прибавим новые доли и выделим целую часть.'];
   if(p===4)data=['Найди сумму трёх дробей '+improper+', '+frac(D+1,D)+' и '+frac(gap,D)+'. Запиши результат смешанным числом.',A(V(N),V(D+1),V(gap)),'mixed',5,'Сложим три числителя, затем поделим на прежний знаменатель.'];
  }
 }else{
  if(t===1){
   if(p===0)data=['К смешанному числу '+oldMixed+' прибавили одну целую. Запиши результат неправильной дробью со знаменателем '+D+'.',A(V(N),V(D)),'improper',2,'Одна целая содержит '+D+' долей.'];
   if(p===1)data=['В смешанном числе '+oldMixed+' целую часть увеличили вдвое, а дробную сохранили. Каков числитель неправильной дроби со знаменателем '+D+'? Введи только число.',A(M(V(2*W),V(D)),V(R)),'number',3,'Удвоим целые, превратим их в доли и прибавим числитель.'];
   if(p===2)data=['На отрезке ленты длиной '+oldMixed+' м добавили ещё один метр. Запиши новую длину неправильной дробью со знаменателем '+D+'.',A(V(N),V(D)),'improper',3,'Переведём длину в доли, затем прибавим '+D+' долей.'];
   if(p===3)data=['К смешанному числу '+oldMixed+' прибавили '+frac(2,D)+' и вычли '+frac(1,D)+'. Сколько долей по '+frac(1,D)+' получилось? Введи только число.',S(A(V(N),V(2)),V(1)),'number',3,'Переведём смешанное число в доли, затем изменим количество долей.'];
   if(p===4)data=['К смешанному числу '+oldMixed+' прибавили '+frac(3,D)+', а затем вычли '+frac(1,D)+'. Запиши результат неправильной дробью со знаменателем '+D+'.',S(A(V(N),V(3)),V(1)),'improper',3,'У исходного числителя прибавим 3 и вычтем 1.'];
  }else{
   if(p===0)data=['Сложи два смешанных числа '+oldMixed+' и '+mixed(W+1,R,D)+'. Ответ запиши неправильной дробью со знаменателем '+D+'.',A(V(N),A(V(N),V(D))),'improper',4,'Переведём каждое смешанное число в доли, затем сложим числители.'];
   if(p===1)data=['В смешанном числе '+oldMixed+' целую часть увеличили втрое, а затем прибавили ещё '+frac(2,D)+'. Найди числитель неправильной дроби со знаменателем '+D+'. Введи только число.',A(M(M(V(W),V(3)),V(D)),V(R),V(2)),'number',4,'Утроим количество целых, добавим дробную часть и ещё 2 доли.'];
   if(p===2)data=['Для трёх изделий нужно по '+oldMixed+' м ленты и ещё '+frac(1,D)+' м дополнительно. Запиши общую длину неправильной дробью со знаменателем '+D+'.',A(M(V(N),V(3)),V(1)),'improper',4,'Утроим длину в долях и добавим одну долю.'];
   if(p===3)data=['Длину '+oldMixed+' м уменьшили на '+frac(1,D)+' м и оставшуюся длину удвоили. Сколько долей по '+frac(1,D)+' получилось? Введи только число.',M(S(V(N),V(1)),V(2)),'number',4,'Из числа долей вычтем одну, затем удвоим остаток.'];
   if(p===4)data=['К смешанному числу '+oldMixed+' прибавили одну целую, затем '+frac(gap+1,D)+' и ещё '+frac(1,D)+'. Запиши сумму неправильной дробью со знаменателем '+D+'.',A(V(N),V(D),V(gap+1),V(1)),'improper',5,'Сначала прибавим полную единицу, затем две дробные части и объединим числители.'];
  }
 }
 if(!data)throw Error('v131 missing conversion question '+id+'/'+t+'/'+p);
 return {text:data[0],plan:data[1],kind:data[2],steps:data[3],explanation:data[4],family:'v131_'+id+'_L'+t+'_F'+p,t,p,id,N,D,W,R};
}
// Separate alias avoids ambiguity between the denominator D number and division AST constructor.
function Dfn(a,b){return ['div',a,b]}
function generate(base,id){
 const old=base?.conversionAudit,stage=tier(),p=slot();
 if(!old||stage===0)return base;
 const N=Number(old.originalNumerator),den=Number(old.den),W=Number(old.whole),R=Number(old.rem);
 if(![N,den,W,R].every(Number.isSafeInteger)||den<2||W<1||R<1||R>=den||N!==W*den+R)
  throw Error('v131 malformed original conversion');
 const d=spec(id,stage,p,N,den,W,R),ansN=value(d.plan);
 if(!Number.isSafeInteger(ansN)||ansN<0)throw Error('v131 invalid conversion answer '+d.family+': '+ansN);
 let choices,ans,rat,correctText,correctHtml,answerMode,conversionType=null,fixedForm=null,singleLabel=null;
 if(d.kind==='number'){
  ans=String(ansN);rat=rational(ansN,1);correctText=ans;correctHtml=ans;answerMode='number';
  singleLabel=id==='frac_to_mixed'?(p===1?'Количество целых':'Остаток'):(p===1?'Числитель':'Количество долей');
  choices=g5nums(ansN,[ansN+1,ansN+2,Math.max(0,ansN-1)]);
 }else if(d.kind==='mixed'){
  const whole=Math.floor(ansN/den),rem=ansN%den;
  if(whole<1||rem<1||rem>=den)throw Error('v131 incorrect mixed representation '+d.family+': '+ansN+'/'+den);
  rat=rational(ansN,den);correctText=whole+' '+rem+'/'+den;
  correctHtml=mixed(whole,rem,den);ans='ok';answerMode='fraction';conversionType='mixed';fixedForm={kind:'mixed'};
  choices=[{label:correctHtml,key:'ok'},
    {label:mixed(whole+1,rem,den),key:'bad1'},
    {label:mixed(whole+2,rem,den),key:'bad2'},
    {label:mixed(whole+3,rem,den),key:'bad3'}];
 }else{
  if(ansN<den)throw Error('v131 expected improper fraction '+d.family);
  rat=rational(ansN,den);correctText=ansN+'/'+den;correctHtml=frac(ansN,den);
  answerMode='fraction';conversionType='improper';fixedForm={kind:'exact',n:ansN,d:den};
  const [nr,dr]=g5NewRat(ansN,den);
  ans=nr+'/'+dr;
  choices=g5NewChoiceSet(ansN,den,[[ansN+1,den],[Math.max(0,ansN-1),den],[ansN,den+1]]);
 }
 const labeled=choices.filter(c=>String(c.key)===String(ans));
 if(labeled.length!==1||new Set(choices.map(c=>String(c.label))).size!==choices.length)throw Error('v131 bad conversion choices '+d.family);
 const rationalPair=d.kind==='number'?null:g5NewRat(ansN,den);
 const info={
  ...(base.mk5Audit||{}),type:d.kind==='number'?'numeric':'rational',
  expected:d.kind==='number'?ansN:rationalPair[0]+'/'+rationalPair[1],
  numerator:d.kind==='number'?undefined:ansN,denominator:d.kind==='number'?undefined:den,
  stage,topic:id,pedagogicalFamily:d.family
 };
 return {...base,text:d.text,ex:d.explanation+' Ответ: '+correctText+'.',
  choices,ans,answerMode,answerRat:rat,correctText,correctHtml,correctLabel:correctHtml,
  templateId:d.family,sig:['g5',id,d.family,d.text,ansN].join(':'),
  preferMixed:d.kind==='mixed',stage18AnswerForm:fixedForm,
  stage18FixedDenominator:conversionType?den:undefined,
  stage18ConversionType:conversionType,
  stage18SingleFieldLabel:singleLabel,
  inputHint:d.kind==='number'?'Введи одно число. Другие поля не нужны.':'',
  mk5Audit:info,
  conversionAudit:{...old,answerNumerator:ansN,answerKind:d.kind,familyV131:d.family,stage},
  mk131:{id,stage,p,kind:d.kind,plan:d.plan,answerN:ansN,den,steps:d.steps,family:d.family}
 };
}
makeG5Question=function(id){
 const base=prior.apply(this,arguments);
 return TOPICS.includes(id)?generate(base,id):base;
};
window.mkG5V131Tiered=TOPICS.slice();
})();
