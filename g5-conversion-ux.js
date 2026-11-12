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
 if(!Number.isSafeInteger(numerator)||!Number.isSafeInteger(denominator)||denominator<1)return null;
 return {numerator,denominator,whole};
}
makeG5Question=function(id){
 const base=previousMake.apply(this,arguments);
 if(!base)return base;
 const topic=String(base.sourceTopicId||id||''),variant=String(base.templateId||'');
 if(topic!=='frac_to_mixed'&&topic!=='mixed_to_frac')return base;
 const given=displayedParts(base.text);
 if(!given)return base;
 if(topic==='frac_to_mixed'&&given.whole===null&&(variant==='improper_whole_part'||(Number(blockSession?.done||0)+activeDifficulty())%3===1)){
   const whole=Math.floor(given.numerator/given.denominator);
   return {...base,text:'Сколько целых содержится в дроби '+frac(given.numerator,given.denominator)+'? Введи только число целых.',
     answerMode:'number',answerRat:rational(whole,1),correctText:String(whole),correctHtml:String(whole),
     stage18SingleFieldLabel:'Количество целых',inputHint:'Одно число. Дробные клетки не нужны.'};
 }
 if(topic==='mixed_to_frac'&&given.whole!==null&&(variant==='mixed_numerator'||(Number(blockSession?.done||0)+activeDifficulty())%3===1)){
   const numerator=given.whole*given.denominator+given.numerator;
   return {...base,text:'Переведи '+mixed(given.whole,given.numerator,given.denominator)+' в неправильную дробь. Какой получится числитель?',
     answerMode:'number',answerRat:rational(numerator,1),correctText:String(numerator),correctHtml:String(numerator),
     stage18SingleFieldLabel:'Новый числитель',inputHint:'Введи только числитель. Знаменатель не меняется.'};
 }
 if(topic==='mixed_to_frac'&&given.whole!==null){
   const numerator=given.whole*given.denominator+given.numerator;
   return {...base,text:'Запиши '+mixed(given.whole,given.numerator,given.denominator)+' неправильной дробью.',
     answerMode:'fraction',answerRat:rational(numerator,given.denominator),preferMixed:false,
     correctText:numerator+'/'+given.denominator,correctHtml:frac(numerator,given.denominator),
     stage18AnswerForm:{kind:'exact',n:numerator,d:given.denominator},
     stage18FixedDenominator:given.denominator,stage18ConversionType:'improper'};
 }
 if(topic==='frac_to_mixed'&&given.whole===null){
   const whole=Math.floor(given.numerator/given.denominator),rem=given.numerator%given.denominator;
   if(whole<1||rem<1)return base;
   return {...base,text:'Представь '+frac(given.numerator,given.denominator)+' смешанным числом.',
     answerMode:'fraction',answerRat:rational(given.numerator,given.denominator),preferMixed:true,
     correctText:whole+' '+rem+'/'+given.denominator,correctHtml:mixed(whole,rem,given.denominator),
     stage18AnswerForm:{kind:'mixed'},stage18FixedDenominator:given.denominator,
     stage18ConversionType:'mixed'};
 }
 return base;
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
