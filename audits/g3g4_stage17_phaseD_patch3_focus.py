#!/usr/bin/env python3
"""Stage 17D: targeted repair of asynchronous G4 multiplication input and teaching text."""
import hashlib,json,pathlib
from datetime import datetime,timezone
OLD="5c1532d17ff98b5f4cf7c2155233a6bfd1560c8688679bab0d906d6afa49d41f"
hp=pathlib.Path("index.html")
original=hp.read_bytes()
if hashlib.sha256(original).hexdigest()!=OLD:raise SystemExit("ABORT: wrong HTML candidate")
sp=pathlib.Path("sw.js")
sw=sp.read_text(encoding="utf8")
if "matkvest-iphone-v42" not in sw or f'const APP_BUILD_HASH = "{OLD}"' not in sw:raise SystemExit("ABORT: wrong service worker")
def js(s):return s.replace("@BT@",chr(96)).replace("@DL@",chr(36))
s=original.decode("utf8")
old_focus="setTimeout(()=>fin.focus(),0);"
new_focus='setTimeout(()=>document.getElementById("fin")?.focus(),0);'
old_guard="function checkTable(){\n if(tableSolved)"
new_guard='function checkTable(){\n const fin=document.getElementById("fin");if(!fin)return;\n if(tableSolved)'
old_theory=js('@DL@{activeDifficulty()===0?\'Разминка: множители от 2 до 5.\':activeDifficulty()===1?\'Тренировка: множители от 2 до 7.\':\'Мастер: вся таблица от 2 до 9.\'}')
new_theory=js('@DL@{g4TableTheory17D()}')
theory=js("""function g4TableTheory17D(){
 const d=activeDifficulty();
 const level=d===0?"Разминка: множители от 2 до 5.":d===1?"Тренировка: множители от 2 до 7.":"Мастер: вся таблица от 2 до 9.";
 return @BT@<p><b>@DL@{level}</b></p><p><b>Смысл умножения:</b> число 4 · 3 означает четыре одинаковых группы по 3. Складываем: 3 + 3 + 3 + 3 = 12.</p><p><b>Как проверить:</b> используем обратное действие. 12 : 3 = 4 и 12 : 4 = 3.</p><p><b>Если забыл ответ:</b> посчитай одинаковые группы по порядку или опирайся на соседний известный пример. Вводи в поле только число.</p>@BT@;
}
""")
old_intro="function openTable(){"
new_intro=theory+old_intro
for name,old in [("deferred fin focus",old_focus),("checkTable missing guard",old_guard),("old G4 table lesson",old_theory),("openTable location",old_intro)]:
 count=s.count(old)
 expected_count=2 if name=="deferred fin focus" else 1
 if count!=expected_count:raise SystemExit(f"ABORT: {name} match count {count}; expected {expected_count}")
new=s.replace(old_focus,new_focus).replace(old_guard,new_guard).replace(old_theory,new_theory).replace(old_intro,new_intro)
nb=new.encode("utf8")
NEW=hashlib.sha256(nb).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py")
checker_text=checker.read_text(encoding="utf8")
if checker_text.count("matkvest-iphone-v42")!=1:raise SystemExit("ABORT: unexpected PWA checker")
sem=pathlib.Path("audits/g3g4_stage17_phaseD_semantics.mjs")
semtext=sem.read_text(encoding="utf8")
if semtext.count(OLD)!=1:raise SystemExit("ABORT: unexpected semantic test pin")
recovery=pathlib.Path("audits/g3g4_stage17_phaseD_recovery_theory.mjs")
recoverytext=recovery.read_text(encoding="utf8")
if recoverytext.count(OLD)!=1:raise SystemExit("ABORT: unexpected recovery test pin")
swnew=sw.replace("matkvest-iphone-v42","matkvest-iphone-v43").replace(OLD,NEW)
# Everything validated before writes
hp.write_bytes(nb)
sp.write_text(swnew,encoding="utf8")
checker.write_text(checker_text.replace("matkvest-iphone-v42","matkvest-iphone-v43"),encoding="utf8")
sem.write_text(semtext.replace(OLD,NEW),encoding="utf8")
recovery.write_text(recoverytext.replace(OLD,NEW),encoding="utf8")
report={"phase":"17D-G4-table-focus-and-theory",
"utc":datetime.now(timezone.utc).isoformat(),"oldSha256":OLD,"newSha256":NEW,"htmlBytes":len(nb),"cache":"matkvest-iphone-v43",
"changes":["G4 table deferred focus resolves optional DOM element to prevent ReferenceError on screen change",
"G4 answer validation guards against missing input element",
"G4 multiplication-table theory includes meaning, repeated addition, division check and hint"],
"productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_patch3_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(report,ensure_ascii=False))
