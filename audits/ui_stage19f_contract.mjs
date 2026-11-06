import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import puppeteer from 'puppeteer-core';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const fns=['teacherCourseProgress','teacherStageBreakdown','teacherProfileGradeActivity','profileDirectBest','stagePassed','progressFor','topicProgressText','teacherActivity','g3TopicCard','g4AchievementKeys','g7AllTopics','g8AllTopics','g5AllTopics','g6AllTopics','g3AllTopics'];
const source=Object.fromEntries(fns.map(name=>{
 const p=lines.findIndex(s=>new RegExp('function\\s+'+name+'\\s*\\(').test(s));
 return [name,p<0?{line:null}:{line:p+1,code:lines.slice(p,p+12).map((s,i)=>(p+i+1)+': '+s.slice(0,1300)).join('\n')}];
}));
const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded'});
const live=await page.evaluate(()=>{
 const obj={};for(let g=1;g<=8;g++){
  const safe=fn=>{try{return fn()}catch(e){return {error:e.message}}};
  obj[g]={
    teacherCourseProgress:safe(()=>teacherCourseProgress(state,g)),
    teacherStageBreakdown:safe(()=>teacherStageBreakdown(state,g)),
    profileGradeActivity:safe(()=>teacherProfileGradeActivity(state,g))
  };
 }
 const funcs={};for(const name of ['teacherCourseProgress','teacherStageBreakdown','teacherProfileGradeActivity','progressFor','stagePassed']){
  try{const f=eval(name);funcs[name]=typeof f==='function'?String(f).slice(0,17000):typeof f}catch(e){funcs[name]=e.message}
 }
 const levels=[0,114,115,229,230,500,2000,2500].map(xp=>({xp,p:mk872GetLevelProgress(xp)}));
 const keys=Object.keys(state.courseProgress||{}).slice(0,25);
 return{grades:obj,functions:funcs,levelSamples:levels,firstProgressKeys:keys};
});
await browser.close();
const result={source,live};fs.writeFileSync('audits/ui_stage19f_progress_contract.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({grades:live.grades,levels:live.levelSamples,functions:Object.fromEntries(Object.entries(live.functions).map(([k,v])=>[k,String(v).slice(0,1100)]))}).slice(0,25000));
