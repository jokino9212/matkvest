/* МатКвест · 5 класс · перевод смешанных чисел, UX-патч. */
(function(){
'use strict';
const previousMake=makeG5Question;
function displayedParts(html){
 const el=document.createElement('div');el.innerHTML=String(html||'');
 const f=el.querySelector('.frac');
 if(!f)return null;
 const numerator=Number(f.querySelector('.num')?.textContent);
 const denominator=Number(f.querySelector('.den')?.textContent);
 const w=el.querySelector('.mixed .whole');
 const whole=w?Number(w.textContent):null;
 if(!Number.isSafeInteger(numerator)||!Number.isSafeInteger(denominator)||denominator<2)return null;
 return {numerator,denominator,whole};
}
// The former three-mode generator had only two mathematical actions. Each
// five-question cycle now has five intentionally different cognitive tasks.
function conversionQuestion(base,topic,given){
 const pos=Math.max(0,Number(blockSession?.done)||0),stage=Math.max(0,Math.min(2,Number(activeDifficulty())||0));
 const familyIndex=pos%5,advanced=stage>=1,master=stage===2,den=given.denominator;
 const whole=topic==='frac_to_mixed'?Math.floor(given.numerator/den):given.whole;
 const rem=topic==='frac_to_mixed'?given.numerator%den:given.numerator;
 if(!Number.isSafeInteger(whole)||whole<1||!Number.isSafeInteger(rem)||rem<1||rem>=den)return base;
 const originalN=whole*den+rem;
 const shown=topic==='frac_to_mixed'?frac(originalN,den):mixed(whole,rem,den);
 const level=stage;
 let family,question,kind,answerN,explanation,label;
 if(topic==='frac_to_mixed'){
   const division=originalN+' = '+whole+' · '+den+' + '+rem+'.';
   if(familyIndex===0){
     family=advanced?'full_recheck':'full_conversion';
     question=advanced?'Представь дробь '+shown+' смешанным числом. Проверь, что остаток меньше знаменателя.':'Представь дробь '+shown+' смешанным числом.';
     kind='mixed';answerN=originalN;explanation=division+' Целая часть '+whole+', остаток '+rem+'.';
   }else if(familyIndex===1){
     family=advanced?'whole_after_plus_one':'whole_part';
     const plus=advanced?1:0;
     question=plus?'К дроби '+shown+' прибавили 1. Сколько целых частей стало? Введи только число.':'Сколько целых содержится в дроби '+shown+'? Введи только число.';
     kind='number';answerN=whole+plus;label='Количество целых';
     explanation=division+(plus?' После прибавления единицы целых стало '+answerN+'.':' Частное равно '+whole+'.');
   }else if(familyIndex===2){
     family=advanced?'remainder_after_unit_fraction':'remainder';
     const change=advanced?1:0;
     question=change?'К дроби '+shown+' прибавили '+frac(1,den)+'. Какой остаток получится при делении нового числителя на '+den+'? Введи только остаток.':'Раздели '+originalN+' на '+den+' с остатком. Каков остаток? Введи только число.';
     kind='number';answerN=(rem+change)%den;label='Остаток';
     explanation=division+(change?' Новый числитель '+(originalN+1)+', остаток '+answerN+'.':' Остаток '+rem+'.');
   }else if(familyIndex===3){
     family=advanced?'context_plus_one':'context_conversion';
     const plus=advanced?1:0;
     question=plus?'Лента имеет длину '+shown+' м. К ней добавили ещё 1 м. Запиши новую длину смешанным числом.':'Отрезок ленты имеет длину '+shown+' м. Запиши эту длину смешанным числом.';
     kind='mixed';answerN=originalN+plus*den;
     explanation=division+(plus?' Прибавляем '+den+'/'+den+', значит целых станет '+(whole+1)+'.':' Получаем '+whole+' целых и '+rem+'/'+den+'.');
   }else{
     const plus=advanced?2:1;
     family=advanced?'plus_two_wholes':'plus_one_whole';
     question='К дроби '+shown+' прибавили '+plus+(plus===1?' целую':' целых')+'. Запиши результат смешанным числом.';
     kind='mixed';answerN=originalN+plus*den;
     explanation=division+' Прибавили '+plus+' целых: целая часть '+(whole+plus)+', остаток '+rem+'/'+den+'.';
   }
 }else{
   const product=whole+' · '+den+' + '+rem+' = '+originalN+'.';
   if(familyIndex===0){
     family=advanced?'full_recheck':'full_conversion';
     question=advanced?'Запиши смешанное число '+shown+' неправильной дробью, сохранив знаменатель.':'Запиши '+shown+' неправильной дробью.';
     kind='improper';answerN=originalN;
     explanation=product+' Знаменатель '+den+' не меняется.';
   }else if(familyIndex===1){
     const plus=advanced?1:0;
     family=advanced?'numerator_after_plus_one':'new_numerator';
     question=plus?'К смешанному числу '+shown+' прибавили 1. Какой станет числитель неправильной дроби со знаменателем '+den+'? Введи только числитель.':'Переведи '+shown+' в неправильную дробь. Какой получится числитель? Введи только число.';
     kind='number';answerN=originalN+plus*den;label='Новый числитель';
     explanation=product+(plus?' Добавили '+den+' долей, числитель стал '+answerN+'.':' Это новый числитель.');
   }else if(familyIndex===2){
     family=advanced?'context_fraction':'context_conversion';
     question=advanced?'На изготовление модели ушло '+shown+' м проволоки. Вырази эту длину неправильной дробью.':'Для изделия нужно '+shown+' м ленты. Запиши длину неправильной дробью.';
     kind='improper';answerN=originalN;
     explanation=product+' Длина равна '+answerN+'/'+den+' м.';
   }else if(familyIndex===3){
     const plus=advanced?den:0;
     family=advanced?'count_parts_after_plus_one':'count_fractional_units';
     question=plus?'Было '+shown+' м ленты, добавили ещё 1 м. Сколько отрезков длиной '+frac(1,den)+' м получится из всей ленты? Введи только число.':'Сколько долей по '+frac(1,den)+' содержится в числе '+shown+'? Введи только число.';
     kind='number';answerN=originalN+plus;label='Количество долей';
     explanation=product+(plus?' Ещё 1 целая — это '+den+' долей. Всего '+answerN+' долей.':' Всего '+answerN+' долей по 1/'+den+'.');
   }else{
     const plus=advanced?den+1:1;
     family=advanced?'plus_whole_and_fraction':'plus_one_fractional_unit';
     question='К смешанному числу '+shown+' прибавили '+frac(plus,den)+'. Запиши сумму неправильной дробью со знаменателем '+den+'.';
     kind='improper';answerN=originalN+plus;
     explanation=product+' Прибавляем '+plus+' долей: '+originalN+' + '+plus+' = '+answerN+'. Знаменатель '+den+'.';
   }
 }
 const divisionText=originalN+' = '+whole+' · '+den+' + '+rem+'.';
 const productText=whole+' · '+den+' + '+rem+' = '+originalN+'.';
 if(master){
   // The Master tier has new multi-step cognitive tasks rather than repeating the
   // warmup five or relying on session.done >= 5 for progression.
   if(topic==='frac_to_mixed'){
     if(familyIndex===0){
       family='master_add_two_sub_one';
       question='К дроби '+shown+' прибавили 2 целых, затем вычли 1 целую. Запиши результат смешанным числом.';
       kind='mixed';answerN=originalN+den;
       explanation=divisionText+' Сначала прибавляем 2 · '+den+' долей, затем вычитаем '+den+'. Остаётся '+(whole+1)+' целых и '+rem+'/'+den+'.';
     }else if(familyIndex===1){
       family='master_whole_after_two_changes';
       question='К дроби '+shown+' прибавили 3 целых, затем вычли 1 целую. Сколько целых частей получилось? Введи только число.';
       kind='number';answerN=whole+2;label='Количество целых';
       explanation=divisionText+' Целых станет '+whole+' + 3 − 1 = '+answerN+'.';
     }else if(familyIndex===2){
       family='master_remainder_after_numerator_changes';
       question='Числитель дроби '+shown+' увеличили на '+(den+2)+', затем уменьшили на 1. Какой остаток получится при делении нового числителя на '+den+'?';
       kind='number';answerN=(rem+1)%den;label='Остаток';
       explanation='Исходный числитель '+originalN+'. Новый числитель '+(originalN+den+1)+'. Остаток '+answerN+'.';
     }else if(familyIndex===3){
       family='master_context_add_three_sub_one';
       question='Лента имеет длину '+shown+' м. К ней добавили 3 м, затем отрезали 1 м. Запиши оставшуюся длину смешанным числом.';
       kind='mixed';answerN=originalN+2*den;
       explanation='Прибавление 3 м и вычитание 1 м даёт увеличение на 2 целых. Получаем '+(whole+2)+' '+rem+'/'+den+'.';
     }else{
       family='master_plus_four_minus_one';
       question='К неправильной дроби '+shown+' прибавили 4 целых, а затем вычли 1 целую. Запиши результат смешанным числом.';
       kind='mixed';answerN=originalN+3*den;
       explanation=divisionText+' Изменение составляет 4 − 1 = 3 целых. Новая целая часть '+(whole+3)+'.';
     }
   }else{
     if(familyIndex===0){
       family='master_improper_add_two_sub_one';
       question='Смешанное число '+shown+' увеличили на 2, затем уменьшили на 1. Представь результат неправильной дробью с исходным знаменателем.';
       kind='improper';answerN=originalN+den;
       explanation='Исходный числитель '+originalN+'. Прибавляем 2 · '+den+' и вычитаем '+den+'. Получаем '+answerN+'/'+den+'.';
     }else if(familyIndex===1){
       family='master_numerator_add_wholes_sub_part';
       question='К числу '+shown+' прибавили 2 целых и вычли '+frac(1,den)+'. Какой числитель получится у неправильной дроби со знаменателем '+den+'?';
       kind='number';answerN=originalN+2*den-1;label='Новый числитель';
       explanation='Числитель '+originalN+' + 2 · '+den+' − 1 = '+answerN+'.';
     }else if(familyIndex===2){
       family='master_context_improper_two_changes';
       question='Было '+shown+' м ленты. Добавили 1 м, затем отрезали '+frac(1,den)+' м. Запиши оставшуюся длину неправильной дробью со знаменателем '+den+'.';
       kind='improper';answerN=originalN+den-1;
       explanation='К исходному числителю '+originalN+' прибавляем '+den+' и вычитаем 1: '+answerN+'/'+den+'.';
     }else if(familyIndex===3){
       family='master_count_parts_two_changes';
       question='Было '+shown+' м ленты. Добавили 3 м, затем отрезали '+frac(2,den)+' м. Сколько долей по '+frac(1,den)+' м осталось? Введи только число.';
       kind='number';answerN=originalN+3*den-2;label='Количество долей';
       explanation='Исходно '+originalN+' долей, затем '+(3*den)+' новых долей и 2 доли вычли. Итого '+answerN+'.';
     }else{
       family='master_plus_whole_and_two_parts';
       question='К смешанному числу '+shown+' прибавили 2 целых и '+frac(1,den)+'. Запиши результат неправильной дробью с тем же знаменателем.';
       kind='improper';answerN=originalN+2*den+1;
       explanation='Исходный числитель '+originalN+'. Прибавим '+(2*den)+' и ещё 1: '+answerN+'/'+den+'.';
     }
   }
 }
 if(!Number.isSafeInteger(answerN)||answerN<0)return base;
 let answerMode,answerRat,correctText,correctHtml,correctLabel,choices,ans,form,conversionType;
 if(kind==='number'){
   answerMode='number';answerRat=rational(answerN,1);correctText=String(answerN);correctHtml=correctText;
   correctLabel=correctText;ans=correctText;choices=g5nums(answerN,[answerN+1,Math.max(0,answerN-1),answerN+den]);
 }else if(kind==='mixed'){
   const w=Math.floor(answerN/den),r=answerN%den;
   if(w<1||r<1)return base;
   answerMode='fraction';answerRat=rational(answerN,den);correctText=w+' '+r+'/'+den;
   correctHtml=mixed(w,r,den);correctLabel=correctHtml;ans='ok';conversionType='mixed';form={kind:'mixed'};
   const variants=[{label:correctHtml,key:'ok'},{label:mixed(w+1,r,den),key:'a'},
     {label:mixed(w+2,r,den),key:'b'},{label:mixed(w+3,r,den),key:'c'}];
   choices=g5q(question,variants,'ok',explanation,family).choices;
 }else{
   answerMode='fraction';answerRat=rational(answerN,den);correctText=answerN+'/'+den;
   correctHtml=frac(answerN,den);correctLabel=correctHtml;conversionType='improper';
   form={kind:'exact',n:answerN,d:den};
   const [reducedN,reducedD]=g5NewRat(answerN,den);
   ans=reducedN+'/'+reducedD;
   choices=g5NewChoiceSet(answerN,den,[[answerN+1,den],[Math.max(0,answerN-1),den],[answerN,den+1]]);
 }
 const audit={...(base.mk5Audit||{}),type:kind==='number'?'numeric':'rational',
   expected:kind==='number'?answerN:(()=>{const x=g5NewRat(answerN,den);return x[0]+'/'+x[1]})(),
   numerator:kind==='number'?undefined:answerN,denominator:kind==='number'?undefined:den,
   level,stage,topic,pedagogicalFamily:family};
 const signature='g5:'+topic+':'+topic+':'+family+':'+stripHtmlText(question)+':'+correctText;
 return {...base,text:question,ans,choices,ex:explanation,templateId:'g5_conversion_'+family,
   sig:signature,answerMode,answerRat,correctText,correctHtml,correctLabel,preferMixed:kind==='mixed',
   stage18AnswerForm:form||null,stage18FixedDenominator:kind==='number'?undefined:den,
   stage18ConversionType:conversionType||null,stage18SingleFieldLabel:kind==='number'?label:null,
   inputHint:kind==='number'?'Введи одно число. Другие поля не нужны.':'',
   mk5Audit:audit,conversionAudit:{topic,family,position:pos,stage,level,whole,rem,den,
     originalNumerator:originalN,answerNumerator:answerN,answerKind:kind}};
}
makeG5Question=function(id){
 // Repeated conversion families must still have different visible numbers.
 // The session stores signatures of already shown tasks; reroll both the
 // source fraction and the conversion, not only the final answer.
 const requested=String(id||'');
 if(requested!=='frac_to_mixed'&&requested!=='mixed_to_frac')return previousMake.apply(this,arguments);
 const used=Array.isArray(blockSession?.usedSignatures)?blockSession.usedSignatures:[];
 for(let attempt=0;attempt<32;attempt++){
  const base=previousMake.apply(this,arguments);
  if(!base)return base;
  const topic=String(base.sourceTopicId||requested);
  if(topic!==requested)return base;
  const given=displayedParts(base.text);
  if(!given)return base;
  const converted=conversionQuestion(base,topic,given);
  if(!used.includes(converted.sig))return converted;
 }
 throw Error('No unique visible Grade 5 conversion task after 32 draws: '+requested);
};
const previousMarkup=stage18FractionMarkup;
stage18FractionMarkup=function(nextHandler,skipHandler,hint){
 const type=q?.stage18ConversionType,den=q?.stage18FixedDenominator;
 if(keyGrade(qid)!==5||!['mixed','improper'].includes(type)||!Number.isSafeInteger(den))return previousMarkup.apply(this,arguments);
 const cell=(id,title,val,locked=false)=>'<label class="stage18-frac-part"><span class="stage18-frac-label">'+title+'</span><input id="'+id+'" class="stage18-frac-cell" autocomplete="off" inputmode="numeric" aria-label="'+title+'"'+(locked?' value="'+val+'" readonly aria-readonly="true"':'')+'></label>';
 const whole=type==='mixed'?cell('quizFracWhole','Целая часть',''):'';
 const numerator='<label class="stage18-frac-part"><span class="stage18-frac-label">Числитель</span><input id="quizFracNum" class="stage18-frac-cell" autocomplete="off" inputmode="numeric" aria-label="Числитель"></label>';
 const denominator=cell('quizFracDen','Знаменатель',den,true);
 const fraction='<div class="stage18-frac-part"><div class="stage18-frac-stack">'+numerator+'<div class="stage18-frac-bar" role="presentation"></div>'+denominator+'</div></div>';
 const label=type==='mixed'?'Впиши целую часть и остаток (числитель)':'Впиши новый числитель';
 return '<div class="quiz-input-wrap stage18-frac-wrap"><div class="quiz-input-label stage18-frac-title">'+label+'</div><div class="stage18-frac-entry">'+whole+fraction+'</div><div class="stage18-frac-note">Знаменатель '+den+' уже указан и не меняется.</div></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="'+nextHandler+'()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="'+skipHandler+'()">⏭ Пропустить задание</button></div>';
};
const previousAnswerMarkup=quizAnswerMarkup;
quizAnswerMarkup=function(nextHandler,skipHandler){
 let html=previousAnswerMarkup.apply(this,arguments);
 if(q?.stage18SingleFieldLabel)html=html.replace('>Введите ответ</label>','>'+q.stage18SingleFieldLabel+'</label>');
 return html;
};
const previousEvaluate=quizInputEvaluation;
quizInputEvaluation=function(question,raw){
 const result=previousEvaluate.apply(this,arguments);
 if(!question?.stage18ConversionType||!result?.valid||!result.ok)return result;
 const d=String(raw?.denominator||'').trim(),n=String(raw?.numerator||'').trim(),w=String(raw?.whole||'').trim();
 const fixed=question.stage18FixedDenominator;
 const formOK=Number(d)===fixed&&n!==''&&(
  question.stage18ConversionType==='improper'?!w&&Number(n)>=fixed:
  w!==''&&Number(n)>0&&Number(n)<fixed
 );
 return formOK?result:{...result,ok:false,detail:'Укажи ответ в нужной форме, сохранив знаменатель.',
  retryMessage:'🟡 Проверь запись: знаменатель остаётся прежним; заполни только нужные клетки.'};
};
document.addEventListener('input',function(event){
 if(keyGrade(qid)!==5||!q?.stage18ConversionType)return;
 const id=event.target?.id;
 if(id!=='quizFracWhole'&&id!=='quizFracNum')return;
 event.target.classList.remove('good','bad');
 event.stopPropagation();
 if(id==='quizFracWhole'&&/^\d+$/.test(event.target.value))document.getElementById('quizFracNum')?.focus();
},true);
})();
