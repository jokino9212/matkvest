#!/usr/bin/env python3
"""Stage 17D: focused source excerpts, never modifies the application."""
import hashlib
import json
import pathlib
import re
from datetime import datetime, timezone

src = pathlib.Path("index.html").read_bytes()
expected = "b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3"
actual = hashlib.sha256(src).hexdigest()
if actual != expected:
    raise SystemExit(f"BLOCKED: unexpected HTML SHA-256 {actual}")
sw = pathlib.Path("sw.js").read_text(encoding="utf-8")
if f'const APP_BUILD_HASH = "{actual}"' not in sw:
    raise SystemExit("BLOCKED: SW and HTML disagree")
s = src.decode("utf-8")
markers = {
    "g3_multiplication_text": ["одинаковые группы", "одинаковых групп", "одинаковая группа", "группы по"],
    "g3_money_text": ["100 коп..", "100 коп.", "коп. .", "руб. ="],
    "g3_topics": ["g3:multiplication_table", "g3:money", "g3:time", "g3:offtable_divide"],
    "generator_functions": ["function makeG3Question", "const makeG3Question", "function g3TheoryHtml", "function startG3WrittenStage"],
    "legacy_functions": ["function startQuizStage", "function startColumnStage", "function startTableStage", "const TOPICS", "function makeQuestion"],
    "error_feedback": ["function checkColumn", "function pick(", "quizQuestions"],
}
out = {"stage": "17D-source-read-only", "sha256": actual, "bytes": len(src),
       "utc": datetime.now(timezone.utc).isoformat(), "excerpts": {}}
for group, words in markers.items():
    for word in words:
        hits = [m.start() for m in list(re.finditer(re.escape(word), s))[:12]]
        out["excerpts"][word] = {
            "count_at_least": len(hits), "positions": hits,
            "snippets": [s[max(0, p-(1100 if group in ("g3_multiplication_text", "g3_money_text") else 400)):
                          min(len(s), p+(1800 if group in ("g3_multiplication_text", "g3_money_text") else 850))]
                         for p in hits[:3]]
        }
pathlib.Path("audits/g3g4_stage17_phaseD_source_inspect.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"stage": out["stage"], "hash": actual, "size": len(src),
    "hits": {key: val["count_at_least"] for key,val in out["excerpts"].items()}}, ensure_ascii=False))
