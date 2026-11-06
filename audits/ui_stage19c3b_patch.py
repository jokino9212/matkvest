#!/usr/bin/env python3
"""UI19C/3B: testable visual improvements for result, resume, collection and chests."""
from pathlib import Path
import hashlib,json
index=Path("index.html");swfile=Path("sw.js")
html=index.read_text(encoding="utf-8");sw=swfile.read_text(encoding="utf-8")
prior="1fc7decbf372a7da0245562a8dd668791e00bb27eb2c935ccff3d07454ec7efd"
if 'id="mk-ui19c3b-final-screens"' in html:
    assert "matkvest-iphone-v61" in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print("UI19C/3B already installed");raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==prior,"Refuse non-v60 HTML"
assert prior in sw and "matkvest-iphone-v60" in sw and "mk-ui19c3-modal-design" in html
css=r"""
<style id="mk-ui19c3b-final-screens">
/* v61: preserve game-state colors and all storage/economy logic. */
#modal .block-result{
  max-width:800px;margin:0 auto;
  color:#193e32;
}
#modal .block-result .btn{
  min-height:44px;border-radius:12px;
  font-weight:750;
}
#modal .block-result .btn:focus-visible,
#modal .report-card:focus-visible{
  outline:3px solid rgba(23,107,84,.37);
  outline-offset:3px;
}
#modal .block-result small,#modal .block-result p{line-height:1.5}
#modal .report-empty{
  border:1px dashed #caddd2;background:#f8fbf9;
  border-radius:15px;padding:20px;
  color:#557367;
}
/* Compact account preview helps pupils reach collection and chest controls faster. */
#modal .profile-preview.profile-cosmetic-card{
  border-radius:16px;border-color:#d4e7dd;
}
#modal .mk872-col-count{
  border-radius:12px;
  min-height:58px;
  transition:background-color .14s ease,border-color .14s ease
}
#modal .mk872-col-count:focus-visible{
  outline:3px solid rgba(23,107,84,.36);
  outline-offset:2px;
}
#modal .mk872-col-count.active{
  border-color:#24845f;
}
/* Chest odds and prices remain app-owned. Only the presentation changes. */
#modal .mk861-chest-card{
  border:1px solid #d6e7df;
  background:#fffefa;
  box-shadow:0 2px 7px rgba(33,68,47,.04);
  border-radius:17px;
}
#modal .mk861-chest-icon{border-radius:13px}
#modal .mk861-chest-actions .btn{
  min-height:44px;border-radius:12px;
  font-weight:750;
}
#modal .mk861-chest-actions .btn:focus-visible{
  outline:3px solid rgba(23,107,84,.36);
  outline-offset:2px;
}
/* Nested guidance and interrupted-work dialog are topmost, never under page UI. */
.mk872-training-panel{
  border-radius:19px;
  border:1px solid #d9e7dd;
  box-shadow:0 26px 68px rgba(10,37,25,.22);
}
.mk872-training-panel .mk872-training-actions{gap:8px}
.mk872-training-panel .btn{min-height:44px;border-radius:12px}
.mk872-training-panel .btn:focus-visible{
  outline:3px solid rgba(23,107,84,.38);outline-offset:3px
}
.mk872-help-dialog{
  border:1px solid #d4e6db;border-radius:17px;
  box-shadow:0 22px 60px rgba(10,37,25,.2);
}
.mk872-help-dialog .mk872-help-close{
  min-width:42px;min-height:42px;border-radius:11px
}
.mk872-help-dialog .mk872-help-close:focus-visible{
  outline:3px solid rgba(23,107,84,.38);outline-offset:2px
}
@media(max-width:680px){
 #modal .profile-preview.profile-cosmetic-card{
   padding:10px 11px!important;
   gap:7px!important;
   min-height:0!important;
   margin-bottom:10px!important;
 }
 #modal .profile-preview .avatar-badge.large{
   width:62px!important;height:62px!important;
   min-width:62px!important;min-height:62px!important;
 }
 #modal .profile-preview-info{
   min-width:0;
   font-size:12.5px!important;
   line-height:1.24!important;
 }
 #modal .profile-preview-info b,#modal .profile-preview-info strong{
   font-size:14px!important;
   line-height:1.24!important;
 }
 #modal .profile-preview-info .profile-sticker-line,
 #modal .profile-preview-info .profile-badge-empty{
   font-size:11px!important;line-height:1.25!important;
 }
 #modal .mk872-col-count{
   min-height:56px;padding:7px 6px;
 }
 #modal .mk861-chest-card{
   border-radius:15px;
 }
 #modal .mk861-chest-actions .btn{min-height:44px}
 #modal .block-result{max-width:100%;margin:0}
 #modal .block-result .btn{min-height:44px}
 .mk872-training-panel{
   border-radius:17px;
   padding:16px!important;
 }
 .mk872-training-panel .mk872-training-actions{gap:7px}
 .mk872-training-panel .btn{min-height:44px}
 .mk872-help-dialog{
   border-radius:15px;
   max-width:calc(100vw - 24px);
 }
}
@media(prefers-reduced-motion:reduce){
 #modal .mk872-col-count,
 #modal .mk861-chest-actions .btn{
  transition:none!important;
 }
}
</style>
"""
assert html.count("</body>")==1
html=html.replace("</body>",css+"\n</body>",1)
sha=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace("matkvest-iphone-v60","matkvest-iphone-v61").replace(prior,sha)
assert "matkvest-iphone-v61" in sw and sha in sw
index.write_text(html,encoding="utf-8");swfile.write_text(sw,encoding="utf-8")
meta={"phase":"19C/3B","version":"v61","base_sha256":prior,"sha256":sha,"cache":"matkvest-iphone-v61",
"scope":["quiz result buttons and typography","empty report cards","mobile profile preview density","collection count cards","chest panel styling","resume and nested help dialogs"],
"excluded":["exercise algorithms","response correctness","XP/coins","purchases","chest odds","rarity values","unlock conditions","user data"]}
Path("audits/ui_stage19c3b_patch_report.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(meta,ensure_ascii=False))
