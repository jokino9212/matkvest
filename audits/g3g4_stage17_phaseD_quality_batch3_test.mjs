import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const sha=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes('matkvest-iphone-v46')||!sw.includes('const APP_BUILD_HASH = "'+sha+'"'))throw Error('G3 geometry HTML/PWA v46 disagree');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
if(!chrome)throw Error('Chromium unavailable');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:90000,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const report={stage:'17D-quality-batch3',sha256:sha,createdAt:new Date().toISOString(),rows:[],ui:[],errors:[],pageErrors,summary:{}};
try{
 await page.setViewport({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 const x=await page.evaluate(()=>{
   const topics=['geometry_figures','geometry_construction','area_measure'],N=500,rows=[],errors=[],ui=[];
   const fail=(kind,obj)=>{if(errors.length<140)errors.push({kind,...obj})};
   const strip=x=>String(x??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
   const within=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<=13&&p.y>=0&&p.y<=8;
   const coords=pts=>Array.isArray(pts)&&pts.every(within);
   const areaRect=pts=>pts?.length===4&&pts[0].y===pts[1].y&&pts[1].x===pts[2].x&&pts[2].y===pts[3].y&&pts[3].x===pts[0].x;
   for(const id of topics)for(let d=0;d<3;d++){
     const variantCounts={},prompts=new Set(),visuals=new Set(),row={id,d,count:N,verified:0,variants:variantCounts,promptVariety:0,visualVariety:0,mathVerifications:0};
     for(let i=0;i<N;i++){
       let q;
       try{q=makeG3Question('g3:'+id,d)}catch(e){fail('exception',{id,d,i,error:String(e)});continue}
       const a=q?.audit??{},vis=q?.visual??{},data=vis.data??{},v=String(a.variant),ans=String(q?.ans??q?.answer),txt=strip(q?.text),exp=strip(q?.ex);
       variantCounts[v]=(variantCounts[v]||0)+1;prompts.add(txt);
       visuals.add(JSON.stringify({kind:data.kind,points:data.points,cells:data.cells,labels:data.labels}));
       if(!txt||!exp||!q?.sig||!vis||vis.type!=='g3geometry')fail('missing-question-or-visual',{id,d,i,v,txt});
       if(Array.isArray(data.points)&&!coords(data.points))fail('outside-grid',{id,d,i,v,points:data.points});
       if(Array.isArray(data.cells)&&!coords(data.cells))fail('cells-outside-grid',{id,d,i,v});
       if(id==='geometry_figures'){
         if(d===0){
           const labels={point:'точка',line:'прямая',segment:'отрезок',broken:'ломаная',polygon:'многоугольник'};
           if(v!=='identify'||!labels[a.kind]||ans!==labels[a.kind]||data.kind!==a.kind)fail('basic-identify',{id,d,i,v,ans,a,kind:data.kind});
           if(a.kind==='point'&&data.points?.length!==1||a.kind==='line'&&data.points?.length!==2||a.kind==='segment'&&data.points?.length!==2||a.kind==='broken'&&data.points?.length<3||a.kind==='polygon'&&data.points?.length<3)fail('incorrect-geometry-figure',{id,d,i,a});
         }else if(d===1){
           if(v==='closed'&&((ans==='ДА')!==a.closed||data.kind!==(a.closed?'polygon':'broken')))fail('closed-polygon',{id,d,i,a,ans,kind:data.kind});
           else if(v==='right'&&((ans==='ДА')!==a.right||a.u.x*a.v.x+a.u.y*a.v.y!==a.dot||(a.dot===0)!==a.right))fail('right-angle',{id,d,i,a,ans});
           else if(!['right','closed'].includes(v))fail('unexpected-mid-geometry',{id,d,i,v});
         }else{
           if(v==='links'&&(!Number.isInteger(a.count)||a.count!==data.points?.length-1||ans!==String(a.count)))fail('links-count',{id,d,i,a,ans});
           else if(v==='vertices'&&(!Number.isInteger(a.count)||a.count!==data.points?.length||ans!==String(a.count)||data.kind!=='polygon'))fail('vertices-count',{id,d,i,a,ans});
           else if(v==='features'&&(!Number.isInteger(a.vertices)||a.vertices!==a.sides||a.vertices!==data.points?.length||ans!==String(2*a.vertices)||data.kind!=='polygon'))fail('features-count',{id,d,i,a,ans});
           else if(v==='right'&&(!a.u||!a.v||(a.u.x*a.v.x+a.u.y*a.v.y===0)!==a.right||ans!==(a.right?'прямой':'не прямой')))fail('angle-classification',{id,d,i,a,ans});
           else if(!['links','vertices','features','right'].includes(v))fail('unexpected-advanced-geometry',{id,d,i,v});
         }
       }
       if(id==='geometry_construction'){
         if(d===0){
           const p=data.points??[],actual=p.length===2?Math.abs(p[0].x-p[1].x)+Math.abs(p[0].y-p[1].y):null;
           if(v!=='segment'||data.kind!=='segment'||actual!==a.length||ans!==String(actual)||p.length!==2||p[0].x!==p[1].x&&p[0].y!==p[1].y)fail('segment-cells',{id,d,i,a,ans,points:p});
         }else{
           const p=data.points??[],w=p.length===4?Math.abs(p[0].x-p[1].x):NaN,h=p.length===4?Math.abs(p[1].y-p[2].y):NaN;
           if(data.kind!=='polygon'||!areaRect(p)||w!==a.w||h!==a.h)fail('construction-visual-size',{id,d,i,v,a,points:p});
           if(d===1){
             if(!['rectangle','square'].includes(v)||ans!==(v==='square'?'квадрат':'прямоугольник')||(w===h)!==(v==='square'))fail('construct-identify',{id,d,i,v,a,ans});
           }else{
             if(v==='dimensions'&&ans!==String(w)+'×'+String(h))fail('dimensions-answer',{id,d,i,a,ans});
             else if(v==='squareExtension'&&(!(w!==h)||ans!==String(Math.abs(w-h))||a.answer!==Math.abs(w-h)))fail('square-completion-answer',{id,d,i,a,ans});
             else if(!['dimensions','squareExtension'].includes(v))fail('advanced-reverted-to-easy',{id,d,i,v,a});
           }
         }
       }
       if(id==='area_measure'){
         const all=data.cells??[];
         if(data.kind!=='cells'||all.some(c=>!within(c)))fail('area-visual-cells',{id,d,i,v,data});
         if(d===0&&!['rectangle'].includes(v)||d===1&&!['rectangle','L','compare'].includes(v)||d===2&&!['complete','difference'].includes(v))fail('area-level-variant',{id,d,i,v});
         if(v==='rectangle'||v==='L'){
           const expected=v==='rectangle'?a.w*a.h:a.w*a.h-a.cutW*a.cutH;
           if(a.area!==expected||ans!==String(expected)||all.length!==expected||(v==='L'&&a.cutW*a.cutH<=0))fail('area-cell-count',{id,d,i,v,a,ans,drawn:all.length});
         }
         if(v==='compare'||v==='difference'){
           const A=a.cellsA??[],B=a.cellsB??[],arA=A.length,arB=B.length;
           if(arA!==a.areaA||arB!==a.areaB||all.length!==arA+arB||B.some(c=>c.alt!==true)||A.some(c=>c.alt===true))fail('two-area-drawing',{id,d,i,v,a,drawn:all.length});
           if(v==='compare'&&ans!==(arA===arB?'=':arA>arB?'>':'<'))fail('area-compare',{id,d,i,a,ans});
           if(v==='difference'&&(arA===arB||ans!==String(Math.abs(arA-arB))||a.answer!==Math.abs(arA-arB)))fail('area-difference',{id,d,i,a,ans});
         }
         if(v==='complete'){
           const expected=a.cutW*a.cutH,filled=a.w*a.h-expected;
           if(a.outer!==a.w*a.h||a.area!==filled||all.length!==filled||ans!==String(expected)||a.answer!==expected)fail('fill-missing-cells',{id,d,i,a,ans,drawn:all.length});
         }
       }
       if(q.choices?.length){
         const keys=q.choices.map(c=>String(c.key??c.value??c.label));
         if(!keys.includes(ans)||new Set(keys).size!==keys.length)fail('choice-keys',{id,d,i,v,ans,keys});
       }
       row.mathVerifications++;row.verified++;
     }
     row.promptVariety=prompts.size;row.visualVariety=visuals.size;
     if(row.verified!==N)fail('generation-coverage',{id,d,verified:row.verified,N});
     if(id==='geometry_figures'&&d===0&&row.visualVariety<18)fail('basic-visual-variety',{id,d,visuals:row.visualVariety});
     if(id==='geometry_figures'&&d===2&&(!variantCounts.features||variantCounts.features<65))fail('advanced-feature-coverage',{id,d,variants:variantCounts});
     if(id==='geometry_construction'&&d===2&&(!variantCounts.squareExtension||variantCounts.squareExtension<70))fail('square-extension-coverage',{id,d,variants:variantCounts});
     if(id==='area_measure'&&d===2&&(!variantCounts.complete||!variantCounts.difference))fail('area-new-reasoning-coverage',{id,d,variants:variantCounts});
     rows.push(row);
   }
   for(const id of topics)for(let d=0;d<3;d++){
     try{
       startG3QuizStage('g3:'+id,d);
       const visible=!!document.querySelector('#qstage .quizq'),svg=document.querySelector('#qstage .g3-geo-svg'),overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
       ui.push({id,d,visible,svg:!!svg,overflow});
       if(!visible||!svg||overflow>60)fail('topic-render',{id,d,visible,svg:!!svg,overflow});
     }catch(e){fail('ui-exception',{id,d,error:String(e)})}
   }
   return {rows,errors,ui};
 });
 report.rows=x.rows;report.errors=x.errors;report.ui=x.ui;
 report.summary={generated:x.rows.reduce((s,r)=>s+r.verified,0),independentChecks:x.rows.reduce((s,r)=>s+r.mathVerifications,0),ui:x.ui.length,uiReady:x.ui.filter(z=>z.visible&&z.svg&&z.overflow<=60).length,errors:x.errors.length,jsErrors:pageErrors.length};
 console.log('BATCH3',JSON.stringify(report.summary));
 console.log('VARIETY',JSON.stringify(report.rows.map(r=>({id:r.id,d:r.d,variants:r.variants,visual:r.visualVariety,uniquePrompt:r.promptVariety}))));
 if(x.errors.length)console.log('BATCH3 ERRORS',JSON.stringify(x.errors.slice(0,30)));
 if(report.summary.generated!==4500||report.summary.independentChecks!==4500||report.summary.uiReady!==9||report.summary.errors||pageErrors.length)process.exitCode=1;
}catch(e){report.errors.push({fatal:String(e),stack:String(e.stack).slice(0,1500)});console.error('FATAL',e);process.exitCode=1}
finally{fs.writeFileSync('audits/g3g4_stage17_phaseD_quality_batch3_test_report.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
