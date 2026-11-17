const checked=["triangle_midline","triangle_centers","triangle_centroid","right_triangle_projections","similarity_constructions","similarity_applications","acute_angle_trig_ratios","trig_identity","special_angles_trig","line_and_circle","circle_relative_positions","circle_tangency","common_tangents_two_circles","arc_degree_measure","central_inscribed_angles","tangent_chord_angle","chords_secants_angles","tangential_quadrilateral","cyclic_quadrilateral","similarity_by_angles","similarity_by_two_sides","similarity_by_three_sides","algebraic_fraction_domain","algebraic_fraction_basic_property","algebraic_fraction_reduction","algebraic_fraction_add_sub","algebraic_fraction_mul_div","rational_expression_transformations","inverse_proportion_function","like_denominator_fractions","algebraic_fraction_products","partial_fraction_decomposition","double_radicals","parameter_equations","inequality_proofs","integer_fractional_parts","reciprocal_power_functions","convex_polygons","pythagorean_converse","heron_formula","logical_connectives","negating_compound_statements","addition_probability","events_number_line","repeated_event_probability","pythagorean_applications","parallelogram_properties","number_intervals","linear_function","rational_equation_word_problems"];
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const url=pathToFileURL(process.cwd()+'/index.html').href;
const sizes=[5,7,10];

function sampleTopic(raw){
 const id='g8:'+raw;
 const target=g8InfoById(id);
 const textNode=document.createElement('div');
 const clean=html=>{
  textNode.innerHTML=String(html??'');
  return textNode.textContent.replace(/\s+/g,' ').trim().toLowerCase();
 };
 const skeleton=text=>text.replace(/\d+(?:[.,]\d+)*/g,'#').replace(/−/g,'-');
 const countMap=map=>map.size;
 const add=(map,key,value)=>{if(!map.has(key))map.set(key,value);};
 const n=120,rawRandom=Math.random,stages=[],issues=[];
 const saved=[];
 const flags=new Map();
 const examplesByStage=[];
 for(let stage=0;stage<3;stage++){
  let state=(0x7f4a7c15+Math.imul(stage+1,0x9e3779b9)+[...raw].reduce((h,c)=>Math.imul(h,31)+c.charCodeAt(0)|0,0))>>>0;
  Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};
  const exact=new Map(),family=new Map(),type=new Map(),answers=new Map(),examples=[];
  let produced=0;
  try{
   for(let i=0;i<n;i++){
    let q;
    try{q=makeG8Question(id,stage);}
    catch(error){add(flags,'generation '+(stage+1),String(error.message));continue;}
    if(!q?.text){add(flags,'empty '+(stage+1),String(q));continue;}
    produced++;
    const prompt=clean(q.text),explanation=clean(q.ex);
    const options=(q.choices??[]).map(o=>[String(o.key),clean(o.label)]);
    const visual=q.visual?.type??'';
    const model=q.visual?.data??null;
    const fingerprint=JSON.stringify([prompt,visual,model,options.map(o=>o[1]).sort()]);
    const answer=clean(q.correctText??q.correctLabel??q.ans);
    const shape=JSON.stringify([skeleton(prompt),visual]);
    const variant=q.templateId??q.audit?.variant??'';
    if(!explanation)add(flags,'explanation '+(stage+1),prompt);
    if(/NaN|Infinity|undefined/.test(String(q.text)+' '+String(q.ex)))add(flags,'invalid '+(stage+1),prompt);
    if(options.length){
     const keys=options.map(o=>o[0]), labels=options.map(o=>o[1]);
     if(new Set(keys).size!==keys.length||keys.filter(k=>k===String(q.ans)).length!==1)
      add(flags,'choices '+(stage+1),prompt);
     if(new Set(labels).size!==labels.length)add(flags,'same label '+(stage+1),prompt);
    }else if(q.answerRat&&(!Number.isSafeInteger(q.answerRat.n)||!Number.isSafeInteger(q.answerRat.d)||q.answerRat.d<=0)){
     add(flags,'numeric '+(stage+1),prompt);
    }
    if(answers.has(fingerprint)&&answers.get(fingerprint)!==answer)
     add(flags,'conflict '+(stage+1),{prompt,visual,answers:[answers.get(fingerprint),answer]});
    add(answers,fingerprint,answer);
    add(exact,fingerprint,{p:prompt.slice(0,220),a:answer.slice(0,130)});
    add(family,shape,{p:prompt.slice(0,220),a:answer.slice(0,130)});
    if(variant)add(type,variant,skeleton(prompt));
    if(examples.length<3&&!examples.some(e=>e.k===(variant||shape)))
     examples.push({k:variant||shape,p:prompt.slice(0,220),a:answer.slice(0,120),e:explanation.slice(0,160)});
   }
  }finally{Math.random=rawRandom;}
  saved.push({exact,type,family});
  examplesByStage.push(examples);
  stages.push([produced,countMap(type),countMap(family),countMap(exact)]);
 }
 const overlap=(left,right,field)=>[...saved[left][field].keys()].filter(k=>saved[right][field].has(k));
 const edges=[[0,1],[1,2],[0,2]].map(([left,right])=>{
  const common=overlap(left,right,'exact'),family=overlap(left,right,'family'),type=overlap(left,right,'type');
  return [common.length,family.length,type.length,common.length?saved[left].exact.get(common[0]).p:null];
 });
 for(const [key,message] of flags)issues.push([key,message]);
 return {raw,title:target.title,course:target.course,stages,edges,issues,examples:examplesByStage};
}

