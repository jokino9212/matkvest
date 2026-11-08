'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const out='audits/ux102_pet_inventory_output';fs.mkdirSync(out,{recursive:true});
const expected=['pet_bot','pet_owl','pet_penguin','pet_dino','pet_cat','pet_dragon','pet_fox','pet_turtle',
 'pet_tiger','pet_robotx','pet_astronaut','pet_wisecat','pet_royal_dragon','pet_streak_owl',
 'pet_fraction_dragon','pet_golden_pig','pet_golden_turtle','pet_phoenix','pet_orb','pet_ghost'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={timestamp:'2026-11-08',source:'SHOP_CATALOG.pets in staging v100',records:[],errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const source=await page.evaluate(()=>{
   return SHOP_CATALOG.pets.map(x=>({
    id:x.id,name:x.name,rarity:x.rarity,price:x.price,level:x.level,
    rewardOnly:!!x.rewardOnly,achievement:x.achievement||null,
    raw:String(x.icon||x.image||x.src||'')
   }));
  });
  assert.equal(source.length,21,'Unexpected pet catalog size');
  assert.equal(new Set(source.map(x=>x.id)).size,21,'Duplicate pet IDs');
  assert.equal(source.filter(x=>x.id!=='pet_none').length,20);
  assert.deepEqual(new Set(source.filter(x=>x.id!=='pet_none').map(x=>x.id)),new Set(expected));
  assert(source.find(x=>x.id==='pet_none')?.raw.length===0,'Empty pet should have no artwork');
  const invalid=[];
  for(const item of source){
   if(item.id==='pet_none')continue;
   const raw=item.raw.trim();
   const kind=/^<img\b/i.test(raw)?'img-tag':
     /data:image\/webp/i.test(raw)?'webp':
     /data:image\/png/i.test(raw)?'png':
     /^<svg/i.test(raw)?'svg':
     (/^<[^>]+/.test(raw)?'html':'symbol');
   if(kind==='symbol')invalid.push(item.id);
   report.records.push({id:item.id,name:item.name,rarity:item.rarity,price:item.price,
     level:item.level,rewardOnly:item.rewardOnly,achievement:item.achievement,kind,
     artworkSha:crypto.createHash('sha256').update(raw).digest('hex').slice(0,16),
     rawLength:raw.length});
  }
  const symbols=report.records.filter(x=>x.kind==='symbol');
  assert.deepEqual(new Set(symbols.map(x=>x.id)),new Set(['pet_phoenix','pet_orb','pet_ghost']),
   'Previously emoji-like pets changed unexpectedly; review actual source');
  await page.evaluate(items=>{
   const main=document.createElement('main');
   main.style.cssText='font-family:Arial,system-ui;background:#101827;color:#f1f5ff;padding:22px;min-height:100vh';
   main.innerHTML='<h1 style="font-size:24px">МатКвест · питомцы v100 · проверка всех 20</h1><p>Сопоставление 64 и 256 px на светлом и тёмном фоне. Пустой pet_none исключён.</p>';
   for(const size of [64,256]){
    const h=document.createElement('h2');h.textContent='Размер '+size+' px';h.style.cssText='font-size:20px;margin:22px 0 12px';main.append(h);
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px';main.append(grid);
    for(const item of items){
     if(item.id==='pet_none')continue;
     const card=document.createElement('article');card.style.cssText='padding:10px 5px;border-radius:12px;border:1px solid #5D7698;background:#1e293b;min-width:0';
     const image=document.createElement('div');image.className='ux102-pet-preview';
     image.style.cssText='background:linear-gradient(120deg,#E8F0F9 0 50%,#15243E 50% 100%);display:grid;place-items:center;overflow:hidden;color:#111827;margin:0 auto 7px;width:100%;height:'+(size+16)+'px;max-width:100%';
     const holder=document.createElement('div');holder.style.cssText='height:'+size+'px;width:'+size+'px;display:grid;place-items:center;font-size:'+Math.floor(size*.7)+'px;line-height:1';
     if(/^\s*</.test(item.raw))holder.innerHTML=item.raw;
     else if(/^data:image\//.test(item.raw)){const im=document.createElement('img');im.src=item.raw;holder.append(im)}
     else holder.textContent=item.raw;
     image.append(holder);
     const title=document.createElement('div');title.textContent=item.name;title.style.cssText='font-weight:bold;font-size:12px;min-height:32px';
     const sub=document.createElement('div');sub.textContent=item.id+' · '+item.rarity+' · '+(item.rewardOnly?'награда':item.price+' монет');sub.style.cssText='font-size:10px;color:#BAD1E8;word-break:break-word';
     card.append(image,title,sub);grid.append(card);
    }
   }
   const style=document.createElement('style');style.textContent='.ux102-pet-preview img,.ux102-pet-preview svg{display:block!important;max-width:96%!important;max-height:96%!important;width:auto!important;height:auto!important;object-fit:contain!important}';document.head.append(style);
   document.body.replaceChildren(main);
  },source);
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('.ux102-pet-preview img')].map(x=>x.decode().catch(()=>null))));
  const media=await page.evaluate(()=>{
   return [...document.querySelectorAll('.ux102-pet-preview')].slice(0,20).map((el,i)=>{
     const image=el.querySelector('img');
     const holder=el.firstElementChild;
     const r=holder.getBoundingClientRect();
     const out={index:i,width:r.width,height:r.height,img:!!image,
       naturalWidth:image?.naturalWidth||0,naturalHeight:image?.naturalHeight||0,
       decoded:image?image.complete&&image.naturalWidth>0:true};
     if(image?.naturalWidth&&image.naturalHeight){
      const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
      if(c.width*c.height<=2000000){
       const ctx=c.getContext('2d',{willReadFrequently:true});
       try{
        ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
        let minX=c.width,maxX=-1,minY=c.height,maxY=-1;
        for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(data[(y*c.width+x)*4+3]>24){
         minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        }
        out.alphaW=maxX<0?0:Number(((maxX-minX+1)/c.width).toFixed(3));
        out.alphaH=maxY<0?0:Number(((maxY-minY+1)/c.height).toFixed(3));
       }catch(e){out.alphaError=String(e)}
      }
     }
     return out;
   });
  });
  report.records.forEach((item,i)=>Object.assign(item,media[i]));
  report.errors.push(...media.filter(x=>!x.decoded).map(x=>'broken:'+report.records[x.index].id));
  report.errors.push(...jsErrors);
  await page.screenshot({path:out+'/all_20_pets_64_and_256.png',fullPage:true,animations:'disabled',timeout:25000});
  fs.writeFileSync(out+'/pet_inventory_v100.json',JSON.stringify(report,null,2));
  console.log('UX102_PET_INVENTORY',JSON.stringify({count:report.records.length,types:Object.fromEntries([...new Set(report.records.map(x=>x.kind))].map(k=>[k,report.records.filter(x=>x.kind===k).length])),missingIllustrations:symbols.map(x=>x.id),broken:report.errors,
     smallerThan128:report.records.filter(x=>x.img&&x.naturalWidth<128).map(x=>x.id),
     sample:report.records.map(x=>({id:x.id,name:x.name,price:x.price,rarity:x.rarity,kind:x.kind,alphaW:x.alphaW,alphaH:x.alphaH}))}));
  assert.deepEqual(report.errors,[]);
  await page.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('UX102_PETS_FAIL',e.stack||e);process.exitCode=1});
