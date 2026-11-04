#!/usr/bin/env python3
"""Patch three proven grade-3 teaching-content defects on audited v41 only."""
import hashlib,json,pathlib
from datetime import datetime,timezone
OLD="8bd7ccd047368b8754299e7c1bd5995229f789b040a9ca8478d1ecb4b521da5a"
html_path=pathlib.Path("index.html")
before=html_path.read_bytes()
if hashlib.sha256(before).hexdigest()!=OLD:raise SystemExit("ABORT: different HTML build")
sw_path=pathlib.Path("sw.js")
sw=sw_path.read_text(encoding="utf8")
if f'const APP_BUILD_HASH = "{OLD}"' not in sw or "matkvest-iphone-v41" not in sw:raise SystemExit("ABORT: worker v41 mismatch")
def js(s):return s.replace("@BT@",chr(96)).replace("@DL@",chr(36))
t=before.decode("utf8")
old_table=js('g3StoryNumberQuestion(@BT@Сколько книг прочитал <b>@DL@{names[i]}</b>?@BT@')
new_table=js('g3StoryNumberQuestion(@BT@Сколько книг @DL@{["Аня","Оля"].includes(names[i])?"прочитала":"прочитал"} <b>@DL@{names[i]}</b>?@BT@')
old_geo=js('q.ex=@BT@@DL@{why[a.kind]} <b>@DL@{String(q.ans)}</b>.@BT@;')
new_geo='q.ex=why[a.kind];'
old_area='function g3RectangleSquareAreaQuestion(d){const variant=d===0?"gridRect":d===1?g6RandomFrom(["rect","square"]):g6RandomFrom(["gridRect","rect","square"]),unit=g6RandomFrom(["см²","дм²","м²"]);'
new_area='function g3RectangleSquareAreaQuestion(d){const variant=d===0?"gridRect":d===1?g6RandomFrom(["rect","square"]):g6RandomFrom(["gridRect","rect","square"]),unit=variant==="gridRect"?"кв. ед.":g6RandomFrom(["см²","дм²","м²"]);'
old_journal=js('journalText:@BT@Стороны: @DL@{a} и @DL@{b} @DL@{unit.replace("²","")}.@BT@')
new_journal=js('journalText:variant==="gridRect"?@BT@По клеткам: @DL@{a} × @DL@{b}.@BT@:@BT@Стороны: @DL@{a} и @DL@{b} @DL@{unit.replace("²","")}.@BT@')
for label,old in [("table gender",old_table),("geometry answer duplication",old_geo),("grid area unit",old_area),("grid area journal",old_journal)]:
 if t.count(old)!=1:raise SystemExit(f"ABORT: {label} pattern count {t.count(old)}")
fixed=t.replace(old_table,new_table).replace(old_geo,new_geo).replace(old_area,new_area).replace(old_journal,new_journal)
newbytes=fixed.encode("utf8")
NEW=hashlib.sha256(newbytes).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py")
checker_text=checker.read_text(encoding="utf8")
if checker_text.count("matkvest-iphone-v41")!=1:raise SystemExit("ABORT: PWA check version")
sem=pathlib.Path("audits/g3g4_stage17_phaseD_semantics.mjs")
sem_text=sem.read_text(encoding="utf8")
if sem_text.count(OLD)!=1:raise SystemExit("ABORT: semantic source pin")
new_sw=sw.replace("matkvest-iphone-v41","matkvest-iphone-v42").replace(OLD,NEW)
# Write checked files only.
html_path.write_bytes(newbytes)
sw_path.write_text(new_sw,encoding="utf8")
checker.write_text(checker_text.replace("matkvest-iphone-v41","matkvest-iphone-v42"),encoding="utf8")
sem.write_text(sem_text.replace(OLD,NEW),encoding="utf8")
report={"stage":"17D-second-quality-fix","utc":datetime.now(timezone.utc).isoformat(),
"oldSha256":OLD,"newSha256":NEW,"bytesBefore":len(before),"bytesAfter":len(newbytes),
"changes":["G3 tables: verb agreement with feminine and masculine names",
"G3 geometry figures: explanation without duplicated answer",
"G3 grid area: square-unit answer instead of ungrounded cm2/dm2/m2; correct journal text"],
"pwaCache":"matkvest-iphone-v42","productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_patch2_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(report,ensure_ascii=False))
