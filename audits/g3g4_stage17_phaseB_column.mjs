import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const approved='b953b710a471210fe0f8247b55e879cedf4d7e11c6f369d551040a9f5d46c7d3';
const hash=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
if(hash!==approved||!fs.readFileSync('sw.js','utf8').includes('const APP_BUILD_HASH = "'+hash+'"'))throw Error('Refuse unapproved candidate');
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17B-written-column-arithmetic-and-placement',candidateSha256:hash,createdAt:new Date().toISOString(),operations:[],samples:[],anomalies:[],pageErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const res=await page.evaluate(()=>{
  const operations=[],samples=[],anomalies=[],summary={attempted:0,rendered:0,independentArithmetic:0,gridRowsChecked:0,gridPlacementChecked:0,divisionRowsChecked:0,geometricMisalignment:0,wrongAnswers:0};
  const fail=(code,detail)=>{summary.wrongAnswers++;if(anomalies.length<120)anomalies.push({code,...detail})};
  const clean=x=>String(x??'').trim();
  for(const grade of [3,4]){
    if(grade===4)openGrade(4);
    for(const op of ['add','sub','mul','div'])for(let d=0;d<3;d++){
      const item={grade,op,d,attempted:0,rendered:0,arithmeticChecked:0,shapeChecked:0,geometricMisalignment:0,range:[null,null],sampleTitle:null};
      for(let trial=0;trial<40;trial++){
       summary.attempted++;item.attempted++;
       try{
        if(grade===3)startG3WrittenStage('g3:written_'+(op==='sub'?'subtract':op==='mul'?'multiply':op==='div'?'divide':'add'),d);
        else startColumnStage(op,d);
       }catch(e){fail('launch-exception',{grade,op,d,error:String(e)});continue}
       const root=document.getElementById('stage');
       if(!root?.textContent?.trim()){fail('empty-stage',{grade,op,d});continue}
       summary.rendered++;item.rendered++;
       const title=root.querySelector('.task-title b')?.textContent?.trim()??'';
       if(!item.sampleTitle)item.sampleTitle=title;
       let a,b,actual,expected,columns=null,rowCount=0,misalign=0,opts={},digitTrace=[];
       const grid=root.querySelector('.cgrid');
       if(grid){
        columns=parseInt(grid.style.getPropertyValue('--cols'),10);
        const direct=[...grid.children].flatMap(n=>getComputedStyle(n).display==='contents'?[...n.children]:[n]);
        const stride=columns+1;
        if(direct.length%stride!==0)fail('bad-grid-cell-count',{grade,op,d,trial,columns,items:direct.length});
        const rows=[];
        for(let i=0;i<direct.length;i+=stride)rows.push(direct.slice(i,i+stride));
        rowCount=rows.length;summary.gridRowsChecked+=rows.length;
        const arithSymbol=op==='add'?'+':op==='sub'?'−':'×';
        const opAt=rows.findIndex(row=>clean(row[0]?.textContent)===arithSymbol);
        if(opAt<1)fail('operand-rows-not-found',{grade,op,d,trial,title,headings:rows.map(r=>r[0]?.textContent.trim())});
        else{
          const numberFromRow=row=>Number(row.slice(1).map(x=>clean(x.textContent)).join(''));
          a=numberFromRow(rows[opAt-1]);b=numberFromRow(rows[opAt]);
          expected=op==='add'?a+b:op==='sub'?a-b:a*b;
          const inputs=[...grid.querySelectorAll('input[data-row="final"]')].sort((x,y)=>+x.dataset.col-+y.dataset.col);
          actual=Number(inputs.map(x=>x.dataset.exp||'').join(''));
          if(!inputs.length||!Number.isFinite(actual)||actual!==expected){
            fail('incorrect-final-row',{grade,op,d,trial,a,b,expected,actual,finalCells:inputs.map(x=>[x.dataset.col,x.dataset.exp])});
          }else{summary.independentArithmetic++;item.arithmeticChecked++}
          const multiplicands=op==='mul'?[b%10,Math.floor(b/10)]:[];
          for(const [n,rowKey] of multiplicands.map((v,i)=>[v,'mul'+(i+1)])){
            const cells=[...grid.querySelectorAll('input[data-row="'+rowKey+'"]')].sort((x,y)=>+x.dataset.col-+y.dataset.col);
            if(!n||!cells.length)continue;
            const partial=Number(cells.map(x=>x.dataset.exp||'').join(''));
            if(partial!==a*n)fail('incorrect-partial-product',{grade,op,d,trial,a,b,rowKey,partial,expected:a*n});
            const last=Math.max(...cells.map(x=>+x.dataset.col));
            const shouldEnd=columns-1-(rowKey==='mul2'?1:0);
            if(last!==shouldEnd)fail('partial-product-wrong-place',{grade,op,d,trial,rowKey,last,shouldEnd});
          }
          if(op==='add'){
           const mark=[...grid.querySelectorAll('input[data-row="addMark"]')];
           if(mark.length!==columns)fail('missing-carry-cells',{grade,op,d,trial,mark:mark.length,columns});
          }
        }
        const reference=rows.find(r=>r.slice(1).every(x=>x.classList.contains('cell')&&!x.classList.contains('line')));
        if(reference?.length===stride){
          const base=reference.map(x=>x.getBoundingClientRect().left+x.getBoundingClientRect().width/2);
          for(const row of rows)for(let k=1;k<Math.min(stride,row.length);k++){
           const el=row[k];if(!el||!(el.matches('input,.cell')))continue;
           const r=el.getBoundingClientRect(),x=r.left+r.width/2,err=Math.abs(x-base[k]);
           summary.gridPlacementChecked++;
           if(err>7){
             misalign++;summary.geometricMisalignment++;item.geometricMisalignment++;
             if(misalign<=2&&anomalies.length<120)anomalies.push({code:'css-grid-digit-misalignment',grade,op,d,trial,col:k-1,delta:+err.toFixed(2),tag:el.tagName,cl:el.className});
           }
          }
        }
       }else{
         const match=title.match(/^(\d+)\s*:\s*(\d+)$/);
         if(!match){fail('missing-division-operands',{grade,op,d,trial,title})}
         else{
          a=+match[1];b=+match[2];
          if(!Number.isInteger(a/b))fail('division-noninteger',{grade,op,d,trial,a,b});
          const digits=[...root.querySelectorAll('input[data-row="quot"]')].sort((x,y)=>+x.dataset.col-+y.dataset.col);
          actual=Number(digits.map(x=>x.dataset.exp??'').join(''));
          expected=a/b;
          if(!digits.length||!Number.isFinite(actual)||actual!==expected)
           fail('wrong-long-division-quotient',{grade,op,d,trial,a,b,expected,actual});
          else{summary.independentArithmetic++;item.arithmeticChecked++}
          const top=[...root.querySelectorAll('.drow.div-top-row .div-fixed')];
          const axis=top.map(x=>x.getBoundingClientRect().left+x.getBoundingClientRect().width/2);
          for(const row of root.querySelectorAll('.div-rows .drow')){
           const cells=[...row.children].slice(1);
           for(let k=0;k<Math.min(cells.length,axis.length);k++){
            const el=cells[k];if(el.classList.contains('div-op'))continue;
            const r=el.getBoundingClientRect(),x=r.left+r.width/2;
            const delta=Math.abs(x-axis[k]);
            summary.divisionRowsChecked++;
            if(delta>7){
              misalign++;summary.geometricMisalignment++;item.geometricMisalignment++;
              if(misalign<=2&&anomalies.length<120)anomalies.push({code:'division-long-caret-placement',grade,op,d,trial,col:k,delta:+delta.toFixed(2),element:el.outerHTML.slice(0,150)});
            }
           }
          }
         }
       }
       if(trial===0)samples.push({grade,op,d,title:title||root.textContent.trim().slice(0,90),a,b,actual,expected,columns,rowCount,mismatches:misalign,htmlSnippet:root.querySelector('.cgrid,.div-layout')?.outerHTML.slice(0,1100)});
      }
      operations.push(item);
    }
  }
  return {operations,samples,anomalies,summary};
 });
 report.operations=res.operations;report.samples=res.samples;report.anomalies=res.anomalies;
 report.summary={...res.summary,anomalySamples:res.anomalies.length,jsErrors:pageErrors.length};
 console.log('STAGE17 B INDEPENDENT COLUMN SUMMARY',JSON.stringify(report.summary));
 console.log('STAGE17 B ERRORS',JSON.stringify(res.anomalies.slice(0,18)));
 console.log('STAGE17 B ROWS',JSON.stringify(res.operations.map(x=>({grade:x.grade,op:x.op,d:x.d,attempted:x.attempted,arithmetic:x.arithmeticChecked,misalign:x.geometricMisalignment}))));
 // Diagnostic discovery records alignments, but does not claim correct pixel layout until inspected.
 if(pageErrors.length||res.summary.independentArithmetic!==res.summary.attempted)process.exitCode=1;
}catch(e){report.anomalies.push({fatal:String(e),stack:String(e.stack).slice(0,1700)});console.error('STAGE17B FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseB_column_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}