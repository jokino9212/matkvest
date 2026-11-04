#!/usr/bin/env python3
"""Guarded 17D grammar patch; never touches main."""
import hashlib
import json
import pathlib
from datetime import datetime, timezone
OLD = "b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3"
p = pathlib.Path("index.html")
source = p.read_bytes()
if hashlib.sha256(source).hexdigest() != OLD:
    raise SystemExit("ABORT: source SHA mismatch")
worker = pathlib.Path("sw.js")
sw = worker.read_text(encoding="utf8")
if f'const APP_BUILD_HASH = "{OLD}"' not in sw or 'matkvest-iphone-v40' not in sw:
    raise SystemExit("ABORT: unknown SW")
def js(text):
    return text.replace("@BT@",chr(96)).replace("@DL@",chr(36))
text = source.decode("utf8")
old_group = js('  const add=Array.from({length:a.a},()=>a.b).join(" + ");q.ex=@BT@@DL@{a.a} одинаковые группы по @DL@{a.b}: @DL@{add} = <b>@DL@{a.product}</b>. Поэтому @DL@{a.a} · @DL@{a.b} = @DL@{a.product}.@BT@;')
new_group = js('  const n=a.a,form=n%100>=11&&n%100<=14?"одинаковых групп":n%10===1?"одинаковая группа":n%10>=2&&n%10<=4?"одинаковые группы":"одинаковых групп";\n  const add=Array.from({length:a.a},()=>a.b).join(" + ");q.ex=@BT@@DL@{a.a} @DL@{form} по @DL@{a.b}: @DL@{add} = <b>@DL@{a.product}</b>. Поэтому @DL@{a.a} · @DL@{a.b} = @DL@{a.product}.@BT@;')
old_money = js(' if(ratio>=1)return @BT@1 @DL@{a.from} = @DL@{ratio} @DL@{a.to}.<br>@DL@{a.value} · @DL@{ratio} = <b>@DL@{ans} @DL@{a.to}</b>.@BT@;\n const k=1/ratio;return @BT@1 @DL@{a.to} = @DL@{k} @DL@{a.from}.<br>@DL@{a.value} : @DL@{k} = <b>@DL@{ans} @DL@{a.to}</b>.@BT@;')
new_money = js(' const punct=u=>String(u).endsWith(".")?"":".";\n if(ratio>=1)return @BT@1 @DL@{a.from} = @DL@{ratio} @DL@{a.to}@DL@{punct(a.to)}<br>@DL@{a.value} · @DL@{ratio} = <b>@DL@{ans} @DL@{a.to}</b>@DL@{punct(a.to)}@BT@;\n const k=1/ratio;return @BT@1 @DL@{a.to} = @DL@{k} @DL@{a.from}@DL@{punct(a.from)}<br>@DL@{a.value} : @DL@{k} = <b>@DL@{ans} @DL@{a.to}</b>@DL@{punct(a.to)}@BT@;')
for label, old in [("G3 multiplication grammar",old_group),("G3 money abbreviation",old_money)]:
    count=text.count(old)
    if count!=1:
        raise SystemExit(f"ABORT: unexpected {label} matches: {count}")
new_text=text.replace(old_group,new_group).replace(old_money,new_money)
new_bytes=new_text.encode("utf8")
NEW=hashlib.sha256(new_bytes).hexdigest()
checker=pathlib.Path("audits/g7_stage12_sync_pwa.py")
old_checker=checker.read_text(encoding="utf8")
assert old_checker.count("matkvest-iphone-v40")==1
sem=pathlib.Path("audits/g3g4_stage17_phaseD_semantics.mjs")
old_sem=sem.read_text(encoding="utf8")
assert old_sem.count(OLD)==1
new_sw=sw.replace("matkvest-iphone-v40","matkvest-iphone-v41").replace(OLD,NEW)
assert new_sw.count(NEW)==1
# All preconditions satisfied; write only approved files.
p.write_bytes(new_bytes)
worker.write_text(new_sw,encoding="utf8")
checker.write_text(old_checker.replace("matkvest-iphone-v40","matkvest-iphone-v41"),encoding="utf8")
sem.write_text(old_sem.replace(OLD,NEW),encoding="utf8")
report={"stage":"17D-G3-grammar-repair","at":datetime.now(timezone.utc).isoformat(),
 "oldSha256":OLD,"newSha256":NEW,"bytesBefore":len(source),"bytesAfter":len(new_bytes),
 "changes":["g3 multiplication table numeral agreement","g3 money abbreviation punctuation"],
 "cache":"matkvest-iphone-v41","productionChanged":False}
pathlib.Path("audits/g3g4_stage17_phaseD_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(report,ensure_ascii=False))
