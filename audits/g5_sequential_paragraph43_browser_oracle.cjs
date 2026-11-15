'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const topics=['dec_add','dec_sub'];
function scaled(value){
 const [whole,decimal='']=value.split(',');
 return BigInt(whole)*1000n+BigInt(decimal.padEnd(3,'0'));
}
function solveText(text){
 const [a,b,c,d]=[...text.matchAll(/\d+(?:,\d+)?/g)].map(match=>scaled(match[0]));
 if(text.startsWith('Вычисли ')){
  const tokens=text.slice('Вычисли '.length).match(/\d+(?:,\d+)?|[()+−]/g);
  let position=0;
  function expression(){
   const term=()=>{
    const token=tokens[position++];
    if(token!=='(')return scaled(token);
    const nested=expression();
    assert.equal(tokens[position++],')');
    return nested;
   };
   let answer=term();
   while(tokens[position]==='+'||tokens[position]==='−'){
    const operator=tokens[position++],next=term();
    answer=operator==='+'?answer+next:answer-next;
   }
   return answer;
  }
  const answer=expression();
  assert.equal(position,tokens.length);
  return answer;
 }
 if(/^(Сложи |Найди сумму |Было .*лент|Прибавь целое)/.test(text))return a+b;
 if(text.startsWith('Сгруппируй'))return a+b+c;
 if(text.startsWith('Сумма двух чисел'))return a-b;
 if(text.startsWith('В первой коробке'))return a+a+b;
 if(text.startsWith('К ')&&text.includes('прибавили разность'))return a+b-c;
 if(text.startsWith('До остановки'))return a+a+b+c;
 if(text.startsWith('Известно, что x'))return c-a-b+d;
 if(text.startsWith('В первый день потратили'))return a+a-b+c;
 if(/^(Из (целого числа )?\d|Было .*л воды)/.test(text))return a-b;
 if(text.startsWith('На сколько различаются'))return a>b?a-b:b-a;
 if(text.startsWith('После вычитания'))return a+b;
 if(text.startsWith('В коробке'))return a-b+c;
 if(text.startsWith('В баке'))return a-b-b-c;
 if(text.startsWith('Из числа вычли'))return c-b+a;
 if(text.startsWith('По первому пути'))return b-c;
 if(text.startsWith('В двух ящиках'))return a-b-c;
 throw new Error('Не распознан текст задания: '+text);
}
function verifyColumn(column,answer){
 const [left,operation,line,right]=column.split('\n');
 assert.match(line,/^─+$/);
 assert.equal(left.indexOf(','),operation.indexOf(','));
 assert.equal(operation.indexOf(','),right.indexOf(','));
 assert.equal(left.length,right.length);
 const x=scaled(left.trim()),y=scaled(operation.slice(2).trim());
 assert.equal(operation[0]==='+'?x+y:x-y,answer);
 assert.equal(scaled(right.trim()),answer);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
  const data=await page.evaluate(ids=>{
   let seed=2026111543;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const visible=html=>{const node=document.createElement('div');node.innerHTML=html;return node;};
   const questions=[],screens=[];
   for(const id of ids){
    for(let tier=0;tier<3;tier++)for(let slot=0;slot<5;slot++)for(let sample=0;sample<40;sample++){
     qid='g5:'+id;
     blockSession={kind:'g5quiz',key:qid,stageIndex:tier,done:slot,total:10,usedSignatures:[],items:[],finished:false};
     const task=makeG5Question(id),solution=visible(task.ex);
     questions.push({id,tier,slot,text:visible(task.text).textContent,template:task.templateId,source:task.sourceTopicId,
      column:solution.querySelector('pre')?.textContent,explanation:solution.textContent,answer:task.ans,
      choices:task.choices.map(choice=>({key:choice.key,label:visible(choice.label).textContent}))});
    }
    for(let tier=0;tier<3;tier++){
     blockSession=null;qid='';
     startG5QuizStage(id,tier);
     screens.push(document.querySelectorAll('#qstage .answer').length);
     closeModal();
    }
   }
   return {questions,screens,topics:g5AllTopics().length};
  },topics);
  assert.equal(data.topics,74);
  assert.equal(data.questions.length,1200);
  assert.deepEqual(data.screens,[4,4,4,4,4,4]);
  const families=new Map();
  let columns=0;
  for(const row of data.questions){
   assert.equal(row.source,row.id);
   assert.equal(row.template,'g5v116_'+row.id+'_L'+row.tier+'_F'+row.slot);
   const expected=solveText(row.text),answers=row.choices.map(choice=>scaled(choice.label));
   assert.equal(answers.length,4,row.text);
   assert.equal(new Set(answers).size,4,row.text);
   assert.equal(answers.filter(value=>value===expected).length,1,row.text);
   assert.equal(scaled(row.choices.find(choice=>choice.key===row.answer).label),expected,row.text);
   const solution=row.explanation.match(/Ответ: (\d+(?:,\d+)?)\.$/);
   assert(solution,row.explanation);
   assert.equal(scaled(solution[1]),expected,row.text);
   if(row.column){verifyColumn(row.column,expected);columns++;}
   if(row.tier>0){
    const steps=[...row.explanation.matchAll(/(\d+(?:,\d+)?) ([+−]) (\d+(?:,\d+)?) = (\d+(?:,\d+)?)/g)];
    assert(steps.length>=row.tier+1,row.text+' '+row.explanation);
    for(const [,x,operator,y,result] of steps){
     assert.equal(operator==='+'?scaled(x)+scaled(y):scaled(x)-scaled(y),scaled(result),row.explanation);
    }
   }
   const unique=families.get(row.template)||new Set();
   unique.add(row.text);
   families.set(row.template,unique);
  }
  assert.equal(columns,280);
  assert.equal(families.size,30);
  const minimum=Math.min(...[...families.values()].map(unique=>unique.size));
  assert(minimum>=15,`Минимум вариантов: ${minimum}`);
  assert.deepEqual(errors,[]);
  console.log('G5_SEQUENTIAL_PARAGRAPH_43_PASS '+JSON.stringify({questions:1200,families:30,columns,minimum}));
 }finally{await browser.close();}
})().catch(error=>{console.error('G5_SEQUENTIAL_PARAGRAPH_43_FAIL',error.stack||error);process.exitCode=1;});
