import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const patterns={
 level:/\b(?:function\s+levelFor|function\s+xpForLevel|function\s+mk872UpdateTopLevelProgress|function\s+mk872LevelProgressHtml|LEVEL_XP|LEVELS_XP|mk872TopLevelProgress)/,
 grade:/\b(?:function\s+renderHome|function\s+renderGrade|function\s+renderTopics|function\s+openProfiles|function\s+openReport|function\s+openJournal)/,
 history:/\b(?:courseProgress|attemptHistory|trainingAggregates|trainingHistory|questionHistory|stageProgress|topicProgress)/,
 progress:/\b(?:progress-percent|progress-bar|progressTrack|progressFill|progress-stat|progress-card|xp-progress|level-progress|progress-meter)/i,
 xp:/\b(?:function\s+award|function\s+mk855CorrectReward|function\s+mk855ApplyWrongPenalty|function\s+save|function\s+load|function\s+stats)/,
 stages:/\b(?:stage-card|stageGrid|stageRows|stageName|stageDone|stageResult)/,
};
const hits={};
for(const [name,re]of Object.entries(patterns)){
 const found=[];for(let i=0;i<lines.length;i++){if(re.test(lines[i]))found.push(i)}
 const cap={level:30,grade:30,history:28,progress:30,xp:18,stages:22}[name];
 hits[name]={count:found.length,samples:found.slice(0,cap).map(i=>({line:i+1,text:lines.slice(Math.max(0,i-2),Math.min(lines.length,i+4)).map((l,j)=>String(Math.max(0,i-2)+j+1)+': '+l.slice(0,600)).join('\n')}))};
}
const definitions=[];
for(let i=0;i<lines.length;i++)if(/\b(?:function\s+(?:levelFor|xpForLevel|renderHome|renderGrade|renderTopic|openJournal|openProfiles|stats|mk872UpdateTopLevelProgress|mk872LevelProgressHtml|mk872Render|showStages|openReport)|const\s+[^=]*(?:XP_THRESHOLDS|LEVEL_XP|GRADE_THEMES)\b)/.test(lines[i]))definitions.push({line:i+1,text:lines.slice(Math.max(i-1,0),Math.min(i+12,lines.length)).map((s,j)=>String(Math.max(i-1,0)+j+1)+': '+s.slice(0,1100)).join('\n')});
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();await page.setViewport({width:390,height:900,isMobile:true,hasTouch:true});
await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
const state=await page.evaluate(()=>{
 const run=expr=>{try{return eval(expr)}catch(e){return 'ERROR '+e.message}};
 const lf=run('levelFor');
 const xs=[0,5,10,20,40,50,100,150,200,300,500,750,1000,1200,2000,3000,5000,10000,30000];
 const thresholds=xs.map(xp=>({xp,lv:typeof lf==='function'?lf(xp):null}));
 const s=run('state');
 const hist={};for(const k of ['courseProgress','questionHistory','attemptHistory','trainingHistory','trainingAggregates']){const v=s?.[k];hist[k]=Array.isArray(v)?{type:'array',n:v.length,sample:v[0]||null}:v&&typeof v==='object'?{type:'object',keys:Object.keys(v).slice(0,18),sample:Object.values(v)[0]}:{type:typeof v,value:v}};
 const top=document.querySelector('#mk872TopLevelProgress');
 const inspect=e=>e?{html:e.outerHTML.slice(0,4300),text:e.innerText.replace(/\s+/g,' ').slice(0,650),rect:(()=>{const r=e.getBoundingClientRect();return[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})()}:null;
 return{xp:s?.xp,levelFor:typeof lf==='function'?String(lf).slice(0,1800):String(lf),thresholds,top:inspect(top),home:inspect(document.querySelector('#mainView')),history:hist,functions:Object.fromEntries(['mk872UpdateTopLevelProgress','mk872LevelProgressHtml','renderHome','renderGrade','renderTopics'].map(k=>{const f=run(k);return[k,typeof f==='function'?String(f).slice(0,2000):typeof f]}))};
});
const screens=[];for(const g of [1,4,7,8]){
 await page.evaluate(g=>{document.querySelectorAll('.grade-grid>.grade-card')[g-1].querySelector('button.btn.primary').click()},g);
 const d=await page.evaluate(()=>{
  const root=document.querySelector('#mainView'),heads=[...root.querySelectorAll('h1,h2,h3')].map(e=>e.innerText.trim().slice(0,110));
  const hs=[...root.querySelectorAll('[class*="progress"],[class*="level"],[class*="stat"],[id*="Progress"]')].filter(e=>e.getBoundingClientRect().width>0).slice(0,28).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,140),id:e.id,txt:e.innerText?.replace(/\s+/g,' ').slice(0,120)}));
  return{headings:heads.slice(0,12),elements:hs,themeCount:root.querySelectorAll('.topic').length,top:root.innerHTML.slice(0,4800)};
 });
 screens.push({grade:g,...d});await page.screenshot({path:'audits/ui19f_before_grade'+g+'_390.png'});
 await page.evaluate(()=>renderHome());
}
await browser.close();
const report={lineCount:lines.length,hits,definitions:definitions.slice(0,50),live:state,screens};
fs.writeFileSync('audits/ui_stage19f_baseline.json',JSON.stringify(report,null,2)+'\n');
console.log('UI19F BASELINE',JSON.stringify({lineCount:report.lineCount,patternCounts:Object.fromEntries(Object.entries(hits).map(([k,v])=>[k,v.count])),definitions:definitions.slice(0,14).map(d=>d.text.slice(0,550)),live:{xp:state.xp,levelFor:state.levelFor,thresholds:state.thresholds,top:state.top,history:state.history},screens:screens.map(x=>({grade:x.grade,headings:x.headings,topics:x.themeCount,elements:x.elements.slice(0,9)}))}).slice(0,26000));
