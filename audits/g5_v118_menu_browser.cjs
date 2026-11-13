'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

(async()=>{
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.equal((html.match(/<script src="g5-textbook-navigation-v118.js"><\/script>/g)||[]).length,1);
 assert(!html.includes('<script src="g5-textbook-navigation-v117.js"></script>'));
 assert(sw.includes('"./g5-textbook-navigation-v118.js"'));
 assert(!sw.includes('"./g5-textbook-navigation-v117.js"'));
 assert(sw.includes('matkvest-iphone-v118'));
 assert(sw.includes(crypto.createHash('sha256').update(html).digest('hex')));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const widths=[320,390,768,1280], reports=[];
 try{
  for(const width of widths){
   const page=await browser.newPage({viewport:{width,height:850}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    renderGrade5();
    const nav=mainView.querySelector('#mk-g5-textbook-nav'),issues=[];
    if(!nav)return {issues:['Missing Grade 5 menu']};
    const data=window.mkG5TextbookNavigation;
    const rows=[...nav.querySelectorAll('.mk-g5-toc-list li')];
    const chapters=[...nav.querySelectorAll('details.mk-g5-toc-chapter')];
    const parts=[...nav.querySelectorAll('.mk-g5-toc-part')];
    const search=nav.querySelector('.mk-g5-toc-search'),status=nav.querySelector('.mk-g5-toc-status');
    function check(ok,why){if(!ok)issues.push(why)}
    check(data.version===118,'Wrong UI release');
    check(data.total===51&&rows.length===51,'Missing textbook paragraphs');
    check(data.chapters===7&&chapters.length===7,'Expected seven chapters');
    check(data.volumes===2&&parts.length===2,'Expected two textbook volumes');
    check(data.missing.length===0,'Missing lessons: '+data.missing.join(','));
    check(g5AllTopics().length===74,'Legacy catalog count changed');
    check(nav.querySelector('h2')?.textContent==='Темы 5 класса','Long technical title remains');
    check(!nav.textContent.includes('Обе части, все 51 пункта'),'Service text still visible');
    check(!nav.textContent.includes('Нажмите название'),'Service instruction still visible');
    check(search?.placeholder==='Найти тему','Search placeholder should be concise');
    check(status.hidden&&status.textContent==='','Idle search result counter must be hidden');
    check(chapters.every(d=>!d.open),'Chapters should be collapsed by default');
    check(rows.every((li,index)=>li.value===index+1),'Textbook paragraphs out of order');
    check(rows.every(li=>li.querySelector('button.mk-g5-toc-link')),'Rows not fully actionable');
    for(const [n,term,id] of [[14,'Деление с остатком','division_remainder'],[15,'Упрощение выражений','simplify_expressions'],[26,'Доли и дроби','frac_parts'],[31,'Смешанные числа','frac_to_mixed'],[43,'Сложение и вычитание десятичных дробей','dec_add']]){
      const row=rows[n-1];
      check(row?.querySelector('button')?.textContent.includes(term),'Wrong label for '+n);
      check(g5AllTopics().some(t=>t.id===id),'Missing generator '+id);
    }
    check(rows[14].querySelectorAll('button').length===2,'Missing extra "Раскрытие скобок" lesson');
    check(rows[14].querySelectorAll('button')[1].textContent.includes('Раскрытие скобок'),'Extra lesson label');
    chapters[0].open=true;chapters[2].open=true;
    const natural=rows[0].querySelector('button'),complex=rows[2].querySelector('button');
    const navWidth=nav.getBoundingClientRect().width;
    const listWidth=natural.closest('li').getBoundingClientRect().width;
    const buttonWidth=natural.getBoundingClientRect().width;
    check(buttonWidth/listWidth>.96,'First row is a narrow badge instead of a full-width link');
    check(Math.abs(complex.getBoundingClientRect().width-buttonWidth)<=1,'Rows use uneven widths');
    check(getComputedStyle(natural).display==='grid','Rows are not unified grid buttons');
    check(natural.getBoundingClientRect().height>=49,'Too small tap target');
    // Verify query opens only matching sections and removes all text from the baseline counter.
    search.value='деление с остатком';search.dispatchEvent(new Event('input',{bubbles:true}));
    check(!status.hidden && status.textContent==='Найдено тем: 1','Wrong active search status');
    check(rows.filter(li=>!li.hidden).length===1 && !rows[13].hidden,'Search for remainder failed');
    check(chapters.filter(d=>!d.hidden).length===1 && chapters[2].open,'Wrong filtered chapter');
    search.value='раскрытие скобок';search.dispatchEvent(new Event('input',{bubbles:true}));
    check(rows.filter(li=>!li.hidden).length===1 && !rows[14].hidden,'Search extra lesson failed');
    search.value='случайная несущестующая тема';search.dispatchEvent(new Event('input',{bubbles:true}));
    check(status.textContent==='Ничего не найдено','Wrong empty state');
    search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
    check(status.hidden && !status.textContent,'Clearing search must hide status');
    check(rows.every(li=>!li.hidden),'Clearing search must restore all rows');
    check(chapters[0].open && chapters[2].open,'Open chapter state was not restored');
    check(!chapters[1].open,'Filtered expansion must not persist');
    // Verify both textbook links and fallback to hidden legacy catalog search.
    const otherSearch=mainView.querySelector('#mk-textbook-search-input-5');
    if(otherSearch){otherSearch.value='нет такой темы';otherSearch.dispatchEvent(new Event('input',{bubbles:true}))}
    rows[13].querySelector('button').click();
    check(document.activeElement?.classList?.contains('g5-card'),'Remainder did not focus legacy lesson');
    check(document.activeElement?.textContent.includes('Деление с остатком'),'Wrong remainder lesson');
    check(!document.activeElement?.hidden,'Lesson stayed hidden');
    check(!otherSearch || otherSearch.value==='','Existing catalog filter not cleared');
    rows[14].querySelectorAll('button')[1].click();
    check(document.activeElement?.textContent.includes('Раскрытие скобок'),'Extra lesson did not navigate');
    check(document.documentElement.scrollWidth<=innerWidth+2,'Horizontal page overflow at '+innerWidth);
    const bottom=nav.getBoundingClientRect().right;
    check(bottom<=innerWidth+2,'Menu spills out of screen');
    return {issues,paragraphs:rows.length,chapters:chapters.length,parts:parts.length,topicCount:g5AllTopics().length,navWidth};
   });
   assert.deepEqual(report.issues,[],JSON.stringify({width,report}));
   assert.deepEqual(errors,[],JSON.stringify({width,errors}));
   reports.push({width,paragraphs:report.paragraphs,chapters:report.chapters,parts:report.parts,topicCount:report.topicCount});
   await page.close();
  }
  console.log('G5_V118_CLEAN_MENU_PASS',JSON.stringify(reports));
 }finally{await browser.close()}
})().catch(err=>{console.error('G5_V118_CLEAN_MENU_FAIL',err.stack||err);process.exit(1)});
