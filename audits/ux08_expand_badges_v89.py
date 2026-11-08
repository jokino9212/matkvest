from pathlib import Path
import re,hashlib,json
p=Path('index.html');swp=Path('sw.js')
s=p.read_text('utf8');sw=swp.read_text('utf8')
assert 'matkvest-iphone-v88' in sw and 'mkUX00BadgeArtworkInstalled' in s
assert 'bd_crystal"' not in s and 'bd_crystal.svg' not in sw
base=['bd_star','bd_diamond','bd_pi','bd_root','bd_sigma','bd_fraction','bd_infinity','bd_div_master','bd_fraction_master','bd_perfect','bd_control','bd_errors','bd_grade4','bd_grade5','bd_thousand','bd_equations','bd_comet','bd_geometry','bd_logic','bd_sprint','bd_orbit','bd_compass','bd_clock','bd_puzzle','bd_crown','bd_prism','bd_rocket','bd_chess','bd_spiral','bd_telescope','bd_abacus','bd_hourglass','bd_atom','bd_matrix','bd_phoenix','bd_magnet','bd_gear','bd_mountain','bd_key','bd_dragonfly','bd_lighthouse','bd_book','bd_owl','bd_sundial','bd_rune']
new=[
 {'id':'bd_crystal','name':'Кристалл логики','price':270,'level':7,'rarity':'uncommon','desc':'Чистая структура мыслей в сияющем кристалле.'},
 {'id':'bd_satellite','name':'Спутник знаний','price':395,'level':9,'rarity':'rare','desc':'Исследователь передаёт знания за пределы Земли.'},
 {'id':'bd_archimedes','name':'Рычаг Архимеда','price':475,'level':10,'rarity':'epic','desc':'Сила точного расчёта и равновесия.'},
 {'id':'bd_galaxy','name':'Галактика формул','price':615,'level':12,'rarity':'epic','desc':'Великая галактика математических закономерностей.'},
 {'id':'bd_aurora','name':'Полярное сияние','price':950,'level':16,'rarity':'legendary','desc':'Редкая вершина мастерства — сияние знаний.'}
]
for item in new:
 f=Path('assets/source/badges/prototypes')/(item['id']+'.svg')
 assert f.exists(),f
 assert 'viewBox="0 0 512 512"' in f.read_text('utf8')
needle=' const artworkIds=new Set('
assert s.count(needle)==1
js=''' /* UX-08 phase 7: five new purchasable badges; original 16 records untouched. */
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
sw=sw.replace('matkvest-iphone-v88','matkvest-iphone-v89',1)
existing='const APP_FILES = ['
assert sw.count(existing)==1
end=sw.index('];',sw.index(existing))
newpaths=','.join(' "./assets/source/badges/prototypes/'+item['id']+'.svg"' for item in new)
sw=sw[:end]+','+newpaths+sw[end:]
sha=hashlib.sha256(s.encode('utf8')).hexdigest()
sw,n=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',lambda m:m.group(1)+sha+m.group(2),sw,count=1)
assert n==1
p.write_text(s,'utf8');swp.write_text(sw,'utf8')
print('UX08_BADGES_NEW',len(new),'TOTAL',len(base)+len(new),'HTML_SHA256',sha,'PWA','v89')
