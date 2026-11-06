#!/usr/bin/env python3
"""UI stage19C/3A: bounded modal & lesson visual system, from verified v59."""
from pathlib import Path
import hashlib,json
index=Path("index.html");worker=Path("sw.js")
html=index.read_text(encoding="utf-8");sw=worker.read_text(encoding="utf-8")
expected="f5477eb12f0fd80e7e452060e463b8bce5b06e93f64b5907a670a9d79f5fb3b4"
if 'id="mk-ui19c3-modal-design"' in html:
    assert "matkvest-iphone-v60" in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print("UI19C/3A already applied");raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==expected,"Refusing: not the verified v59 checkpoint"
assert "matkvest-iphone-v59" in sw and expected in sw,"Unexpected PWA fingerprint"
assert "mk-ui19c2-layout" in html and html.count("</body>")==1
css=r"""
<style id="mk-ui19c3-modal-design">
/* v60 / UI19C3A: the real lesson, practice, shop and account are overlay dialogs.
   Only geometry, typography and affordances; never modify exercise correctness styles. */
#modal{
  border:1px solid #d8e6df;
  border-radius:20px;
  box-shadow:0 28px 70px rgba(15,44,34,.22),0 4px 12px rgba(15,44,34,.06);
  background:#fff;
}
#modal .mtop{
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:12px;min-width:0;padding-bottom:12px;margin-bottom:14px;
  border-bottom:1px solid #e5eee8
}
#modal .mtop h2{
  font-size:clamp(20px,2.05vw,25px);line-height:1.22;
  font-weight:800;letter-spacing:-.025em;overflow-wrap:anywhere;
  margin:0;color:#173c30;min-width:0
}
#modal .mtop .x{
  flex:0 0 42px;min-width:42px;min-height:42px;
  background:#f0f6f2;border:1px solid #d6e7de;
  border-radius:12px;color:#265848;
  transition:background-color .14s ease,border-color .14s ease
}
#modal .mtop .x:hover{background:#e2f0e8;border-color:#b5d5c5}
#modal .mtop .x:focus-visible{outline:3px solid rgba(23,107,84,.4);outline-offset:3px}
/* Theory: unify reading surfaces without touching mathematical text or diagrams. */
#modal .lesson{
  border-radius:15px;border-color:#d7e8df;
  background-color:#f4faf6;
  padding:16px;
}
#modal .elementary-theory,#modal .lesson p{line-height:1.55}
#modal .elementary-example{
  border-radius:12px;border-color:#d9e8de;
  background-color:#fbfdfb
}
/* Three stage choices: keep native buttons, lock badges and sequential unlocking. */
#modal .stage-grid{gap:10px}
#modal button.stage-card{
  border-radius:15px;border:1px solid #d6e6de;
  box-shadow:0 2px 5px rgba(25,63,47,.025);
  padding:14px;transition:border-color .17s ease,box-shadow .17s ease,transform .17s ease
}
#modal button.stage-card:not(:disabled):not(.locked):hover{
  transform:translateY(-2px);
  border-color:#8dbfa6;
  box-shadow:0 9px 21px rgba(24,72,51,.1)
}
#modal button.stage-card:focus-visible{
  outline:3px solid rgba(23,107,84,.38);outline-offset:3px
}
#modal button.stage-card.locked,#modal button.stage-card:disabled{
  cursor:not-allowed;box-shadow:none
}
#modal button.stage-card strong{font-weight:800;letter-spacing:-.012em}
#modal button.stage-card small{line-height:1.45}
/* Practice: improve rhythm without overriding right/wrong/selected answer colors. */
#modal .block-head{
  border-radius:13px;border:1px solid #d8e9df;
  background:#f4faf6;padding:11px 12px;gap:8px
}
#modal .quizq{
  border-radius:14px;
  font-size:clamp(21px,2.2vw,29px);
  line-height:1.23;letter-spacing:-.02em;
  font-weight:800;overflow-wrap:anywhere
}
#modal .answers{gap:10px}
#modal .answers button.answer{
  min-height:56px;border-radius:13px;
  font-weight:750;line-height:1.22;
  transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease
}
#modal .answers button.answer:focus-visible{
  outline:3px solid rgba(23,107,84,.36);outline-offset:2px
}
#modal #quizSkip{min-height:43px;border-radius:12px;font-size:14px}
/* Shop and account: compact visual hierarchy, no buying/equipping changes. */
#modal .profile-preview.profile-cosmetic-card{
  border-radius:15px;border:1px solid #d8e8df;
  box-shadow:none;padding:13px 15px;gap:11px
}
#modal .profile-preview-info{line-height:1.36}
#modal .profile-preview-info .profile-title-line{font-weight:700}
#modal .shop-tabs{gap:6px;margin:10px 0}
#modal button.shop-tab{
  min-height:40px;border-radius:11px;
  border:1px solid #d8e7df;
  padding:8px 10px;
  background-color:#f8fbf9;color:#244e40;
  font-weight:700;transition:border-color .14s ease,background-color .14s ease
}
#modal button.shop-tab.active{
  background-color:#e0f1e7;border-color:#a2cdb6;color:#116343
}
#modal button.shop-tab:not(.active):hover{background-color:#eff7f2;border-color:#bcd8c8}
#modal button.shop-tab:focus-visible{
  outline:3px solid rgba(23,107,84,.34);outline-offset:2px
}
#modal .shop-card{
  border-radius:15px;border-color:#d6e5dd;
  box-shadow:0 3px 8px rgba(25,70,48,.035),0 9px 24px rgba(25,70,48,.05)
}
#modal .shop-card .btn{border-radius:12px}
#modal .profile-row{
  border-radius:14px;border-color:#d4e6dc;
  box-shadow:none
}
#modal .profile-row.current{border-color:#95c5ab}
#modal .profile-create input{min-height:44px;border-radius:12px}
#modal .report-card,#modal .backup-action{
  border-radius:13px;border-color:#d4e5db;
  box-shadow:0 2px 7px rgba(25,60,45,.035)
}
/* Mobile modal: keep the scrolling container intact and all controls accessible. */
@media(max-width:680px){
 #modal{border-radius:18px}
 #modal .mtop{gap:8px;margin-bottom:10px;padding-bottom:9px}
 #modal .mtop h2{font-size:21px;line-height:1.22}
 #modal .mtop .x{min-height:42px;min-width:42px}
 #modal .lesson{padding:13px;border-radius:13px}
 #modal .stage-grid{gap:8px}
 #modal button.stage-card{padding:12px 13px;border-radius:13px}
 #modal .block-head{padding:9px 10px}
 #modal .quizq{font-size:22px}
 #modal .answers{gap:9px}
 #modal .answers button.answer{min-height:56px}
 #modal .profile-preview.profile-cosmetic-card{padding:12px;gap:8px}
 #modal button.shop-tab{min-height:42px;padding:7px 9px;font-size:13px}
 #modal .shop-card{border-radius:14px}
}
/* State changes (correct, wrong, locked, purchased, equipped) are owned by the app. */
@media(hover:none){
 #modal button.stage-card:hover{transform:none}
 #modal .mtop .x:hover{box-shadow:none}
}
@media(prefers-reduced-motion:reduce){
 #modal .mtop .x,#modal button.stage-card,
 #modal button.shop-tab,#modal .answers button.answer{
   transition:none!important;transform:none!important;animation:none!important
 }
}
</style>
"""
html=html.replace("</body>",css+"\n</body>",1)
sha=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace("matkvest-iphone-v59","matkvest-iphone-v60").replace(expected,sha)
assert "matkvest-iphone-v60" in sw and sha in sw
index.write_text(html,encoding="utf-8");worker.write_text(sw,encoding="utf-8")
meta={"phase":"19C/3A","version":"v60","previous":expected,"sha256":sha,"pwa":"matkvest-iphone-v60",
"scope":["dialog header and close","lesson reading surfaces","locked/enabled stage cards","practice question, answer spacing, focus","shop category tabs, item cards","profile and report cards"],
"excluded":["math logic","answer state styles","unlock rules","purchase and equip flows","economy","local data"]}
Path("audits/ui_stage19c3_patch_report.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(meta,ensure_ascii=False))
