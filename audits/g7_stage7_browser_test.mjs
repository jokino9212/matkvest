import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';

const execPath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
if(!execPath)throw Error('Chromium executable not found');
const browser=await puppeteer.launch({executablePath:execPath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
const page=await browser.newPage(),pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
let report;
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
 report=await page.evaluate(()=>{
  const targets=['geo_primitives','coordinate_plane','graphical_equations_systems'];
  const topics=g7AllTopics(),errors=[],stats=[],sessions=[];
  const rationalValue=q=>q&&typeof q==='object'&&'n' in q?q.n/q.d:Number(q);
  let total=0;
  function validate(raw,d,q){
   if(!q||!q.text||!q.sig||!q.ex||!q.audit)throw Error('Missing question fields');
   if(/(?:undefined|NaN|\[object Object\])/.test(String(q.text)+' '+String(q.ex)))throw Error('Invalid generated text');
   if(q.choices?.length&&q.choices.filter(c=>String(c.key)===String(q.ans)).length!==1)throw Error('Choice is not unique');
   if(!targets.includes(raw))return;
   if(q.audit.type!=='g7AuditStage7'||q.audit.raw!==raw||q.audit.d!==d)throw Error('Stage7 metadata mismatch');
   if(q.audit.answer!==undefined&&Number(q.ans)!==Number(q.audit.answer))throw Error('Numeric answer mismatch');
   if(q.audit.correct!==undefined&&String(q.ans)!==String(q.audit.correct))throw Error('Choice answer mismatch');
   if(q.audit.expectedX!==undefined){
     if(q.answerMode!=='coordinate')throw Error('Missing coordinate mode');
     if(rationalValue(q.answerPoint.x)!==q.audit.expectedX||rationalValue(q.answerPoint.y)!==q.audit.expectedY)throw Error('Coordinate answer mismatch');
   }
   const data=q.visual?.data,m=q.audit;
   if(raw==='coordinate_plane'&&m.variant==='axis_name'){
     if(q.ans!==m.axis)throw Error('Coordinate axis name mismatch');
     return;
   }
   if(!data)throw Error('Missing diagram model');
   if(raw==='geo_primitives'){
     if(q.visual.type!=='geometry'||data.kind!=='g7-primitives')throw Error('Missing geometric SVG');
     const svg=g7GeometryPrimitivesSvg(data);
     if(!svg||!svg.includes('<'))throw Error('Empty geometric SVG');
     for(const label of [...data.labels,...(data.offPoint?[data.offPoint]:[])])if(!svg.includes(label))throw Error('Geometric label not drawn: '+label);
     if(m.variant==='between'&&q.ans!==data.labels[1])throw Error('Incorrect midpoint label');
     if(m.variant==='membership'&&q.ans!==data.offPoint)throw Error('Off-line point mismatch');
     if(m.variant==='ray_name'&&q.ans!=='луч '+data.labels.join(''))throw Error('Ray direction mismatch');
     if(m.variant==='ray_origin'&&q.ans!==data.labels[0])throw Error('Ray origin mismatch');
     if(m.variant==='ray_through'&&q.ans!==data.labels[1])throw Error('Ray through mismatch');
   }else if(raw==='coordinate_plane'&&m.variant!=='axis_name'){
     if(q.visual.type!=='coordinatePlane'||data.points.length!==1)throw Error('Missing coordinate graph point');
     const p=data.points[0],x=rationalValue(p.x),y=rationalValue(p.y);
     if(x!==m.x||y!==m.y)throw Error('Point model mismatch');
     if(Math.abs(x)>5||Math.abs(y)>5)throw Error('Point outside axes');
     if(m.variant==='dist_ox'&&Number(q.ans)!==Math.abs(y))throw Error('Distance to Ox mismatch');
     if(m.variant==='dist_oy'&&Number(q.ans)!==Math.abs(x))throw Error('Distance to Oy mismatch');
     if(m.variant==='abscissa'&&Number(q.ans)!==x)throw Error('Abscissa mismatch');
     if(m.variant==='ordinate'&&Number(q.ans)!==y)throw Error('Ordinate mismatch');
     if(['quadrant','axis_point'].includes(m.variant)&&q.ans!==g6CoordinateClass(p.x,p.y))throw Error('Classification mismatch');
   }else if(raw==='graphical_equations_systems'){
     if(q.visual.type!=='coordinatePlane'||data.series?.length!==2)throw Error('Missing two plotted lines');
     const {k1,b1,k2,b2}=m;
     for(const [i,s] of data.series.entries()){
       const k=i?k2:k1,b=i?b2:b1;
       if(s.k!==k||s.b!==b||s.points.length!==2)throw Error('Line parameters mismatch');
       for(const p of s.points){
         const x=rationalValue(p.x),y=rationalValue(p.y);
         if(Math.abs(y-(k*x+b))>0.00001||Math.abs(x)>6.001||Math.abs(y)>6.001)throw Error('Line clipped incorrectly');
       }
     }
     const expected=k1===k2?(b1===b2?'infinite':'none'):'one';
     if(m.case!==expected)throw Error('Line intersection classification mismatch');
     if(m.x0!==null){
       if(k1*m.x0+b1!==m.y0||k2*m.x0+b2!==m.y0)throw Error('Plotted intersection not on both lines');
     }
   }
  }
  function sample(raw,d,n,scope){
   const text=new Set(),semantic=new Set(),sigs=new Set(),variants=new Set();
   let successes=0;
   for(let i=0;i<n;i++){
     try{
       const q=makeG7Question('g7:'+raw,d);
       validate(raw,d,q);
       text.add(q.text);sigs.add(q.sig);
       semantic.add(JSON.stringify([q.text,q.ans,q.visual?.data||null]));
       variants.add(q.audit?.variant||'legacy');
       successes++;total++;
     }catch(e){errors.push({raw,d,scope,index:i,error:String(e)});if(errors.length>=25)break;}
   }
   if(scope==='target')stats.push({raw,d,attempted:n,successes,uniqueTexts:text.size,uniqueSemanticCases:semantic.size,uniqueSignatures:sigs.size,variants:[...variants]});
  }
  for(const raw of targets)for(let d=0;d<3;d++)sample(raw,d,240,'target');
  for(const t of topics)for(let d=0;d<3;d++)sample(t.id.slice(3),d,10,'catalog');
  for(const raw of targets)for(let d=0;d<3;d++)for(let run=0;run<20;run++){
   const sem=new Set(),sig=new Set(),v=new Set();
   for(let i=0;i<10;i++){
    try{
      const q=makeG7Question('g7:'+raw,d);
      validate(raw,d,q);
      sem.add(JSON.stringify([q.text,q.ans,q.visual?.data||null]));
      sig.add(q.sig);v.add(q.audit.variant);
      total++;
    }catch(e){errors.push({raw,d,run,i,error:String(e)});}
   }
   sessions.push({raw,d,run,uniqueSemantic:sem.size,uniqueSig:sig.size,variants:v.size});
   if(sem.size<7||sig.size<7)errors.push({raw,d,run,error:'Fewer than 7 different questions within 10 attempts',distinct:sem.size,uniqueSig:sig.size});
  }
  return {catalog:topics.length,total,errors,stats,sessions};
 });
 report.pageErrors=pageErrors;
 report.htmlSha256=createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
 report.testedAt=new Date().toISOString();
 report.browser=await browser.version();
 fs.writeFileSync('audits/g7_stage7_browser_report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({catalog:report.catalog,total:report.total,errors:report.errors.slice(0,15),pageErrors,targets:report.stats,sessionMin:Math.min(...report.sessions.map(s=>s.uniqueSemantic))},null,2));
 if(report.catalog!==107||report.errors.length||pageErrors.length)process.exitCode=1;
}finally{await browser.close();}
