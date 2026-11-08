'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1536,height:900}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const meta=await page.evaluate(()=>{
    return SHOP_CATALOG.badges.map(x=>({id:x.id,name:x.name,rarity:x.rarity,price:x.price,src:x.icon?.match(/src="([^"]+)"/)?.[1]}));
  });
  assert.equal(meta.length,50);assert.equal(new Set(meta.map(x=>x.id)).size,50);
  await page.evaluate(meta=>{
    const root=document.createElement('main');
    root.style.cssText='background:#0e1730;color:#f2f7ff;padding:32px;font-family:Arial,system-ui;min-height:100vh';
    root.innerHTML='<h1 style="margin:0 0 9px">МатКвест · 50 значков</h1><p style="margin:0 0 22px;color:#c4d4ec">Единая художественная приёмка · векторные исходники 512×512 · реальные предметы каталога v89</p>';
    for(const size of [48,160]){
      const title=document.createElement('h2');title.textContent=size+' px — '+(size===48?'реальный размер миниатюры':'детали значка');root.append(title);
      const grid=document.createElement('section');grid.style.cssText='display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:12px;padding:12px 0 32px';
      for(const item of meta){
        const col=document.createElement('article');col.style.cssText='background:#253754;border:1px solid #52657f;border-radius:14px;padding:12px 5px;text-align:center;min-height:185px';
        const img=document.createElement('img');img.src=item.src;img.width=size;img.height=size;img.style.cssText='display:block;object-fit:contain;margin:0 auto 9px;max-width:100%';
        const name=document.createElement('div');name.textContent=item.name;name.style.cssText='font-size:13px;font-weight:bold;min-height:32px';
        const info=document.createElement('div');info.textContent=item.rarity+' · '+(item.price||'награда');info.style.cssText='font-size:11px;color:#b7cdeb';
        col.append(img,name,info);grid.append(col);
      }root.append(grid);
    }
    document.body.replaceChildren(root);
  },meta);
  const images=await page.evaluate(async()=>{
    const list=[...document.querySelectorAll('main img')];
    await Promise.all(list.map(x=>x.decode().catch(()=>null)));
    return list.map(x=>({src:x.getAttribute('src'),ok:x.complete&&x.naturalWidth>0,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}));
  });
  assert.equal(images.length,100);assert(images.every(x=>x.ok),JSON.stringify(images.filter(x=>!x.ok)));
  const base='audits/ux08_50_gallery_output';
  fs.mkdirSync(base,{recursive:true});
  await page.screenshot({path:base+'/all_50_badges_48_and_160.png',fullPage:true,animations:'disabled'});
  fs.writeFileSync(base+'/all_50_meta.json',JSON.stringify({items:meta,images},null,2));
  console.log('ALL_50_GALLERY_PASS',images.length,'svg loaded');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
