const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const applicationTopics=[
 'triangle_midline','triangle_centers','triangle_centroid','right_triangle_projections','similarity_constructions','similarity_applications'
];
const trigonometryTopics=['acute_angle_trig_ratios','trig_identity','special_angles_trig'];
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
 await page.goto(pathToFileURL(process.cwd()+'/index.html').href,{waitUntil:'domcontentloaded'});
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
 assert.deepEqual(data.counts,[74,75,149,136]);
 assert.deepEqual(data.numbers,[[1,51],[46,83],[32,58]].map(([start,end])=>Array.from({length:end-start+1},(_,i)=>start+i)));
 assert.deepEqual(data.issues,[]);
 assert.equal(data.missing,0);
 assert.equal(data.overflow,false);
 await search.fill('вероятность 57');
 await menu.locator('[data-topic-id="g8:independent_events"]:visible').waitFor();
 assert.equal(await menu.locator('[data-paragraph]:visible').count(),1);
 for(const [query,id] of [
  ['алгебра 27','rational_equation_word_problems'],['алгебра 38','number_intervals'],['алгебра 44','linear_function'],
  ['геометрия 66','similarity_by_angles'],['геометрия 67','similarity_by_two_sides'],['геометрия 68','similarity_by_three_sides'],
  ['геометрия 69','triangle_midline'],['геометрия 70','triangle_centers'],['геометрия 71','right_triangle_projections'],
  ['геометрия 72','similarity_constructions'],['геометрия 73','similarity_applications']
 ]){
  await search.fill(query);
  await menu.locator('[data-topic-id="g8:'+id+'"]:visible').waitFor();
 }
 const trigRows=await menu.locator('.mk-g5-toc-part').nth(1).locator('[data-paragraph="74"], [data-paragraph="75"]').evaluateAll(rows=>
  rows.map(row=>[...row.querySelectorAll('[data-topic-id]')].map(button=>button.dataset.topicId))
 );
 assert.deepEqual(trigRows,[['g8:acute_angle_trig_ratios','g8:trig_identity'],['g8:special_angles_trig']]);
 await search.fill('геометрия 62');
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').waitFor();
 assert.equal(await menu.locator('details:visible').count(),1);
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').click();
 assert.equal(await page.locator('#modal .stage-card').count(),3);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#modal .stage-card').first().waitFor();
 assert.equal(await page.evaluate(()=>currentGrade),8);
 await page.evaluate(()=>mk872BrandGoHome());
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/136.*0\/408/);
 await page.reload({waitUntil:'domcontentloaded'});
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/136.*0\/408/);
}
async function testSimilarity(page){
 return page.evaluate(({applicationTopics,trigonometryTopics})=>{
  const check=(condition,message)=>{if(!condition)throw Error(message);};
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function checkTriangle(triangle){
   const {sides,angles=[],labels=[]}=triangle;
   const [ab,ac,bc]=sides;
   check(sides.every(s=>Number.isFinite(s)&&s>0)&&ab+ac>bc&&ac+bc>ab&&ab+bc>ac,'Invalid triangle');
   labels.forEach((label,index)=>{
    if(typeof label==='number')check(label===sides[index],'Side label differs from its length');
   });
   const angle=(left,right,opposite)=>180*Math.acos((left*left+right*right-opposite*opposite)/(2*left*right))/Math.PI;
   const measured=[angle(ab,ac,bc),angle(ab,bc,ac),angle(ac,bc,ab)];
   angles.forEach((label,index)=>{
    if(label?.endsWith('°'))check(Math.abs(parseFloat(label)-measured[index])<1e-6,'Angle label differs from its measure');
   });
  }
  function checkFigure(model){
   const polygons=[...document.querySelectorAll('#qstage svg polygon.geo-face')];
   check(polygons.length===2,'Missing pair of triangles');
   const svg=polygons[0].ownerSVGElement,box=svg.getBoundingClientRect();
   check(box.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Geometry is clipped');
   const labels=[...svg.querySelectorAll('text')];
   [model.left,model.right].forEach((triangle,i)=>{
    const vertices=polygons[i].points;
    check(vertices.length===3,'Incomplete triangle');
    const ab=distance(vertices[0],vertices[1]),ac=distance(vertices[0],vertices[2]),bc=distance(vertices[1],vertices[2]);
    check(Math.abs(ac/ab-triangle.sides[1]/triangle.sides[0])<1e-5&&
          Math.abs(bc/ab-triangle.sides[2]/triangle.sides[0])<1e-5,'Drawn sides distort the triangle');
    [...triangle.vertices,...(triangle.angles??[]),...(triangle.labels??[])].filter(label=>label!=null).forEach(label=>{
     check(labels.some(el=>el.textContent===String(label)),'Missing SVG label '+label);
    });
   });
   for(const label of labels){
    check(parseFloat(getComputedStyle(label).fontSize)>=23,'Small SVG label '+label.textContent);
    const labelBox=label.getBoundingClientRect();
    check(labelBox.left>=box.left-1&&labelBox.right<=box.right+1&&labelBox.top>=box.top-1&&labelBox.bottom<=box.bottom+1,
     'Clipped SVG label '+label.textContent);
   }
  }
  const legacy='g8:triangle_similarity_tests',legacyProgress=progressFor(legacy);
  legacyProgress.best=[4,6,9];
  check(g8InfoById(legacy)&&makeG8Question(legacy,2)?.text,'Original workout is unavailable');
  function checkProjection(model){
   const svg=document.querySelector('#qstage svg.geometry-svg');
   check(svg?.querySelectorAll('.geo-right').length===2,'Missing two right-angle marks');
   const points=svg.querySelector('polygon.geo-face').points;
   const [a,b,c]=[points[0],points[1],points[2]];
   const p=c.x-a.x,q=b.x-c.x,h=a.y-c.y;
   check(p>0&&q>0&&h>0&&Math.abs(p/q-model.p/model.q)<1e-5,'Incorrect projection ratio');
   check(Math.abs(h*h/(p*q)-1)<1e-5,'Altitude is not the geometric mean of the projections');
   const box=svg.getBoundingClientRect();
   check(box.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Altitude drawing is clipped');
   check([...svg.querySelectorAll('text')].map(label=>label.textContent).join('')==='ABHC','Wrong altitude labels');
  }
  function checkTrigonometryFigure(model){
   checkTriangle(model);
   const svg=document.querySelector('#qstage svg.geometry-svg');
   check(svg?.querySelectorAll('.geo-right').length===1,'Missing right-angle mark');
   const [c,a,b]=svg.querySelector('polygon.geo-face').points;
   check(Math.abs(distance(c,b)/distance(c,a)-model.sides[1]/model.sides[0])<1e-5,'Trigonometry diagram distorts the legs');
   const box=svg.getBoundingClientRect();
   check(box.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Trigonometry drawing is clipped');
   const labels=[...svg.querySelectorAll('text')];
   for(const value of [...model.vertices,...model.angles,...model.labels].filter(value=>value!=null)){
    check(labels.some(label=>label.textContent===String(value)),'Missing trigonometry label '+value);
   }
   for(const label of labels){
    const bounds=label.getBoundingClientRect();
    check(bounds.left>=box.left-1&&bounds.right<=box.right+1&&bounds.top>=box.top-1&&bounds.bottom<=box.bottom+1,
     'Clipped trigonometry label '+label.textContent);
   }
  }
  const totals={similarityQuestions:0,similarityDrawings:0,applicationQuestions:0,projectionDrawings:0,
   trigonometryQuestions:0,trigonometryDrawings:0};
  const criteria=['similarity_by_angles','similarity_by_two_sides','similarity_by_three_sides'];
  for(const raw of [...criteria,...applicationTopics,...trigonometryTopics]){
   const criterion=criteria.includes(raw),trigonometry=trigonometryTopics.includes(raw);
   const id='g8:'+raw,templates=new Set();
   for(let stage=0;stage<3;stage++){
    const count=STAGES[stage].count,generated=new Set();
    for(let i=0;i<250;i++){
     const task=makeG8Question(id,stage);
     check((task.audit?.topic??task.audit?.raw)===raw&&task.audit?.stage===stage,raw+' generated from the wrong pool');
     generated.add(task.templateId);
     if(criterion&&task.visual){
      check(task.visual.type==='geometry',raw+' uses an unexpected visual');
      checkTriangle(task.visual.data.left);
      checkTriangle(task.visual.data.right);
     }
    }
    check(generated.size===count,raw+' missed a template');
    for(const template of generated){
     check(!templates.has(template),raw+' reused a template across levels');
     templates.add(template);
    }
    startG8QuizStage(id,stage);
    const seen=new Set();
    for(let i=0;i<count;i++){
     check(!seen.has(q.templateId),raw+' repeated a template');
     seen.add(q.templateId);
     if(criterion&&q.visual){
      checkFigure(q.visual.data);
      totals.similarityDrawings++;
     }else if(q.visual?.data.kind==='g7-g8-altitude-to-hypotenuse'){
      checkProjection(q.visual.data);
      totals.projectionDrawings++;
     }else if(q.visual?.data.kind==='g7-g8-right-trig'){
      checkTrigonometryFigure(q.visual.data);
      totals.trigonometryDrawings++;
     }
     if(q.choices.length){
      const index=q.choices.findIndex(option=>String(option.key)===String(q.ans));
      check(index>=0,raw+' has no correct option');
      document.querySelectorAll('#qstage .answer')[index].click();
     }else{
      const {n,d}=q.answerRat;
      document.querySelector('#quizInput').value=d===1?String(n):n+'/'+d;
      checkQuizInput();
     }
     check(blockSession.correct===i+1,raw+' rejected a correct answer in '+q.templateId);
     check(blockSession.done===i+1,raw+' did not record progress');
     if(!blockSession.finished)nextQ();
     if(criterion)totals.similarityQuestions++;
     else if(trigonometry)totals.trigonometryQuestions++;
     else totals.applicationQuestions++;
    }
    check(blockSession.finished,raw+' did not finish the stage');
    const resultButton=[...document.querySelectorAll('#qstage button')].find(button=>button.textContent.includes('Посмотреть результат'));
    check(resultButton,raw+' did not show the result button');
    resultButton.click();
    check(progressFor(id).best[stage]===count,raw+' did not save the stage result');
   }
  }
  check(JSON.stringify(legacyProgress.best)==='[4,6,9]', 'Original workout progress changed');
  check(totals.similarityDrawings===9&&totals.similarityQuestions===66,'Missing similarity problems or visuals');
  check(totals.applicationQuestions===132&&totals.projectionDrawings===5,'Missing application problems or altitude diagrams');
  check(totals.trigonometryQuestions===66&&totals.trigonometryDrawings===11,'Missing trigonometry problems or diagrams');
  return totals;
 },{applicationTopics,trigonometryTopics});
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
   }else if(['triangle_centers','right_triangle_projections','similarity_constructions'].includes(raw)){
    verify(JSON.stringify(families.map(group=>group.size))==='[5,7,10]',id+' lost a scenario');
    verify(new Set(families.flatMap(group=>[...group])).size===22,id+' shares scenarios across levels');
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
   page.setDefaultTimeout(20000);
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await testNavigation(page);
   console.log(JSON.stringify({width,navigation:'pass'}));
   const similarity=await testSimilarity(page);
   const result=width===390&&!process.env.MATKVEST_G8_NAV_ONLY?await testSessions(page):{};
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,...similarity,...result}));
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
