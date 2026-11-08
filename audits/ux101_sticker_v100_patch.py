from pathlib import Path
import re, hashlib, json

html_file=Path('index.html')
sw_file=Path('sw.js')
html=html_file.read_text('utf-8')
sw=sw_file.read_text('utf-8')
assert 'matkvest-iphone-v99' in sw, 'Staging base must be v99'
assert 'id="mk-ux101-sticker-catalog"' not in html, 'UX-101 already applied'
assert html.count('</body>') == 1
assert html.count('const SHOP_CATALOG') == 1
new_items=[
 ('st_pencil','Карандаш','common',28,1,'Для первых аккуратных решений.'),
 ('st_heart','Сердце','common',33,2,'Любовь к математическим открытиям.'),
 ('st_target','Точная цель','common',36,2,'Попадание точно в ответ.'),
 ('st_hourglass','Песочные часы','uncommon',46,3,'Терпение и внимание к каждой минуте.'),
 ('st_magnifier','Лупа исследователя','uncommon',47,3,'Находить закономерности интересно.'),
 ('st_joystick','Геймпад','rare',61,5,'Задачи как увлекательная игра.'),
 ('st_robot','Робот-помощник','rare',63,5,'Технологичный спутник тренировки.'),
 ('st_portal','Портал знаний','epic',82,7,'Новый мир сложных математических задач.'),
 ('st_phoenix','Феникс победы','legendary',125,10,'Возрождение после сложных испытаний.')
]
ids=[x[0] for x in new_items]
assert len(ids)==9 and len(ids)==len(set(ids))
for id in ids:
 assert Path('assets/source/stickers',id+'.svg').is_file(), id
 assert f'./assets/source/stickers/{id}.svg' not in sw
 assert f'id:"{id}"' not in html, 'Existing catalog entry would collide: '+id
items=[dict(id=id,name=name,price=price,level=level,rarity=rarity,desc=desc,
            icon=f'<img class="mk-ux94-sticker-image" alt="" loading="eager" decoding="async" src="assets/source/stickers/{id}.svg">')
       for id,name,rarity,price,level,desc in new_items]
js='''<script id="mk-ux101-sticker-catalog">
/* UX-101: nine original, purchasable stickers. Original 31 and all reward conditions are immutable. */
(function(){
 const fresh=__STICKER_DATA__;
 if(SHOP_CATALOG.stickers.length!==31)throw Error("UX-101 expected 31 existing stickers");
 const existing=new Set(SHOP_CATALOG.stickers.map(item=>item.id));
 for(const item of fresh){
   if(existing.has(item.id))throw Error("UX-101 sticker ID collision "+item.id);
   if(!Number.isInteger(item.price)||item.price<1)throw Error("UX-101 invalid shop price");
   SHOP_CATALOG.stickers.push(item);
   existing.add(item.id);
 }
 if(SHOP_CATALOG.stickers.length!==40||existing.size!==40)throw Error("UX-101 catalog not 40 unique stickers");
})();
</script>
'''.replace('__STICKER_DATA__',json.dumps(items,ensure_ascii=False,separators=(',',':')))
html=html.replace('</body>',js+'</body>',1)
sw=sw.replace('matkvest-iphone-v99','matkvest-iphone-v100',1)
anchor='];\n\n// Navigation'
assert sw.count(anchor)==1
added=', '+', '.join(json.dumps('./assets/source/stickers/'+id+'.svg') for id in ids)
sw=sw.replace(anchor,added+anchor,1)
hash=hashlib.sha256(html.encode('utf-8')).hexdigest()
sw,count=re.subn(r'(const APP_BUILD_HASH = ")[0-9a-f]{64}(")',
    lambda m:m.group(1)+hash+m.group(2),sw,count=1)
assert count==1
assert 'matkvest-iphone-v100' in sw
html_file.write_text(html,'utf-8')
sw_file.write_text(sw,'utf-8')
print('UX101_STICKERS_40_OF_40',json.dumps(dict(new=ids,total=40,cache='matkvest-iphone-v100',hash=hash),ensure_ascii=False))
