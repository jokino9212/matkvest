"""Extract only pinned pure layout functions, never run the production HTML."""
from hashlib import sha256
from pathlib import Path
import re,sys
source=Path(sys.argv[1]).read_bytes()
assert sha256(source).hexdigest()=="7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318","Unexpected v306 runtime"
text=source.decode("utf-8")
def section(first,last):
    a=list(re.finditer(r"(?m)^function "+re.escape(first)+r"\(",text))
    b=list(re.finditer(r"(?m)^function "+re.escape(last)+r"\(",text))
    assert len(a)==len(b)==1 and a[0].start()<b[0].start(),(first,last)
    return text[a[0].start():b[0].start()]
pieces=[section("divisionSteps","countMarks"),section("digits","toggleDot"),section("columnMultiplyCarryRow","columnCellsHtml")]
out="/* Generated from accepted v306 HTML; only pure layout functions. */\nconst blockSession=true;\n"+"\n".join(pieces)+"\nexport {divisionSteps,calcCarries,calcBorrows,calcMulCarries,columnExerciseModel};\n"
Path(sys.argv[2]).write_text(out,encoding="utf-8")
print("PASS_V307_EXACT_COLUMN_LAYOUT",sha256(out.encode()).hexdigest())
