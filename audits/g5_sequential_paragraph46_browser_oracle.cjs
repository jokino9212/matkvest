'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
function milli(value){
 const [whole,decimal='']=value.split(',');
 return BigInt(whole)*1000n+BigInt(decimal.padEnd(3,'0'));
}
function solve(text){
 const values=(text.match(/\d+(?:,\d+)?/g)||[]).map(milli),[a,b,c,d,e]=values;
 const div=(x,y)=>{assert.equal(x*1000n%y,0n,text);return x*1000n/y;};
 const times=(x,y)=>x*y/1000n;
 if(text.startsWith('Вычисли ('))return div(a+b,c);
 if(text.startsWith('Вычисли ')&&text.includes(' + '))return div(a,b)+div(c,d);
 if(text.startsWith('Вычисли ')&&values.length===3)return div(div(a,b),c);
 if(text.startsWith('Вычисли ')||text.startsWith('Верёвку'))return div(a,b);
 if(text.startsWith('Найди половину'))return a/2n;
 if(text.startsWith('В ')&&text.includes('ёмкостей'))return div(b,a)-c;
 if(text.startsWith('После деления'))return times(a,b);
 if(text.startsWith('Сравни частные'))return div(a,b)>div(c,d)?div(a,b):div(c,d);
 if(text.startsWith('Из ')&&text.includes('кг сырья'))return div(a-b,c)-d;
 if(text.startsWith('Число x увеличили'))return times(b,c)-a;
 if(text.startsWith('Найди сумму'))return (div(a,b)+div(c,d))/2n;
 if(text.startsWith('В одной группе'))return div(b,a)-div(d,c);
 throw Error('Не распознано задание: '+text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(()=>{
   let seed=2026111546;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const plain=html=>{const node=document.createElement('div');node.innerHTML=html;return node.textContent;};
   const id='dec_div_nat',rows=[],screens=[];
   for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let n=0;n<40;n++){
    qid='g5:'+id;
    blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
    const q=makeG5Question(id);
    rows.push({tier,slot,text:plain(q.text),solution:plain(q.ex),template:q.templateId,source:q.sourceTopicId,
     correct:q.ans,choices:q.choices.map(choice=>({key:choice.key,label:plain(choice.label)}))});
   }
   for(let tier=0;tier<3;tier++){
    blockSession=null;qid='';startG5QuizStage(id,tier);
    screens.push(document.querySelectorAll('#qstage .answer').length);
    closeModal();
   }
   return {rows,screens,topics:g5AllTopics().length};
  });
  assert.equal(data.rows.length,600);assert.equal(data.topics,74);assert.deepEqual(data.screens,[4,4,4]);
  const families=new Map();
  for(const row of data.rows){
   assert.equal(row.source,'dec_div_nat');
   assert.equal(row.template,'v127_dec_div_nat_L'+row.tier+'_F'+row.slot);
   const expected=solve(row.text),values=row.choices.map(choice=>milli(choice.label));
   assert.equal(new Set(values).size,4,row.text);
   assert.equal(values.filter(value=>value===expected).length,1,row.text);
   assert.equal(milli(row.choices.find(choice=>choice.key===row.correct).label),expected,row.text);
   const result=row.solution.match(/Ответ: (\d+(?:,\d+)?)\.$/);
   assert(result,row.solution);assert.equal(milli(result[1]),expected,row.text);
   const equations=[...row.solution.matchAll(/(\d+(?:,\d+)?) ([:·+−]) (\d+(?:,\d+)?) = (\d+(?:,\d+)?)/g)];
   assert(equations.length>=row.tier+1,row.solution);
   for(const [,x,operation,y,z] of equations){
    const a=milli(x),b=milli(y),c=milli(z);
    assert.equal(operation===':'?a*1000n/b:operation==='·'?a*b/1000n:operation==='+'?a+b:a-b,c,row.solution);
   }
   const family=families.get(row.template)||new Set();family.add(row.text);families.set(row.template,family);
  }
  assert.equal(families.size,15);
  const minimum=Math.min(...[...families.values()].map(forms=>forms.size));
  assert(minimum>=15,`Минимум вариантов: ${minimum}`);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_46_PASS '+JSON.stringify({questions:600,families:15,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_46_FAIL',error.stack||error);process.exitCode=1;});
