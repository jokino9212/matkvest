'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1350,height:820}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const names=['bd_star','bd_diamond','bd_pi','bd_root','bd_sigma','bd_fraction','bd_infinity'];
  await page.evaluate(names=>{
   const base='assets/source/badges/prototypes/';
   const root=document.createElement('main');root.style.cssText='background:#101827;color:#f9fafb;padding:28px;font-family:system-ui;min-height:100vh';
   root.innerHTML='<h1>МатКвест · SVG prototypes · UX-00</h1><p>Preliminary vector artwork; NOT installed in shop.</p>';
   for(const size of [48,160]){
    const row=document.createElement('section');row.style.cssText='display:flex;gap:18px;align-items:start;padding:16px;border-bottom:1px solid #475569';
    for(const name of names){
     const col=document.createElement('div');col.style.cssText='background:#26344c;border-radius:16px;padding:12px;min-width:170px;text-align:center';
     const img=document.createElement('img');img.src=base+name+'.svg';img.width=size;img.height=size;img.style.cssText='display:block;object-fit:contain;margin:0 auto';
     const label=document.createElement('div');label.textContent=name+' / '+size+'px';
     col.append(img,label);row.append(col);
    }root.append(row);
   }
   document.body.replaceChildren(root);
  },names);
  const images=await page.evaluate(async()=>{
   await Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode().catch(()=>null)));
   return [...document.querySelectorAll('main img')].map(img=>({src:img.src,ok:img.complete&&img.naturalWidth>0,size:img.width}));
  });
  assert.equal(images.length,14);assert(images.every(x=>x.ok),JSON.stringify(images));
  fs.mkdirSync('audits/ux00_prototype_output',{recursive:true});
  await page.screenshot({path:'audits/ux00_prototype_output/badge_prototypes_7.png',fullPage:true,animations:'disabled'});
  fs.writeFileSync('audits/ux00_prototype_output/results.json',JSON.stringify(images,null,2));
  console.log('SVG_PROTO_PASS',JSON.stringify(images));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
