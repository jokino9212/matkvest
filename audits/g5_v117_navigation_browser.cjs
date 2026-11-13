'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const crypto=require('node:crypto');

(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-textbook-navigation-v117.js"><\/script>/g)||[]).length,1);
 assert(sw.includes('"./g5-textbook-navigation-v117.js"'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let tests=0;
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:800}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    renderGrade5();
    const nav=document.querySelector('#mk-g5-textbook-nav');
    if(!nav)return {error:'Navigation is absent'};
    const info=window.mkG5TextbookNavigation;
    const rows=[...nav.querySelectorAll('.mk-g5-toc-list li')];
    const all=g5AllTopics();
    const search=nav.querySelector('input');
    const checks=[];
    const failures=[];
    if(info.total!==51)failures.push('51 items are not present: '+info.total);
    if(info.chapters!==7)failures.push('Seven sections absent: '+info.chapters);
    if(info.missing.length)failures.push('Missing mapping: '+info.missing.join(', '));
    if(all.length!==74)failures.push('Expected 74 existing topic cards, found '+all.length);
    if(rows.length!==51)failures.push('Wrong list count '+rows.length);
    if(rows.some((row,i)=>row.value!==i+1))failures.push('Textbook order mismatch');
    for(const [number,term,id] of [
      [14,'Деление с остатком','division_remainder'],
      [15,'Упрощение выражений','simplify_expressions'],
      [26,'Доли и дроби','frac_parts'],
      [31,'Смешанные числа','frac_to_mixed'],
      [43,'Сложение и вычитание десятичных дробей','dec_add']
    ]){
     const row=rows[number-1];
     if(!row?.textContent.includes(term))failures.push('Missing textbook item '+number);
     if(!row?.querySelector('button'))failures.push('Non-clickable '+number);
     if(!all.some(t=>t.id===id))failures.push('Absent generator '+id);
    }
    search.value='деление с остатком';search.dispatchEvent(new Event('input',{bubbles:true}));
    if(rows.filter(r=>!r.hidden).length!==1||!rows[13]||rows[13].hidden)failures.push('Search for item 14 failed');
    search.value='упрощение выражений';search.dispatchEvent(new Event('input',{bubbles:true}));
    if(rows.filter(r=>!r.hidden).length!==1||rows[14].hidden)failures.push('Search for item 15 failed');
    search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
    if(rows.some(r=>r.hidden))failures.push('Clear search does not restore 51 paragraphs');
    // Open the exact topic through the table of contents, including when the old search hides it.
    const original=document.querySelector('#mk-textbook-search-input-5');
    if(original){original.value='несуществующая тема';original.dispatchEvent(new Event('input',{bubbles:true}))}
    rows[13].querySelector('button').click();
    const selected=document.activeElement;
    if(!selected?.classList?.contains('g5-card') || !selected.textContent.includes('Деление с остатком'))failures.push('Item 14 did not focus correct lesson card');
    if(selected?.hidden)failures.push('Item 14 remains hidden');
    if(original?.value)failures.push('Catalog filter was not cleared');
    const hasOverflow=document.documentElement.scrollWidth>innerWidth+2;
    if(hasOverflow)failures.push('Horizontal overflow '+document.documentElement.scrollWidth+'/'+innerWidth);
    return {failures,topics:all.length,sections:info.chapters,paragraphs:info.total,overflow:hasOverflow};
   });
   assert(!report.error,JSON.stringify(report));
   assert.deepEqual(report.failures,[],JSON.stringify({width,report}));
   assert.deepEqual(errors,[],JSON.stringify({width,errors}));
   tests++;
   await page.close();
  }
  console.log('G5_V117_TWO_VOLUME_NAVIGATION_PASS',JSON.stringify({viewports:tests,paragraphs:51,chapters:7,existingTopics:74}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V117_NAVIGATION_FAIL',e.stack||e);process.exit(1)});
