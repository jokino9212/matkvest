#!/usr/bin/env python3
"""MatKvest stage 19E: read-only wealth dashboard grounded in existing profile accounting."""
from pathlib import Path
import hashlib,json
i=Path("index.html");swp=Path("sw.js")
html=i.read_text("utf-8");sw=swp.read_text("utf-8")
base="5e8d980f0311acc54b024e820a73335e3d867505f69dfca691a38e2788da7aff"
if 'id="mk-ui19e-wallet-style"' in html:
    assert "matkvest-iphone-v64" in sw and hashlib.sha256(html.encode()).hexdigest() in sw
    print("UI19E already applied");raise SystemExit(0)
assert hashlib.sha256(html.encode()).hexdigest()==base,"Refuse wrong v63 build"
assert "matkvest-iphone-v63" in sw and base in sw and html.count("</body>")==1
style=r"""
<style id="mk-ui19e-wallet-style">
#modal .mk19e-wallet{display:flex;flex-direction:column;gap:16px;max-width:900px;margin:0 auto;color:#1b4134}
#modal .mk19e-wallet-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px;border-radius:17px;background:#f5f9f6;border:1px solid #d9e7df}
#modal .mk19e-wallet-head .mk19e-overline{font-size:12px;color:#547465;font-weight:700}
#modal .mk19e-wallet-head .mk19e-balance{font-size:clamp(27px,4vw,38px);font-weight:850;letter-spacing:-.035em;line-height:1.15;color:#155b40;font-variant-numeric:tabular-nums}
#modal .mk19e-wallet-head small{display:block;color:#557263;line-height:1.4;margin-top:3px}
#modal .mk19e-wallet-head .mk19e-id{font-size:12px;color:#5e766b;max-width:280px;overflow-wrap:anywhere}
#modal .mk19e-section-title{font-size:16px;font-weight:800;margin:0 0 9px;color:#1d4a36}
#modal .mk19e-wallet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#modal .mk19e-wallet-cell{border:1px solid #dce6df;background:#fff;border-radius:13px;padding:12px 14px;min-width:0}
#modal .mk19e-wallet-cell .mk19e-label{font-size:12px;color:#547367;line-height:1.3}
#modal .mk19e-wallet-cell strong{display:block;font-size:22px;line-height:1.3;margin-top:4px;font-variant-numeric:tabular-nums;color:#194d37}
#modal .mk19e-wallet-cell small{display:block;font-size:11px;line-height:1.4;color:#667d72;margin-top:3px}
#modal .mk19e-potential{border:1px solid #bed8c8;border-radius:15px;background:#f5faf7;padding:14px 16px}
#modal .mk19e-potential-line{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:7px}
#modal .mk19e-potential-line b{color:#1c6548;font-size:22px;font-variant-numeric:tabular-nums}
#modal .mk19e-potential p{font-size:12px;color:#537163;line-height:1.55;margin:6px 0 0}
#modal .mk19e-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#modal .mk19e-facts .mk19e-fact{border:1px solid #dde9e1;border-radius:11px;padding:9px 10px;font-size:12px;color:#567061}
#modal .mk19e-facts b{display:block;font-size:17px;color:#245a43;font-variant-numeric:tabular-nums;margin-top:4px}
#modal .mk19e-transactions{display:flex;flex-direction:column;border:1px solid #dce9e0;border-radius:13px;overflow:hidden}
#modal .mk19e-transaction{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:11px 13px;font-size:12px;border-bottom:1px solid #e6eee8}
#modal .mk19e-transaction:last-child{border-bottom:0}
#modal .mk19e-transaction .mk19e-transaction-name{font-weight:750;color:#204e3a;line-height:1.35}
#modal .mk19e-transaction small{display:block;font-size:11px;line-height:1.4;color:#6b8176;margin-top:2px}
#modal .mk19e-transaction .mk19e-transaction-value{font-size:14px;font-weight:800;white-space:nowrap;color:#236548;font-variant-numeric:tabular-nums}
#modal .mk19e-info{font-size:12px;color:#61786a;line-height:1.55}
#modal .mk19e-info summary{cursor:pointer;font-weight:750;color:#315c47;outline-offset:3px}
#modal .mk19e-info p{margin:8px 0 0}
#modal .mk19e-shortcuts{display:flex;flex-wrap:wrap;gap:8px}
#modal .mk19e-shortcuts .btn{border-radius:11px;min-height:44px;padding:10px 15px}
#modal .shop-tab.mk19e-wallet-tab{font-weight:800;white-space:nowrap}
#modal button.mk19e-wallet-tab:focus-visible,
#modal .mk19e-shortcuts button:focus-visible{outline:3px solid rgba(23,107,84,.38);outline-offset:2px}
.stats .mk19e-coin-shortcut{cursor:pointer}
.stats .mk19e-coin-shortcut:focus-visible{outline:3px solid rgba(23,107,84,.38);outline-offset:3px}
@media(max-width:680px){
 #modal .mk19e-wallet{gap:13px}
 #modal .mk19e-wallet-head{padding:12px;border-radius:14px}
 #modal .mk19e-wallet-cell{padding:10px 11px}
 #modal .mk19e-wallet-cell strong{font-size:19px}
 #modal .mk19e-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
 #modal .mk19e-potential{padding:12px}
}
@media(max-width:359px){
 #modal .mk19e-wallet-grid{gap:7px}
 #modal .mk19e-wallet-cell strong{font-size:17px}
 #modal .mk19e-facts{gap:6px}
}
</style>
"""
script=r"""
<script id="mk-ui19e-wallet-script">
/* Read-only money dashboard. Never estimate lifetime earned coins from incomplete histories. */
(function(){
 'use strict';
 function mk19eAmount(n){const x=Number(n);return Number.isFinite(x)?Math.max(0,Math.floor(x)):0}
 function mk19eMoney(n){return mk19eAmount(n).toLocaleString('ru-RU')+' 🪙'}
 function mk19eProfileSummary(profile=state){
   const inv=profile?.inventory||{},stats=profile?.shopStats||{},chests=profile?.chestStats||{};
   let realizable=0,eligibleCount=0;
   const seen=new Set();
   for(const [type,ids] of Object.entries(inv)){
     for(const rawId of Array.isArray(ids)?ids:[]){
       const id=String(rawId),key=type+':'+id;if(seen.has(key))continue;seen.add(key);
       const item=catalogItem(type,id);if(!item)continue;
       let amount=0;
       if(type==='avatars'&&typeof mk873IsArchivedAvatar==='function'&&mk873IsArchivedAvatar(id)){
         const e=mk873Eligibility(profile,id);
         if(e.ok)amount=mk19eAmount(e.paidPrice);
       }else if(typeof mk865SellEligibility==='function'){
         const e=mk865SellEligibility(type,id,profile);
         if(e.ok)amount=mk19eAmount(e.refundNow);
       }
       if(amount>0){realizable+=amount;eligibleCount++}
     }
   }
   const balance=mk19eAmount(profile?.coins);
   return {balance,spent:mk19eAmount(stats.spent),purchases:mk19eAmount(stats.purchases),
     sales:mk19eAmount(stats.sales),refunded:mk19eAmount(stats.refundedCoins),
     chestCount:mk19eAmount(chests.totalOpened),chestBonus:mk19eAmount(chests.compensationCoins),
     realizable,eligibleCount,potential:balance+realizable,
     saleHistory:Array.isArray(profile?.saleHistory)?profile.saleHistory.slice(-7).reverse():[]};
 }
 function mk19eSalesHtml(rows){
   if(!rows.length)return '<div class="mk19e-wallet-cell mk19e-info">Пока нет сохранённых записей о продажах.</div>';
   return '<div class="mk19e-transactions">'+rows.map(x=>{
     const name=esc(String(x.itemName||catalogItem(x.type,x.id)?.name||'Предмет'));
     const refund=mk19eMoney(x.refundCoins);
     const date=Number(x.soldAt)>0?new Date(Number(x.soldAt)).toLocaleDateString('ru-RU'):'Дата неизвестна';
     const extra=x.reason==='archivedAvatarFullRefund'?'Полная компенсация за архивный аватар'
       :Math.round(Number(x.refundRate||0)*100)+'% от стоимости покупки';
     return '<div class="mk19e-transaction"><div><div class="mk19e-transaction-name">'+name+'</div><small>'+esc(date+' · '+extra)+'</small></div><span class="mk19e-transaction-value">+'+refund+'</span></div>';
   }).join('')+'</div>';
 }
 function mk19eWallet(){
   normalizeShop();
   const a=mk19eProfileSummary(state);
   const cell=(name,value,explanation)=>'<div class="mk19e-wallet-cell"><span class="mk19e-label">'+name+'</span><strong>'+value+'</strong><small>'+explanation+'</small></div>';
   show('<div class="mtop"><h2>🪙 Кошелёк</h2><button type="button" class="x" onclick="closeModal()" aria-label="Закрыть кошелёк">×</button></div>'+
     shopTabs('wallet')+
     '<div id="mk19eWallet" class="mk19e-wallet">'+
      '<div class="mk19e-wallet-head"><div><span class="mk19e-overline">Доступные монеты</span><div class="mk19e-balance">'+mk19eMoney(a.balance)+'</div><small>Сумма на счёте прямо сейчас</small></div><span class="mk19e-id">'+esc(currentProfile)+'</span></div>'+
      '<section><h3 class="mk19e-section-title">Мои покупки и возвраты</h3><div class="mk19e-wallet-grid">'+
        cell('Потрачено в магазине',mk19eMoney(a.spent),'Учтённые покупки предметов; без сундуков')+
        cell('Возвращено монет',mk19eMoney(a.refunded),'Продажи предметов и архивные компенсации')+
        cell('Покупок предметов',String(a.purchases),'По сохранённой статистике магазина')+
        cell('Продаж и компенсаций',String(a.sales),'По сохранённой статистике профиля')+
      '</div></section>'+
      '<section><div class="mk19e-potential"><div class="mk19e-potential-line"><span>Если продать доступные предметы сейчас</span><b>+'+mk19eMoney(a.realizable)+'</b></div><p>Подтверждённый возврат без учебных миссий за '+a.eligibleCount+' предмет(ов). Учитываются 40% цены покупки; для подходящих архивных аватаров — 100%. Эти монеты ещё не на счёте.</p><div class="mk19e-potential-line" style="margin-top:9px;border-top:1px solid #dce9df;padding-top:10px"><span>Баланс + возможные возвраты</span><b>'+mk19eMoney(a.potential)+'</b></div></div></section>'+
      '<section><h3 class="mk19e-section-title">Сундуки</h3><div class="mk19e-facts"><div class="mk19e-fact">Открыто сундуков<b>'+a.chestCount+'</b></div><div class="mk19e-fact">Компенсации из сундуков<b>'+mk19eMoney(a.chestBonus)+'</b></div><div class="mk19e-fact">Цена одного сейчас<b>200 🪙</b></div></div></section>'+
      '<section><h3 class="mk19e-section-title">Последние продажи</h3>'+mk19eSalesHtml(a.saleHistory)+'</section>'+
      '<details class="mk19e-info"><summary>Как считаются суммы</summary><p>Кошелёк берёт текущий баланс и сохранённые счётчики покупок, продаж и сундуков только выбранного профиля. Расходы в магазине не включают сундуки. Возможные возвраты — это не монеты на счёте. Полная сумма монет, когда-либо заработанных за обучение и достижения, в старых данных отдельно не хранится, поэтому мы не показываем выдуманный «общий заработок». История продаж может быть неполной после переноса старых данных.</p></details>'+
      '<div class="mk19e-shortcuts"><button class="btn soft" type="button" onclick="openShop(\'avatars\')">В магазин</button><button class="btn soft" type="button" onclick="openCollection()">Моя коллекция</button></div>'+
     '</div>');
 }
 const prevTabs=shopTabs;
 shopTabs=function(active){
   const raw=prevTabs(active);
   const btn='<button type="button" class="shop-tab mk19e-wallet-tab '+(active==='wallet'?'active':'')+'" onclick="openShop(\'wallet\')">🪙 Кошелёк</button>';
   return raw.replace(/<\/div>\s*$/,btn+'</div>');
 };
 const prevOpen=openShop;
 openShop=function(category='avatars',rarity=null){
   if(category==='wallet')return mk19eWallet();
   return prevOpen(category,rarity);
 };
 function mk19eBindCoinPill(){
   const coins=document.getElementById('coins'),pill=coins?.closest('.pill');
   if(!pill||pill.dataset.mk19eBound==='1')return;
   pill.dataset.mk19eBound='1';
   pill.classList.add('mk19e-coin-shortcut');
   pill.setAttribute('role','button');pill.setAttribute('tabindex','0');
   pill.setAttribute('aria-label','Открыть кошелёк и посмотреть монеты');
   pill.setAttribute('title','Открыть кошелёк');
   pill.addEventListener('click',()=>mk19eWallet());
   pill.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();mk19eWallet()}});
 }
 mk19eBindCoinPill();
 window.mk19eWallet=mk19eWallet;
 window.mk19eProfileSummary=mk19eProfileSummary;
})();
</script>
"""
html=html.replace("</body>",style+"\n"+script+"\n</body>",1)
hashval=hashlib.sha256(html.encode()).hexdigest()
sw=sw.replace("matkvest-iphone-v63","matkvest-iphone-v64").replace(base,hashval)
assert hashval in sw and "matkvest-iphone-v64" in sw
i.write_text(html,"utf-8");swp.write_text(sw,"utf-8")
report={"stage":"19E","candidate":"v64","base_sha256":base,"sha256":hashval,"sw":"matkvest-iphone-v64",
"scope":["read-only profile wallet with current coins, shop stats, chest stats","sale history and eligible current resale estimation","shop tab and keyboard-accessible top balance shortcut"],
"not_changed":["prices","actual money, XP or inventory balances","purchases, sale or chest handlers","profile data schema","backend","other UX"]}
Path("audits/ui_stage19e_patch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,ensure_ascii=False))
