'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
function solve(text,figures){
 const [a,b]=[...text.matchAll(/\d+/g)].map(match=>Number(match[0]));
 const [one,two]=figures.map(figure=>figure.angle);
 if(text.startsWith('Измерь два угла'))return text.includes('сумму')?one+two:one-two;
 if(text.startsWith('Развёрнутый угол состоит'))return 180-one-a;
 if(text.startsWith('Измерь угол, найди дополнение'))return a-one-b;
 if(text.startsWith('Два угла с рисунка'))return 180-one-two;
 if(text.startsWith('Измерь угол на рисунке'))return 90-one;
 if(text.startsWith('Измерь тупой угол'))return 180-one;
 if(text.startsWith('Измерь угол и увеличь'))return one+a;
 if(text.startsWith('На транспортире получили'))return Math.max(a,b);
 if(text.startsWith('На транспортире измерь'))return one/2;
 if(/^(Измерь угол на транспортире|Найди градусную меру|На шкале)/.test(text))return one;
 throw Error('Не распознано задание: '+text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111551;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const node=html=>{const el=document.createElement('div');el.innerHTML=html;return el;};
   const id='angles',rows=[],screens=[];
   openGrade(5);
   const textbook=[...document.querySelectorAll('#mk-g5-textbook-nav .mk-g5-toc-list li')].map(item=>item.value);
   const toward=(x1,y1,x2,y2)=>Math.round(Math.atan2(y1-y2,x2-x1)*180/Math.PI);
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let n=0;n<40;n++){
    qid='g5:'+id;blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id),prompt=node(q.text),figures=[];
    for(const svg of prompt.querySelectorAll('svg')){
     const ray=className=>{
      const line=svg.querySelector(className);
      const coords=['x1','y1','x2','y2'].map(name=>Number(line.getAttribute(name)));
      return toward(...coords);
     };
     const start=ray('.g5-measure-start'),end=ray('.g5-measure-end');
     const angle=Math.abs(start-end);
     const scale=name=>[...svg.querySelectorAll(name)].map(label=>Number(label.textContent));
     figures.push({angle,marks:svg.querySelectorAll('.g5-protractor-mark').length,
      outer:scale('.g5-protractor-outer'),inner:scale('.g5-protractor-inner'),label:svg.getAttribute('aria-label'),
      direction:start, rayEnd:end});
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
   return {rows,screens,textbook,topics:g5AllTopics().length};
  });
  assert.equal(data.rows.length,600);assert.equal(data.topics,74);assert.deepEqual(data.screens,[4,4,4]);
  assert.deepEqual(data.textbook,Array.from({length:51},(_,i)=>i+1));
  const families=new Map();let drawings=0;
  for(const row of data.rows){
   assert.equal(row.source,'angles');assert.equal(row.template,'v126_angles_L'+row.tier+'_F'+row.slot);
   const expected=solve(row.text,row.figures),values=row.choices.map(choice=>Number(choice.label));
   assert.equal(new Set(values).size,4,row.text);assert.equal(values.filter(value=>value===expected).length,1,row.text);
   assert.equal(Number(row.choices.find(choice=>choice.key===row.correct).label),expected,row.text);
   assert(row.solution.endsWith('Ответ: '+expected+'.'),row.solution);
   for(const fig of row.figures){
    assert.equal(fig.marks,37);
    assert.deepEqual(fig.outer,[0,30,60,90,120,150,180]);
    assert.deepEqual(fig.inner,[180,150,120,90,60,30,0]);
    assert(!/\d/.test(fig.label),'Доступное описание раскрывает ответ');
    assert.equal(fig.angle%5,0);
    assert(fig.angle>0&&fig.angle<180);
    assert([0,180].includes(fig.direction));
    const scale=fig.direction===0?fig.outer:fig.inner;
    const position=Math.floor(fig.rayEnd/30),remainder=fig.rayEnd%30;
    assert.equal(scale[position]+(fig.direction===0?remainder:-remainder),fig.angle);
    drawings++;
   }
   const forms=families.get(row.template)||new Set();forms.add(row.text+JSON.stringify(row.figures));families.set(row.template,forms);
  }
  assert.equal(families.size,15);assert.equal(drawings,680);
  const minimum=Math.min(...[...families.values()].map(forms=>forms.size));assert(minimum>=12,'Мало вариантов: '+minimum);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_51_PASS '+JSON.stringify({questions:600,families:15,drawings,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_51_FAIL',error.stack||error);process.exitCode=1;});
