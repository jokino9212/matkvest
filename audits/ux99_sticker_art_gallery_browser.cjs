'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const out='audits/ux99_sticker_art_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const items=await page.evaluate(()=>SHOP_CATALOG.stickers.map(x=>({id:x.id,name:x.name,rarity:x.rarity,price:x.price,rewardOnly:!!x.rewardOnly,src:x.icon?.match(/src="([^"]+)"/)?.[1]})));
  assert.equal(items.length,31);assert.equal(new Set(items.map(x=>x.id)).size,31);
  const report=[],errors=[];
  for(const item of items){
   assert.equal(item.src,'assets/source/stickers/'+item.id+'.svg','Catalog icon link incorrect '+item.id);
   const svg=fs.readFileSync(path.resolve(item.src),'utf8');
   if(!svg.includes('viewBox="0 0 256 256"'))errors.push(item.id+': non-square or invalid viewBox');
   if(/<script\b|<foreignObject\b|\sonload\s*=|\sonerror\s*=/i.test(svg))errors.push(item.id+': executable markup');
   if(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(svg))errors.push(item.id+': external URL');
   if(!svg.includes('aria-label='))errors.push(item.id+': no accessible description');
   if(!svg.includes('linearGradient'))errors.push(item.id+': missing collectible enamel treatment');
   const hash=crypto.createHash('sha256').update(svg).digest('hex');
   report.push({...item,bytes:Buffer.byteLength(svg),hash});
  }
  assert.equal(new Set(report.map(x=>x.hash)).size,31,'Duplicate SVG source');
  const render=await page.evaluate(async items=>{
   const results=[];
   for(const item of items){
    const img=new Image();img.src=item.src;
    try{await img.decode();results.push({id:item.id,loaded:img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight})}
    catch(e){results.push({id:item.id,loaded:false,error:String(e)})}
   }
   return results;
  },items);
  errors.push(...render.filter(x=>!x.loaded).map(x=>x.id+': failed image load'));
  const ext=items.map(x=>({...x,src:'data:image/svg+xml;base64,'+fs.readFileSync(path.resolve(x.src)).toString('base64')}));
  const optical=await page.evaluate(async items=>{
   const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
   const c=canvas.getContext('2d',{willReadFrequently:true});
   const measurements=[];
   for(const item of items){
    const img=new Image();img.src=item.src;await img.decode();
    c.clearRect(0,0,32,32);c.drawImage(img,0,0,32,32);
    const data=c.getImageData(0,0,32,32).data;
    let sum=0,sum2=0,occupied=0;
    for(let i=0;i<data.length;i+=4){if(data[i+3]<24)continue;
     const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
     occupied++;sum+=l;sum2+=l*l;
    }
    const mean=sum/Math.max(occupied,1);
    measurements.push({id:item.id,coverage:Math.round(100*occupied/1024),contrast:Math.round(Math.sqrt(Math.max(0,sum2/Math.max(occupied,1)-mean*mean))*10)/10});
   }
   return measurements;
  },ext);
  for(const item of optical){
   if(item.coverage<30)errors.push(item.id+': too little visible at 32px ('+item.coverage+'%)');
   if(item.contrast<25)errors.push(item.id+': low contrast at 32px ('+item.contrast+')');
  }
  await page.evaluate(items=>{
   const root=document.createElement('main');
   root.style.cssText='background:#0e1730;color:#f2f7ff;padding:28px;font-family:Arial,system-ui;min-height:100vh';
   root.innerHTML='<h1 style="margin:0 0 10px">МатКвест · все 31 стикер</h1><p style="color:#c5d9ee;margin:0 0 20px">Художественная приёмка SVG · 32px и 128px · реальные изображения каталога v98</p>';
   for(const size of [32,128]){
    const h=document.createElement('h2');h.style.cssText='font-size:21px;margin:20px 0 12px';h.textContent='Размер '+size+' пикселей';root.append(h);
    const g=document.createElement('section');g.style.cssText='display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px;margin-bottom:24px';
    for(const item of items){
     const card=document.createElement('article');card.style.cssText='background:#253957;border-radius:12px;border:1px solid #56708c;text-align:center;padding:11px 5px;min-width:0';
     const img=document.createElement('img');img.src=item.src;img.width=size;img.height=size;img.style.cssText='display:block;max-width:100%;object-fit:contain;margin:0 auto 6px';
     const name=document.createElement('div');name.textContent=item.name;name.style.cssText='font-size:12px;font-weight:bold;min-height:29px';
     const rarity=document.createElement('div');rarity.textContent=item.rarity+' · '+(item.rewardOnly?'награда':item.price+' 🪙');rarity.style.cssText='color:#bfd4ef;font-size:10px';
     card.append(img,name,rarity);g.append(card);
    }root.append(g);
   }
   document.body.replaceChildren(root);
  },items);
  await page.locator('main img').first().waitFor();
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode())));
  await page.screenshot({path:out+'/all_31_stickers_32_and_128.png',fullPage:true,animations:'disabled'});
  const data={count:31,rarities:Object.fromEntries([...new Set(report.map(x=>x.rarity))].map(r=>[r,report.filter(x=>x.rarity===r).length])),errors,details:report.map(x=>({...x,...optical.find(y=>y.id===x.id)}))};
  fs.writeFileSync(out+'/art_audit.json',JSON.stringify(data,null,2));
  console.log('UX99_ART_REPORT',JSON.stringify({count:data.count,rarities:data.rarities,errors,leastContrast:optical.slice().sort((a,b)=>a.contrast-b.contrast).slice(0,5)}));
  assert.deepEqual(errors,[],'SVG art QA issues');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});