'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-textbook-navigation-v119.js"><\/script>/g)||[]).length,1);
 assert(!html.includes('<script src="g5-textbook-navigation-v118.js"></script>'));
 assert(sw.includes('"./g5-textbook-navigation-v119.js"'));
 assert(!sw.includes('"./g5-textbook-navigation-v118.js"'));
 assert(sw.includes('matkvest-iphone-v119'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const widths=[320,390,768,1280],results=[];
 try{
  for(const width of widths){
   const page=await browser.newPage({viewport:{width,height:800}});
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message)));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const result=await page.evaluate(()=>{
    renderGrade5();
    const nav=mainView.querySelector('#mk-g5-textbook-nav');
    const failures=[];
    const check=(condition,reason)=>{if(!condition)failures.push(reason)};
    if(!nav)return {failures:['Textbook menu missing']};
    const input=nav.querySelector('input.mk-g5-toc-search');
    const toggle=nav.querySelector('.mk-g5-toc-toggle');
    const body=nav.querySelector('#mk-g5-toc-parts');
    const original=mainView.querySelector('#mk-textbook-search-input-5');
    const rows=[...nav.querySelectorAll('.mk-g5-toc-list li')];
    const visibleFields=()=>[...mainView.querySelectorAll('input')].filter(x=>x.getClientRects().length>0);
    const cardCount=()=>[...mainView.querySelectorAll('.g5-card')].filter(x=>x.getClientRects().length>0).length;
    check(window.mkG5TextbookNavigation?.version===119,'Wrong menu version');
    check(rows.length===51,'Textbook paragraph count changed');
    check(g5AllTopics().length===74,'Legacy topic catalog count changed');
    check(!!original,'Legacy search engine missing');
    check(original?.closest('.mk-textbook-search')?.getClientRects().length===0,'Old textbook search still visible');
    check(visibleFields().length===1,'More than one visible Grade 5 search: '+visibleFields().map(x=>x.placeholder).join('|'));
    check(input?.placeholder==='Найти тему','Search label changed');
    check(toggle?.textContent==='К карточкам','Missing card switch');
    check(toggle?.getAttribute('aria-expanded')==='true','Expanded state incorrect');
    check(!body.hidden,'Textbook parts collapsed by default');
    check(nav.querySelectorAll('details').length===7,'Missing textbook sections');
    check(cardCount()===74,'Visual topics unexpectedly hidden by default');
    // One search drives both the chapter navigation and the classic visual cards.
    input.value='деление с остатком';input.dispatchEvent(new Event('input',{bubbles:true}));
    check(original.value===input.value,'Search not synchronized with textbook catalog');
    check(rows.filter(li=>!li.hidden).length===1&&!rows[13].hidden,'Textbook filtering failed');
    check(cardCount()>=1&&cardCount()<74,'Visual catalog not filtered by single search');
    input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
    check(original.value===''&&rows.every(li=>!li.hidden),'Search clear did not reset both catalogs');
    check(cardCount()===74,'Search clearing did not restore visual cards');
    // A single click hides all sections but preserves the search and controls.
    toggle.click();
    check(body.hidden,'Collapse did not hide textbook sections');
    check(toggle.textContent==='Показать разделы','Missing restore action');
    check(toggle.getAttribute('aria-expanded')==='false','Collapsed aria state incorrect');
    check(nav.classList.contains('mk-g5-toc-collapsed'),'Collapsed style not applied');
    check(visibleFields().length===1,'Collapse hid or duplicated search');
    check(cardCount()===74,'Collapse hid traditional visual cards');
    check(nav.getBoundingClientRect().height<230,'Collapsed menu remains too tall');
    // Search in compact mode still filters visual cards.
    input.value='упрощение выражений';input.dispatchEvent(new Event('input',{bubbles:true}));
    check(original.value===input.value,'Collapsed search stopped synchronizing');
    check(cardCount()>=1&&cardCount()<74,'Collapsed search does not filter cards');
    input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
    toggle.click();
    check(!body.hidden&&toggle.textContent==='К карточкам','Cannot reopen textbook sections');
    check(rows.length===51&&cardCount()===74,'Reopening changed catalog');
    check(toggle.getAttribute('aria-expanded')==='true','Expanded aria state not restored');
    // Navigation stays functional even when an old search has hidden the catalog.
    input.value='деление с остатком';input.dispatchEvent(new Event('input',{bubbles:true}));
    rows[13].querySelector('button').click();
    check(document.activeElement?.classList.contains('g5-card'),'Textbook link does not focus a topic card');
    check(document.activeElement?.textContent.includes('Деление с остатком'),'Textbook link opened wrong card');
    check(original.value==='','Topic navigation failed to reset legacy filter');
    check(document.documentElement.scrollWidth<=window.innerWidth+2,'Horizontal scrolling at '+window.innerWidth);
    return {failures,paragraphs:rows.length,topics:g5AllTopics().length,searchCount:visibleFields().length};
   });
   assert.deepEqual(result.failures,[],JSON.stringify({width,result}));
   assert.deepEqual(pageErrors,[],JSON.stringify({width,pageErrors}));
   results.push({width,paragraphs:result.paragraphs,topics:result.topics,searchCount:result.searchCount});
   await page.close();
  }
  console.log('G5_V119_ONE_SEARCH_COLLAPSE_PASS',JSON.stringify(results));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_V119_ONE_SEARCH_COLLAPSE_FAIL',e.stack||e);process.exit(1)});
