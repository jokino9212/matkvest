#!/usr/bin/env python3
"""Stage18: safe grade5/6 visual fractions input patch, based on verified v50."""
from pathlib import Path
import hashlib, re, json

html=Path("index.html")
swfile=Path("sw.js")
s=html.read_text("utf8")
base_hash="0b64dc42f34e375fedce727720bb6475fcca63b2429c0d9fa8fd6539012e761d"
assert hashlib.sha256(s.encode("utf8")).hexdigest()==base_hash, "Unexpected frontend baseline; refuse patch"
sw=swfile.read_text("utf8")
assert "matkvest-iphone-v50" in sw and base_hash in sw

def edit_function(name,old,new):
    global s
    marker="function "+name+"("
    a=s.index(marker)
    b=s.find("\nfunction ",a+len(marker))
    if b<0: raise ValueError("Next function missing: "+name)
    part=s[a:b]
    if part.count(old)!=1: raise ValueError("Expected one match in "+name+": "+str(part.count(old))+" for "+old[:80])
    part=part.replace(old,new,1)
    s=s[:a]+part+s[b:]

css="""<style id="matkvest-stage18-fraction-input">
.stage18-frac-wrap{text-align:center}
.stage18-frac-entry{display:flex;justify-content:center;align-items:flex-end;gap:18px;flex-wrap:wrap;margin:13px auto 10px;max-width:100%}
.stage18-frac-part{display:flex;flex-direction:column;align-items:center;gap:7px;color:var(--ink);font-weight:800;font-size:13px}
.stage18-frac-stack{display:flex;flex-direction:column;align-items:center;gap:4px}
.stage18-frac-cell{width:64px;height:56px;box-sizing:border-box;text-align:center;border:2px solid #93a8bd;border-radius:9px;background:#fff;font-weight:850;font-size:27px;color:var(--ink);padding:3px;box-shadow:0 1px 4px #19354914}
.stage18-frac-cell:focus{border-color:#2770da;outline:3px solid #7eb2ff66;outline-offset:1px}
.stage18-frac-cell.bad{border-color:#cf3838;background:#fff0f0}
.stage18-frac-cell.good{border-color:#39a56e;background:#e8f7ef}
.stage18-frac-bar{height:3px;width:72px;background:var(--ink);border-radius:5px;margin:0 auto}
.stage18-frac-title{font-weight:800;font-size:14px;margin:2px 0 0}
.stage18-frac-label{font-size:12px;line-height:1.35;max-width:115px;color:var(--muted);text-align:center;min-height:32px}
.stage18-frac-note{color:var(--muted);font-size:12px;line-height:1.45;margin:4px auto 8px}
@media(max-width:480px){.stage18-frac-entry{gap:10px}.stage18-frac-cell{width:55px;height:52px;font-size:23px}.stage18-frac-bar{width:63px}.stage18-frac-label{font-size:11px;max-width:98px}}
</style>"""
assert s.count("</head>")==1
s=s.replace("</head>",css+"\n</head>",1)

