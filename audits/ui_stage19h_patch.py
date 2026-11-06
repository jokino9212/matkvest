#!/usr/bin/env python3
"""Stage 19H: reversible confirmation for skips and explicit destructive-action copy."""
from pathlib import Path
import hashlib, json
index = Path("index.html")
worker = Path("sw.js")
html = index.read_text(encoding="utf-8")
sw = worker.read_text(encoding="utf-8")
BASE = "0bae176adc5a0db883851157220e439a0d8bacaf8e0f6c5b4f26efa4f6b0adb2"
if 'id="mk-ui19h-training-script"' in html:
    current = hashlib.sha256(html.encode("utf-8")).hexdigest()
    assert 'matkvest-iphone-v68' in sw and current in sw
    print("v68 already applied")
    raise SystemExit(0)
assert hashlib.sha256(html.encode("utf-8")).hexdigest() == BASE, "Expected exact v67 HTML"
assert BASE in sw and 'matkvest-iphone-v67' in sw
assert 'id="mk872-training-guard"' in html and 'id="mk-ui19g-pets-script"' in html
assert html.count("</body>") == 1
css = """
<style id="mk-ui19h-training-style">
.mk872-training-dialog .mk872-training-panel{outline:none}
.mk872-training-dialog .mk872-training-actions button:focus-visible{
  outline:3px solid #448b6b;outline-offset:3px
}
.mk872-training-dialog .mk872-training-actions button:disabled{cursor:wait;opacity:.75}
@media(max-width:390px){
 .mk872-training-dialog{padding:10px}
 .mk872-training-panel{padding:15px;border-radius:16px}
 .mk872-training-actions .btn{min-height:44px}
}
@media(prefers-reduced-motion:reduce){
 .mk872-training-dialog .btn{transition:none!important}
}
</style>
"""
script = """
<script id="mk-ui19h-training-script">
/* 19H: no change to question generators, grading, skip handlers or economy.
   Intercept only explicit "Пропустить задание" buttons inside a live block. */
(function(){
  'use strict';
  const previousDialog = mk872LearningDialog;
  mk872LearningDialog = function(title, message, choices){
    let committed = false;
    return previousDialog(title,message,choices.map(choice=>({
      label:choice.label,
      run:function(){
        if(committed)return;
        committed=true;
        const controls=mk872Dialog?.querySelectorAll('button')||[];
        controls.forEach(button=>{button.disabled=true});
        return choice.run();
      }
    })));
  };
  function activeItemIdentity(){
    if(!mk872BlockActive()||!blockSession?.currentItem||blockSession.finished)return null;
    return {
      profileId:mk872ProfileId(),
      attemptId:blockSession.attemptId,
      item: blockSession.currentItem,
      done:blockSession.done
    };
  }
  document.addEventListener('click',function(event){
    const button=event.target?.closest?.('button');
    if(!button||mk872Dialog||!button.textContent?.includes('Пропустить задание'))return;
    if(!button.closest('#qstage,#stage,#tstage')||!overlay.contains(button))return;
    const identity=activeItemIdentity();
    if(!identity)return;
    if(button.closest('#qstage')&&answered)return;
    if(button.closest('#stage')&&columnSolved)return;
    if(button.closest('#tstage')&&tableSolved)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    mk872PersistDraft();
    mk872LearningDialog(
      'Пропустить это задание?',
      'Задание будет отмечено как пропущенное. Отменить пропуск после перехода к следующему заданию нельзя. Твои уже полученные награды сохранятся.',
      [
        {label:'Вернуться к заданию',run:()=>mk872CloseDialog()},
        {label:'Да, пропустить задание',run:()=>{
          const now=activeItemIdentity();
          if(!now||now.profileId!==identity.profileId||
             now.attemptId!==identity.attemptId||now.item!==identity.item||
             now.done!==identity.done||!button.isConnected){
            mk872CloseDialog();
            return;
          }
          mk872CloseDialog();
          // Invoke the unchanged original inline click handler once, not a synthetic click.
          if(typeof button.onclick==='function')button.onclick();
        }}
      ]
    );
  },true);

  const originalExit=mk872RequestExit;
  mk872RequestExit=function(){
    const result=originalExit();
    if(!mk872Dialog||!mk872HasActiveLearning())return result;
    const text=mk872Dialog.querySelector('.mk872-training-panel p');
    if(text)text.textContent='Тренировка ещё не завершена. Если выйти, незавершённая попытка и её сохранённый черновик будут удалены. Для продолжения с того же места вернись к заданию.';
    const buttons=mk872Dialog.querySelectorAll('.mk872-training-actions button');
    if(buttons[0])buttons[0].textContent='Остаться в тренировке';
    if(buttons[1])buttons[1].textContent='Выйти и удалить попытку';
    return result;
  };
  const originalStartOver=mk872StartOver;
  mk872StartOver=function(d){
    if(!d||d.profileId!==mk872ProfileId())return;
    const draft=mk872ReadDraft();
    if(!draft||draft.attemptId!==d.attemptId)return;
    mk872LearningDialog(
      'Начать тренировку заново?',
      'Текущая незавершённая попытка будет сброшена, а сохранённые задания исчезнут. Это действие нельзя отменить. Уже заработанные награды не изменятся.',
      [
        {label:'Отмена — сохранить попытку',run:()=>mk872CloseDialog()},
        {label:'Да, начать заново',run:()=>{
          const current=mk872ReadDraft();
          if(current?.attemptId!==d.attemptId||current?.profileId!==mk872ProfileId()){
            mk872CloseDialog();return;
          }
          originalStartOver(d);
        }}
      ]
    );
  };
})();
</script>
"""
html = html.replace("</body>",css + "\n" + script + "\n</body>",1)
sha = hashlib.sha256(html.encode("utf-8")).hexdigest()
sw=sw.replace('matkvest-iphone-v67','matkvest-iphone-v68').replace(BASE,sha)
assert sha in sw and 'matkvest-iphone-v68' in sw
index.write_text(html,encoding="utf-8")
worker.write_text(sw,encoding="utf-8")
meta={
 "stage":"19H","candidate":"v68","base_sha256":BASE,
 "sha256":sha,"cache":"matkvest-iphone-v68",
 "changes":[
   "confirm every live explicit skip button for quiz/table/column including practice variants",
   "cancel and Escape preserve item, typed values and original focus",
   "deduplicate confirmation button actions",
   "make destructive exit explicit and keep safe cancel default",
   "confirm restart of saved draft against its actual profile and attempt"
 ],
 "unchanged":["question generators","answer validation","score/penalties","XP","coins","profile schema","backend","production"]
}
Path("audits/ui_stage19h_patch_report.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(meta,ensure_ascii=False))
