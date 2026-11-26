#!/usr/bin/env python3
"""Build-only overlay for v302: preserve the reproducible v300 baseline.
Run after the guarded pet patch and exact catalogue export, before integration build.
No backend sources, deployment, or database access.
"""
from pathlib import Path
import hashlib, json, sys
from prepare_backend95_pet_migration_v302 import preflight, NEW_SHA, NEW_BUILD

def one(s, before, after):
    if s.count(before) != 1:
        raise ValueError("Source anchor mismatch: " + before[:100])
    return s.replace(before, after, 1)

def pinned(path, blob):
    data=path.read_bytes()
    actual=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    if actual!=blob: raise ValueError("Unexpected source: "+str(path))
    return data.decode("utf8")

def apply(policy_path):
    _, raw=preflight()
    if policy_path.read_bytes()!=raw: raise ValueError("Export differs from verified v302 policy")
    root=Path("integrations/backend95")
    reader=root/"economy_read.mjs"
    fixture=Path("audits/backend95_account_browser.cjs")
    s=pinned(reader,"08894dbcf516039ac78123c63e8b5d07ecee7816")
    f=pinned(fixture,"7a30df1a20231e20dabbd9ac0b52d9fe255cab32")
    # Embed the exact pinned policy in a separate module, included in SW hashes.
    policy=json.loads(raw)
    module="export default "+json.dumps(policy,ensure_ascii=False,separators=(",",":"))+";\n"
    s=one(s,"// Read-only server economy. The installed backend exposes no purchase/resale/equip API.",
        "import pinnedPolicy from './economy_policy_v302.mjs?v=300';\n// Server economy, exact v302 policy only.")
    s=one(s,"bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce",NEW_BUILD)
    s=one(s,"e12e0b972331ecf508f40a0e9a5b285d205807844222d2191260d91a88e54c43",NEW_SHA)
    s=one(s,"export function validateEconomy(catalog,state,id){",'''const retired=new Set(['pet_robotx','pet_wisecat','pet_royal_dragon']);
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x!==null&&typeof x==='object'?'{' + Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const expectedPolicy=canonical(pinnedPolicy);
export function validateEconomy(catalog,state,id){
 if(!catalog||catalog.policy_sha256!==POLICY)return null;
 const {policy_sha256,...actual}=catalog;
 if(canonical(actual)!==expectedPolicy)return null;''')
    s=one(s,"catalog.items.filter(i=>i.buyable).length!==184","catalog.items.filter(i=>i.buyable).length!==181")
    s=one(s,"const p=by.get(i.id),selected=equipped.has(i.id);","const p=by.get(i.id),archived=retired.has(i.id),selected=!archived&&equipped.has(i.id);")
    s=one(s,"return {id:i.id,title:p?.name||info?.name||i.id,selected,art:live?trustedArt(info,true):'<div class=\"mk872-col-preview\">◆</div>',meta:(selected?'Выбрано · ':'')+",
        "return {id:i.id,title:p?.name||info?.name||i.id,archived,selected,art:live?trustedArt(info,true):'<div class=\"mk872-col-preview\">◆</div>',meta:(archived?'Архивный питомец · ':selected?'Выбрано · ':'')+")
    s=one(s,"...(live&&p?.selectable?","...(live&&!archived&&p?.selectable?")
    s=one(s,"return {id:category,title,owned:items.length,items,serverReadOnly:true};","const active=items.filter(i=>!i.archived);return {id:category,title,owned:active.length,items:active,archived:items.filter(i=>i.archived),serverReadOnly:true};")
    s=one(s,"}).filter(x=>x.items.length);\n // Unknown historical categories",
        "});\n const archive=collectionSections.flatMap(s=>s.archived);for(let i=collectionSections.length-1;i>=0;i--)if(!collectionSections[i].items.length)collectionSections.splice(i,1);\n if(archive.length)collectionSections.push({id:'archived-pets',title:'Архивные питомцы',owned:archive.length,items:archive,serverReadOnly:true});\n // Unknown historical categories")
    s=one(s,"items.filter(i=>!i.hiddenInStore&&!i.archived&&!i.legacyHero&&!i.retired)","items.filter(i=>!retired.has(i.id)&&!i.hiddenInStore&&!i.archived&&!i.legacyHero&&!i.retired)")
    # Use the real exported candidate for the mock API; baseline stays untouched.
    f=one(f,"const rawPolicy=gunzipSync(Buffer.from(readFileSync(resolve(__dirname,'../integrations/backend95-next/economy_v290.json.gz.b64'),'utf8').trim(),'base64'));",
        "const rawPolicy=readFileSync(resolve(__dirname,'../ci-acceptance-output/economy_v302_candidate.json'));")
    f=one(f,"e12e0b972331ecf508f40a0e9a5b285d205807844222d2191260d91a88e54c43",NEW_SHA)
    f=one(f,"[E]:{items:[],equipped:[],achievements:[]}};",
        "[E]:{items:[{id:'pet_robotx',category:'pets',source:'store',paid_price:430},{id:'pet_wisecat',category:'pets',source:'store',paid_price:320},{id:'pet_royal_dragon',category:'pets',source:'chest',paid_price:0}],equipped:[],achievements:[]}};")
    # Change only the mission target in the candidate; original baseline still tests sticker mission.
    f=one(f,"await openShop('stickers');await card('st_pi').getByRole('button',{name:'Продать'}).click();\n  await p.getByRole('button',{name:/4 класс.*Таблица умножения/}).click();",
        """await openShop('pets');
  for(const id of ['pet_robotx','pet_wisecat','pet_royal_dragon'])assert.equal(await card(id).count(),0);
  assert.equal(econHistory.some(x=>['pet_robotx','pet_wisecat','pet_royal_dragon'].includes(x.item_id)),false);
  await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();
  await p.getByRole('heading',{name:'Архивные питомцы'}).waitFor();
  for(const id of ['pet_robotx','pet_wisecat','pet_royal_dragon']){
   const item=p.locator('[data-collection-item="'+id+'"]');await item.waitFor();
   assert.equal(await item.getByRole('button',{name:'Выбрать',exact:true}).count(),0);
   assert.match(await item.innerText(),/Архивный питомец/);
  }
  assert.equal(await p.locator('[data-collection-item="pet_royal_dragon"]').getByRole('button',{name:'Продать'}).count(),0);
  await p.locator('[data-collection-item="pet_wisecat"]').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:/4 класс.*Таблица умножения/}).click();""")
    f=one(f,"await p.locator('[data-economy-view=\"shop\"]').getByRole('button',{name:'Назад к тренировкам'}).click();\n  for(let block=0;",
        "await p.locator('[data-economy-view=\"collection\"]').getByRole('button',{name:'Назад к тренировкам'}).click();\n  for(let block=0;")
    f=one(f,"await openShop('stickers');await card('st_pi').getByRole('button',{name:'Продать'}).click();\n  await p.getByRole('button',{name:'Получить 80%',exact:true}).click();await waitBalance(1701);",
        """await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();
  await p.locator('[data-collection-item="pet_wisecat"]').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:'Получить 80%',exact:true}).click();await waitBalance(1937);""")
    f=one(f,"assert.equal(econMission,null);assert.equal(econCommits,8);",
        """assert.equal(econMission,null);assert.equal(econCommits,8);
  assert.equal(await p.locator('[data-collection-item="pet_wisecat"]').count(),0);
  await p.reload();await waitBalance(1937);
  await p.locator('#appHeader').getByRole('button',{name:'Коллекция',exact:true}).click();
  await p.locator('[data-collection-item="pet_robotx"]').getByRole('button',{name:'Продать'}).click();
  await p.getByRole('button',{name:'Продать сейчас',exact:true}).click();await waitBalance(2109);
  assert.equal(econCommits,9);
  assert.equal(await p.locator('[data-collection-item="pet_robotx"]').count(),0);
  console.log('PASS_V302_ARCHIVE_COMPENSATION_UI 40/80 and reload');""")
    f=one(f,"await ctx.setOffline(false);await waitBalance(1701);","await ctx.setOffline(false);await waitBalance(2109);")
    reader.write_text(s,encoding="utf8")
    (root/"economy_policy_v302.mjs").write_text(module,encoding="utf8")
    fixture.write_text(f,encoding="utf8")
    print("PASS_V302_POLICY_OVERLAY",NEW_SHA)

if __name__=="__main__":
    apply(Path(sys.argv[1]))
