from pathlib import Path
import hashlib,json,re,shutil,sys
root=Path(__file__).resolve().parent.parent
out=Path(sys.argv[1]).resolve()
if out.exists():raise SystemExit('Destination must be new')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(root/'index.html')=='bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce'
out.mkdir(parents=True)
for p in root.iterdir():
 if p.is_file() and (p.suffix=='.js' or p.name in ('index.html','manifest.webmanifest')):shutil.copy2(p,out/p.name)
shutil.copytree(root/'assets',out/'assets')
shutil.copytree(root/'integrations/backend95',out/'integration')
shutil.copy2(root/'integrations/backend95-next/school_block_queue.mjs',out/'integration/school_block_queue.mjs')
page=out/'index.html';sw=out/'sw.js'
s=page.read_text('utf8')
assert s.count('</body>')==1
s=s.replace('?v=290','?v=300')
bootstrap="""<link rel="stylesheet" href="./integration/account.css?v=300"><script>
try{if(sessionStorage.getItem('mk95-mode')==='server')document.documentElement.dataset.mk95Mode='server'}catch{}
(function(){
 const active=()=>document.documentElement.dataset.mk95Mode==='server';
 for(const kind of ['click','keydown','submit','change','input','pointerdown']){
  document.addEventListener(kind,e=>{
   if(!active())return;
   const allowed=e.target?.closest?.('[data-mk95-server],#mk95-account-entry,#overlay[data-mk95-report]');
   if(!allowed){e.preventDefault();e.stopImmediatePropagation()}
  },true);
 }
 window.addEventListener('popstate',e=>{if(active()){e.stopImmediatePropagation();history.replaceState({...history.state,route:{screen:'home'}},'')}},true);
})();
</script>"""
assert s.count('</head>')==1
s=s.replace('</head>',bootstrap+'</head>')
s=s.replace('</body>','<div id="mk95-account-entry"></div><script type="module" src="./integration/account_ui.mjs?v=300"></script></body>')
page.write_text(s,'utf8')
w=sw.read_text('utf8')
assert w.count('matkvest-iphone-v')>=1
w=w.replace('matkvest-iphone-v','matkvest-integration95-v').replace('matkvest-integration95-v290','matkvest-integration95-v300')
w,n=re.subn(r'const APP_BUILD_HASH = "[a-f0-9]+";',f'const APP_BUILD_HASH = "{sha(page)}";',w);assert n==1
m=re.search(r'const SCRIPT_HASHES = (\{[^\n]+\});',w);assert m
hashes=json.loads(m[1])
hashes['assets/ui/knowledge-map.js']=sha(out/'assets/ui/knowledge-map.js')
for p in (out/'integration').iterdir():
 if p.suffix in ('.mjs','.css'):hashes['integration/'+p.name]=sha(p)
w=w.replace(m[0],'const SCRIPT_HASHES = '+json.dumps(hashes)+';',1)
marker='  const url = new URL(request.url);'
assert w.count(marker)==1
w=w.replace(marker,marker+'\n  if (url.pathname.startsWith("/api/") || request.headers.has("Authorization")) return;')
sw.write_text(w,'utf8')
for path,digest in hashes.items():assert sha(out/path)==digest,path
print('PASS_INTEGRATION_BUILD',sha(page))
