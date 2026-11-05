#!/usr/bin/env python3
"""Stage18B: repair grade-5 fractional form requirements + diversify powers on vetted v51."""
from pathlib import Path
import json, hashlib
idx=Path("index.html")
sw_path=Path("sw.js")
html=idx.read_text("utf8")
sw=sw_path.read_text("utf8")
prior="4dea66f5bfa2f203d11595d2a24d6e504d97a4069f4a228563abfc8360688017"
marker='id="matkvest-stage18b-form-and-powers"'
if marker in html:
    assert 'matkvest-iphone-v52' in sw
    assert hashlib.sha256(html.encode("utf8")).hexdigest() in sw
    print("STAGE18B: already applied")
    raise SystemExit(0)
assert hashlib.sha256(html.encode("utf8")).hexdigest()==prior, "Unverified HTML v51; no patch"
assert 'matkvest-iphone-v51' in sw and prior in sw, "Unverified SW v51"
script=r"""
<script id="matkvest-stage18b-form-and-powers">
/* Grade 5 semantic answers: correct mathematical VALUE plus requested FORM. */
(function(){
 const numerals={одна:1,одну:1,один:1,два:2,две:2,три:3,четыре:4,пять:5,шесть:6,семь:7,восемь:8,девять:9,десять:10,одиннадцать:11,двенадцать:12};
 const denominators={вторая:2,вторых:2,третья:3,третьих:3,четвертая:4,четвёртая:4,четвертых:4,четвёртых:4,пятая:5,пятых:5,шестая:6,шестых:6,седьмая:7,седьмых:7,восьмая:8,восьмых:8,девятая:9,девятых:9,десятая:10,десятых:10,одиннадцатых:11,двенадцатых:12};
 function partsFromHtml(html){
   const node=document.createElement('div');
   node.innerHTML=String(html||'');
   if(node.querySelectorAll('.frac').length!==1)return null;
   const ff=node.querySelector('.frac'),n=Number(ff.querySelector('.num')?.textContent),d=Number(ff.querySelector('.den')?.textContent);
   if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d<=0)return null;
   const wholeNode=node.querySelector('.mixed .whole'),w=wholeNode?Number(wholeNode.textContent):null;
   if(wholeNode&&!Number.isSafeInteger(w))return null;
   return {n,d,whole:w};
 }
 function exactFromQuestion(topic,question){
   const html=String(question.text||'');
   let plain=String(question.text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
   if(topic==='frac_read'){
     const m=plain.match(/Запиши дробью:\s*«\s*([а-яё]+)\s+([а-яё]+)\s*»/i);
     if(m){
       const n=numerals[m[1].toLowerCase()],d=denominators[m[2].toLowerCase()];
       if(n!=null&&d!=null)return {kind:'exact',n,d};
     }
   }
   if(topic==='frac_ray' && /неправильной дробью/i.test(plain)){
     const division=plain.match(/разделили\s+на\s+(\d+)\s+част/i),mark=plain.match(/на\s+(\d+)-й\s+отметке/i);
     if(division&&mark)return {kind:'exact',n:Number(mark[1]),d:Number(division[1])};
   }
   if(topic==='mixed_to_frac'&&/неправильную дробь/i.test(plain)){
     const p=partsFromHtml(html);
     if(p&&p.whole!==null)return {kind:'exact',n:p.whole*p.d+p.n,d:p.d};
   }
   return null;
 }
 function numberRatFromCorrect(result){
   const shown=String(result.correctLabel||result.correctHtml||'');
   const p=partsFromHtml(shown);
   if(p)return {rat:rational((p.whole===null?0:p.whole*p.d)+p.n,p.d),mixed:p.whole!==null};
   const v=shown.trim().replace(/<[^>]*>/g,'');
   if(/^[+-]?\d+$/.test(v))return {rat:rational(Number(v),1),mixed:false};
   return null;
 }
 function prepareFraction(result,topic){
   if(!result||!result.text)return result;
   let r=result;
   const form=exactFromQuestion(topic,r);
   if(form){
     if(!Number.isSafeInteger(form.n)||!Number.isSafeInteger(form.d)||form.d<1)return r;
     r={...r,answerMode:'fraction',answerRat:rational(form.n,form.d),preferMixed:false,
       requireReduced:false,correctText:String(form.n)+'/'+String(form.d),
       correctHtml:frac(form.n,form.d),stage18AnswerForm:form};
   } else if(topic==='frac_to_mixed'||topic==='mixed_add'||topic==='mixed_sub'||topic==='mixed_to_frac'){
     const parsed=numberRatFromCorrect(r);
     if(parsed){
       const expectMixed=topic==='frac_to_mixed'||topic==='mixed_add'||topic==='mixed_sub';
       r={...r,answerMode:'fraction',answerRat:parsed.rat,preferMixed:expectMixed,
         correctText:expectMixed?rationalPlain(parsed.rat,true):rationalPlain(parsed.rat,false),
         correctHtml:rationalHtml(parsed.rat,expectMixed),
         stage18AnswerForm:{kind:expectMixed?'mixed':'improper'}};
     }
   }
   return r;
 }
 function generatePowers(result,id){
   if(id!=='powers')return result;
   const difficulty=activeDifficulty();
   if(difficulty>1)return result;
   const n=difficulty===0?ri(2,14):ri(2,8);
   const family=ri(0,5),value=difficulty===0?n*n:n*n*n,reverse=family===5;
   const answer=reverse?n:value;
   let prompt,why;
   if(difficulty===0){
     const arr=[
       ['Найди квадрат числа '+n+'.','Квадрат числа '+n+' равен '+n+' · '+n+' = '+value+'.'],
       ['Сторона квадрата '+n+' см. Найди его площадь (см²).','Площадь квадрата равна '+n+'² = '+value+' см².'],
       ['В квадрате '+n+' рядов по '+n+' клеток. Сколько всего клеток?','Умножаем число рядов на число клеток: '+n+' · '+n+' = '+value+'.'],
       ['Сколько будет '+n+' · '+n+'?','Это квадрат числа '+n+': '+value+'.'],
       ['Сколько единичных квадратов поместится в квадрате со стороной '+n+' единиц?','Площадь в единичных квадратах равна '+n+' · '+n+' = '+value+'.'],
       ['Квадрат какого натурального числа равен '+value+'?','Так как '+n+' · '+n+' = '+value+', искомое число '+n+'.']
     ];
     [prompt,why]=arr[family];
   }else{
     const arr=[
       ['Найди куб числа '+n+'.','Куб числа '+n+' равен '+n+' · '+n+' · '+n+' = '+value+'.'],
       ['Ребро куба '+n+' см. Найди его объём (см³).','Объём куба равен '+n+'³ = '+value+' см³.'],
       ['Куб сложили из '+n+' слоёв по '+n*n+' маленьких кубиков. Сколько их всего?','Умножаем '+n+' на '+n*n+' и получаем '+value+'.'],
       ['Найди произведение '+n+' · '+n+' · '+n+'.','Это куб числа '+n+': '+value+'.'],
       ['В одном ряду '+n+' кубиков, таких рядов '+n+' в слое и всего '+n+' слоёв. Сколько кубиков?','Перемножаем '+n+' · '+n+' · '+n+' = '+value+'.'],
       ['Куб какого натурального числа равен '+value+'?','Так как '+n+'³ = '+value+', ответ '+n+'.']
     ];
     [prompt,why]=arr[family];
   }
   const ch=g5nums(answer,[Math.max(0,answer+1),Math.max(0,answer-1),value+n,n*n,Math.max(0,n-1)]);
   const answerString=String(answer);
   return {...result,text:prompt,ans:answerString,choices:ch,
     correctLabel:answerString,correctText:answerString,answerMode:'choice',ex:why,
     templateId:'s18b_power_'+difficulty+'_'+family,
     sig:'g5:powers:s18b:'+difficulty+':'+family+':'+n+':'+answerString};
 }
 const earlierMakeG5=makeG5Question;
 makeG5Question=function(id){
   const q=earlierMakeG5.apply(this,arguments);
   const topic=String(q?.sourceTopicId||id||'');
   return topic==='powers'?generatePowers(q,topic):prepareFraction(q,topic);
 };
 const earlierEvaluation=quizInputEvaluation;
 quizInputEvaluation=function(question,raw){
   const evaluation=earlierEvaluation.apply(this,arguments);
   const required=question?.stage18AnswerForm;
   if(!required||!stage18UsesFractionBoxes(question)||!evaluation?.valid||!evaluation.ok)return evaluation;
   const w=String(raw?.whole||'').trim(),n=String(raw?.numerator||'').trim(),d=String(raw?.denominator||'').trim();
   let accepts=true;
   if(required.kind==='exact'){
     accepts=!w&&Number(n)===required.n&&Number(d)===required.d;
   }else if(required.kind==='improper'){
     accepts=!w&&n!==''&&d!==''&&Number(n)>=Number(d);
   }else if(required.kind==='mixed'){
     const expect=question.answerRat,integer=!!expect&&expect.d===1;
     accepts=integer?!!w&&!n&&!d:!!w&&n!==''&&d!==''&&Number(n)>0&&Number(n)<Number(d);
   }
   if(!accepts){
     return {...evaluation,ok:false,detail:'Значение верное, но форма записи не соответствует условию.',
       retryMessage:'🟡 Значение верное. Запиши ответ в той форме, которую требует задание.',
       finalWrongMessage:'Запиши ответ в нужной форме: '+evaluation.correctHtml};
   }
   return evaluation;
 };
})();
</script>
"""
assert html.count("</body>")==1
html=html.replace("</body>",script+"\n</body>",1)
sha=hashlib.sha256(html.encode("utf8")).hexdigest()
sw=sw.replace("matkvest-iphone-v51","matkvest-iphone-v52").replace(prior,sha)
assert "matkvest-iphone-v52" in sw and sha in sw
idx.write_text(html,"utf8");sw_path.write_text(sw,"utf8")
report={"base_sha256":prior,"sha256":sha,"new_cache":"matkvest-iphone-v52","modified_paths":["index.html","sw.js"],"scope":"grade5 semantics and powers; grade6 fraction boxes retained"}
Path("audits/g5g6_stage18_semantics_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
