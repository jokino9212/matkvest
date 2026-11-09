#!/usr/bin/env python3
"""UX-106: stop badge images escaping small chips in profiles and leaderboard; CSS-only plus PWA fingerprint."""
from pathlib import Path
import hashlib,re
index=Path("index.html");worker=Path("sw.js")
html=index.read_text("utf-8");sw=worker.read_text("utf-8")
assert html.count("</body>")==1,"HTML endpoint must be unique"
assert 'const CACHE_NAME = "matkvest-iphone-v105"' in sw,"Only patch verified v105"
assert 'id="mk-ux106-profile-badge-sizes"' not in html,"Patch already applied"
assert 'class="profile-badge-chip"' in html and "mk-ux-badge-image" in html,"Missing original bug surfaces"
assert re.search(r'const APP_BUILD_HASH = "([0-9a-f]{64})"',sw).group(1)==hashlib.sha256(html.encode("utf-8")).hexdigest(),"Incorrect v105 baseline fingerprint"
css="""<style id="mk-ux106-profile-badge-sizes">
/* UX-106: fixed-size badge thumbnail in profile + leaderboard.
   Badges are still freely zoomable from the real media viewer.
   Scope is deliberately restricted to small badges in the modal. */
#modal .profile-badges{
  display:flex!important;align-items:center!important;justify-content:flex-start!important;
  flex-wrap:wrap!important;gap:5px!important;min-width:0!important;max-width:100%!important;
}
#modal .profile-badges .profile-badge-chip{
  box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;
  justify-content:center!important;flex:0 0 30px!important;
  width:30px!important;min-width:30px!important;max-width:30px!important;
  height:30px!important;min-height:30px!important;max-height:30px!important;
  padding:2px!important;overflow:hidden!important;line-height:1!important;
  position:relative!important;vertical-align:middle!important;
}
#modal .profile-badges.large .profile-badge-chip{
  flex-basis:38px!important;width:38px!important;min-width:38px!important;max-width:38px!important;
  height:38px!important;min-height:38px!important;max-height:38px!important;
  padding:3px!important;
}
#modal .profile-badges .profile-badge-chip > img,
#modal .profile-badges .profile-badge-chip > svg,
#modal .profile-badges .profile-badge-chip > picture,
#modal .profile-badges .profile-badge-chip > span{
  display:block!important;position:static!important;transform:none!important;flex:0 1 auto!important;
  box-sizing:border-box!important;width:100%!important;height:100%!important;
  min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;
  object-fit:contain!important;aspect-ratio:1/1!important;
}
</style>
"""
html=html.replace("</body>",css+"</body>",1)
sw=sw.replace('matkvest-iphone-v105','matkvest-iphone-v106',1)
digest=hashlib.sha256(html.encode("utf-8")).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+digest+m.group(2),sw,count=1)
assert n==1 and 'matkvest-iphone-v106' in sw
index.write_text(html,"utf-8");worker.write_text(sw,"utf-8")
print("UX106_PROFILE_BADGE_CSS_PATCHED",{"cache":"v106","html_sha256":digest,"scope":"only small profile badges in modal"})
