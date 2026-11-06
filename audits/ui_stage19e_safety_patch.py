#!/usr/bin/env python3
"""UI19E safety refinement: hidden legacy accessories are not immediately sellable."""
from pathlib import Path
import hashlib,json
i=Path('index.html');swp=Path('sw.js')
html=i.read_text('utf-8');sw=swp.read_text('utf-8')
base='a962fc0d20e2239eb110c1ded3de73970171f5e8bae0ea0800efd9d219fd0a74'
if 'id="mk-ui19e-legacy-sell-safety"' in html:
    assert 'matkvest-iphone-v65' in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print('v65 already applied');raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==base,'Refuse non-v64 HTML'
assert sw.count(base)>=1 and 'matkvest-iphone-v64' in sw
anchor=html.index('<script id="mk-ui19e-wallet-script">')
end=html.index('</script>',anchor)
body=html[anchor:end]
old="const item=catalogItem(type,id);if(!item)continue;"
new="const item=catalogItem(type,id);if(!item||type==='accessories')continue;"
assert body.count(old)==1,'Refuse uncertain wealth valuation replacement'
body=body.replace(old,new)
explain="Возможные возвраты — это не монеты на счёте."
assert explain in body
body=body.replace(explain,"Возможные возвраты — это не монеты на счёте. Устаревшие аксессуары не учитываются, поскольку их продажа через магазин недоступна.")
html=html[:anchor]+body+html[end:]
html=html.replace('</body>',"""<style id="mk-ui19e-legacy-sell-safety">
/* A traceable build marker: no visual changes. */
</style>
</body>""",1)
h=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace('matkvest-iphone-v64','matkvest-iphone-v65').replace(base,h)
assert h in sw and 'matkvest-iphone-v65' in sw
i.write_text(html,'utf-8');swp.write_text(sw,'utf-8')
report={'stage':'19E / resale accuracy','version':'v65','base_sha256':base,'sha256':h,'cache':'matkvest-iphone-v65',
'change':'Exclude disabled, archived accessory type from immediate-sale potential; explain omission',
'excluded':['purchases','sale handlers','wallet current coins','inventory','rarity prices','PWA logic']}
Path('audits/ui_stage19e_safety_patch_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
