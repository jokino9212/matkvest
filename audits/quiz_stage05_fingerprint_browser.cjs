'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
 const report=await page.evaluate(()=>{
  const topics=[...G5_CORE,...G5_FRACTIONS,...G5_DECIMALS],rows=[];
  for(const topic of topics)for(const stage of [0,1,2]){
    blockSession={kind:'g5quiz',key:'g5:'+topic.id,stageIndex:stage,usedSignatures:[],items:[],done:0,total:10};
    qid='g5:'+topic.id;
    const a=[];
    for(let j=0;j<100;j++){
      const v=makeG5Question(topic.id);
      const html=String(v.text||''),txt=stripHtmlText(html),answer=String(v.correctText||'');
      const full=[html,answer,String(v.correctLabel||''),v.choices?.map(c=>String(c.label||'')).join('|')||''].join('~');
      const stem=txt.toLowerCase().replace(/[-+]?\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim();
      const semantic=stem.replace(/[^\p{L}# +:;.,?=÷×−<>]/gu,'').slice(0,200);
      a.push({full,txt,answer,stem:semantic,svg:/<svg|class="ray"|class="frac"|class="mixed"/i.test(html),
        mode:v.answerMode||'choice',template:v.templateId,question:html.slice(0,250)});
    }
    const unique=items=>new Set(items).size;
    const full=unique(a.map(x=>x.full)),text=unique(a.map(x=>x.txt)),stems=unique(a.map(x=>x.stem));
    const ids=[...new Set(a.map(x=>x.stem))],examples=ids.slice(0,8).map(id=>a.find(x=>x.stem===id).txt.slice(0,200));
    rows.push({id:topic.id,stage,full,text,stemCount:stems,svgCount:a.filter(x=>x.svg).length,
      answerCount:unique(a.map(x=>x.answer)),sample:examples,
      modes:[...new Set(a.map(x=>x.mode))],templateCount:unique(a.map(x=>x.template))});
  }
  const problematic=rows.filter(x=>x.full<45||x.stemCount<2);
  return {topics:topics.length,samples:rows.length*100,problematic:problematic.map(({id,stage,full,text,stemCount,svgCount,answerCount,sample})=>({id,stage,full,text,stemCount,svgCount,answerCount,sample:sample.slice(0,2)})),
    byTopic:topics.map(t=>({id:t.id,full:rows.filter(x=>x.id===t.id).map(x=>x.full),
      text:rows.filter(x=>x.id===t.id).map(x=>x.text),stem:rows.filter(x=>x.id===t.id).map(x=>x.stemCount),
      variantSamples:rows.filter(x=>x.id===t.id).map(x=>x.sample.slice(0,3))}))};
 });
 console.log('STAGE05_FULL_FINGERPRINT',JSON.stringify(report));
 assert.equal(errors.length,0,'browser errors '+errors.join('|'));
 assert.equal(report.topics,53);
 assert.equal(report.samples,15900);
 console.log('STAGE05_FULL_FINGERPRINT_PASS',JSON.stringify({topics:report.topics,samples:report.samples,problematic:report.problematic.length}));
 }finally{await browser.close()}
})().catch(e=>{console.error('STAGE05_FULL_FINGERPRINT_FAILED',e.stack||e);process.exit(1)});
