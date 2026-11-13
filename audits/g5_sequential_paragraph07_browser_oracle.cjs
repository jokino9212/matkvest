'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const ID='column_charts',TRIALS=40;
const amount=(str,re,context)=>{const m=str.match(re);assert(m,'Cannot interpret student wording '+context+': '+str);return Number(m[1]);};
function evalExact(plan){
 const [op,...x]=plan,E=evalExact;
 if(op==='v')return BigInt(x[0]);
 if(op==='add')return x.reduce((a,b)=>a+E(b),0n);
 if(op==='sub')return E(x[0])-E(x[1]);
 if(op==='mul')return E(x[0])*E(x[1]);
 if(op==='div'){const a=E(x[0]),b=E(x[1]);assert(b!==0n&&a%b===0n,'Non-integer intermediate chart task');return a/b}
 if(op==='abs'){const a=E(x[0]);return a<0n?-a:a}
 throw Error('Unhandled §7 exact numerical operation '+op);
}
const sum=arr=>arr.reduce((a,b)=>a+b,0),diff=(a,b)=>Math.abs(a-b);
function interpret(q){
 const {level:t,family:p,plain:s,values:bar}=q,blue=bar.books,orange=bar.albums;
 assert.equal(blue.length,4,'Four values expected for blue bars');
 const [a,b,c,d]=blue,sorted=[...blue].sort((u,v)=>v-u);
 if(t===0){
  assert(!orange,'Warmup must present one readable series');
  if(p===0)return b;
  if(p===1)return sorted[0];
  if(p===2)return diff(a,c);
  if(p===3)return b+d;
  if(p===4)return sorted[0]-sorted[3];
 }
 if(t===1){
  if(p===0)return sum(blue);
  if(p===1)return diff(a+b,c+d);
  if(p===2)return amount(s,/За пять дней продали (\d+) тетрадей/,'training five days')-sum(blue);
  if(p===3){assert(orange,'Two categories required for Wednesday');return c+orange[2];}
  if(p===4)return sorted[0]+sorted[1];
 }
 if(t===2){
  if(p===0)return sum(blue)+sorted[2]+sorted[3];
  assert(orange,'Master chart needs two colour-coded product series');
  if(p===1)return sum(blue)+sum(orange);
  if(p===2)return diff(sum(blue),sum(orange));
  if(p===3){
   const addition=amount(s,/В пятницу дополнительно продали (\d+) тетрадей/,'additional fifth-day sales');
   const returns=amount(s,/вернули (\d+) штук/,'returned albums');
   return sum(blue)+sum(orange)+addition-returns;
  }
  if(p===4)return diff(b+d,orange[0]+orange[2]);
 }
 throw Error('Unexpected live §7 family '+t+'/'+p);
}
(async()=>{
 const nav=fs.readFileSync('g5-textbook-navigation-v121.js','utf8');
 assert(nav.includes("[7,'Представление числовой информации в столбчатых диаграммах',['column_charts']]"),'§7 textbook navigation missing');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(({id,trials})=>{
   let seed=2026111307;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const rows=[],plots={single:0,double:0,bars:0,majorTicks:0,minorTicks:0,labels:0,mobile:0};
   const requireChart=(ok,msg)=>{if(!ok)throw Error('§7 chart geometry: '+msg)};
   const days=['Пн','Вт','Ср','Чт'];
   for(let level=0;level<3;level++)for(let family=0;family<5;family++)for(let trial=0;trial<trials;trial++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:level,done:family,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),root=document.createElement('div');root.innerHTML=String(q.text);
    const plain=root.childNodes[0]?.textContent||'',svg=root.querySelector('.mk-g5-chart-figure svg'),ctx=level+'/'+family+'/'+trial;
    requireChart(svg&&svg.getAttribute('role')==='img'&&svg.getAttribute('width')==='100%'&&svg.getAttribute('viewBox'),'Missing responsive accessible SVG '+ctx);
    requireChart(!/NaN|undefined|Infinity/.test(svg.outerHTML),'Malformed numeric SVG '+ctx);
    const view=svg.getAttribute('viewBox').split(/\s+/).map(Number),[,,,viewH]=view;
    requireChart(view[2]===620&&viewH<=360,'Chart must fit narrow Android viewports proportionally '+ctx);
    const wrap=svg.parentNode;requireChart(wrap.style.overflow==='hidden'&&wrap.style.maxWidth,'Chart wrapper must not spill horizontally '+ctx);plots.mobile++;
    const labels=[...svg.querySelectorAll('.mk-g5-chart-day')].map(x=>x.textContent);
    requireChart(labels.join(',')===days.join(','),'Day labels not aligned '+ctx);
    const yTicks=[...svg.querySelectorAll('.mk-g5-chart-grid')].map(x=>({n:Number(x.getAttribute('data-unit')),y:Number(x.getAttribute('y1'))}));
    requireChart(yTicks.length===11&&yTicks[0].n===0&&yTicks.at(-1).n===100,'YAxis must cover 0..100 with tens '+ctx);
    const pxPerUnit=(yTicks[0].y-yTicks.at(-1).y)/100;
    requireChart(pxPerUnit>0,'No positive chart vertical scale '+ctx);
    for(let i=0;i<yTicks.length;i++){
     const tick=yTicks[i];requireChart(tick.n===10*i,'Wrong value on scale '+ctx);
     requireChart(Math.abs(tick.y-(yTicks[0].y-tick.n*pxPerUnit))<.02,'Nonlinear Y scale '+ctx);
     requireChart(Number.isFinite(tick.y)&&tick.y>=0&&tick.y<viewH,'YAxis outside chart '+ctx);
    }
    const major=[...svg.querySelectorAll('.mk-g5-chart-tick-label')].map(x=>Number(x.getAttribute('data-unit')));
    requireChart(major.join(',')==='0,20,40,60,80,100','Missing visible major labels '+ctx);
    plots.majorTicks+=major.length;plots.minorTicks+=yTicks.length-major.length;
    const shapes=[...svg.querySelectorAll('.mk-g5-chart-bar')],values={books:[],albums:[]};
    const paired=level===2&&family!==0||level===1&&family===3;
    requireChart(shapes.length===(paired?8:4),'Wrong number of actual visible bars '+ctx);
    requireChart(svg.getAttribute('aria-label').includes('тетради')===paired,'Two-series accessible legend does not match '+ctx);
    const titleTexts=[...svg.querySelectorAll('text')].map(x=>x.textContent);
    if(paired){requireChart(titleTexts.includes('Тетради')&&titleTexts.includes('Альбомы'),'Missing genuine legend for blue and orange '+ctx);plots.double++;}
    else{requireChart(!titleTexts.includes('Альбомы'),'Unexpected secondary legend '+ctx);plots.single++;}
    const perDay=new Map();
    for(const rect of shapes){
     const series=rect.getAttribute('data-series'),day=rect.getAttribute('data-day'),v=Number(rect.getAttribute('data-value'));
     const y=Number(rect.getAttribute('y')),h=Number(rect.getAttribute('height')),x=Number(rect.getAttribute('x')),w=Number(rect.getAttribute('width'));
     requireChart(['books','albums'].includes(series)&&days.includes(day),'Unknown series or x category '+ctx);
     requireChart(v>=10&&v<=100&&v%10===0,'Bar values do not align to reading scale '+ctx);
     requireChart(Math.abs(h/pxPerUnit-v)<.015,'Visible bar height differs from recorded number '+ctx);
     requireChart(Math.abs(y+h-yTicks[0].y)<.015,'Bar does not start at zero '+ctx);
     requireChart(x>=70&&x+w<590&&w>25,'Bar protrudes beyond diagram on phone '+ctx);
     requireChart((rect.getAttribute('fill')==='#3678bf')===(series==='books'),'Series color mismatch '+ctx);
     requireChart(!/^\d+$/.test(rect.textContent.replace(/<[^>]*>/g,'')),'Bar visually prints the intended answer '+ctx);
     const dayIndex=days.indexOf(day);
     requireChart(values[series][dayIndex]===undefined,'Duplicated bar for same date and series '+ctx);
     // Derive the student-visible number FROM SVG GEOMETRY, not data-value or source formula.
     values[series][dayIndex]=Math.round(h/pxPerUnit);
     let positions=perDay.get(day)||[];positions.push({series,x,w});perDay.set(day,positions);
     plots.bars++;
    }
    requireChart(values.books.length===4&&values.books.every(Number.isInteger),'Incomplete primary values '+ctx);
    for(const [day,items]of perDay){
     requireChart(items.length===(paired?2:1),'Wrong series count at '+day+' '+ctx);
     if(paired)requireChart(items[0].x+items[0].w<items[1].x,'Paired bars overlap '+ctx);
    }
    const sec=paired?values.albums:null;
    const good=q.choices.filter(x=>String(x.key)===String(q.ans));
    requireChart(good.length===1,'No unique selected correct answer '+ctx);
    rows.push({level,family,trial,plain,values:{books:values.books,albums:sec},ans:String(q.ans),
      right:String(good[0].label),meta:q.mk123,template:q.templateId,choices:q.choices.map(x=>({key:String(x.key),label:String(x.label)})),ex:String(q.ex)});
   }
   renderGrade5();
   return {topics:g5AllTopics().length,rows,plots,links:document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-link[data-topic-id="column_charts"]').length,lesson:String(g5Lesson(id))};
  },{id:ID,trials:TRIALS});
  assert.equal(result.topics,74,'Do not change the Grade 5 curriculum catalog');
  assert.equal(result.rows.length,600,'15 families × 40 generations must be real browser output');
  assert.equal(result.links,1,'§7 needs a direct textbook link exactly once');
  assert(/шкал/.test(result.lesson)&&/оранжевые/.test(result.lesson),'Lesson must teach the scale and chart legend');
  const families=new Map(),variety=new Map(),steps=[[],[],[]],answers=[];
  for(const q of result.rows){
   const ctx=q.level+'/'+q.family+'/'+q.trial,m=q.meta;
   assert(m&&m.id===ID&&m.t===q.level&&m.p===q.family,'Not the published v123 family '+ctx);
   assert.equal(q.choices.filter(v=>v.key===q.ans).length,1,'Missing unique correct key '+ctx);
   assert.equal(new Set(q.choices.map(v=>v.label)).size,q.choices.length,'Duplicate visible multiple-choice labels '+ctx);
   assert.equal(q.ans,evalExact(m.plan).toString(),'BigInt independent math evaluator disagrees '+ctx);
   const studentExpected=interpret(q);
   assert(Number.isSafeInteger(studentExpected)&&studentExpected>=0,'Nonsensical student answer '+ctx);
   assert.equal(String(m.expected),String(studentExpected),'Source expected differs from visible chart interpretation '+ctx);
   assert.equal(q.right,String(studentExpected),'Accepted option differs from what student sees '+ctx);
   const slot=q.level+'/'+q.family;
   if(!families.has(slot))families.set(slot,q.template);
   else assert.equal(families.get(slot),q.template,'Random family switching '+ctx);
   const vals=variety.get(slot)||new Set();vals.add(JSON.stringify({bars:q.values,plain:q.plain}));variety.set(slot,vals);
   steps[q.level].push(m.steps);
   answers.push(studentExpected);
  }
  assert.equal(families.size,15,'Need exactly 15 different families');
  assert.equal(new Set(families.values()).size,15,'Family IDs collide between difficulty tiers');
  for(const [slot,vals]of variety)assert(vals.size>=10,'Insufficient real diagram and math variation '+slot+' '+vals.size);
  const meanSteps=steps.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
  assert(meanSteps[0]<meanSteps[1]&&meanSteps[1]<meanSteps[2],'Difficulty metadata does not grow '+meanSteps);
  assert.equal(result.plots.single+result.plots.double,600,'Every generated question must show a real chart');
  assert(result.plots.double>=200,'Advanced level never reads multiple data series');
  assert.equal(result.plots.bars,result.plots.single*4+result.plots.double*8,'Bar count mismatch');
  assert.deepEqual(errors,[],'Unhandled browser runtime error');
  console.log('G5_SEQUENTIAL_PARAGRAPH_07_PASS '+JSON.stringify({paragraph:7,questions:result.rows.length,families:families.size,meanSteps,visual:result.plots,links:result.links}));
 }finally{await browser.close()}
})().catch(e=>{console.error('G5_SEQUENTIAL_PARAGRAPH_07_FAIL',e.stack||e);process.exit(1)});
