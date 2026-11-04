import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const patch=JSON.parse(fs.readFileSync('audits/g3g4_stage17_phaseD_patch2_report.json','utf8'));
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(sha!==patch.newSha256 || !fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('Invalid second patch hash / worker');
const binary=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const browser=await puppeteer.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17D-second-patch-targeted-content-regression',sha256:sha,at:new Date().toISOString(),stats:{},failures:[],pageErrors};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const out=await page.evaluate(()=>{
   const failures=[],stats={tableLookup:0,geometryIdentify:0,gridArea:0,renderedVisuals:0,g3Starts:0};
   const fail=(kind,x)=>{if(failures.length<80)failures.push({kind,...x})};
   const clean=x=>String(x??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
   for(const topic of ['g3:tables','g3:geometry_figures','g3:rectangle_square_area']){
    for(let d=0;d<3;d++){
     for(let i=0;i<350;i++){
      let q;try{q=makeG3Question(topic,d)}catch(e){fail('exception',{topic,d,i,reason:String(e)});continue}
      const audit=q.audit||{},text=clean(q.text),ex=clean(q.ex),ans=String(q.ans??q.answer??'');
      if(topic==='g3:tables'&&audit.variant==='lookup'){
       stats.tableLookup++;
       const m=text.match(/Сколько книг (прочитала|прочитал) (Аня|Оля|Миша|Дима)\s*\?/u);
       if(!m || (['Аня','Оля'].includes(m[2])?m[1]!=='прочитала':m[1]!=='прочитал'))
         fail('wrong-table-gender',{topic,d,i,text});
      }
      if(topic==='g3:geometry_figures'&&audit.variant==='identify'){
       stats.geometryIdentify++;
       if(ex.toLowerCase().split(ans.toLowerCase()).length-1!==1)
         fail('duplicate-geometry-answer',{topic,d,i,ex,ans});
      }
      if(topic==='g3:rectangle_square_area'&&audit.variant==='gridRect'){
       stats.gridArea++;
       if(audit.unit!=='кв. ед.'||!/кв\.\s*ед\./u.test(ex)||/(?:см²|дм²|м²)/u.test(ex)||/Стороны:.*кв\. ед\./u.test(audit.journalText||''))
          fail('area-cell-unit-mismatch',{topic,d,i,ex,unit:audit.unit,journal:audit.journalText});
      }
      if(q.visual){
       const html=String(quizVisualHtml(q)||'');
       if(!html.trim()||/NaN|Infinity/.test(html))fail('invalid-geometry-visual',{topic,d,i,text,sample:html.slice(0,150)});
       else stats.renderedVisuals++;
      }
     }
     try{
      startG3QuizStage(topic,d);
      const stage=document.querySelector('#qstage'),view=stage?.querySelector('.quizq');
      if(!view?.textContent?.trim())fail('g3-ui-unavailable',{topic,d});
      else stats.g3Starts++;
     }catch(e){fail('g3-ui-exception',{topic,d,reason:String(e)})}
    }
   }
   return {stats,failures};
 });
 report.stats=out.stats;report.failures=out.failures;
 report.summary={...out.stats,failures:out.failures.length,jsErrors:pageErrors.length};
 console.log('STAGE17D SECOND PATCH TARGETED',JSON.stringify(report.summary));
 console.log('FAILURES',JSON.stringify(out.failures.slice(0,15)));
 if(out.failures.length||pageErrors.length||out.stats.tableLookup<100||out.stats.geometryIdentify<100||out.stats.gridArea<100||out.stats.g3Starts!==9)process.exitCode=1;
}catch(e){report.failures.push({fatal:String(e),stack:String(e.stack).slice(0,1800)});console.error('TARGETED FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_patch2_targeted_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
