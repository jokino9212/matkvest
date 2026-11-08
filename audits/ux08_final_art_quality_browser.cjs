'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base='assets/source/badges/prototypes';
const out='audits/ux08_final_art_quality_output';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const items=await page.evaluate(()=>SHOP_CATALOG.badges.map(x=>({id:x.id,rarity:x.rarity,price:x.price,name:x.name,src:x.icon?.match(/src="([^"]+)"/)?.[1]})));
  assert.equal(items.length,50);assert.equal(new Set(items.map(x=>x.id)).size,50);
  const problems=[],stats=[];
  for(const item of items){
    const source=fs.readFileSync(path.join(base,item.id+'.svg'),'utf8');
    const banned=/<script\b|<foreignObject\b|\bonload\s*=|\bonerror\s*=|https?:\/\/|url\(https?:|data:image/i;
    if(banned.test(source))problems.push(item.id+': unsafe markup');
    if(!source.includes('viewBox="0 0 512 512"'))problems.push(item.id+': invalid viewBox');
    if(item.src!==base+'/'+item.id+'.svg')problems.push(item.id+': icon URI mismatch');
    const circleCount=(source.match(/<circle\b/g)||[]).length;
    if(circleCount<2)problems.push(item.id+': missing shared medallion rims');
    const fixture={id:item.id,rarity:item.rarity,price:item.price,circles:circleCount,size:Buffer.byteLength(source)};
    stats.push(fixture);
  }
  const inlineItems=items.map(item=>({...item,dataUrl:'data:image/svg+xml;base64,'+fs.readFileSync(path.join(base,item.id+'.svg')).toString('base64')}));
  const optics=await page.evaluate(async items=>{
    const cvs=document.createElement('canvas');cvs.width=48;cvs.height=48;const cx=cvs.getContext('2d',{willReadFrequently:true});
    const rec=[];
    for(const item of items){
      const img=new Image();img.src=item.dataUrl;await img.decode();
      cx.clearRect(0,0,48,48);cx.drawImage(img,0,0,48,48);
      const pixels=cx.getImageData(0,0,48,48).data;
      let occupied=0,sum=0,sumSq=0;
      for(let i=0;i<pixels.length;i+=4){
        if(pixels[i+3]<24)continue;
        const l=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
        occupied++;sum+=l;sumSq+=l*l;
      }
      const avg=sum/Math.max(occupied,1),contrast=Math.sqrt(Math.max(0,sumSq/Math.max(occupied,1)-avg*avg));
      rec.push({id:item.id,pixelCoverage:Math.round(occupied/2304*1000)/10,contrast:Math.round(contrast*10)/10});
    }
    return rec;
  },inlineItems);
  for(const o of optics){
    if(o.pixelCoverage<28)problems.push(o.id+': too little artwork in 48px thumbnail ('+o.pixelCoverage+'%)');
    if(o.contrast<24)problems.push(o.id+': low 48px luma variance ('+o.contrast+')');
  }
  const report={total:items.length,rareCounts:Object.fromEntries([...new Set(items.map(x=>x.rarity))].map(k=>[k,items.filter(x=>x.rarity===k).length])),problems,items:stats.map(x=>({...x,...optics.find(y=>y.id===x.id)}))};
  fs.writeFileSync(out+'/art_quality_audit.json',JSON.stringify(report,null,2));
  console.log('ART_QUALITY_REPORT',JSON.stringify({total:report.total,rareCounts:report.rareCounts,problems,lowestContrast:optics.slice().sort((a,b)=>a.contrast-b.contrast).slice(0,5)}));
  assert.deepEqual(problems,[],'Art QA violations');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
