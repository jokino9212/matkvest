# Stage18 focus: quiz input and answer pipeline

## g5q, line 1681, offset 265304, function_span 303 chars
~~~javascript
function g5q(text,choices,correct,explain,templateId="base"){let u=finalizeChoices(String(correct),g5UniqChoices(choices),Math.max(2,Math.min(4,choices.length||4))),c=u.find(x=>String(x.key)===String(correct));return{text,choices:u,correct:String(correct),correctLabel:c?c.label:"",explain,templateId}}

~~~
## g5FractionChoices, line 1693, offset 266122, function_span 324 chars
~~~javascript
function g5FractionChoices(correctN,correctD,extras=[]){
 let arr=[{label:frac(correctN,correctD),key:correctN+"/"+correctD},...extras];
 let guard=0;
 while(arr.length<4&&guard++<50){let d=ri(2,12),n=ri(1,Math.max(1,d+3));let k=n+"/"+d;if(!arr.some(x=>x.key===k))arr.push({label:frac(n,d),key:k})}
 return arr.slice(0,4)
}

~~~
## parseRationalInput, line 2604, offset 553748, function_span 1175 chars
~~~javascript
function parseRationalInput(value){
 const raw=String(value??"").trim().replace(/[−–—]/g,"-");
 if(!raw)return {ok:false,empty:true,error:"empty"};
 let m=raw.match(/^([+-]?\d+)$/);
 if(m){const n=Number(m[1]);return {ok:Number.isSafeInteger(n),rat:rational(n,1),rawN:n,rawD:1,wasReduced:true,kind:"integer",raw}}
 m=raw.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
 if(m){const n=Number(m[1]),d=Number(m[2]);if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)return {ok:false,error:d===0?"zero-denominator":"invalid",raw};const posD=Math.abs(d),signedN=d<0?-n:n,g=gcd(Math.abs(signedN),posD);return {ok:true,rat:rational(signedN,posD),rawN:signedN,rawD:posD,wasReduced:g===1,kind:"fraction",raw}}
 m=raw.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(m){const w=Number(m[1]),n=Number(m[2]),d=Number(m[3]);if(!Number.isSafeInteger(w)||!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0||n<0||n>=d)return {ok:false,error:d===0?"zero-denominator":"invalid",raw};const sign=w<0?-1:1,total=sign*(Math.abs(w)*d+n),g=gcd(n,d);return {ok:true,rat:rational(total,d),rawWhole:w,rawN:n,rawD:d,wasReduced:g===1,kind:"mixed",raw}}
 return {ok:false,error:"invalid",raw};
}

~~~
## g6FractionInputQuestion, line 2615, offset 554923, function_span 468 chars
~~~javascript
function g6FractionInputQuestion(text,answer,ex,sig,{requireReduced=false,preferMixed=true,audit={}}={}){
 const a=rational(answer.n,answer.d);return {text,ans:rationalPlain(a,preferMixed),correctText:rationalPlain(a,preferMixed),correctHtml:rationalHtml(a,preferMixed),answerMode:"fraction",answerRat:a,requireReduced:!!requireReduced,preferMixed:!!preferMixed,choices:[],ex,sig,audit};
}

/* ЭТАП 6.4: точный ввод чисел, отношений, нескольких частей и процентов. */

~~~
## quizPromptHtml, line 4791, offset 883261, function_span 118 chars
~~~javascript
function quizPromptHtml(question){return `<div class="quizq">${question?.text||""}</div>${quizVisualHtml(question)}`}

~~~
## renderErrorWorkQuiz, line 8860, offset 1738447, function_span 227 chars
~~~javascript
function renderErrorWorkQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextErrorWorkTask","skipErrorWorkQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}

~~~
## renderWeakPracticeQuiz, line 9017, offset 1765553, function_span 236 chars
~~~javascript
function renderWeakPracticeQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextWeakPracticeTask","skipWeakPracticeQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}

~~~
## renderControlQuiz, line 9117, offset 1782758, function_span 233 chars
~~~javascript
function renderControlQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextControlReviewTask","skipControlReviewQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}

~~~
## answerInputs, line 9790, offset 1916788, function_span 675 chars
~~~javascript
function answerInputs(value,cols,shift,rowid,klass="work-in",op=""){
 const arr=Array(cols).fill("");const s=String(value);const end=cols-1-shift;const start=end-s.length+1;
 for(let i=0;i<s.length;i++)arr[start+i]=s[i];
 let h=`<div class="cell op ${op==="+"?"mul-plus":""}">${op}</div>`;
 for(let c=0;c<cols;c++){
   if(c>end){h+='<div class="shiftcell" title="сдвиг по разряду"></div>';continue}
   if(arr[c]===""){h+='<div class="cell blank calc-spacer"></div>';continue}
   h+=`<input class="${klass}" maxlength="1" inputmode="numeric" data-exp="${arr[c]}" data-row="${rowid}" data-col="${c}" oninput="workInput(this)" onkeydown="workKey(event,this)">`;
 }
 return h;
}

~~~
## quizAnswerMarkup, line 10487, offset 1975689, function_span 3556 chars
~~~javascript
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   const inputMode=mode==="number"?"decimal":"text",suffix=q.unitSuffix?`<span class="quiz-input-suffix">${esc(q.unitSuffix)}</span>`:"";
   return `<div class="quiz-input-wrap"><label class="quiz-input-label" for="quizInput">Введите ответ</label><div class="quiz-input-line"><input id="quizInput" class="quiz-input" autocomplete="off" inputmode="${inputMode}">${suffix}</div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
 }
 return `<div class="answers">${q.choices.map((c,i)=>`<button class="answer" onclick="pick(${i})">${c.label}</button>`).join("")}</div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
}

~~~
## quizFractionAnswerHtml, line 10501, offset 1979245, function_span 567 chars
~~~javascript
function quizFractionAnswerHtml(parsed){
 if(!parsed?.ok)return "";
 if(parsed.kind==="integer")return `<span class="math">${parsed.rawN<0?"−"+Math.abs(parsed.rawN):parsed.rawN}</span>`;
 if(parsed.kind==="fraction"){const neg=parsed.rawN<0?"−":"";return `<span class="math">${neg}</span>${frac(Math.abs(parsed.rawN),parsed.rawD)}`}
 if(parsed.kind==="mixed"){const neg=parsed.rawWhole<0?"−":"";return `<span class="mixed"><span class="whole">${neg}${Math.abs(parsed.rawWhole)}</span>${frac(parsed.rawN,parsed.rawD)}</span>`}
 return rationalHtml(parsed.rat,true);
}

