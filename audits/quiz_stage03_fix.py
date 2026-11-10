"""Stage03: reveal answer on skip before the next question, preserving scoring."""
from pathlib import Path
import re,hashlib
htmlpath=Path('index.html');swpath=Path('sw.js')
s=htmlpath.read_text('utf-8')
old='''function skipNormalQuiz(){
 if(!blockSession||!(["quiz","g1quiz","g2quiz","g3quiz","g5quiz","g6quiz","g7quiz","g8quiz"].includes(blockSession.kind))||answered||!blockSession.currentItem)return false;
 finishAttemptItem(false,false,{skipped:true,studentAnswer:"—"});
 recordBlockItem(false);answered=true;save();
 if(blockSession.finished)finishBlock();else nextQ();
 return true;
}'''
new='''function skipNormalQuiz(){
 if(!blockSession||!(["quiz","g1quiz","g2quiz","g3quiz","g5quiz","g6quiz","g7quiz","g8quiz"].includes(blockSession.kind))||answered||!blockSession.currentItem)return false;
 const answerText=correctChoicePlain(q);
 const answerHtml=q?.correctHtml||(q?.choices?.find(c=>String(c.key)===String(q.ans))?.label)||esc(answerText);
 const explanation=q?.ex||"";
 finishAttemptItem(false,false,{skipped:true,studentAnswer:"—",correctAnswer:answerText,correctAnswerHtml:answerHtml,explanation});
 recordBlockItem(false);answered=true;save();
 const feedback=document.getElementById("qfb");
 if(feedback)feedback.innerHTML='⏭ Задание пропущено. Правильный ответ: <b>'+answerHtml+'</b>.'+(explanation?'<div class="quiz-skip-explanation">'+explanation+'</div>':'');
 document.querySelectorAll("#qstage .answer,#qstage .quiz-input-wrap input,#qstage .quiz-input-wrap textarea").forEach(el=>{el.disabled=true});
 const skip=document.getElementById("quizSkip"),check=document.getElementById("quizCheck"),next=document.getElementById("quizNext");
 if(skip)skip.style.display="none";
 if(check)check.style.display="none";
 if(next){
   next.style.display="inline-block";
   next.classList.add("next-ready");
   next.textContent=blockSession.finished?"Посмотреть результат →":"Следующий пример →";
   next.onclick=blockSession.finished?finishBlock:nextQ;
 }
 return true;
}'''
assert s.count(old)+s.count(new)==1,'skipNormalQuiz source differs from expected; manual review required'
if old in s:
 s=s.replace(old,new,1)
 htmlpath.write_text(s,'utf8')
 print('STAGE03_FIX_APPLIED')
else: print('STAGE03_ALREADY_PATCHED')
digest=hashlib.sha256(htmlpath.read_bytes()).hexdigest()
sw=swpath.read_text('utf8')
pattern=r'(const APP_BUILD_HASH = ")([0-9a-f]{64})(")'
assert len(re.findall(pattern,sw))==1,'cannot refresh PWA fingerprint safely'
sw=re.sub(pattern,lambda m:m.group(1)+digest+m.group(3),sw,count=1)
swpath.write_text(sw,'utf8')
print('STAGE03_HTML_SHA256',digest)
