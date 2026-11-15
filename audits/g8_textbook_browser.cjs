const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const rebuilt=[
 'algebraic_fraction_domain','algebraic_fraction_basic_property','algebraic_fraction_reduction','algebraic_fraction_add_sub',
 'algebraic_fraction_mul_div','rational_expression_transformations','inverse_proportion_function',
 'like_denominator_fractions','algebraic_fraction_products','partial_fraction_decomposition','double_radicals','parameter_equations','inequality_proofs',
 'integer_fractional_parts','reciprocal_power_functions','convex_polygons','pythagorean_converse','heron_formula',
 'triangle_centers','right_triangle_projections','similarity_constructions','line_and_circle','logical_connectives',
 'negating_compound_statements','addition_probability','events_number_line','repeated_event_probability',
 'pythagorean_applications','parallelogram_properties','number_intervals','linear_function','rational_equation_word_problems'
];
async function testNavigation(page){
 await page.goto(pathToFileURL(process.cwd()+'/index.html').href);
 await page.locator('button[onclick="openGrade(8)"]').click();
 const menu=page.locator('#mk-g8-textbook-nav');
 const search=page.locator('main input[type=search]:visible');
 await menu.waitFor();
 await search.waitFor();
 assert.equal(await search.count(),1);
 const data=await page.evaluate(()=>{
  const groups=[...document.querySelectorAll('#mk-g8-textbook-nav .mk-g5-toc-part')];
  const numbers=groups.map(group=>[...group.querySelectorAll('[data-paragraph]')].map(item=>Number(item.dataset.paragraph)));
  return {numbers,counts:[g5AllTopics().length,g6AllTopics().length,g7AllTopics().length,g8AllTopics().length],
   issues:g8CatalogAudit().issues,missing:document.querySelectorAll('#mk-g8-textbook-nav .mk-g6-toc-unavailable').length,
   overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 assert.deepEqual(data.counts,[74,75,149,133]);
 assert.deepEqual(data.numbers,[[1,51],[46,83],[32,58]].map(([start,end])=>Array.from({length:end-start+1},(_,i)=>start+i)));
 assert.deepEqual(data.issues,[]);
 assert.equal(data.missing,0);
 assert.equal(data.overflow,false);
 await search.fill('вероятность 57');
 await menu.locator('[data-topic-id="g8:independent_events"]:visible').waitFor();
 assert.equal(await menu.locator('[data-paragraph]:visible').count(),1);
 for(const [query,id] of [['алгебра 27','rational_equation_word_problems'],['алгебра 38','number_intervals'],['алгебра 44','linear_function']]){
  await search.fill(query);
  await menu.locator('[data-topic-id="g8:'+id+'"]:visible').waitFor();
 }
 await search.fill('геометрия 62');
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').waitFor();
 assert.equal(await menu.locator('details:visible').count(),1);
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').click();
 assert.equal(await page.locator('#modal .stage-card').count(),3);
 await page.reload();
 await page.locator('#modal .stage-card').first().waitFor();
 assert.equal(await page.evaluate(()=>currentGrade),8);
 await page.evaluate(()=>mk872BrandGoHome());
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/133.*0\/399/);
 await page.reload();
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/133.*0\/399/);
}
async function testSessions(page){
 const total={generated:0,questions:0,sessions:0};
 for(const id of rebuilt){
  const result=await page.evaluate(raw=>{
   const result={generated:0,questions:0,sessions:0};
   const verify=(ok,message)=>{if(!ok)throw Error(message);};
   const id='g8:'+raw,families=[];
   for(let stage=0;stage<3;stage++){
    const variants=new Set();
    for(let i=0;i<100;i++){
     const question=makeG8Question(id,stage);
     verify(question?.text&&question.ex&&question.sig&&question.ans!==undefined,id+' incomplete question');
     verify(!/NaN|Infinity|undefined/.test(question.text+question.ex),id+' invalid text');
     const options=question.choices?.map(option=>String(option.key))||[];
     if(options.length)verify(new Set(options).size===options.length&&options.includes(String(question.ans)),question.text);
     else verify(Number.isSafeInteger(question.answerRat?.n)&&question.answerRat?.d>0,question.text);
     variants.add(question.templateId);
     result.generated++;
    }
    families.push(variants);
    for(let run=0;run<3;run++){
     const seen=new Set();
     startG8QuizStage(id,stage);
     for(let i=0;i<STAGES[stage].count;i++){
      verify(document.querySelector('#qstage .quizq')?.textContent.trim(),id+' missing problem');
      const fingerprint=JSON.stringify([q.text,q.visual?.data]);
      verify(!seen.has(fingerprint),id+' repeated prompt '+q.text);
      seen.add(fingerprint);
      if(q.templateId==='@@P_hard_perimeter')verify(q.text.includes('AB, BC и CD'),q.text);
      if(i%2===0){
       if(q.choices.length){
        const selected=q.choices.findIndex(item=>String(item.key)===String(q.ans));
        document.querySelectorAll('#qstage .answer')[selected].click();
       }else{
        const rationalAnswer=q.answerRat;
        document.getElementById('quizInput').value=rationalAnswer.d===1?String(rationalAnswer.n):rationalAnswer.n+'/'+rationalAnswer.d;
        checkQuizInput();
       }
       verify(blockSession.correct===Math.floor(i/2)+1,id+' did not accept the answer to '+q.text);
      }else verify(skipNormalQuiz(),id+' skip failed');
      verify(blockSession.done===i+1,id+' wrong progress');
      if(!blockSession.finished)nextQ();
      result.questions++;
     }
     verify(blockSession.finished,id+' attempt unfinished');
     result.sessions++;
    }
   }
   if(raw==='pythagorean_applications'){
    verify(JSON.stringify(families.map(group=>group.size))==='[5,7,10]',id+' lost a scenario');
    verify(new Set(families.flatMap(group=>[...group])).size===22,id+' shares scenarios across levels');
   }else if(raw==='triangle_centers'){
    verify(JSON.stringify(families.map(group=>group.size))==='[5,4,4]',id+' lost a scenario');
    verify(new Set(families.flatMap(group=>[...group])).size===13,id+' shares scenarios across levels');
   }else if(raw!=='parallelogram_properties'){
    verify(families.every(group=>group.size===4)&&new Set(families.flatMap(group=>[...group])).size===12,id+' lost an exclusive scenario');
   }
   return result;
  },id);
  for(const key of Object.keys(total))total[key]+=result[key];
 }
 const exact=await page.evaluate(()=>{
  for(let i=0;i<300;i++){
   const task=makeG8Question('g8:pythagorean_applications',1);
   if(task.templateId==='area'&&task.answerRat.d===2)return task.answerRat.n%2===1;
  }
  return false;
 });
 assert.equal(exact,true,'An odd half was lost in area answer');
 assert.deepEqual(total,{generated:9600,questions:2112,sessions:288});
 return total;
}

(async()=>{
 for(const width of [390,320,1280]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  try{
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await testNavigation(page);
   const result=width===390&&!process.env.MATKVEST_G8_NAV_ONLY?await testSessions(page):{};
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,...result}));
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
