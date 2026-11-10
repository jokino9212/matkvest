'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let catalog={};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  catalog=await page.evaluate(()=>{
   const grades={};const found=[];
   for(let g=1;g<=8;g++){
    const getter=window['g'+g+'AllTopics'];
    if(typeof getter==='function'){
     const arr=getter();
     grades[g]={source:getter.name,rawCount:arr.length,topics:arr.map((t,i)=>({
       id:typeof t.id==='string'?t.id:null,
       title:String(t.title||t.name||'').slice(0,180),
       implemented:t.implemented!==false,
       rowIndex:i
     }))};
    }else{
     openGrade(g);
     const rows=[...document.querySelectorAll('#mainView .topic')].map((t,i)=>{
       const on=t.getAttribute('onclick')||t.querySelector('[onclick]')?.getAttribute('onclick')||'';
       const ids=[...on.matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);
       return {id:ids.find(x=>/^[a-z0-9_]+(:[a-z0-9_]+)?$/i.test(x))||null,
        title:(t.querySelector('h3,h4,.topic-title')?.textContent||t.textContent||'').trim().replace(/\s+/g,' ').slice(0,180),
        implemented:!t.classList.contains('soon')&&!t.classList.contains('disabled'),
        rowIndex:i,handler:on.slice(0,200)};
     });
     grades[g]={source:'grade DOM',rawCount:rows.length,topics:rows};
    }
   }
   return {grades,appVersion:'8.77'};
  });
  for(const [grade,group] of Object.entries(catalog.grades)){
   const ids=group.topics.filter(x=>x.id).map(x=>x.id);
   const missing=group.topics.filter(x=>!x.id);
   const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
   console.log('STAGE29_GRADE',JSON.stringify({grade,source:group.source,raw:group.rawCount,identified:ids.length,
    unique:new Set(ids).size,missing:missing.length,duplicates:duplicates.slice(0,12),
    first:group.topics.slice(0,4).map(x=>({id:x.id,title:x.title,implemented:x.implemented}))}));
   if(duplicates.length)throw Error('Duplicate IDs in grade '+grade+': '+duplicates.join(','));
   if(Number(grade)>=5 && ids.length<20)throw Error('Insufficient grade '+grade+' identifiers');
  }
 }finally{await browser.close()}
 const out=path.resolve('audits/stage29_frontend_topic_inventory.json');
 fs.writeFileSync(out,JSON.stringify({
   schema:'matkvest-stage29-topic-inventory-v1',generatedFrom:'index.html',
   purpose:'review stable practical topic identifiers before publishing server Free 25% policy',
   rule:'do not auto-enable inferred topic policy without human and source audit',
   grades:catalog.grades
 },null,2)+'\n');
 console.log('STAGE29_CATALOG_OK',out,fs.statSync(out).size);
}
main().catch(e=>{console.error(e);process.exitCode=1});
