from pathlib import Path
import re,hashlib,json
p=Path('index.html');swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v82' in sw and 'mkUX00BadgeArtworkInstalled' in s
assert 'bd_comet"' not in s and 'bd_comet.svg' not in sw
base=['bd_star','bd_diamond','bd_pi','bd_root','bd_sigma','bd_fraction','bd_infinity','bd_div_master','bd_fraction_master','bd_perfect','bd_control','bd_errors','bd_grade4','bd_grade5','bd_thousand','bd_equations']
new=[
 {'id':'bd_comet','name':'Комета','price':160,'level':4,'rarity':'uncommon','desc':'Стремительная комета — космический коллекционный значок.'},
 {'id':'bd_geometry','name':'Архитектор фигур','price':240,'level':6,'rarity':'rare','desc':'Объёмная геометрия для исследователей фигур.'},
 {'id':'bd_logic','name':'Логический лабиринт','price':360,'level':8,'rarity':'epic','desc':'Трофей за любовь к логике и задачам на смекалку.'},
 {'id':'bd_sprint','name':'Молниеносное решение','price':520,'level':10,'rarity':'legendary','desc':'Престижный значок молниеносного математика.'}
]
for item in new:
 f=Path('assets/source/badges/prototypes')/(item['id']+'.svg')
 assert f.exists(),f
 assert 'viewBox="0 0 512 512"' in f.read_text('utf8')
needle=' const artworkIds=new Set('
assert s.count(needle)==1
js=''' /* UX-08 phase 1: four new purchasable badges; original 16 records untouched. */
 SHOP_CATALOG.badges.push(
'''+',\n'.join('  '+json.dumps(item,ensure_ascii=False,separators=(',',':')) for item in new)+'''
 );
'''
# Set explicit icons from existing IIFE to use exact same art renderer.
s=s.replace(needle,js+needle,1)
match=re.search(r' const artworkIds=new Set\((\[[^;]+?\])\);',s)
assert match, 'Artwork IDs set missing'
ids=json.loads(match.group(1))
assert ids==base
s=s[:match.start(1)]+json.dumps(base+[item['id'] for item in new])+s[match.end(1):]
sw=sw.replace('matkvest-iphone-v82','matkvest-iphone-v83',1)
existing='const APP_FILES = ['
assert sw.count(existing)==1
end=sw.index('];',sw.index(existing))
newpaths=','.join(' "./assets/source/badges/prototypes/'+item['id']+'.svg"' for item in new)
sw=sw[:end]+','+newpaths+sw[end:]
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('UX08_BADGES_NEW',len(new),'TOTAL',len(base)+len(new),'HTML_SHA256',sha,'PWA','v83')
