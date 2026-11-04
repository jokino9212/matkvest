import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v49')||!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('G3 batch6 PWA fingerprint mismatch');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome is not available');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17D-quality-batch6',sha256:sha,at:new Date().toISOString(),rows:[],ui:[],errors:[],pageErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const result=await page.evaluate(()=>{
  const ids=['area_units','tables','bar_charts'],N=500,rows=[],errors=[],ui=[];
  const fail=(kind,info)=>{if(errors.length<140)errors.push({kind,...info})};
  const num=q=>Number(String(q?.ans??q?.answer??NaN).replace(',','.'));
  const ans=q=>String(q?.ans??q?.answer??'');
  const op=(a,b)=>a<b?'<':a>b?'>':'=';
  const ints=arr=>Array.isArray(arr)&&arr.every(n=>Number.isInteger(n));
  for(const id of ids)for(let d=0;d<3;d++){
   const row={id,d,attempted:N,valid:0,mathChecks:0,variants:{},prompts:new Set(),dataModels:new Set(),visualModels:0,chartScaleChecks:0};
   for(let i=0;i<N;i++){
    let q;
    try{q=makeG3Question('g3:'+id,d)}catch(e){fail('exception',{id,d,i,error:String(e)});continue}
    const a=q?.audit??{},v=String(a.variant??'none'),ctx={id,d,i,v},name=String(q?.text??'').replace(/<[^>]*>/g,' ').trim(),
      explain=String(q?.ex??'').replace(/<[^>]*>/g,' ').trim();
    row.variants[v]=(row.variants[v]??0)+1;row.prompts.add(name);
    if(!name||!explain||!q?.sig||!q?.ans)fail('missing-content',{...ctx,name,explain,ans:q?.ans});
    if(Array.isArray(q.choices)&&q.choices.length){
      const keys=q.choices.map(c=>String(c.key??c.value??c.label));
      if(keys.filter(k=>k===ans(q)).length!==1||new Set(keys).size!==keys.length)fail('invalid-choices',{...ctx,keys,answer:ans(q)});
    }
    if(id==='area_units'){
      const modes=d===0?['dm2cm2','m2dm2']:d===1?['mixedDmCm','cm2dm2']:['mixedCompare','difference','m2cm2'];
      if(!modes.includes(v))fail('area-invalid-progression',{...ctx,modes});
      let expected=NaN,expectedSuffix=null;
      if(v==='dm2cm2'||v==='m2dm2'){
        expected=a.value*100;expectedSuffix=a.to;
        if(a.dimension!=='area'||a.from!==(v==='dm2cm2'?'дм²':'м²')||a.to!==(v==='dm2cm2'?'см²':'дм²'))fail('area-basic-conversion',{...ctx,a});
      }else if(v==='cm2dm2'){
        expected=a.value/100;expectedSuffix='дм²';
        if(a.value%100!==0||a.from!=='см²'||a.to!=='дм²')fail('area-reverse-conversion',{...ctx,a});
      }else if(v==='mixedDmCm'){
        expected=a.dm*100+a.cm;expectedSuffix='см²';
        if(a.cm<=0||a.cm>=100||a.cm%10!==0)fail('area-mixed-range',{...ctx,a});
      }else if(v==='mixedCompare'){
        const left=a.dm*100+a.cm,right=a.right;
        expected=op(left,right);
        if(a.left!==left||a.leftBase!==left||a.rightBase!==right||ans(q)!==expected)
          fail('area-compare',{...ctx,a,expected,answer:ans(q)});
      }else if(v==='difference'){
        expected=a.dm*100-a.cm;expectedSuffix='см²';
        if(expected<=0||a.left!==a.dm*100)fail('area-difference-model',{...ctx,a,expected});
      }else if(v==='m2cm2'){
        expected=a.value*10000;expectedSuffix='см²';
        if(a.from!=='м²'||a.to!=='см²')fail('area-big-unit-model',{...ctx,a});
      }
      if(v!=='mixedCompare'){
        if(num(q)!==expected||q.answerRat?.n!==expected||q.answerRat?.d!==1||q.unitSuffix!==expectedSuffix)
          fail('area-independent-answer',{...ctx,expected,actual:ans(q),suffix:q.unitSuffix,expectedSuffix});
      }
      row.mathChecks++;
    }else if(id==='tables'){
      const m=a.tableModel,values=m?.rows?.map(r=>Number(r[1])),target=m?.target,visual=q.visual?.data;
      if(q.visual?.type!=='tableData'||!m||!Array.isArray(m.rows)||!Array.isArray(m.headers))
        fail('table-incomplete-visual',{...ctx,visualType:q.visual?.type,model:m});
      else{
        const shape=JSON.stringify(m.rows);
        row.dataModels.add(shape);
        if(!visual||!Array.isArray(visual.rows)||visual.rows.length!==m.rows.length)
          fail('table-visual-not-renderable',{...ctx,visual});
        else if(v!=='missing'&&m.rows.some((r,k)=>JSON.stringify(r)!==JSON.stringify(visual.rows[k])))
          fail('table-visual-model-different',{...ctx,model:m.rows,rendered:visual.rows});
        if(v==='missing'){
          const r=target?.row,full=m.rows[r],shown=visual?.rows?.[r];
          if(!full||target.column!==3||full[1]*full[2]!==full[3]||num(q)!==full[3]||shown?.[3]!=='□')
            fail('table-hidden-cell-math',{...ctx,m,shown,answer:ans(q)});
          for(let k=0;k<m.rows.length;k++)if(m.rows[k][1]*m.rows[k][2]!==m.rows[k][3])
            fail('table-all-prices',{...ctx,row:k,values:m.rows[k]});
        }else{
          if(!ints(values)||values.length!==4||values.some(z=>z<3||z>20))fail('table-data-range',{...ctx,values});
          const roles=d===0?['lookup','max','min']:d===1?['lookup','max','min','sum','difference']:['missing','total','range','sum','difference'];
          if(!roles.includes(v))fail('table-wrong-level',{...ctx,roles});
          let expected=null;
          if(v==='lookup')expected=values[target?.row];
          if(v==='max'||v==='min')expected=m.rows[values.indexOf(v==='max'?Math.max(...values):Math.min(...values))][0];
          if(v==='total')expected=values.reduce((x,y)=>x+y,0);
          if(v==='range')expected=Math.max(...values)-Math.min(...values);
          if(v==='sum'||v==='difference'){
            const rows=target?.rows??[];
            if(rows.length!==2)fail('table-pair-index',{...ctx,target});
            else expected=v==='sum'?values[rows[0]]+values[rows[1]]:values[rows[0]]-values[rows[1]];
          }
          if(ans(q)!==String(expected))fail('table-independent-answer',{...ctx,expected,answer:ans(q),m});
          if(v==='difference'&&!(expected>0))fail('table-ambiguous-greater',{...ctx,values,target});
          if(v==='range'&&new Set(values).size!==4)fail('table-range-unique',{...ctx,values});
          if(v==='max'||v==='min'){
            const targetValue=v==='max'?Math.max(...values):Math.min(...values);
            if(values.filter(x=>x===targetValue).length!==1)fail('table-extreme-not-unique',{...ctx,values});
          }
        }
      }
      row.mathChecks++;
    }else{
      const m=a.chartModel,values=m?.values??[],labels=m?.categories??[],t=m?.target,visual=q?.visual?.data;
      if(q.visual?.type!=='barChart'||labels.length!==4||values.length!==4||!ints(values)||values.some(x=>x<2||x>20))
        fail('chart-data-invalid',{...ctx,type:q.visual?.type,m});
      else{
        row.dataModels.add(JSON.stringify({labels,values}));
        if(!m.scale||!Number.isFinite(m.scale.step)||m.scale.step<=0||m.scale.maxValue<Math.max(...values)||m.baseline!==0)
          fail('chart-scale',{...ctx,values,scale:m.scale,baseline:m.baseline});
        else row.chartScaleChecks++;
        if(!visual||!Array.isArray(visual.labels)||!Array.isArray(visual.values)||visual.labels.join('|')!==labels.join('|')||visual.values.join('|')!==values.join('|'))
          fail('chart-render-data-inconsistent',{...ctx,visual,m});
        const roles=d===0?['lookup','max','min']:d===1?['lookup','max','min','difference','sum']:['total','equal','range','topTwo'];
        if(!roles.includes(v))fail('chart-wrong-level',{...ctx,roles});
        let expected=null;
        if(v==='lookup')expected=values[t?.index];
        if(v==='max'||v==='min')expected=labels[values.indexOf(v==='max'?Math.max(...values):Math.min(...values))];
        if(v==='sum')expected=values[t.indices[0]]+values[t.indices[1]];
        if(v==='difference')expected=Math.abs(values[t.indices[0]]-values[t.indices[1]]);
        if(v==='total')expected=values.reduce((x,y)=>x+y,0);
        if(v==='range')expected=Math.max(...values)-Math.min(...values);
        if(v==='topTwo'){
          const highest=[...values].sort((x,y)=>y-x);
          expected=highest[0]+highest[1];
          if(!t?.indices||t.indices.length!==2||t.indices.some(z=>![...values.keys()].includes(z)))fail('chart-top-indices',{...ctx,t});
        }
        if(v==='equal'){
          const pair=t?.pair??[];
          expected=pair.map(x=>labels[x]).sort().join(' и ');
          if(pair.length!==2||values[pair[0]]!==values[pair[1]]||values.filter(x=>x===values[pair[0]]).length!==2)fail('chart-equal-pair-not-unique',{...ctx,pair,values});
        }
        if(String(expected)!==ans(q)||a.answer!==expected)
          fail('chart-independent-answer',{...ctx,expected,answer:ans(q),auditAnswer:a.answer,model:m});
        if((v==='max'||v==='min')&&values.filter(x=>x===(v==='max'?Math.max(...values):Math.min(...values))).length!==1)
          fail('chart-extreme-ambiguous',{...ctx,values});
      }
      row.mathChecks++;
    }
    row.valid++;
   }
   row.exactPrompts=row.prompts.size;row.uniqueDataModels=row.dataModels.size;delete row.prompts;delete row.dataModels;
   if(row.valid!==N||row.mathChecks!==N)fail('coverage',{id,d,valid:row.valid,checks:row.mathChecks});
   if(d>0&&Object.keys(row.variants).length<2)fail('no-progression',{id,d,variants:row.variants});
   if(id==='area_units'&&d===2&&Object.keys(row.variants).length!==3)fail('missing-area-model',{id,d,variants:row.variants});
   if(id==='tables'&&row.uniqueDataModels<60)fail('low-table-data-variety',{id,d,count:row.uniqueDataModels});
   if(id==='bar_charts'&&row.uniqueDataModels<60)fail('low-chart-data-variety',{id,d,count:row.uniqueDataModels});
   rows.push(row);
  }
  for(const id of ids)for(let d=0;d<3;d++){
   try{
    startG3QuizStage('g3:'+id,d);
    const node=document.querySelector('#qstage'),quiz=!!node?.querySelector('.quizq'),
      table=!!node?.querySelector('table'),chart=!!node?.querySelector('svg'),
      overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
    ui.push({id,d,quiz,table,chart,overflow});
    if(!quiz||overflow>60||id==='tables'&&!table||id==='bar_charts'&&!chart)
      fail('unavailable-visual-training',{id,d,quiz,table,chart,overflow});
   }catch(e){fail('ui-exception',{id,d,error:String(e)})}
  }
  return {rows,errors,ui};
 });
 report.rows=result.rows;report.errors=result.errors;report.ui=result.ui;
 report.summary={generated:report.rows.reduce((s,r)=>s+r.valid,0),independentMath:report.rows.reduce((s,r)=>s+r.mathChecks,0),chartScaleChecks:report.rows.reduce((s,r)=>s+r.chartScaleChecks,0),ui:report.ui.length,uiReady:report.ui.filter(z=>z.quiz&&z.overflow<=60).length,errors:report.errors.length,jsErrors:pageErrors.length};
 console.log('BATCH6',JSON.stringify(report.summary));
 console.log('MODELS',JSON.stringify(report.rows.map(r=>({id:r.id,d:r.d,variants:r.variants,uniqueModels:r.uniqueDataModels,uniquePrompts:r.exactPrompts}))));
 if(report.errors.length)console.log('BATCH6 ERRORS',JSON.stringify(report.errors.slice(0,25)));
 if(report.summary.generated!==4500||report.summary.independentMath!==4500||report.summary.uiReady!==9||report.errors.length||pageErrors.length)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1400)});console.error('FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch6_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