helpers="""/* STAGE18 - pedagogical field-based fraction input for grades 5 and 6 only. */
function stage18UsesFractionBoxes(question=q){
 return question?.answerMode==="fraction"&&(keyGrade(qid)===5||keyGrade(qid)===6);
}
function stage18FractionMarkup(nextHandler,skipHandler,hint){
 const whole='<label class="stage18-frac-part"><span class="stage18-frac-label">Целая часть<br>(если есть)</span><input id="quizFracWhole" class="stage18-frac-cell" autocomplete="off" inputmode="text" aria-label="Целая часть, если есть" placeholder="—"></label>';
 const frac='<div class="stage18-frac-part"><div class="stage18-frac-label">Дробная часть</div><div class="stage18-frac-stack"><input id="quizFracNum" class="stage18-frac-cell" autocomplete="off" inputmode="text" aria-label="Числитель" placeholder="числ."><div class="stage18-frac-bar" role="presentation"></div><input id="quizFracDen" class="stage18-frac-cell" autocomplete="off" inputmode="numeric" aria-label="Знаменатель" placeholder="знам."></div></div>';
 return '<div class="quiz-input-wrap stage18-frac-wrap"><div class="quiz-input-label stage18-frac-title">Запиши ответ в клеточках</div><div class="stage18-frac-entry">'+whole+frac+'</div><div class="stage18-frac-note">Сверху — числитель, снизу — знаменатель. Целую часть заполняй только при необходимости.</div></div><div class="feedback" id="qfb"></div><div class="actions"><button id="quizCheck" class="btn primary" onclick="checkQuizInput()">Проверить</button><button id="quizNext" class="btn primary" style="display:none" onclick="'+nextHandler+'()">Следующий пример →</button><button id="quizSkip" class="btn soft" onclick="'+skipHandler+'()">⏭ Пропустить задание</button></div>';
}
function stage18FractionFields(){
 return {stage18Fraction:true,whole:String(document.getElementById("quizFracWhole")?.value||"").trim(),numerator:String(document.getElementById("quizFracNum")?.value||"").trim(),denominator:String(document.getElementById("quizFracDen")?.value||"").trim()};
}
function stage18FractionStudentText(raw){
 const w=String(raw?.whole||"").trim(),n=String(raw?.numerator||"").trim(),d=String(raw?.denominator||"").trim();
 return n&&d?(w?w+" ":"")+n+"/"+d:w||[n,d].filter(Boolean).join("/");
}
function stage18ParseFractionFields(raw){
 const w=String(raw?.whole||"").trim(),n=String(raw?.numerator||"").trim(),d=String(raw?.denominator||"").trim();
 if(!w&&!n&&!d)return {ok:false,empty:true,error:"empty"};
 if(w&&!n&&!d)return parseRationalInput(w);
 if(!n||!d)return {ok:false,error:"missing-part"};
 if(!/^[+-]?\\d+$/.test(n)||!/^[+-]?\\d+$/.test(d))return {ok:false,error:"invalid"};
 if(!w)return parseRationalInput(n+"/"+d);
 if(!/^[+-]?\\d+$/.test(w)||!/^\\d+$/.test(n)||!/^\\d+$/.test(d))return {ok:false,error:"invalid"};
 return parseRationalInput(w+" "+n+"/"+d);
}
function stage18FocusFractionMissing(raw){
 const f=raw?.stage18Fraction?raw:stage18FractionFields();
 const id=!f.numerator&&(!f.whole||f.denominator)?"quizFracNum":f.numerator&&!f.denominator?"quizFracDen":!f.whole&&!f.numerator?"quizFracNum":"quizFracWhole";
 document.getElementById(id)?.focus();
}
function stage18ConvertG5Fraction(result,source){
 const k=String(source?.correct??""),label=String(result.correctLabel||"");
 if(!/class="(?:frac|mixed)"/.test(label))return result;
 const simple=k.match(/^([+-]?\\d+)\\/([1-9]\\d*)$/),mix=k.match(/^([+-]?\\d+)_([0-9]+)_([1-9]\\d*)$/);
 let a=null;
 if(simple)a=rational(Number(simple[1]),Number(simple[2]));
 else if(mix){
   const w=Number(mix[1]),n=Number(mix[2]),d=Number(mix[3]);
   if(!Number.isSafeInteger(w)||!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||n>=d)return result;
   a=rational((w<0?-1:1)*(Math.abs(w)*d+n),d);
 }
 if(!a)return result;
 return {...result,answerMode:"fraction",answerRat:a,preferMixed:!!mix,requireReduced:/сократ|несократ/i.test(String(result.text||"")),correctHtml:label,correctText:result.correctText};
}
"""
assert s.count("function quizAnswerMarkup(")==1
s=s.replace("function quizAnswerMarkup(",helpers+"\nfunction quizAnswerMarkup(",1)

edit_function("quizAnswerMarkup",
 '   if(mode==="coordinate"){',
 '   if(stage18UsesFractionBoxes(q))return stage18FractionMarkup(nextHandler,skipHandler,hint);\n   if(mode==="coordinate"){')
edit_function("quizInputElements",
 ' if(question?.answerMode==="coordinate")',
 ' if(stage18UsesFractionBoxes(question))return ["quizFracWhole","quizFracNum","quizFracDen"].map(id=>document.getElementById(id)).filter(Boolean);\n if(question?.answerMode==="coordinate")')
