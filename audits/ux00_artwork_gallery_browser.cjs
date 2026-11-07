'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('audits/ux00_artwork_output');fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const findings={};try{
 const page=await browser.newPage({viewport:{width:1250,height:850},deviceScaleFactor:1});
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 for(const category of ['avatars','pets','badges','stickers']){
  findings[category]=await page.evaluate(async category=>{
   const items=SHOP_CATALOG[category].filter(p=>p.id!=='pet_none');
   document.body.replaceChildren();const root=document.createElement('main');
   root.style.cssText='background:#101827;color:#fff;padding:25px;min-height:100vh;font-family:system-ui';
   const title=document.createElement('h1');title.textContent=category+' · '+items.length;root.append(title);
   const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(6,1fr);gap:12px';root.append(grid);
   const records=[];
   for(const item of items){
    const card=document.createElement('div');card.style.cssText='background:#1e293b;border:1px solid #475569;border-radius:12px;padding:9px;min-width:0';
    const media=document.createElement('div');media.style.cssText='height:160px;background:#e2e8f0;border-radius:9px;display:grid;place-items:center;overflow:hidden;color:#172033;font-size:70px;line-height:1';
    const raw=String(item.icon||item.image||item.src||'');
    if(/^\s*</.test(raw))media.innerHTML=raw;
    else if(/^data:image\//.test(raw)){const img=document.createElement('img');img.src=raw;media.append(img)}
    else media.textContent=raw;
    const id=document.createElement('div');id.textContent=item.id;id.style.cssText='font-weight:700;font-size:12px;overflow-wrap:anywhere';
    const name=document.createElement('div');name.textContent=item.name||'';name.style.cssText='font-size:11px;overflow-wrap:anywhere';
    const rarity=document.createElement('div');rarity.textContent=item.rarity+' · '+item.price;rarity.style.cssText='font-size:11px;color:#cbd5e1';
    card.append(media,id,name,rarity);grid.append(card);
    records.push({item,media});
   }
   const style=document.createElement('style');style.textContent='main img,main svg{max-width:92%!important;max-height:92%!important;width:auto!important;height:auto!important;object-fit:contain!important}';document.head.append(style);
   document.body.append(root);
   await Promise.all([...root.querySelectorAll('img')].map(i=>i.decode().catch(()=>null)));
   return records.map(({item,media})=>{
    const images=[...media.querySelectorAll('img')].map(img=>({ok:img.complete&&img.naturalWidth>0,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,displayWidth:img.getBoundingClientRect().width}));
    const svg=[...media.querySelectorAll('svg')].map(x=>({viewBox:x.getAttribute('viewBox'),width:x.getBoundingClientRect().width}));
    return {id:item.id,name:item.name,rarity:item.rarity,price:item.price,images,svg,onlyText:images.length===0&&svg.length===0};
   });
  },category);
  await page.screenshot({path:path.join(out,category+'_gallery.png'),fullPage:true,animations:'disabled'});
  console.log('ART_GALLERY',category,findings[category].length,'textOnly',findings[category].filter(x=>x.onlyText).length,'brokenImg',findings[category].flatMap(x=>x.images).filter(i=>!i.ok).length);
 }
 fs.writeFileSync(path.join(out,'gallery_metrics.json'),JSON.stringify(findings,null,2));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
