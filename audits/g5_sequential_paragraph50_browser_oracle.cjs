'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
function type(value){return value<90?'Острый':value===90?'Прямой':value<180?'Тупой':'Развёрнутый';}
function solve(text,figures){
 const [a,b]=[...text.matchAll(/\d+/g)].map(match=>Number(match[0]));
 if(text.startsWith('Как называется изображённый'))return type(figures[0].angle);
 if(text.startsWith('Как называется угол на втором'))return type(figures[1].angle);
 if(text.startsWith('Как называется угол'))return type(a);
 if(text.startsWith('Какой угол отмечен'))return type(figures[0].angle);
 if(text.startsWith('Сколько градусов не хватает'))return String(90-a);
 if(text.startsWith('Сложили углы'))return type(a+b);
 if(text.startsWith('Прямой угол на рисунке'))return String(90-figures[0].angle+b);
 if(text.startsWith('От тупого угла'))return type(a-b);
 if(text.startsWith('Развёрнутый угол разделили на')){
  if(text.includes('x°'))return String(Math.abs(90-a-b));
  return String(a-90);
 }
 if(text.startsWith('Сколько из углов'))return String((text.match(/\d+/g)||[]).map(Number).filter(value=>text.includes('тупыми')?value>90&&value<180:value<90).length);
 if(text.startsWith('Прямой угол разделили'))return type(90-a+b);
 if(text.startsWith('Какой наибольший'))return String(89-a);
 if(text.startsWith('К прямому углу'))return type(90+a-b);
 throw Error('Не распознано задание: '+text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111550;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const node=html=>{const el=document.createElement('div');el.innerHTML=html;return el;};
   const id='angle_types',rows=[],screens=[];
   const toward=(x1,y1,x2,y2)=>Math.round(Math.atan2(y1-y2,x2-x1)*180/Math.PI);
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let n=0;n<40;n++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),prompt=node(q.text),figures=[];
    for(const svg of prompt.querySelectorAll('svg')){
     const polygon=svg.querySelector('polygon');
     if(polygon){
      const [x,y,xx,yy,xxx,yyy]=polygon.getAttribute('points').split(' ').map(Number);
      const orthogonal=(xx-x)*(xxx-x)+(yy-y)*(yyy-y)===0;
      figures.push({kind:'triangle',angle:orthogonal?90:0,mark:!!svg.querySelector('.g5-right-mark'),shape:polygon.getAttribute('points')});
     }else{
      const ray=[...svg.querySelectorAll('line')].at(-1);
      const [x1,y1,x2,y2]=['x1','y1','x2','y2'].map(name=>Number(ray.getAttribute(name)));
      figures.push({kind:'rays',angle:toward(x1,y1,x2,y2),label:Number(svg.textContent.match(/\d+/)?.[0]),shape:ray.outerHTML});
     }
     svg.remove();
    }
    rows.push({tier,slot,text:prompt.textContent,figures,solution:node(q.ex).textContent,template:q.templateId,source:q.sourceTopicId,
     correct:q.ans,choices:q.choices.map(choice=>({key:choice.key,label:node(choice.label).textContent}))});
   }
   for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,topics:g5AllTopics().length};
  });
  assert.equal(data.rows.length,600);assert.equal(data.topics,74);assert.deepEqual(data.screens,[4,4,4]);
  const families=new Map();let drawings=0;
  for(const row of data.rows){
   assert.equal(row.source,'angle_types');assert.equal(row.template,'angle_L'+row.tier+'_F'+row.slot);
   const expected=solve(row.text,row.figures),values=row.choices.map(choice=>choice.label);
   assert.equal(new Set(values).size,4,row.text);assert.equal(values.filter(value=>value===expected).length,1,row.text);
   assert.equal(row.choices.find(choice=>choice.key===row.correct).label,expected,row.text);
   assert(row.solution.endsWith('Ответ: '+expected+'.'),row.solution);
   for(const fig of row.figures){
    if(fig.kind==='triangle'){assert.equal(fig.angle,90);assert(fig.mark);}else assert.equal(fig.angle,fig.label);
    drawings++;
   }
   const forms=families.get(row.template)||new Set();forms.add(row.text+JSON.stringify(row.figures));families.set(row.template,forms);
  }
  assert.equal(families.size,15);assert.equal(drawings,200);
  const minimum=Math.min(...[...families.values()].map(forms=>forms.size));assert(minimum>=12,'Мало вариантов: '+minimum);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_50_PASS '+JSON.stringify({questions:600,families:15,drawings,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_50_FAIL',error.stack||error);process.exitCode=1;});
