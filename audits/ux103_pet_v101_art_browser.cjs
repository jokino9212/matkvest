'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out='audits/ux103_pet_art_output';fs.mkdirSync(out,{recursive:true});
const pets=[
 {id:'pet_phoenix',name:'Феникс',rarity:'Эпический · 820 монет'},
 {id:'pet_orb',name:'Сфера знаний',rarity:'Легендарный · 1050 монет'},
 {id:'pet_ghost',name:'Призрак формул',rarity:'Легендарный · 1500 монет'}
];
(async()=>{
 const hashes=[];
 for(const item of pets){
  const text=fs.readFileSync('assets/source/pets/'+item.id+'.svg','utf8');
  const hash=crypto.createHash('sha256').update(text).digest('hex');
  hashes.push(hash);
  assert(text.includes('viewBox="0 0 512 512"'));
  assert(/aria-label="[^"]+"/.test(text),'Missing source description');
  assert(!/<script\b|<foreignObject\b|\bonload\s*=|\bonerror\s*=|\bxlink:href\s*=|<image\b|<rect[^>]+width="512"/i.test(text),
   'Unsafe SVG or full-page puddle '+item.id);
  assert(!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(text),'External resource '+item.id);
 }
 assert.equal(new Set(hashes).size,3,'Three pets reused the same artwork');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:900},deviceScaleFactor:1});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  // Raster inspection must use same-origin data URLs: file:// SVG taints canvas in Chromium.
  const samples=pets.map(p=>({...p,dataUrl:'data:image/svg+xml;base64,'+fs.readFileSync('assets/source/pets/'+p.id+'.svg').toString('base64')}));
  const measurements=await page.evaluate(async pets=>{
   const sizes=[48,128,384],result=[];
   for(const item of pets){
    const img=new Image();img.src=item.dataUrl;
    await img.decode();
    if(img.naturalWidth!==512||img.naturalHeight!==512)throw Error('Wrong natural dimensions '+item.id);
    for(const size of sizes){
      const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0,size,size);
      const data=ctx.getImageData(0,0,size,size).data;
      let count=0,minX=size,maxX=-1,minY=size,maxY=-1;
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
       const ix=(y*size+x)*4;
       if(data[ix+3]>28){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
        minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
      }
      const w=maxX<0?0:(maxX-minX+1)/size,h=maxY<0?0:(maxY-minY+1)/size;
      const coverage=count/(size*size);
      const corners=[0,(size-1)*4,(size-1)*size*4,(size*size-1)*4]
        .map(ix=>data[ix+3]);
      result.push({id:item.id,size,coverage:Number(coverage.toFixed(3)),bounds:{
       width:Number(w.toFixed(3)),height:Number(h.toFixed(3)),
       minX:Number((minX/size).toFixed(3)),minY:Number((minY/size).toFixed(3))},
       corners,naturalWidth:img.naturalWidth});
    }
   }
   return result;
  },samples);
  for(const m of measurements){
    assert(m.coverage>=.13 && m.coverage<=.82,'Art poorly visible or opaque tile '+JSON.stringify(m));
    assert(m.bounds.width>=.63&&m.bounds.height>=.65,'Pet too small on canvas '+JSON.stringify(m));
    assert(m.corners.every(x=>x<18),'Opaque square/puddle detected '+JSON.stringify(m));
  }
  await page.evaluate(pets=>{
   const root=document.createElement('main');
   root.style.cssText='padding:30px;background:#101827;color:#f6f8ff;min-height:100vh;font-family:Arial,system-ui';
   root.innerHTML='<h1 style="margin:0 0 9px;font-size:30px">МатКвест · UX-103 · новые питомцы</h1>'
    +'<p style="margin:0 0 24px;color:#bcd2e4">Три независимых оригинальных SVG · прозрачный фон · 48 / 128 / 384 px</p>';
   for(const size of [48,128,384]){
    const title=document.createElement('h2');title.textContent='Размер '+size+' px';
    title.style.cssText='font-size:20px;margin:24px 0 12px';root.append(title);
    const row=document.createElement('section');
    row.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px';
    for(const pet of pets){
      const card=document.createElement('article');
      card.style.cssText='border:1px solid #536e92;border-radius:15px;overflow:hidden;background:#24344f;text-align:center';
      const stage=document.createElement('div');
      stage.style.cssText='display:grid;grid-template-columns:1fr 1fr;min-height:'+(Math.max(90,size+20))+'px;background:linear-gradient(90deg,#eaf2fc 50%,#192945 50%)';
      for(let i=0;i<2;i++){
       const container=document.createElement('div');container.style.cssText='display:grid;place-items:center;min-width:0';
       const image=document.createElement('img');image.src='assets/source/pets/'+pet.id+'.svg';
       image.width=size;image.height=size;image.style.cssText='display:block;width:'+size+'px;height:'+size+'px;max-width:100%;object-fit:contain';
       container.append(image);stage.append(container);
      }
      const label=document.createElement('div');label.style.cssText='padding:10px';
      const name=document.createElement('div');name.textContent=pet.name;name.style.cssText='font-weight:bold;font-size:14px';
      const rarity=document.createElement('div');rarity.textContent=pet.rarity;rarity.style.cssText='margin-top:4px;font-size:12px;color:#bdd5ed';
      label.append(name,rarity);card.append(stage,label);row.append(card);
    }
    root.append(row);
   }
   document.body.replaceChildren(root);
  },pets);
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode())));
  await page.screenshot({path:out+'/three_pets_48_128_384_light_dark.png',fullPage:true,animations:'disabled',timeout:25000});
  const report={pets,hashes,measurements};
  fs.writeFileSync(out+'/art_qa.json',JSON.stringify(report,null,2));
  console.log('UX103_ART_PASS',JSON.stringify({uniqueHashes:hashes.length,measurements}));
 }finally{await browser.close()}
})().catch(e=>{console.error('UX103_ART_FAIL',e.stack||e);process.exitCode=1});
