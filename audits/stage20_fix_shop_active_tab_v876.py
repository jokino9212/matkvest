#!/usr/bin/env python3
"""Stage 20: keep selected shop tab visible on narrow displays."""
from pathlib import Path
import hashlib,re
p=Path("index.html");swp=Path("sw.js")
s=p.read_text("utf-8");sw=swp.read_text("utf-8")
assert s.count("</body>")==1
assert "mk-v876-active-shop-tab" not in s
assert "matkvest-iphone-v75" in sw
patch=r'''
<!-- Stage 20 / v8.76: active category must be visible in horizontally scrollable shop tabs. -->
<style id="mk-v876-active-shop-tab">
#modal .shop-tabs{scroll-padding-inline:10px}
#modal .shop-tabs .shop-tab.active{scroll-margin-inline:10px}
</style>
<script id="mk-v876-active-shop-tab-script">
(function(){
 'use strict';
 const modal=document.getElementById('modal');
 if(!modal)return;
 let pending=false;
 function align(){
  pending=false;
  const strip=modal.querySelector('.shop-tabs');
  const active=strip?.querySelector('.shop-tab.active');
  if(!strip||!active)return;
  const sr=strip.getBoundingClientRect();
  const ar=active.getBoundingClientRect();
  if(sr.width<1||ar.width<1)return;
  const inset=10;
  if(ar.left>=sr.left+inset&&ar.right<=sr.right-inset)return;
  const desired=strip.scrollLeft+(ar.left+ar.width/2)-(sr.left+sr.width/2);
  strip.scrollLeft=Math.max(0,Math.min(strip.scrollWidth-strip.clientWidth,desired));
 }
 function queue(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(align);
 }
 new MutationObserver(queue).observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 queue();
})();
</script>
'''
s=s.replace("</body>",patch+"</body>")
assert "8.75" in s
s=s.replace("8.75","8.76")
p.write_text(s,"utf-8")
h=hashlib.sha256(p.read_bytes()).hexdigest()
sw=sw.replace("matkvest-iphone-v75","matkvest-iphone-v76")
sw,n=re.subn(r'(const APP_BUILD_HASH\s*=\s*")[0-9a-f]{64}(";)',lambda m:m.group(1)+h+m.group(2),sw)
assert n==1 and h in sw
swp.write_text(sw,"utf-8")
print("PATCH 8.76 OK",h)