function exerciseTopic({raw,sizes}){
 const id='g8:'+raw,results=[];
 for(let stage=0;stage<3;stage++){
  const anomalies=[],prompts=new Set();
  let solved=0,skips=0;
  try{
   startG8QuizStage(id,stage);
   if(blockSession.topicId!==raw)throw Error('Started wrong topic '+blockSession.topicId);
   for(let i=0;i<sizes[stage];i++){
    if(!q?.text||!document.querySelector('#qstage .quizq')?.textContent.trim())throw Error('Task missing at '+(i+1));
    const fingerprint=JSON.stringify([q.text,q.visual?.data,(q.choices??[]).map(o=>o.label).sort()]);
    if(prompts.has(fingerprint)&&!anomalies.some(x=>x[0]==='repeat'))
     anomalies.push(['repeat',normalizePromptForCompare(q.text).slice(0,170)]);
    prompts.add(fingerprint);
    const before=blockSession.correct;
    let submitted=false;
    if(q.choices?.length){
     const answerIndex=q.choices.findIndex(option=>String(option.key)===String(q.ans));
     const button=document.querySelectorAll('#qstage .answer')[answerIndex];
     if(!button)throw Error('Correct option not rendered at '+(i+1));
     button.click();submitted=true;
    }else if(q.answerRat&&document.querySelector('#quizInput')){
     const {n,d}=q.answerRat;
     document.querySelector('#quizInput').value=d===1?String(n):n+'/'+d;
     checkQuizInput();submitted=true;
    }
    if(submitted){
     if(blockSession.correct===before+1)solved++;
     else if(!anomalies.some(x=>x[0]==='rejected'))anomalies.push(['rejected',normalizePromptForCompare(q.text).slice(0,170)]);
    }
    if(blockSession.done===i){
     if(!skipNormalQuiz())throw Error('Cannot advance at '+(i+1));
     skips++;
    }
    if(blockSession.done!==i+1)throw Error('Wrong progress at '+(i+1)+': '+blockSession.done);
    if(!blockSession.finished)nextQ();
   }
   if(!blockSession.finished)throw Error('Stage not completed');
   const button=[...document.querySelectorAll('#qstage button')].find(el=>el.textContent.includes('Посмотреть результат'));
   if(!button)throw Error('Result button is missing');
   button.click();
   if(progressFor(id).best[stage]!==solved)
    anomalies.push(['score',solved,progressFor(id).best[stage]]);
  }catch(error){anomalies.push(['exception',String(error.message)]);}
  results.push({solved,skips,anomalies});
 }
 return results;
}

async function browserPage(browser){
 const page=await browser.newPage({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 page.setDefaultTimeout(20000);
 await page.goto(url,{waitUntil:'domcontentloaded'});
 return page;
}
function withLimit(promise,ms,reason){
 let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(reason)),ms)});
 return Promise.race([promise,deadline]).finally(()=>clearTimeout(timer));
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browserPage(browser);
  const ids=await page.evaluate(checked=>{
   const excluded=new Set(checked);
   return [...new Set(window.grade8Textbook.chapters.flatMap(ch=>ch.items.flatMap(i=>i[2])))].filter(id=>!excluded.has(id));
  },checked);
  assert.equal(ids.length,87);
  for(const raw of ids){
   const row=await page.evaluate(sampleTopic,raw);
   console.log('G8_S '+JSON.stringify(row));
  }
  await page.close();
  let cursor=0;
  const run=async()=>{
   while(cursor<ids.length){
    const raw=ids[cursor++];
    let target;
    try{
     target=await browserPage(browser);
     const errors=[];
     target.on('pageerror',error=>errors.push(error.message));
     const results=await withLimit(target.evaluate(exerciseTopic,{raw,sizes}),13000,'Stage run timed out');
     console.log('G8_U '+JSON.stringify({raw,results,errors}));
    }catch(error){console.log('G8_U '+JSON.stringify({raw,error:String(error.message)}));}
    finally{await target?.close();}
   }
  };
  await Promise.allSettled([run(),run(),run()]);
  console.log('G8_DONE '+ids.length);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