edit_function("quizInputRaw",
 ' if(question?.answerMode==="coordinate")',
 ' if(stage18UsesFractionBoxes(question))return stage18FractionFields();\n if(question?.answerMode==="coordinate")')
edit_function("quizInputEmpty",
 ' if(question?.answerMode==="coordinate")',
 ' if(stage18UsesFractionBoxes(question))return !raw?.whole&&!raw?.numerator&&!raw?.denominator;\n if(question?.answerMode==="coordinate")')
edit_function("focusQuizInput",
 'function focusQuizInput(){',
 'function focusQuizInput(){if(stage18UsesFractionBoxes(q)){const mixedExpected=q.preferMixed&&q.answerRat&&Math.abs(q.answerRat.n)>=q.answerRat.d;document.getElementById(mixedExpected?"quizFracWhole":"quizFracNum")?.focus();return}')
edit_function("quizKeyboard",
 ' checkQuizInput();',
 ' if(stage18UsesFractionBoxes(q)){const raw=stage18FractionFields();if(!raw.whole&&!raw.numerator&&!raw.denominator){document.getElementById("quizFracNum")?.focus();return}if((raw.numerator||raw.denominator)&&!raw.numerator){document.getElementById("quizFracNum")?.focus();return}if((raw.numerator||raw.denominator)&&!raw.denominator){document.getElementById("quizFracDen")?.focus();return}}\n checkQuizInput();')
edit_function("quizInputEvaluation",
 '   const parsed=parseRationalInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-denominator"?"Знаменатель не может быть равен нулю.":"Не удалось распознать ответ. Введите дробь, смешанное число или целое."};',
 '   const parsed=stage18UsesFractionBoxes(question)?stage18ParseFractionFields(raw):parseRationalInput(raw);if(!parsed.ok)return {valid:false,message:parsed.error==="zero-denominator"?"Знаменатель не может быть равен нулю.":parsed.error==="missing-part"?"Заполни числитель и знаменатель. Если ответ целый, заполни только целую часть.":"Проверь числа в клеточках."};')
edit_function("quizInputEvaluation",
 'studentText:raw,correctText,correctHtml,detail:equivalent&&!formOk?',
 'studentText:stage18UsesFractionBoxes(question)?stage18FractionStudentText(raw):raw,correctText,correctHtml,detail:equivalent&&!formOk?')
edit_function("checkQuizInput",
 '   }else inputs[0]?.focus();',
 '   }else if(stage18UsesFractionBoxes(q))document.getElementById("quizFracNum")?.focus();else inputs[0]?.focus();')
edit_function("checkQuizInput",
 ' const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;inputs.find(x=>!String(x.value||"").trim())?.focus();return}',
 ' const ev=quizInputEvaluation(q,raw);if(!ev.valid){fb.textContent=ev.message;if(stage18UsesFractionBoxes(q))stage18FocusFractionMissing(raw);else inputs.find(x=>!String(x.value||"").trim())?.focus();return}')
edit_function("checkQuizInput",
 '   inputs[0]?.focus();inputs[0]?.select?.();',
 '   if(stage18UsesFractionBoxes(q))stage18FocusFractionMissing(raw);else{inputs[0]?.focus();inputs[0]?.select?.()}')
edit_function("makeG5Question",
 ' return {\n   text:qq.text,',
 ' const result={\n   text:qq.text,')
edit_function("makeG5Question",
 '\n };\n}',
 '\n };\n return stage18ConvertG5Fraction(result,qq);\n}')

updated_hash=hashlib.sha256(s.encode("utf8")).hexdigest()
assert updated_hash!=base_hash
sw=sw.replace("matkvest-iphone-v50","matkvest-iphone-v51").replace(base_hash,updated_hash)
assert "matkvest-iphone-v51" in sw and updated_hash in sw
html.write_text(s,"utf8");swfile.write_text(sw,"utf8")
report={"base_sha256":base_hash,"new_sha256":updated_hash,"new_cache":"matkvest-iphone-v51","bytes":len(s.encode("utf8")),"scope":"grade5/6 fractional typed entry; grade7/8 untouched; no prod"}
Path("audits/g5g6_stage18_fraction_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf8")
print(json.dumps(report,ensure_ascii=False))
