'use strict';
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
   const gradeData={};
   for(const grade of [5,6]){
    const fn=window['g'+grade+'AllTopics'];
    const topics=typeof fn==='function'?fn():[];
    gradeData[grade]={exists:typeof fn==='function',topics:topics.map((t,i)=>({index:i,id:String(t.id||''),title:String(t.title||t.name||''),section:String(t.section||t.group||t.block||''),description:String(t.description||'')}))};
   }
   const concepts=[
    {name:'Деление с остатком',pattern:'делени.{0,20}остат|остат.{0,20}делени'},
    {name:'Раскрытие скобок',pattern:'раскрыти.{0,10}скоб|скоб.{0,15}раскры'},
    {name:'Упрощение выражений',pattern:'упрощени.{0,15}выражен|приведени.{0,15}подобн'},
    {name:'Буквенные выражения',pattern:'буквенн.{0,15}выражен'},
    {name:'Распределительное свойство',pattern:'распределительн.{0,15}свойств'},
    {name:'Действия с натуральными числами',pattern:'натуральн.{0,15}числ'}
   ];
   const matches={};
   for(const grade of [5,6]){
    matches[grade]=concepts.map(c=>{
     const re=new RegExp(c.pattern,'i');
     return {concept:c.name,results:gradeData[grade].topics.filter(t=>re.test([t.title,t.section,t.description].join(' '))).map(t=>({id:t.id,title:t.title,section:t.section})),matchedByTitleOnly:true};
    });
   }
   const duplicates={};
   for(const grade of [5,6]){
    const m=new Map();
    for(const t of gradeData[grade].topics){const key=t.title.trim().toLocaleLowerCase('ru');if(!m.has(key))m.set(key,[]);m.get(key).push(t.id)}
    duplicates[grade]=[...m].filter(([name,ids])=>name&&ids.length>1).map(([title,ids])=>({title,ids}));
   }
   return {gradeData,matches,duplicates,notes:'Search probes examine displayed catalog titles, sections and descriptions; absence of a title match does not by itself prove absent underlying content.'};
  });
  report.timestamp=new Date().toISOString();report.pageErrors=errors;
  fs.mkdirSync('audits/out',{recursive:true});
  fs.writeFileSync('audits/out/g5_g6_textbook_coverage.json',JSON.stringify(report,null,2)+'\n');
  for(const grade of [5,6]){
   console.log('GRADE_'+grade+'_CATALOG',JSON.stringify(report.gradeData[grade]));
   console.log('GRADE_'+grade+'_CONCEPT_MATCHES',JSON.stringify(report.matches[grade]));
   if(!report.gradeData[grade].exists||!report.gradeData[grade].topics.length)throw Error('Grade '+grade+' catalog unavailable');
  }
  if(errors.length)throw Error('Page errors: '+errors.join(' | '));
  console.log('G5_G6_TEXTBOOK_INVENTORY_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
