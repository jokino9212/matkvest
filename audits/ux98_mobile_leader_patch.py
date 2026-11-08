from pathlib import Path
import hashlib,re
p=Path('index.html');sp=Path('sw.js')
html=p.read_text('utf-8');sw=sp.read_text('utf-8')
assert 'matkvest-iphone-v97' in sw
assert 'id="mk-ux98-leader-mobile"' not in html
css='''
<style id="mk-ux98-leader-mobile">
/* Use a compact vertical identity rather than truncating the badge beside the name.
   Keep the larger leaderboard grid horizontally scrollable for data columns. */
@media(max-width:480px){
 #modal .leader-table .leader-identity{
   display:grid!important;grid-template-columns:52px minmax(0,1fr)!important;
   grid-auto-rows:min-content!important;column-gap:9px!important;row-gap:4px!important;
   align-content:center!important;align-items:center!important;
   width:220px!important;max-width:calc(100vw - 97px)!important;
   min-width:0!important;box-sizing:border-box!important;
 }
 #modal .leader-table .leader-identity > .avatar-badge{
   grid-column:1!important;grid-row:1 / span 5!important;
   align-self:center!important;justify-self:center!important;
 }
 #modal .leader-table .leader-identity > :not(.avatar-badge){
   grid-column:2!important;min-width:0!important;max-width:100%!important;
   margin-left:0!important;margin-right:0!important;
 }
 #modal .leader-table .leader-identity > .nickname-style{
   grid-row:1!important;white-space:normal!important;
   overflow-wrap:anywhere!important;text-overflow:clip!important;
   line-height:1.25!important;max-height:none!important;
 }
 #modal .leader-table .leader-identity > .profile-badge-empty{
   grid-row:2!important;display:block!important;white-space:normal!important;
   overflow-wrap:anywhere!important;font-size:11px!important;line-height:1.25!important;
 }
 #modal .leader-table .leader-identity > .leader-stickers{
   grid-row:3!important;display:block!important;
   width:100%!important;max-width:100%!important;overflow:visible!important;
 }
 #modal .leader-table .leader-identity > .leader-mobile-level{
   grid-row:4!important;display:block!important;
   width:auto!important;max-width:100%!important;
   font-size:11px!important;line-height:1.25!important;
 }
}
</style>
'''
assert html.count('</body>')==1
html=html.replace('</body>',css+'</body>',1)
sw=sw.replace('matkvest-iphone-v97','matkvest-iphone-v98',1)
sha=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(html,'utf-8');sp.write_text(sw,'utf-8')
print('UX98_LEADER_RESPONSIVE',sha)