~~~
## quizInputEvaluation, line 10508, offset 1979812, function_span 7391 chars
~~~javascript
function quizInputEvaluation(question,raw){
 const mode=question?.answerMode||"choice",correctText=String(question?.correctText||question?.ans||""),correctHtml=question?.correctHtml||esc(correctText);
 if(mode==="time"){
   const m=String(raw||"").trim().match(/^(\d{1,2}):([0-5]\d)$/);if(!m)return {valid:false,message:"Введите время в формате часы:минуты, например 10:55."};
   const h=Number(m[1]),mm=Number(m[2]);if(h<0||h>23)return {valid:false,message:"Часы должны быть от 0 до 23."};const mins=h*60+mm,shown=g3TimeText(mins),ok=mins===question.answerMinutes;return {valid:true,ok,studentHtml:`<span class="math g3-time-answer">${shown}</span>`,studentText:shown,correctText,correctHtml,detail:`Правильное время: ${correctText}`,retryMessage:"🟡 Пока неверно. Проверь часы и минуты.",finalWrongMessage:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="coordinate"){
   const px=parseExactNumberInput(raw?.x),py=parseExactNumberInput(raw?.y);if(!px.ok||!py.ok)return {valid:false,message:"Проверьте координаты. В каждое поле нужно ввести число; десятичную дробь можно записать через запятую или точку."};
   const ok=rationalEq(px.rat,question.answerPoint.x)&&rationalEq(py.rat,question.answerPoint.y),student=`(${g6CoordText(px.rat)}; ${g6CoordText(py.rat)})`,studentHtml=`<span class="math">${esc(student)}</span>`;
   return {valid:true,ok,studentHtml,studentText:student,correctText,correctHtml,detail:`Правильные координаты: ${correctText}`,retryMessage:"🟡 Пока неверно. Сначала проверь абсциссу x, затем ординату y.",finalWrongMessage:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="remainder"){
   const pq=parseExactNumberInput(raw?.q),pr=parseExactNumberInput(raw?.r);if(!pq.ok||!pr.ok||pq.rat.d!==1||pr.rat.d!==1)return {valid:false,message:"Введите целые числа: частное и остаток."};
   const qv=pq.rat.n,rv=pr.rat.n,ok=qv===question.answerQuotient&&rv===question.answerRemainder,student=`${qv} (ост. ${rv})`;return {valid:true,ok,studentHtml:`<span class="math">${esc(student)}</span>`,studentText:student,correctText,correctHtml,detail:`Правильный ответ: ${correctText}`,retryMessage:"🟡 Пока неверно. Проверьте и частное, и остаток.",finalWrongMessage:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="linear"){
   const parsed=parseLinearExpression(raw);if(!parsed.ok)return {valid:false,message:"Проверьте запись ответа. Допустима линейная форма, например: 5x + 3, x − 4, −x + 7 или 6."};
   const equivalent=rationalEq(parsed.expr.a,question.answerLinear.a)&&rationalEq(parsed.expr.b,question.answerLinear.b),formOk=!question.requireCanonicalLinear||parsed.canonical,ok=equivalent&&formOk,studentHtml=formatLinearExpressionHtml(parsed.expr),detail=equivalent&&!formOk?"Выражение равносильно правильному, но подобные слагаемые нужно привести и убрать лишние 0/коэффициент 1.":`Правильный ответ: ${correctText}`;
   return {valid:true,ok,studentHtml,studentText:raw,correctText,correctHtml,detail,retryMessage:equivalent&&!formOk?"🟡 Значение выражения верное, но ответ нужно <b>полностью упростить</b>. Попробуйте ещё раз.":"🟡 Пока неверно. Проверьте коэффициент при x и свободное число.",finalWrongMessage:equivalent&&!formOk?`🟡 Выражение равносильно правильному, но требуется упрощённая запись: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="fraction"){
   const parsed=parseRationalInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-denominator"?"Знаменатель не может быть равен нулю.":"Не удалось распознать ответ. Введите дробь, смешанное число или целое."};
   const equivalent=rationalEq(parsed.rat,question.answerRat),formOk=!question.requireReduced||parsed.wasReduced,ok=equivalent&&formOk;return {valid:true,ok,studentHtml:quizFractionAnswerHtml(parsed),studentText:raw,correctText,correctHtml,detail:equivalent&&!formOk?"Значение верное, но дробь нужно сократить полностью.":`Правильный ответ: ${correctText}`,retryMessage:equivalent&&!formOk?"🟡 Значение верное, но дробь нужно <b>сократить полностью</b>. Попробуй ещё раз.":"🟡 Пока неверно. Попробуй ещё раз или пропусти задание.",finalWrongMessage:equivalent&&!formOk?`🟡 Значение дроби верное, но по условию её нужно <b>сократить полностью</b>. Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="number"){
   const parsed=parseExactNumberInput(raw,{allowPercent:!!question.allowPercent});if(!parsed.ok)return {valid:false,message:parsed.error==="percent-not-allowed"?"Знак % здесь вводить не нужно.":parsed.error==="too-many-decimals"?"Слишком много знаков после запятой.":"Не удалось распознать число. Можно использовать запятую или точку для десятичной дроби."};
   const ok=rationalEq(parsed.rat,question.answerRat),suffix=question.unitSuffix||"",hasPercent=/%\s*$/.test(raw),studentHtml=`<span class="math">${esc(String(raw).replace(/[−–—]/g,"-").replace(/^-/,"−"))}</span>${suffix&&!hasPercent?` <span class="math-unit">${esc(suffix)}</span>`:""}`,studentText=suffix&&!hasPercent?`${raw}${suffix==="%"?"%":` ${suffix}`}`:raw;return {valid:true,ok,studentHtml,studentText,correctText,correctHtml,detail:`Правильный ответ: ${correctText}`,retryMessage:"🟡 Пока неверно. Попробуй ещё раз или пропусти задание.",finalWrongMessage:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="ratio"){
   const parsed=parseRatioInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-second"?"Второе число отношения не может быть нулём.":"Не удалось распознать отношение. Введите, например: 2 : 3."};
   const [a,b]=question.answerRatio||[0,1],equivalent=parsed.a*b===a*parsed.b,reduced=gcd(Math.abs(parsed.a),Math.abs(parsed.b))===1,formOk=!question.requireReducedRatio||reduced,ok=equivalent&&formOk,detail=equivalent&&!formOk?"Отношение эквивалентно правильному, но его нужно сократить.":`Правильный ответ: ${correctText}`;return {valid:true,ok,studentHtml:`<span class="math">${parsed.a} : ${parsed.b}</span>`,studentText:`${parsed.a} : ${parsed.b}`,correctText,correctHtml,detail,retryMessage:equivalent&&!formOk?"🟡 Отношение верное, но его нужно <b>сократить</b>. Попробуй ещё раз.":"🟡 Пока неверно. Попробуй ещё раз или пропусти задание.",finalWrongMessage:equivalent&&!formOk?`🟡 Отношение эквивалентно правильному, но нужно записать его в сокращённом виде: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="multi"){
   const parsed=parseMultiIntegerInput(raw);if(!parsed.ok)return {valid:false,message:"Не удалось распознать список чисел. Введите числа по порядку через пробел, запятую или точку с запятой."};
   const answer=question.answerList||[],ok=parsed.nums.length===answer.length&&parsed.nums.every((x,i)=>x===answer[i]),suffix=question.unitSuffix||"";return {valid:true,ok,studentHtml:`<span class="math">${parsed.nums.join(", ")}</span>${suffix?` <span class="math-unit">${esc(suffix)}</span>`:""}`,studentText:parsed.nums.join(", "),correctText,correctHtml,detail:`Правильный ответ: ${correctText}`,retryMessage:"🟡 Пока неверно. Проверь порядок и значения частей.",finalWrongMessage:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 return {valid:false,message:"Для этого задания не найден способ проверки ответа."};
}

~~~
## quizInputElements, line 10546, offset 1987203, function_span 391 chars
~~~javascript
function quizInputElements(question=q){
 if(question?.answerMode==="coordinate")return [document.getElementById("quizInputX"),document.getElementById("quizInputY")].filter(Boolean);
 if(question?.answerMode==="remainder")return [document.getElementById("quizInputQ"),document.getElementById("quizInputR")].filter(Boolean);
 const el=document.getElementById("quizInput");return el?[el]:[];
}

~~~
## quizInputRaw, line 10551, offset 1987594, function_span 472 chars
~~~javascript
function quizInputRaw(question=q){
 if(question?.answerMode==="coordinate")return {x:String(document.getElementById("quizInputX")?.value||"").trim(),y:String(document.getElementById("quizInputY")?.value||"").trim()};
 if(question?.answerMode==="remainder")return {q:String(document.getElementById("quizInputQ")?.value||"").trim(),r:String(document.getElementById("quizInputR")?.value||"").trim()};
 return String(document.getElementById("quizInput")?.value||"").trim();
}

~~~
## quizInputEmpty, line 10556, offset 1988066, function_span 203 chars
~~~javascript
function quizInputEmpty(question,raw){
 if(question?.answerMode==="coordinate")return !raw?.x||!raw?.y;
 if(question?.answerMode==="remainder")return !raw?.q||!raw?.r;
 return !String(raw||"").trim();
}

~~~
## focusQuizInput, line 10561, offset 1988269, function_span 218 chars
~~~javascript
function focusQuizInput(){const el=q?.answerMode==="coordinate"?document.getElementById("quizInputX"):q?.answerMode==="remainder"?document.getElementById("quizInputQ"):document.getElementById("quizInput");el?.focus()}

~~~
## quizKeyboard, line 10570, offset 1988811, function_span 1178 chars
~~~javascript
function quizKeyboard(e){
 if(!e||e.key!=="Enter")return;
 if(e.repeat){e.preventDefault();return}
 const stage=document.getElementById("qstage");
 if(!stage||!stage.contains(e.target))return;
 if(answered){e.preventDefault();e.stopPropagation();quizAdvanceResolved();return}
 if(!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q);
 if(!inputs.includes(e.target))return;
 e.preventDefault();e.stopPropagation();
 if(q.answerMode==="coordinate"){
   const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY"),fb=document.getElementById("qfb");
   if(!String(x?.value||"").trim()){if(fb)fb.textContent="Введите абсциссу x.";x?.focus();return}
   if(!String(y?.value||"").trim()){if(fb)fb.textContent="Введите ординату y.";y?.focus();return}
 }
 if(q.answerMode==="remainder"){
   const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR"),fb=document.getElementById("qfb");
   if(!String(qq?.value||"").trim()){if(fb)fb.textContent="Введите частное.";qq?.focus();return}
   if(!String(rr?.value||"").trim()){if(fb)fb.textContent="Введите остаток.";rr?.focus();return}
 }
 checkQuizInput();
}

~~~
## bindQuizKeyboard, line 10592, offset 1989989, function_span 187 chars
~~~javascript
function bindQuizKeyboard(){const stage=document.getElementById("qstage");if(stage)stage.onkeydown=quizKeyboard}

/* ЭТАП 8.47 — неправильный ответ направляет, но не раскрывает ответ. */

~~~
## checkQuizInput, line 10619, offset 1999044, function_span 4382 chars
~~~javascript
function checkQuizInput(){
 if(answered||!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q),fb=document.getElementById("qfb");if(!inputs.length||!fb)return;
 const raw=quizInputRaw(q);
 if(quizInputEmpty(q,raw)){
   fb.innerHTML=q.answerMode==="coordinate"?"Введите обе координаты. Пустая проверка не считается ошибкой.":q.answerMode==="remainder"?"Введите частное и остаток. Пустая проверка не считается ошибкой.":"Введите ответ. Пустая проверка не считается ошибкой.";
   if(q.answerMode==="coordinate"){
     const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY");
     (!String(x?.value||"").trim()?x:y)?.focus();
   }else if(q.answerMode==="remainder"){
     const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR");
     (!String(qq?.value||"").trim()?qq:rr)?.focus();
   }else inputs[0]?.focus();
   return;
 }
 const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!String(x.value||"").trim())?.focus();return}
 const ok=!!ev.ok,correctText=ev.correctText,correctHtml=ev.correctHtml;
 addAttemptCheck({answer:ev.studentText,correct:ok,details:ok?[]:[ev.detail]});
 if(!ok){
   award(false,"normal");
   quizPenalty=true;
   inputs.forEach(input=>input.classList.add("bad"));
   const retryText=String(qid||"").startsWith("g3:")?`🟡 Пока неверно. ${g3WrongHint847(q)}`:keyGrade(qid)===4?`🟡 Пока неверно. ${g4WrongHint(qid)}`:keyGrade(qid)===5?`🟡 Пока неверно. ${g5WrongHint(qid)}`:keyGrade(qid)===6?`🟡 Пока неверно. ${g6WrongHint(qid)}`:keyGrade(qid)===7?`🟡 Пока неверно. ${g7WrongHint851(q,qid)}`:keyGrade(qid)===8?`🟡 Пока неверно. ${g8WrongHint852(q,qid)}`:ev.retryMessage;
   fb.innerHTML=isErrorWork()?`${retryText} Даже после исправления эта старая ошибка останется на повторение.`:retryText;
   inputs[0]?.focus();inputs[0]?.select?.();
   return;
 }
 answered=true;
 const firstTry=!quizPenalty,source=isErrorWork()?blockSession.errorCurrentSource:null;
 let ew=null,wp=null,cp=null;
 if(isErrorWork())ew=completeErrorWorkOutcome(source,{correct:true,firstTry});
 else if(isWeakPractice())wp=weakPracticeAward();
 else if(isControlReview())cp=controlReviewAward();
 finishAttemptItem(true,firstTry,{studentAnswer:ev.studentText,studentAnswerHtml:ev.studentHtml,correctAnswer:correctText,correctAnswerHtml:correctHtml,explanation:q.ex,...(isErrorWork()?{remediationOutcome:ew?.outcome||"repeat"}:{})});
 if(blockSession)recordBlockItem(isControlReview()?true:firstTry);
 let reward={xp:0,coins:0,bonus:""};
 if(!isErrorWork()&&!isWeakPractice()&&!isControlReview())reward=award(true,"normal");
 else if(isErrorWork())reward={xp:ew?.xp||0,coins:ew?.coins||0,bonus:""};
 else if(isWeakPractice())reward={xp:wp?.xp||0,coins:wp?.coins||0,bonus:""};
 else reward={xp:cp?.xp||0,coins:cp?.coins||0,bonus:""};
 inputs.forEach(input=>{input.disabled=true;input.classList.remove("bad");input.classList.add("good")});
 const check=document.getElementById("quizCheck");if(check)check.style.display="none";
 if(isErrorWork())fb.innerHTML=ew?.outcome==="resolved"?`✅ Ошибка отработана. <span style="color:var(--muted)">+${reward.xp} XP, +${reward.coins} 🪙</span> ${q.ex}`:`🟡 Верно после исправления — ошибка останется на повторение. ${q.ex}`;
 else if(isWeakPractice())fb.innerHTML=`${firstTry?"✅ Верно с первой!":"🟡 Исправлено!"} <span style="color:var(--muted)">+${reward.xp} XP, +${reward.coins} 🪙</span> ${q.ex}`;
 else if(isControlReview())fb.innerHTML=`${firstTry?"✅ Верно с первой!":"🟡 Исправлено!"} <span style="color:var(--muted)">+${reward.xp} XP, +${reward.coins} 🪙</span> ${q.ex}`;
 else fb.innerHTML=`${firstTry?"✅ Верно!":"🟡 Исправлено!"} <span style="color:var(--muted)">+${reward.xp} XP, +${reward.coins} 🪙${reward.bonus}</span> ${q.ex}`;
 const nb=document.getElementById("quizNext"),skip=document.getElementById("quizSkip");if(skip)skip.style.display="none";
 if(nb){
   nb.style.display="inline-block";nb.classList.add("next-ready");
   if(blockSession?.finished){nb.textContent="Посмотреть результат →";nb.onclick=finishBlock}
   else{nb.textContent=`Следующий пример ${blockSession?blockSession.done+1:""}${blockSession?"/"+blockSession.total:""} →`;nb.onclick=isErrorWork()?startNextErrorWorkTask:isWeakPractice()?startNextWeakPracticeTask:isControlReview()?startNextControlReviewTask:nextQ}
   setTimeout(()=>nb.focus(),0);
 }
}


~~~
## questAnswerKey, line 10951, offset 2047703, function_span 220 chars
~~~javascript
function questAnswerKey(item,key){if(item?.topicKey)return item.topicKey;const fake={key:key||`g${item?.grade||4}:${item?.topicId||""}`,grade:item?.grade,topicId:item?.topicId};return topicKeyFromAttemptItem(fake,item)}

~~~
## needle answerMode==="fraction" count 1
- line 10483
~~~javascript
ession._g7qLastPosition=blockSession._g7qLastPosition||{};
 blockSession._g7qLastVariant[raw]=g7R7112Variant(best);blockSession._g7qLastPosition[raw]=g7R7112ChoiceIndex(best);return best;
};

function quizTitleForId(id){
 const s=String(id),isG3=s.startsWith("g3:"),isG7=s.startsWith("g7:"),isG6=s.startsWith("g6:"),isG5=s.startsWith("g5:"),raw=rawCourseId(id);
 if(isG3)return g3InfoById(id)?.title||"3 класс";
 if(isG7)return g7InfoById(id)?.title||"7 класс";
 if(isG6)return g6InfoById(id)?.title||"6 класс";
 return isG5?(raw==="fraction_mix"?"Микс по дробям":g5InfoById(raw)?.title||"Задание"):TOPICS.find(x=>x.id===raw)?.title||"Задание";
}
function correctChoicePlain(question){
 if(question?.answerMode==="fraction"||question?.answerMode==="remainder")return String(question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX
~~~
## needle answerMode === "fraction" count 0
## needle q.answerMode count 20
- line 8855
~~~javascript
mediationItemMeta(source,{kind:"table",label:"Таблица умножения",prompt:`${ta} × ${tb} = ?`,correctAnswer:String(ta*tb)}));renderErrorWorkTable();return;
 }
 qid=source.grade===2?`g2:${String(source.topicId).replace(/^g2:/,"")}`:source.grade===3?`g3:${source.topicId}`:source.grade===8?`g8:${source.topicId}`:source.grade===7?`g7:${source.topicId}`:source.grade===6?`g6:${source.topicId}`:source.grade===5?`g5:${source.topicId}`:source.topicId;answered=false;quizPenalty=false;q=freshErrorQuiz(source);
 beginAttemptItem(remediationItemMeta(source,{kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:source.grade,topicId:source.topicId,sourceTopicId:q.sourceTopicId||source.topicId,questionSignature:q._signature||q.sig||""}));renderErrorWorkQuiz();
}
function renderErrorWorkTable(){
 tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>document.getElementById("fin")?.focus(),0);
}
function renderErrorWorkQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextErrorWorkTask","skipErrorWorkQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function findSourceError(sou
~~~
- line 8860
~~~javascript
"}));renderErrorWorkQuiz();
}
function renderErrorWorkTable(){
 tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>document.getElementById("fin")?.focus(),0);
}
function renderErrorWorkQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextErrorWorkTask","skipErrorWorkQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function findSourceError(source){
 const rec=(state.attemptHistory||[]).find(r=>r.id===source?.sourceAttemptId);if(!rec)return null;
 const item=(rec.items||[]).find(x=>x.itemId===source?.sourceItemId);return item?{record:rec,item}:null;
}
function markErrorOutcome(source,result,resolved=false){
 const hit=findSourceError(source);if(!hit)return false;const rem=normalizeRemediation(hit.item.remediation)||{resolved:false,resolvedAt:null,resolvedAttemptId:null,lastAttemptAt:null,lastAttemptId:null,lastResult:null,attempts:0};
 rem.attempts=Math.max(0,Number(rem.attempts||0))+1;rem.lastAttemptAt=Date.now();rem.lastAttemptId=blockSession?.attemptId||null;rem.lastResult=result;
 let newlyResolved=false;
 if(resolved&&!rem.resolved){rem.resolved=true;rem.resolvedAt=Date.now();rem.resolvedAttemptId=blockSession?.attemptId||null;rem.lastResult="resolved";newlyResolved=true}
 hit.item.remediat
~~~
- line 9014
~~~javascript
ectAnswer:String(ta*tb),grade:4,topicId:"table",practiceStageIndex:target.stageIndex});renderWeakPracticeTable();return}
 qid=target.grade===1?`g1:${String(target.topicId).replace(/^g1:/,"")}`:target.grade===2?`g2:${String(target.topicId).replace(/^g2:/,"")}`:target.grade===3?`g3:${target.topicId}`:target.grade===8?`g8:${target.topicId}`:target.grade===7?`g7:${target.topicId}`:target.grade===6?`g6:${target.topicId}`:target.grade===5?`g5:${target.topicId}`:target.topicId;answered=false;quizPenalty=false;q=weakQuestion(target);beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:target.grade,topicId:target.topicId,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",practiceStageIndex:target.stageIndex});renderWeakPracticeQuiz();
}
function renderWeakPracticeTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderWeakPracticeQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextWeakPracticeTask","skipWeakPracticeQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function 
~~~
- line 9017
~~~javascript
x:target.stageIndex});renderWeakPracticeQuiz();
}
function renderWeakPracticeTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderWeakPracticeQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextWeakPracticeTask","skipWeakPracticeQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function weakPracticeWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function weakPracticeAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.practiceXpEarned=(blockSession.practiceXpEarned||0)+5;blockSession.practiceCoinsEarned=(blockSession.practiceCoinsEarned||0)+1;save();return {xp:5,coins:1}}
function skipCurrentWeakPractice(){if(!isWeakPractice()||!blockSession.currentItem)return false;finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});recordBlockItem(false);save();if(blockSession.finished)finishWeakPractice();else startNextWeakPracticeTask();return true}
function skipWeakPracticeQuiz(){if(answered||!isWeakPractice())return;answered=true;skipCurrentWeakPractice()}
function repeatWeakPractice()
~~~
- line 9114
~~~javascript
l:"Таблица умножения",prompt:`${ta} × ${tb} = ?`,correctAnswer:String(ta*tb),...common});renderControlTable();return}
 qid=target.grade===1?`g1:${String(target.topicId).replace(/^g1:/,"")}`:target.grade===2?`g2:${String(target.topicId).replace(/^g2:/,"")}`:target.grade===3?`g3:${target.topicId}`:target.grade===8?`g8:${target.topicId}`:target.grade===7?`g7:${target.topicId}`:target.grade===6?`g6:${target.topicId}`:target.grade===5?`g5:${target.topicId}`:target.topicId;answered=false;quizPenalty=false;q=controlQuestion(target);beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",...common});renderControlQuiz();
}
function renderControlTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderControlQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextControlReviewTask","skipControlReviewQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function controlReviewWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save(
~~~
- line 9117
~~~javascript
.sig||q._signature||"",...common});renderControlQuiz();
}
function renderControlTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderControlQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextControlReviewTask","skipControlReviewQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function controlReviewWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function controlReviewAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.controlXpEarned=(blockSession.controlXpEarned||0)+5;blockSession.controlCoinsEarned=(blockSession.controlCoinsEarned||0)+1;save();return {xp:5,coins:1}}
function skipCurrentControlReview(){if(!isControlReview()||!blockSession.currentItem)return false;finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});recordBlockItem(false);save();if(blockSession.finished)finishControlReview();else startNextControlReviewTask();return true}
function skipControlReviewQuiz(){if(answered||!isControlReview())return;answered=true;skipCurrentControlReview()}
function repeatControlRe
~~~
- line 10488
~~~javascript
"),raw=rawCourseId(id);
 if(isG3)return g3InfoById(id)?.title||"3 класс";
 if(isG7)return g7InfoById(id)?.title||"7 класс";
 if(isG6)return g6InfoById(id)?.title||"6 класс";
 return isG5?(raw==="fraction_mix"?"Микс по дробям":g5InfoById(raw)?.title||"Задание"):TOPICS.find(x=>x.id===raw)?.title||"Задание";
}
function correctChoicePlain(question){
 if(question?.answerMode==="fraction"||question?.answerMode==="remainder")return String(question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div
~~~
- line 10489
~~~javascript
g3InfoById(id)?.title||"3 класс";
 if(isG7)return g7InfoById(id)?.title||"7 класс";
 if(isG6)return g6InfoById(id)?.title||"6 класс";
 return isG5?(raw==="fraction_mix"?"Микс по дробям":g5InfoById(raw)?.title||"Задание"):TOPICS.find(x=>x.id===raw)?.title||"Задание";
}
function correctChoicePlain(question){
 if(question?.answerMode==="fraction"||question?.answerMode==="remainder")return String(question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div cl
~~~
- line 10576
~~~javascript
.getElementById("quizInputQ"):document.getElementById("quizInput");el?.focus()}
function quizAdvanceResolved(){
 if(!answered)return false;
 if(blockSession?.finished){finishBlock();return true}
 if(isErrorWork()){startNextErrorWorkTask();return true}
 if(isWeakPractice()){startNextWeakPracticeTask();return true}
 if(isControlReview()){startNextControlReviewTask();return true}
 nextQ();return true;
}
function quizKeyboard(e){
 if(!e||e.key!=="Enter")return;
 if(e.repeat){e.preventDefault();return}
 const stage=document.getElementById("qstage");
 if(!stage||!stage.contains(e.target))return;
 if(answered){e.preventDefault();e.stopPropagation();quizAdvanceResolved();return}
 if(!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q);
 if(!inputs.includes(e.target))return;
 e.preventDefault();e.stopPropagation();
 if(q.answerMode==="coordinate"){
   const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY"),fb=document.getElementById("qfb");
   if(!String(x?.value||"").trim()){if(fb)fb.textContent="Введите абсциссу x.";x?.focus();return}
   if(!String(y?.value||"").trim()){if(fb)fb.textContent="Введите ординату y.";y?.focus();return}
 }
 if(q.answerMode==="remainder"){
   const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR"),fb=document.getElementById("qfb");
   if(!String(qq?.value||"").trim()){if(fb)fb.textContent="Введите частное.";qq?.focus();return}
   if(!String(rr?.value||"").trim()){if(fb)fb.textContent="Введите остаток.";rr?.focus();return}
 }
 checkQuizInput();
}
function bindQuizKeyboard(){const stage=document.getElementById("qst
~~~
- line 10580
~~~javascript
sion?.finished){finishBlock();return true}
 if(isErrorWork()){startNextErrorWorkTask();return true}
 if(isWeakPractice()){startNextWeakPracticeTask();return true}
 if(isControlReview()){startNextControlReviewTask();return true}
 nextQ();return true;
}
function quizKeyboard(e){
 if(!e||e.key!=="Enter")return;
 if(e.repeat){e.preventDefault();return}
 const stage=document.getElementById("qstage");
 if(!stage||!stage.contains(e.target))return;
 if(answered){e.preventDefault();e.stopPropagation();quizAdvanceResolved();return}
 if(!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q);
 if(!inputs.includes(e.target))return;
 e.preventDefault();e.stopPropagation();
 if(q.answerMode==="coordinate"){
   const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY"),fb=document.getElementById("qfb");
   if(!String(x?.value||"").trim()){if(fb)fb.textContent="Введите абсциссу x.";x?.focus();return}
   if(!String(y?.value||"").trim()){if(fb)fb.textContent="Введите ординату y.";y?.focus();return}
 }
 if(q.answerMode==="remainder"){
   const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR"),fb=document.getElementById("qfb");
   if(!String(qq?.value||"").trim()){if(fb)fb.textContent="Введите частное.";qq?.focus();return}
   if(!String(rr?.value||"").trim()){if(fb)fb.textContent="Введите остаток.";rr?.focus();return}
 }
 checkQuizInput();
}
function bindQuizKeyboard(){const stage=document.getElementById("qstage");if(stage)stage.onkeydown=quizKeyboard}

/* ЭТАП 8.47 — неправильный ответ направляет, но не раскрывает ответ. */
function g3WrongHint847(question)
~~~
- line 10585
~~~javascript
 stage=document.getElementById("qstage");
 if(!stage||!stage.contains(e.target))return;
 if(answered){e.preventDefault();e.stopPropagation();quizAdvanceResolved();return}
 if(!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q);
 if(!inputs.includes(e.target))return;
 e.preventDefault();e.stopPropagation();
 if(q.answerMode==="coordinate"){
   const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY"),fb=document.getElementById("qfb");
   if(!String(x?.value||"").trim()){if(fb)fb.textContent="Введите абсциссу x.";x?.focus();return}
   if(!String(y?.value||"").trim()){if(fb)fb.textContent="Введите ординату y.";y?.focus();return}
 }
 if(q.answerMode==="remainder"){
   const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR"),fb=document.getElementById("qfb");
   if(!String(qq?.value||"").trim()){if(fb)fb.textContent="Введите частное.";qq?.focus();return}
   if(!String(rr?.value||"").trim()){if(fb)fb.textContent="Введите остаток.";rr?.focus();return}
 }
 checkQuizInput();
}
function bindQuizKeyboard(){const stage=document.getElementById("qstage");if(stage)stage.onkeydown=quizKeyboard}

/* ЭТАП 8.47 — неправильный ответ направляет, но не раскрывает ответ. */
function g3WrongHint847(question){
 const raw=rawCourseId(qid||"");
 const hints={
  numbers_1000:"Проверь место числа в ряду: для соседнего числа меняется на 1.",place_value:"Проверь отдельно сотни, десятки и единицы.",compare_order:"Сравни сначала сотни; если они равны — десятки, затем единицы.",increase_decrease_times:"Слова «в несколько раз» требуют умножения или деления.",multiplica
~~~
- line 10620
~~~javascript
 90°.",symmetry:"Образ должен быть на таком же расстоянии от оси или центра, как исходная точка.",circle:"Различай линию-окружность и область-круг; диаметр обязательно проходит через центр.",circumference:"Проверь, дан радиус или диаметр, и выбери C = 2πr или C = πd.",circle_area:"Если дан диаметр, сначала найди радиус; затем используй S = πr².",prism:"Различай вершины, рёбра и грани объёмной фигуры и внимательно смотри, какой размер спрашивают.",volume:"Приведи три размера к одинаковым единицам, перемножь их и запиши кубические единицы."
 };
 return hints[raw]||"Проверь правило темы и повтори решение по шагам, не угадывая ответ.";
}

function checkQuizInput(){
 if(answered||!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q),fb=document.getElementById("qfb");if(!inputs.length||!fb)return;
 const raw=quizInputRaw(q);
 if(quizInputEmpty(q,raw)){
   fb.innerHTML=q.answerMode==="coordinate"?"Введите обе координаты. Пустая проверка не считается ошибкой.":q.answerMode==="remainder"?"Введите частное и остаток. Пустая проверка не считается ошибкой.":"Введите ответ. Пустая проверка не считается ошибкой.";
   if(q.answerMode==="coordinate"){
     const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY");
     (!String(x?.value||"").trim()?x:y)?.focus();
   }else if(q.answerMode==="remainder"){
     const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR");
     (!String(qq?.value||"").trim()?qq:rr)?.focus();
   }else inputs[0]?.focus();
   return;
 }
 const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!St
~~~
- line 10624
~~~javascript
:"Проверь, дан радиус или диаметр, и выбери C = 2πr или C = πd.",circle_area:"Если дан диаметр, сначала найди радиус; затем используй S = πr².",prism:"Различай вершины, рёбра и грани объёмной фигуры и внимательно смотри, какой размер спрашивают.",volume:"Приведи три размера к одинаковым единицам, перемножь их и запиши кубические единицы."
 };
 return hints[raw]||"Проверь правило темы и повтори решение по шагам, не угадывая ответ.";
}

function checkQuizInput(){
 if(answered||!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q),fb=document.getElementById("qfb");if(!inputs.length||!fb)return;
 const raw=quizInputRaw(q);
 if(quizInputEmpty(q,raw)){
   fb.innerHTML=q.answerMode==="coordinate"?"Введите обе координаты. Пустая проверка не считается ошибкой.":q.answerMode==="remainder"?"Введите частное и остаток. Пустая проверка не считается ошибкой.":"Введите ответ. Пустая проверка не считается ошибкой.";
   if(q.answerMode==="coordinate"){
     const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY");
     (!String(x?.value||"").trim()?x:y)?.focus();
   }else if(q.answerMode==="remainder"){
     const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR");
     (!String(qq?.value||"").trim()?qq:rr)?.focus();
   }else inputs[0]?.focus();
   return;
 }
 const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!String(x.value||"").trim())?.focus();return}
 const ok=!!ev.ok,correctText=ev.correctText,correctHtml=ev.correctHtml;
 addAttemptCheck({answer:ev.studentText,correct:ok,details:ok?[]:[ev.detail]});
 if(!ok)
~~~
- line 10624
~~~javascript
тр, сначала найди радиус; затем используй S = πr².",prism:"Различай вершины, рёбра и грани объёмной фигуры и внимательно смотри, какой размер спрашивают.",volume:"Приведи три размера к одинаковым единицам, перемножь их и запиши кубические единицы."
 };
 return hints[raw]||"Проверь правило темы и повтори решение по шагам, не угадывая ответ.";
}

function checkQuizInput(){
 if(answered||!q?.answerMode||q.answerMode==="choice")return;
 const inputs=quizInputElements(q),fb=document.getElementById("qfb");if(!inputs.length||!fb)return;
 const raw=quizInputRaw(q);
 if(quizInputEmpty(q,raw)){
   fb.innerHTML=q.answerMode==="coordinate"?"Введите обе координаты. Пустая проверка не считается ошибкой.":q.answerMode==="remainder"?"Введите частное и остаток. Пустая проверка не считается ошибкой.":"Введите ответ. Пустая проверка не считается ошибкой.";
   if(q.answerMode==="coordinate"){
     const x=document.getElementById("quizInputX"),y=document.getElementById("quizInputY");
     (!String(x?.value||"").trim()?x:y)?.focus();
   }else if(q.answerMode==="remainder"){
     const qq=document.getElementById("quizInputQ"),rr=document.getElementById("quizInputR");
     (!String(qq?.value||"").trim()?qq:rr)?.focus();
   }else inputs[0]?.focus();
   return;
 }
 const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!String(x.value||"").trim())?.focus();return}
 const ok=!!ev.ok,correctText=ev.correctText,correctHtml=ev.correctHtml;
 addAttemptCheck({answer:ev.studentText,correct:ok,details:ok?[]:[ev.detail]});
 if(!ok){
   award(false,"normal");
   quizPenalty=true;
   inputs.forEach(input=>input.classList.ad
~~~
## needle quizAnswerMarkup( count 5
- line 8860
~~~javascript
:source.topicId,sourceTopicId:q.sourceTopicId||source.topicId,questionSignature:q._signature||q.sig||""}));renderErrorWorkQuiz();
}
function renderErrorWorkTable(){
 tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>document.getElementById("fin")?.focus(),0);
}
function renderErrorWorkQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextErrorWorkTask","skipErrorWorkQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function findSourceError(source){
 const rec=(state.attemptHistory||[]).find(r=>r.id===source?.sourceAttemptId);if(!rec)return null;
 const item=(rec.items||[]).find(x=>x.itemId===source?.sourceItemId);return item?{record:rec,item}:null;
}
function markErrorOutcome(source,result,resolved=false){
 const hit=findSourceError(source);if(!hit)return false;const rem=normalizeRemediation(hit.item.remediation)||{resolved:false,resolvedAt:null,resolvedAttemptId:null,lastAttemptAt:null,lastAttemptId:null,lastResult:null,attempts:0};
 rem.attempts=Math.max(0,Number(rem.attempts||0))+1;rem.lastAttemptAt=Date.now();rem.lastAttemptId=blockSession?.attemptId||null;rem.lastResult=result;
 let newlyResolved=false;
 if(resolved&&!rem.resolved){rem.resolved=true;rem.resolvedAt=Date.now();rem.resolvedAt
~~~
- line 9017
~~~javascript
Id,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",practiceStageIndex:target.stageIndex});renderWeakPracticeQuiz();
}
function renderWeakPracticeTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderWeakPracticeQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextWeakPracticeTask","skipWeakPracticeQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function weakPracticeWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function weakPracticeAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.practiceXpEarned=(blockSession.practiceXpEarned||0)+5;blockSession.practiceCoinsEarned=(blockSession.practiceCoinsEarned||0)+1;save();return {xp:5,coins:1}}
function skipCurrentWeakPractice(){if(!isWeakPractice()||!blockSession.currentItem)return false;finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});recordBlockItem(false);save();if(blockSession.finished)finishWeakPractice();else startNextWeakPracticeTask();return true}
function skipWeakPracticeQuiz(){
~~~
- line 9117
~~~javascript
Mode:q.answerMode||"choice",explanation:q.ex,sourceTopicId:q.sourceTopicId||target.topicId,questionSignature:q.sig||q._signature||"",...common});renderControlQuiz();
}
function renderControlTable(){tstage.innerHTML=`<div class="card"><div class="flash">${ta} × ${tb} = ?</div><input id="fin" class="fin" inputmode="numeric" maxlength="3" onkeydown="tableKey(event)"><div class="actions"><button id="tablePrimary" class="btn primary" onclick="checkTable()">Проверить</button><button class="btn soft" onclick="practice()">⏭ Пропустить задание</button></div><div class="feedback" id="tfb"></div></div>`;setTimeout(()=>fin.focus(),0)}
function renderControlQuiz(){qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("startNextControlReviewTask","skipControlReviewQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function controlReviewWrongOnce(){state.streak=0;state.mistakes=(state.mistakes||0)+1;save()}
function controlReviewAward(){state.solved=(state.solved||0)+1;state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);state.xp=(state.xp||0)+5;state.coins=(state.coins||0)+1;blockSession.controlXpEarned=(blockSession.controlXpEarned||0)+5;blockSession.controlCoinsEarned=(blockSession.controlCoinsEarned||0)+1;save();return {xp:5,coins:1}}
function skipCurrentControlReview(){if(!isControlReview()||!blockSession.currentItem)return false;finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});recordBlockItem(false);save();if(blockSession.finished)finishControlReview();else startNextControlReviewTask();return true}
function skipControlReviewQu
~~~
- line 10487
~~~javascript
rtsWith("g7:"),isG6=s.startsWith("g6:"),isG5=s.startsWith("g5:"),raw=rawCourseId(id);
 if(isG3)return g3InfoById(id)?.title||"3 класс";
 if(isG7)return g7InfoById(id)?.title||"7 класс";
 if(isG6)return g6InfoById(id)?.title||"6 класс";
 return isG5?(raw==="fraction_mix"?"Микс по дробям":g5InfoById(raw)?.title||"Задание"):TOPICS.find(x=>x.id===raw)?.title||"Задание";
}
function correctChoicePlain(question){
 if(question?.answerMode==="fraction"||question?.answerMode==="remainder")return String(question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div
~~~
- line 10689
~~~javascript
inished){finishBlock();return}
 if(isErrorWork()){startNextErrorWorkTask();return}
 if(isWeakPractice()){startNextWeakPracticeTask();return}
 if(isControlReview()){startNextControlReviewTask();return}
 refreshBlockHead();
 answered=false;quizPenalty=false;q=freshQuiz(qid);
 beginAttemptItem({kind:"quiz",label:quizTitleForId(qid),prompt:quizAttemptPrompt(q),correctAnswer:correctChoicePlain(q),correctAnswerHtml:q.correctHtml||null,answerMode:q.answerMode||"choice",explanation:q.ex,grade:keyGrade(qid),topicId:rawCourseId(qid),sourceTopicId:q.sourceTopicId||rawCourseId(qid),questionSignature:q.sig||q._signature||"",questionSubtype:g3QuestionSubtype(q)});
 qstage.innerHTML=`${quizPromptHtml(q)}${quizAnswerMarkup("nextQ","skipNormalQuiz")}`;bindQuizKeyboard();if(q?.answerMode&&q.answerMode!=="choice")setTimeout(focusQuizInput,0)}
function pick(i){
 if(answered)return;
 let bs=[...document.querySelectorAll(".answer")],picked=q.choices[i],ok=String(picked.key)===String(q.ans);
 const studentText=choicePlain(picked),correctChoice=q.choices.find(c=>String(c.key)===String(q.ans)),correctText=correctChoice?choicePlain(correctChoice):String(q.ans);
 addAttemptCheck({answer:studentText,correct:ok,details:ok?[]:[`Выбрано: ${studentText}; правильный ответ: ${correctText}`]});
 // В работе над ошибками тестовый вопрос можно исправить в рамках того же задания.
 // Первый неверный выбор сбрасывает серию один раз, но сам item завершается только
 // после правильного ответа или пропуска. Так «ошибся → исправил» честно остаётся 🟡.
 if(isErrorWork()&&!ok){
   award(false,"normal");quizPenalty=true
   bs[i]?.classList.add("bad");
   qfb.innerHTML
~~~
## needle quizFractionAnswerHtml( count 2
- line 10501
~~~javascript
mary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
 }
 return `<div class="answers">${q.choices.map((c,i)=>`<button class="answer" onclick="pick(${i})">${c.label}</button>`).join("")}</div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
}
function quizFractionAnswerHtml(parsed){
 if(!parsed?.ok)return "";
 if(parsed.kind==="integer")return `<span class="math">${parsed.rawN<0?"−"+Math.abs(parsed.rawN):parsed.rawN}</span>`;
 if(parsed.kind==="fraction"){const neg=parsed.rawN<0?"−":"";return `<span class="math">${neg}</span>${frac(Math.abs(parsed.rawN),parsed.rawD)}`}
 if(parsed.kind==="mixed"){const neg=parsed.rawWhole<0?"−":"";return `<span class="mixed"><span class="whole">${neg}${Math.abs(parsed.rawWhole)}</span>${frac(parsed.rawN,parsed.rawD)}</span>`}
 return rationalHtml(parsed.rat,true);
}
function quizInputEvaluation(question,raw){
 const mode=question?.answerMode||"choice",correctText=String(question?.correctText||question?.ans||""),correctHtml=question?.correctHtml||esc(correctText);
 if(mode==="time"){
   const m=String(raw||"").trim().match(/^(\d{1,2}):([0-5]\d)$/);if(!m)return {valid:false,message:"Введите время в формате часы:минуты, например 10:55."};
   const h=Numb
~~~
- line 10530
~~~javascript
🟡 Пока неверно. Проверьте коэффициент при x и свободное число.",finalWrongMessage:equivalent&&!formOk?`🟡 Выражение равносильно правильному, но требуется упрощённая запись: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="fraction"){
   const parsed=parseRationalInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-denominator"?"Знаменатель не может быть равен нулю.":"Не удалось распознать ответ. Введите дробь, смешанное число или целое."};
   const equivalent=rationalEq(parsed.rat,question.answerRat),formOk=!question.requireReduced||parsed.wasReduced,ok=equivalent&&formOk;return {valid:true,ok,studentHtml:quizFractionAnswerHtml(parsed),studentText:raw,correctText,correctHtml,detail:equivalent&&!formOk?"Значение верное, но дробь нужно сократить полностью.":`Правильный ответ: ${correctText}`,retryMessage:equivalent&&!formOk?"🟡 Значение верное, но дробь нужно <b>сократить полностью</b>. Попробуй ещё раз.":"🟡 Пока неверно. Попробуй ещё раз или пропусти задание.",finalWrongMessage:equivalent&&!formOk?`🟡 Значение дроби верное, но по условию её нужно <b>сократить полностью</b>. Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="number"){
   const parsed=parseExactNumberInput(raw,{allowPercent:!!question.allowPercent});if(!parsed.ok)return {valid:false,message:parsed.error==="percent-not-allowed"?"Знак % здесь вводить не нужно.":parsed.error==="too-many-decimals"?"Слишком много знаков после запятой.":"Не удалось распознать число. Можно использовать запятую или точ
~~~
## needle parseRationalInput( count 3
- line 2604
~~~javascript
a.d===1)return String(a.n);
 if(preferMixed&&Math.abs(a.n)>a.d){const p=rationalToMixedParts(a),sg=p.sign<0?"-":"";return p.rem?`${sg}${p.whole} ${p.rem}/${p.d}`:`${sg}${p.whole}`}
 return `${a.n}/${a.d}`;
}
function rationalHtml(a,preferMixed=true){
 a=rational(a.n,a.d);if(a.d===1)return `<span class="math">${a.n<0?"−"+Math.abs(a.n):a.n}</span>`;
 if(preferMixed&&Math.abs(a.n)>a.d){const p=rationalToMixedParts(a),sg=p.sign<0?"−":"";if(!p.rem)return `<span class="math">${sg}${p.whole}</span>`;return `<span class="mixed"><span class="whole">${sg}${p.whole}</span>${frac(p.rem,p.d)}</span>`}
 const neg=a.n<0?"−":"";return `<span class="math">${neg}</span>${frac(Math.abs(a.n),a.d)}`;
}
function parseRationalInput(value){
 const raw=String(value??"").trim().replace(/[−–—]/g,"-");
 if(!raw)return {ok:false,empty:true,error:"empty"};
 let m=raw.match(/^([+-]?\d+)$/);
 if(m){const n=Number(m[1]);return {ok:Number.isSafeInteger(n),rat:rational(n,1),rawN:n,rawD:1,wasReduced:true,kind:"integer",raw}}
 m=raw.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
 if(m){const n=Number(m[1]),d=Number(m[2]);if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)return {ok:false,error:d===0?"zero-denominator":"invalid",raw};const posD=Math.abs(d),signedN=d<0?-n:n,g=gcd(Math.abs(signedN),posD);return {ok:true,rat:rational(signedN,posD),rawN:signedN,rawD:posD,wasReduced:g===1,kind:"fraction",raw}}
 m=raw.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(m){const w=Number(m[1]),n=Number(m[2]),d=Number(m[3]);if(!Number.isSafeInteger(w)||!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0||n<0||n>=d)return {ok:false,error:d===0?"zero-denominator":
~~~
- line 2628
~~~javascript
turn `${neg?"-":""}${whole}${fracPart?"."+fracPart:""}`}}return null;
}
function rationalRu(a,maxDigits=6){const s=rationalFiniteDecimal(a,maxDigits);return s===null?rationalPlain(a,false):s.replace(".",",")}
function rationalUi(a,maxDigits=6){return `<span class="math">${esc(rationalRu(a,maxDigits).replace(/^-/,"−"))}</span>`}
function parseExactNumberInput(value,{allowPercent=false}={}){
 const raw=String(value??"").trim();if(!raw)return {ok:false,empty:true,error:"empty",raw};
 let body=raw.replace(/[−–—]/g,"-"),hadPercent=false;if(/%\s*$/.test(body)){if(!allowPercent)return {ok:false,error:"percent-not-allowed",raw};hadPercent=true;body=body.replace(/%\s*$/,"").trim()}
 const fracParsed=parseRationalInput(body);if(fracParsed.ok)return {...fracParsed,hadPercent,display:raw};
 const compact=body.replace(/\s+/g,"");const m=compact.match(/^([+-]?\d+)(?:[.,](\d+))?$/);if(!m)return {ok:false,error:"invalid",raw};
 const intPart=Number(m[1]),digits=m[2]||"";if(!Number.isSafeInteger(intPart))return {ok:false,error:"invalid",raw};
 if(!digits)return {ok:true,rat:rational(intPart,1),kind:"number",raw,hadPercent,display:raw};
 if(digits.length>6)return {ok:false,error:"too-many-decimals",raw};
 const scale=10**digits.length,sign=m[1].startsWith("-")?-1:1,absWhole=Math.abs(intPart),fracN=Number(digits),signed=sign*(absWhole*scale+fracN);return {ok:true,rat:rational(signed,scale),kind:"decimal",raw,hadPercent,display:raw};
}
function parseRatioInput(value){
 const raw=String(value??"").trim();if(!raw)return {ok:false,empty:true,error:"empty",raw};
 let m=raw.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);if(!m)m=raw.match(/^\s*(\d+)\s+(\d+)\s*
~~~
- line 10529
~~~javascript
),detail=equivalent&&!formOk?"Выражение равносильно правильному, но подобные слагаемые нужно привести и убрать лишние 0/коэффициент 1.":`Правильный ответ: ${correctText}`;
   return {valid:true,ok,studentHtml,studentText:raw,correctText,correctHtml,detail,retryMessage:equivalent&&!formOk?"🟡 Значение выражения верное, но ответ нужно <b>полностью упростить</b>. Попробуйте ещё раз.":"🟡 Пока неверно. Проверьте коэффициент при x и свободное число.",finalWrongMessage:equivalent&&!formOk?`🟡 Выражение равносильно правильному, но требуется упрощённая запись: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`};
 }
 if(mode==="fraction"){
   const parsed=parseRationalInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-denominator"?"Знаменатель не может быть равен нулю.":"Не удалось распознать ответ. Введите дробь, смешанное число или целое."};
   const equivalent=rationalEq(parsed.rat,question.answerRat),formOk=!question.requireReduced||parsed.wasReduced,ok=equivalent&&formOk;return {valid:true,ok,studentHtml:quizFractionAnswerHtml(parsed),studentText:raw,correctText,correctHtml,detail:equivalent&&!formOk?"Значение верное, но дробь нужно сократить полностью.":`Правильный ответ: ${correctText}`,retryMessage:equivalent&&!formOk?"🟡 Значение верное, но дробь нужно <b>сократить полностью</b>. Попробуй ещё раз.":"🟡 Пока неверно. Попробуй ещё раз или пропусти задание.",finalWrongMessage:equivalent&&!formOk?`🟡 Значение дроби верное, но по условию её нужно <b>сократить полностью</b>. Правильный ответ: <b>${correctHtml}</b>. ${question.ex}`:`💡 Правильный ответ: <b>${correctH
~~~
## needle quiz-input-hint count 4
- line 50
~~~javascript
iz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last-child{display:none}}@media(max-width:520px){.grid,.answers{grid-template-columns:1fr}.shell{padding:10px}.brand span{display:none}.cgrid{grid-template-columns:32px repeat(var(--cols),43px);grid-auto-rows:45px}.cell,.din{width:40px;height:40px;font-size:22px}}

/* Расширенный режим письменных вычислений */
.shiftcell{width:46px;height:46px;border:1px dashed #d4e3dc;border-radius:8px;background:#f4f7f5}
.work-note{
~~~
- line 10491
~~~javascript
:mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="qu
~~~
- line 10494
~~~javascript
ne" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   const inputMode=mode==="number"?"decimal":"text",suffix=q.unitSuffix?`<span class="quiz-input-suffix">${esc(q.unitSuffix)}</span>`:"";
   return `<div class="quiz-input-wrap"><label class="quiz-input-label" for="quizInput">Введите ответ</label><div class="quiz-input-line"><input id="quizInput" class="quiz-input" autocomplete="off" inputmode="${inputMode}">${suffix}</div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" o
~~~
- line 10497
~~~javascript
ton id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   const inputMode=mode==="number"?"decimal":"text",suffix=q.unitSuffix?`<span class="quiz-input-suffix">${esc(q.unitSuffix)}</span>`:"";
   return `<div class="quiz-input-wrap"><label class="quiz-input-label" for="quizInput">Введите ответ</label><div class="quiz-input-line"><input id="quizInput" class="quiz-input" autocomplete="off" inputmode="${inputMode}">${suffix}</div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
 }
 return `<div class="answers">${q.choices.map((c,i)=>`<button class="answer" onclick="pick(${i})">${c.label}</button>`).join("")}</div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
}
function quizFractionAnswerHtml(parsed){
 if(!parsed?.ok)return "";
 if(parsed.kind==="integer")return `<span class="math
~~~
## needle quiz-input count 21
- line 50
~~~javascript
-line-point b{display:block;font-size:15px;line-height:18px;color:#155b42}.number-line-dot{display:block;width:12px;height:12px;border-radius:50%;background:#17845f;border:3px solid #fff;box-shadow:0 0 0 2px #17845f;margin:5px auto 0}.number-line-caption{font-size:12px;color:var(--muted);text-align:center;margin-top:0}.number-line-zero{font-weight:950;color:#0f5f42}.number-line-journal{font-family:"Cambria Math","Times New Roman",serif;letter-spacing:.02em}
@media(max-width:480px){.number-line-wrap{padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middl
~~~
- line 50
~~~javascript
b42}.number-line-dot{display:block;width:12px;height:12px;border-radius:50%;background:#17845f;border:3px solid #fff;box-shadow:0 0 0 2px #17845f;margin:5px auto 0}.number-line-caption{font-size:12px;color:var(--muted);text-align:center;margin-top:0}.number-line-zero{font-weight:950;color:#0f5f42}.number-line-journal{font-family:"Cambria Math","Times New Roman",serif;letter-spacing:.02em}
@media(max-width:480px){.number-line-wrap{padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:cente
~~~
- line 50
~~~javascript
adius:50%;background:#17845f;border:3px solid #fff;box-shadow:0 0 0 2px #17845f;margin:5px auto 0}.number-line-caption{font-size:12px;color:var(--muted);text-align:center;margin-top:0}.number-line-zero{font-weight:950;color:#0f5f42}.number-line-journal{font-family:"Cambria Math","Times New Roman",serif;letter-spacing:.02em}
@media(max-width:480px){.number-line-wrap{padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math
~~~
- line 50
~~~javascript
margin:5px auto 0}.number-line-caption{font-size:12px;color:var(--muted);text-align:center;margin-top:0}.number-line-zero{font-weight:950;color:#0f5f42}.number-line-journal{font-family:"Cambria Math","Times New Roman",serif;letter-spacing:.02em}
@media(max-width:480px){.number-line-wrap{padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:r
~~~
- line 50
~~~javascript
ed);text-align:center;margin-top:0}.number-line-zero{font-weight:950;color:#0f5f42}.number-line-journal{font-family:"Cambria Math","Times New Roman",serif;letter-spacing:.02em}
@media(max-width:480px){.number-line-wrap{padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last
~~~
- line 50
~~~javascript
padding:8px 5px 2px;margin-top:10px}.number-line-axis{height:108px;margin:0 12px 0 6px}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last-child{display:none}}@media(max-width:520px){.grid,.answers{grid-template-columns:1fr}.shell{padding:10px}.brand span{display:none}.cgrid{grid-template-columns:32px repeat(var(--cols),43px);grid-auto-rows:45px}.cell,.di
~~~
- line 50
~~~javascript
x}.number-line-label{font-size:11px}.number-line-point b{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last-child{display:none}}@media(max-width:520px){.grid,.answers{grid-template-columns:1fr}.shell{padding:10px}.brand span{display:none}.cgrid{grid-template-columns:32px repeat(var(--cols),43px);grid-auto-rows:45px}.cell,.din{width:40px;height:40px;font-size:22px}}

/* Расширенный режим письменных вычислений
~~~
- line 50
~~~javascript
{font-size:13px}.number-line-caption{font-size:11px}}
.quiz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last-child{display:none}}@media(max-width:520px){.grid,.answers{grid-template-columns:1fr}.shell{padding:10px}.brand span{display:none}.cgrid{grid-template-columns:32px repeat(var(--cols),43px);grid-auto-rows:45px}.cell,.din{width:40px;height:40px;font-size:22px}}

/* Расширенный режим письменных вычислений */
.shiftcell{width:46px;height:46px;border:1px dashed 
~~~
- line 50
~~~javascript
iz-input-wrap{max-width:460px;margin:14px auto 0;text-align:center}.quiz-input-label{display:block;font-weight:900;margin-bottom:7px}.quiz-input-line{display:flex;justify-content:center;align-items:center;gap:8px}.quiz-input-suffix{font-weight:900;font-size:20px;white-space:nowrap}.quiz-input{width:min(300px,100%);height:54px;border:2px solid #8ec4ab;border-radius:12px;text-align:center;font-size:24px;font-family:"Cambria Math","Times New Roman",serif;font-weight:850;outline:none;background:#fff}.quiz-input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,132,95,.12)}.quiz-input.bad{background:#fff0f0;border-color:#dd6b6b}.quiz-input.good{background:#e8f7ef;border-color:#49a777}.quiz-input-hint{display:block;color:var(--muted);font-size:12px;margin-top:6px}.quizq{overflow-wrap:break-word;word-break:normal}.quizq .math{max-width:100%}.quizq .frac,.feedback .frac,.review-answer .frac,.check-details .frac{vertical-align:middle}.quizq .mixed,.feedback .mixed{display:inline-flex;align-items:center;gap:4px}.quizq .whole,.feedback .whole{font-family:"Cambria Math","Times New Roman",serif}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:1fr}.hero>div:last-child{display:none}}@media(max-width:520px){.grid,.answers{grid-template-columns:1fr}.shell{padding:10px}.brand span{display:none}.cgrid{grid-template-columns:32px repeat(var(--cols),43px);grid-auto-rows:45px}.cell,.din{width:40px;height:40px;font-size:22px}}

/* Расширенный режим письменных вычислений */
.shiftcell{width:46px;height:46px;border:1px dashed #d4e3dc;border-radius:8px;background:#f4f7f5}
.work-note{
~~~
- line 10491
~~~javascript
==="remainder")return String(question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return 
~~~
- line 10491
~~~javascript
question.correctText||question.ans||"");
 const c=question?.choices?.find(x=>String(x.key)===String(question.ans));
 return c?choicePlain(c):String(question?.correctText||question?.ans||"");
}
function quizAnswerMarkup(nextHandler,skipHandler){
 if(q?.answerMode&&q.answerMode!=="choice"){
   const mode=q.answerMode,hint=q.inputHint||(mode==="fraction"?"Можно ввести обыкновенную дробь, смешанное число или целое.":mode==="ratio"?"Введите отношение, например: 2 : 3":mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"
~~~
- line 10491
~~~javascript
:mode==="multi"?"Введите числа по порядку через пробел, запятую или точку с запятой.":mode==="coordinate"?"Введите отдельно x и y.":"Введите ответ.");
   if(mode==="coordinate"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">${esc(q.inputLabel||"Введите координаты")}</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>x =</span><input id="quizInputX" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="qu
~~~
- line 10494
~~~javascript
ecimal" aria-label="Абсцисса x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   const inputMode=mode==="number"?"decimal":"text",su
~~~
- line 10494
~~~javascript
x"></label><label class="coordinate-input-field"><span>y =</span><input id="quizInputY" class="coordinate-input" autocomplete="off" inputmode="decimal" aria-label="Ордината y"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   if(mode==="remainder"){
     return `<div class="quiz-input-wrap"><div class="quiz-input-label">Введите результат деления</div><div class="coordinate-input-grid"><label class="coordinate-input-field"><span>Частное</span><input id="quizInputQ" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Частное"></label><label class="coordinate-input-field"><span>Остаток</span><input id="quizInputR" class="coordinate-input" autocomplete="off" inputmode="numeric" aria-label="Остаток"></label></div><small class="quiz-input-hint">${esc(hint)}</small></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="${nextHandler}()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="${skipHandler}()">⏭ Пропустить задание</button></div>`;
   }
   const inputMode=mode==="number"?"decimal":"text",suffix=q.unitSuffix?`<span clas
~~~