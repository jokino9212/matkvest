const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const applicationTopics=[
 'triangle_midline','triangle_centers','triangle_centroid','right_triangle_projections','similarity_constructions','similarity_applications'
];
const trigonometryTopics=['acute_angle_trig_ratios','trig_identity','special_angles_trig'];
const circleTopics=['line_and_circle','circle_relative_positions','circle_tangency','common_tangents_two_circles'];
const arcTopics=['arc_degree_measure','central_inscribed_angles'];
const circleAngleTopics=['tangent_chord_angle','chords_secants_angles','tangential_quadrilateral','cyclic_quadrilateral'];
const adjustedMasterTopics=[
 'square_root_arithmetic','equation_x2_equals_a','square_root_properties',
 'root_expression_transformations','root_calculations_applications',
 'incomplete_quadratic_equations','quadratic_equation_types','quadratic_roots_cases',
 'quadratic_word_problems','vieta_theorem','quadratic_trinomial_factorization','fractional_rational_equations',
 'two_variable_equation_graph','graphical_equations_systems','numerical_inequalities_properties','direct_proportion_function',
 'integer_exponent_definition','integer_exponent_properties','scientific_notation','scientific_notation_operations',
 'elementary_favorable_events','data_dispersion','standard_deviation','scatter_plot','disjoint_events_addition',
 'conditional_probability','probability_multiplication_rule'
];
const solutionMethodTopics=[
 'linear_system_substitution','linear_system_elimination','set_union_intersection',
 'central_symmetry','sets_elements_subsets','set_complement_properties',
 'set_diagrams_applications','tree_graph_basics','tree_unique_path_leaves'
];
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
 assert.deepEqual(data.counts,[74,75,149,137]);
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
 const geometryRows=await menu.locator('.mk-g5-toc-part').nth(1).locator('[data-paragraph]').evaluateAll(rows=>
  rows.filter(row=>Number(row.dataset.paragraph)>=74&&Number(row.dataset.paragraph)<=83)
   .map(row=>[...row.querySelectorAll('[data-topic-id]')].map(button=>button.dataset.topicId))
 );
 assert.deepEqual(geometryRows,[
  ['g8:acute_angle_trig_ratios','g8:trig_identity'],['g8:special_angles_trig'],
  ['g8:line_and_circle'],['g8:circle_relative_positions','g8:circle_tangency'],['g8:common_tangents_two_circles'],
  ['g8:arc_degree_measure'],['g8:central_inscribed_angles'],['g8:tangent_chord_angle','g8:chords_secants_angles'],
  ['g8:tangential_quadrilateral'],['g8:cyclic_quadrilateral']
 ]);
 await search.fill('геометрия 62');
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').waitFor();
 assert.equal(await menu.locator('details:visible').count(),1);
 await menu.locator('[data-topic-id="g8:heron_formula"]:visible').click();
 assert.equal(await page.locator('#modal .stage-card').count(),3);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#modal .stage-card').first().waitFor();
 assert.equal(await page.evaluate(()=>currentGrade),8);
 await page.evaluate(()=>mk872BrandGoHome());
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/137.*0\/411/);
 await page.reload({waitUntil:'domcontentloaded'});
 assert.match(await page.locator('#g8HomeProgress').textContent(),/0\/137.*0\/411/);
}
async function testGeometry(page,section='similarity'){
 return page.evaluate(({applicationTopics,trigonometryTopics,circleTopics,arcTopics,circleAngleTopics,section})=>{
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
  function checkCircleFigure(model,question){
   const svg=document.querySelector('#qstage svg.geometry-svg');
   const box=svg.getBoundingClientRect();
   check(box.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Circle drawing is clipped');
   const circles=[...svg.querySelectorAll('circle.geo-circle')].map(circle=>({
    x:Number(circle.getAttribute('cx')),y:Number(circle.getAttribute('cy')),r:Number(circle.getAttribute('r'))
   }));
   const lineDistance=(point,line)=>{
    const [x1,y1,x2,y2]=['x1','y1','x2','y2'].map(name=>Number(line.getAttribute(name)));
    return Math.abs((x2-x1)*(point.y-y1)-(y2-y1)*(point.x-x1))/Math.hypot(x2-x1,y2-y1);
   };
   if(model.kind==='g7-g8-circle-line'){
    check(circles.length===1,'Missing circle');
    const [circle]=circles,line=svg.querySelector('line.g8-tested-line');
    check(Math.abs(lineDistance(circle,line)/circle.r-model.distance/model.radius)<1e-5,'Incorrect center-to-line distance');
   }else{
    check(circles.length===2,'Missing pair of circles');
    const [big,small]=circles,scale=big.r/model.big;
    check(Math.abs(small.r/scale-model.small)<1e-7,'Misdrawn circle radius');
    check(Math.abs(distance(big,small)/scale-model.distance)<1e-7,'Incorrect distance between drawn centers');
    if(model.tangents){
     const direct=[1,-1].map(side=>model.big-side*model.small)
      .reduce((total,bound)=>total+(model.distance>bound?2:model.distance===bound?1:0),0);
     const lines=[...svg.querySelectorAll('.g8-common-tangent')];
     check(lines.length===direct&&Number(question.ans)===direct,'Incorrect number of common tangents');
     for(const line of lines){
      for(const circle of circles)check(Math.abs(lineDistance(circle,line)-circle.r)<0.01,'A common tangent misses a circle');
     }
    }
   }
  }
  function checkArcFigure(model){
   const svg=document.querySelector('#qstage svg.geometry-svg');
   const box=svg.getBoundingClientRect();
   check(box.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Arc drawing is clipped');
   const circle=svg.querySelector('.geo-circle');
   const center={x:Number(circle.getAttribute('cx')),y:Number(circle.getAttribute('cy'))},radius=Number(circle.getAttribute('r'));
   const rays=[...svg.querySelectorAll('.g8-arc-ray')];
   check(rays.length===2&&svg.querySelectorAll('.g8-marked-arc').length===1,'Missing marked arc or angle sides');
   const point=(ray,k)=>({x:Number(ray.getAttribute('x'+k)),y:Number(ray.getAttribute('y'+k))});
   const vertex=point(rays[0],1);
   const [first,second]=rays.map(ray=>point(ray,2));
   const endpoints=[first,second];
   check(endpoints.every(endpoint=>Math.abs(distance(endpoint,center)-radius)<0.002),'Arc endpoints are off the circle');
   check(Math.abs(distance(vertex,center)-(model.mode==='central'?0:radius))<0.002,'Wrong angle vertex');
   const a=distance(vertex,first),b=distance(vertex,second),c=distance(first,second);
   const degrees=Math.acos((a*a+b*b-c*c)/(2*a*b))*180/Math.PI;
   check(Math.abs(degrees-model.arc/(model.mode==='central'?1:2))<0.002,'Drawn angle does not match the arc');
  }
  function checkCircleAngleFigure(model){
   const svg=document.querySelector('#qstage svg.geometry-svg');
   const box=svg?.getBoundingClientRect();
   check(box?.width>100&&box.left>=-1&&box.right<=innerWidth+1,'Circle angle figure is clipped');
   const center={x:model.cx,y:model.cy};
   const angle=(a,o,b)=>{
    const u={x:a.x-o.x,y:a.y-o.y},v={x:b.x-o.x,y:b.y-o.y};
    return Math.acos((u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))*180/Math.PI;
   };
   const near=(actual,expected)=>Math.abs(actual-expected)<1e-5;
   const onCircle=p=>near(distance(p,center),model.r);
   const text=[...svg.querySelectorAll('text')].map(label=>label.textContent);
   for(const value of Object.values(model.labels)){
    check(text.includes(value),'Missing figure label '+value);
   }
   if(model.type==='tangent'){
    const {A,B,arc}=model;
    check(onCircle(A)&&onCircle(B)&&near(angle(B,A,{x:A.x,y:A.y-1}),arc/2),'Tangent-chord angle disagrees with the arc');
   }else if(model.type==='inside'){
    const {A,B,C,D,P}=model;
    check([A,B,C,D].every(onCircle),'Chord endpoint outside the circle');
    check(near(distance(C,P)+distance(P,D),distance(C,D))&&near(distance(A,P)+distance(P,B),distance(A,B)),
     'The chord intersection does not lie on both chords');
    check(near(angle(A,P,C),(angle(A,center,C)+angle(B,center,D))/2),'Crossing chords give an incorrect angle');
   }else{
    const {A,B,C,D}=model.vertices;
    if(model.type==='cyclic'){
     check([A,B,C,D].every(onCircle)&&near(angle(D,A,B)+angle(B,C,D),180),'Invalid cyclic quadrilateral');
     if(model.labels.A)check(near(angle(D,A,B),parseFloat(model.labels.A)),'Label at A is not the drawn angle');
    }else{
     for(const [a,b] of [[A,B],[B,C],[C,D],[D,A]]){
      const dx=b.x-a.x,dy=b.y-a.y;
      const signedDistance=(dx*(center.y-a.y)-dy*(center.x-a.x))/Math.hypot(dx,dy);
      check(near(Math.abs(signedDistance),model.r),'Inscribed circle is not tangent to the trapezoid');
     }
    }
   }
  }
  if(section==='arcs'){
   progressFor('g8:central_inscribed_angles').best=[3,5,7];
   check(progressFor('g8:arc_degree_measure').best.every(value=>value===0),'The new arc workout shares the inscribed-angle progress');
  }
  const totals={similarityQuestions:0,similarityDrawings:0,applicationQuestions:0,projectionDrawings:0,
   trigonometryQuestions:0,trigonometryDrawings:0,circleQuestions:0,circleDrawings:0,arcQuestions:0,arcDrawings:0,circleAngleQuestions:0,circleAngleDrawings:0};
  const criteria=['similarity_by_angles','similarity_by_two_sides','similarity_by_three_sides'];
  const topics={circles:circleTopics,trigonometry:trigonometryTopics,arcs:arcTopics,circleAngles:circleAngleTopics,similarity:[...criteria,...applicationTopics]}[section];
  for(const raw of topics){
   const criterion=criteria.includes(raw);
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
     }else if(['g7-g8-circle-line','g7-g8-circle-pair'].includes(q.visual?.data.kind)){
      checkCircleFigure(q.visual.data,q);
      totals.circleDrawings++;
     }else if(q.visual?.data.kind==='g7-g8-arc-angle'){
      checkArcFigure(q.visual.data);
      totals.arcDrawings++;
     }else if(section==='circleAngles'&&q.visual){
      checkCircleAngleFigure(q.visual.data);
      totals.circleAngleDrawings++;
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
     else if(section==='trigonometry')totals.trigonometryQuestions++;
     else if(section==='circles')totals.circleQuestions++;
     else if(section==='arcs')totals.arcQuestions++;
     else if(section==='circleAngles')totals.circleAngleQuestions++;
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
  if(section==='circleAngles'){
   check(totals.circleAngleQuestions===88&&totals.circleAngleDrawings===7,'Missing circle angle questions or diagrams');
   return {circleAngleQuestions:totals.circleAngleQuestions,circleAngleDrawings:totals.circleAngleDrawings};
  }
  if(section==='arcs'){
   check(totals.arcQuestions===44&&totals.arcDrawings===6,'Missing arc questions or diagrams');
   return {arcQuestions:totals.arcQuestions,arcDrawings:totals.arcDrawings};
  }
  if(section==='circles'){
   check(totals.circleQuestions===88&&totals.circleDrawings===15,'Missing circle problems or diagrams');
   return {circleQuestions:totals.circleQuestions,circleDrawings:totals.circleDrawings};
  }
  if(section==='trigonometry'){
   check(totals.trigonometryQuestions===66&&totals.trigonometryDrawings===11,'Missing trigonometry problems or diagrams');
   return {trigonometryQuestions:totals.trigonometryQuestions,trigonometryDrawings:totals.trigonometryDrawings};
  }
  check(totals.similarityDrawings===9&&totals.similarityQuestions===66,'Missing similarity problems or visuals');
  check(totals.applicationQuestions===132&&totals.projectionDrawings===5,'Missing application problems or altitude diagrams');
  return {similarityQuestions:totals.similarityQuestions,similarityDrawings:totals.similarityDrawings,
   applicationQuestions:totals.applicationQuestions,projectionDrawings:totals.projectionDrawings};
 },{applicationTopics,trigonometryTopics,circleTopics,arcTopics,circleAngleTopics,section});
}

async function testAdjustedMaster(page,topics){
 return page.evaluate(topics=>{
  const verify=(ok,message)=>{if(!ok)throw Error(message);};
  const shape=task=>JSON.stringify([
   normalizePromptForCompare(task.text).replace(/\d+(?:[.,]\d+)*/g,'#'),task.visual?.type??''
  ]);
  let masterQuestions=0;
  for(const topic of topics){
   const id='g8:'+topic,lower=new Set(),types=new Set();
   for(const stage of [0,1]){
    for(let index=0;index<150;index++)lower.add(shape(makeG8Question(id,stage)));
   }
   for(let index=0;index<250;index++){
    const task=makeG8Question(id,2);
    verify(task.audit?.type==='g8Textbook'&&task.audit.topic===topic&&task.audit.stage===2,id+' bypassed the updated Master generator');
    verify(!lower.has(shape(task)),id+' reused a lower-level prompt: '+normalizePromptForCompare(task.text));
    types.add(task.templateId);
   }
   verify(types.size===10,id+' needs ten different Master types');
   startG8QuizStage(id,2);
   const seen=new Set();
   for(let index=0;index<STAGES[2].count;index++){
    verify(!seen.has(q.templateId),id+' repeated a Master type');
    seen.add(q.templateId);
    if(q.visual?.type==='coordinatePlane'){
     const plot=[...document.querySelectorAll('#qstage svg')].find(el=>el.querySelector('line,polyline,path')&&el.getBoundingClientRect().width>100);
     verify(plot,id+' did not display the graph');
     const bounds=plot.getBoundingClientRect();
     verify(bounds.left>=-1&&bounds.right<=innerWidth+1,id+' cropped the graph');
    }
    if(q.choices.length){
     const answer=q.choices.findIndex(option=>String(option.key)===String(q.ans));
     verify(answer>=0,id+' has no correct choice');
     document.querySelectorAll('#qstage .answer')[answer].click();
    }else{
     const {n,d}=q.answerRat;
     document.querySelector('#quizInput').value=d===1?String(n):n+'/'+d;
     checkQuizInput();
    }
    verify(blockSession.correct===index+1&&blockSession.done===index+1,id+' rejected '+q.templateId);
    if(!blockSession.finished)nextQ();
    masterQuestions++;
   }
   const button=[...document.querySelectorAll('#qstage button')].find(el=>el.textContent.includes('Посмотреть результат'));
   verify(blockSession.finished&&button,id+' did not show the training result');
   button.click();
   verify(progressFor(id).best[2]===10,id+' did not save the Master result');
  }
  return {masterQuestions};
 },topics);
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
   if(['pythagorean_applications','triangle_centers','right_triangle_projections','similarity_constructions','line_and_circle'].includes(raw)){
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

async function testWarmupTraining(page,topics,checkLayout=true){
 return page.evaluate(({topics,checkLayout})=>{
  const verify=(ok,message)=>{if(!ok)throw Error(message);};
  const normalized=task=>normalizePromptForCompare(task.text);
  const shape=task=>JSON.stringify([normalized(task).replace(/\d+(?:[.,]\d+)*/g,'#'),task.visual?.type??'']);
  let seed=39781;
  Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const totals={topics:0,types:0,sessions:0,answers:0};
  for(const raw of topics){
   const id='g8:'+raw,training=new Set(),warmup=new Set();
   const expectedTypes=raw==='geometry_grade8_review'?8:5;
   for(let index=0;index<600;index++)training.add(shape(makeG8Question(id,1)));
   for(let index=0;index<300;index++){
    const task=makeG8Question(id,0);
    verify(task.audit?.type==='g8Textbook'&&task.audit.topic===raw&&task.audit.stage===0,id+' bypassed the new Warm-up generator');
    verify(task.text&&task.ex&&task.sig&&!/undefined|NaN|Infinity/.test(task.text+task.ex),id+' invalid content '+task.templateId);
    verify(!training.has(shape(task)),id+' overlaps Training: '+normalized(task));
    const items=task.choices.map(option=>normalizePromptForCompare(option.label));
    verify(items.every(Boolean)&&new Set(items).size===items.length,id+' invalid options '+task.templateId);
    warmup.add(task.templateId);
   }
   verify(warmup.size===expectedTypes,id+' missing Warm-up types');
   const seen=new Set(),count=STAGES[0].count;
   let attempts=0;
   while(seen.size<expectedTypes&&attempts<20){
    startG8QuizStage(id,0);
    const inSession=new Set();
    for(let step=0;step<count;step++){
     const task=q;
     verify(document.querySelector('#qstage .quizq')?.textContent.trim(),id+' prompt is missing');
     verify(warmup.has(task.templateId)&&!inSession.has(task.templateId),id+' unexpected or repeated type '+task.templateId);
     inSession.add(task.templateId);
     seen.add(task.templateId);
     if(task.visual){
      const visual=task.visual.type==='tableData'?'#qstage table':'#qstage svg';
      const element=document.querySelector(visual);
      verify(element,id+' visual is missing '+task.templateId);
      if(checkLayout){
       const size=element.getBoundingClientRect();
       verify(size.width>100&&size.left>=-1&&size.right<=innerWidth+1,id+' visual is clipped '+task.templateId);
      }
     }
     if(task.choices.length){
      const index=task.choices.findIndex(option=>String(option.key)===String(task.ans));
      verify(index>=0,id+' missing correct option '+task.templateId);
      document.querySelectorAll('#qstage .answer')[index].click();
     }else{
      const {n,d}=task.answerRat;
      if(stage18UsesFractionBoxes(task)){
       document.querySelector('#quizFracNum').value=String(n);
       document.querySelector('#quizFracDen').value=String(d);
      }else{
       document.querySelector('#quizInput').value=d===1?String(n):n+'/'+d;
      }
      checkQuizInput();
     }
     verify(blockSession.correct===step+1&&blockSession.done===step+1,id+' answer rejected '+task.templateId);
     totals.answers++;
     if(!blockSession.finished)nextQ();
    }
    const button=[...document.querySelectorAll('#qstage button')].find(el=>el.textContent.includes('Посмотреть результат'));
    verify(blockSession.finished&&button,id+' result is missing');
    button.click();
    verify(progressFor(id).best[0]===count,id+' result was not saved');
    totals.sessions++;
    attempts++;
   }
   verify(seen.size===expectedTypes,id+' not all types opened in a session');
   totals.types+=seen.size;
   totals.topics++;
  }
  return totals;
 },{topics,checkLayout});
}

async function testSolutionMethods(page,topics,checkLayout=true){
 return page.evaluate(({topics,checkLayout})=>{
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  const shape=task=>JSON.stringify([normalizePromptForCompare(task.text)
   .replace(/−/g,'-').replace(/[-+]?\d+(?:[.,]\d+)*/g,'#'),task.visual?.type??'']);
  const variant=task=>task.templateId??task.audit?.variant;
  const answer=rat=>rat.d===1?String(rat.n):rat.n+'/'+rat.d;
  let seed=39781;
  Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const totals={topics:0,sessions:0,answers:0,newWarmup:0,newMaster:0};

  function submit(task,id){
   if(task.choices?.length){
    const slot=task.choices.findIndex(option=>String(option.key)===String(task.ans));
    assert(slot>=0,id+' missing choice '+variant(task));
    document.querySelectorAll('#qstage .answer')[slot].click();
    return;
   }
   if(task.answerMode==='coordinate'){
    document.querySelector('#quizInputX').value=answer(task.answerPoint.x);
    document.querySelector('#quizInputY').value=answer(task.answerPoint.y);
   }else{
    const response=task.answerMode==='multi'?task.answerList.join(' '):
     task.answerRat?answer(task.answerRat):task.correctText;
    assert(response!==undefined,id+' unsupported answer '+task.answerMode);
    document.querySelector('#quizInput').value=response;
   }
   checkQuizInput();
  }

  for(const raw of topics){
   const id='g8:'+raw;
   const stages=[0,1,2].map(stage=>{
    const prompts=new Set(),variants=new Set();
    for(let index=0;index<800;index++){
     const task=makeG8Question(id,stage);
     assert(task?.text&&task.ex&&task.sig&&!/undefined|NaN|Infinity/.test(task.text+task.ex),id+' incomplete prompt');
     prompts.add(shape(task));
     variants.add(variant(task));
    }
    return {prompts,variants};
   });

   for(const stage of [0,1,2]){
    startG8QuizStage(id,stage);
    const seen=new Set();
    const count=STAGES[stage].count;
    for(let step=0;step<count;step++){
     const task=q;
     assert(document.querySelector('#qstage .quizq')?.textContent.trim(),id+' missing prompt');
     assert(!seen.has(variant(task)),id+' repeated type '+variant(task));
     stages[stage].prompts.add(shape(task));
     stages[stage].variants.add(variant(task));
     seen.add(variant(task));
     if(task.visual){
      const visual=task.visual.type==='tableData'?'#qstage table':'#qstage svg';
      const element=document.querySelector(visual);
      assert(element,id+' missing drawing '+variant(task));
      if(checkLayout){
       const size=element.getBoundingClientRect();
       assert(size.width>100&&size.left>=-1&&size.right<=innerWidth+1,id+' clipped drawing '+variant(task));
      }
     }
     submit(task,id);
     assert(blockSession.correct===step+1&&blockSession.done===step+1,id+' rejected '+variant(task));
     if(stage===0&&task.audit?.type==='g8Textbook')totals.newWarmup++;
     if(stage===2&&task.audit?.replaces)totals.newMaster++;
     totals.answers++;
     if(!blockSession.finished)nextQ();
    }
    const button=[...document.querySelectorAll('#qstage button')].find(el=>el.textContent.includes('Посмотреть результат'));
    assert(blockSession.finished&&button,id+' missing result');
    button.click();
    assert(progressFor(id).best[stage]===count,id+' result was not saved');
    totals.sessions++;
   }

   for(const [lower,upper] of [[0,1],[1,2],[0,2]]){
    const repeated=[...stages[lower].prompts].find(prompt=>stages[upper].prompts.has(prompt));
    assert(!repeated,id+' repeated between '+lower+' and '+upper+': '+repeated);
    const model=[...stages[lower].variants].find(type=>stages[upper].variants.has(type));
    assert(!model,id+' shared type '+model);
   }
   totals.topics++;
  }
  return totals;
 },{topics,checkLayout});
}

(async()=>{
 for(const width of [390,320,1280]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  try{
   const options={viewport:{width,height:850},isMobile:width<500,hasTouch:width<500};
   const errors=[];
   if(!process.env.MATKVEST_G8_WARMUP_ONLY){
    const solutionMethods={topics:0,sessions:0,answers:0,newWarmup:0,newMaster:0};
    for(let start=0;start<solutionMethodTopics.length;start+=3){
     const checkPage=await browser.newPage(options);
     try{
      checkPage.on('pageerror',error=>errors.push(error.message));
      await checkPage.goto(pathToFileURL(process.cwd()+'/index.html').href,{waitUntil:'domcontentloaded'});
      const batch=await testSolutionMethods(checkPage,solutionMethodTopics.slice(start,start+3));
      for(const key of Object.keys(solutionMethods))solutionMethods[key]+=batch[key];
     }finally{await checkPage.close();}
    }
    assert.deepEqual(solutionMethods,{topics:9,sessions:27,answers:198,newWarmup:35,newMaster:11});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({width,solutionMethods}));
    if(process.env.MATKVEST_G8_SHAPE_ONLY)continue;
   }
   const report=fs.readFileSync('audits/g8_remaining_audit_2026-11-17.md','utf8');
   const flagged=new Set([...report.matchAll(/^\| .+? \| `(\w+)` \| \d+\/\d+\/\d+ \| [1-9]\d*\/\d+\/\d+ \|/gm)].map(match=>match[1]));
   assert.equal(flagged.size,39);
   const ordered=[...flagged];
   const totals={topics:0,types:0,sessions:0,answers:0};
   for(let start=0;start<ordered.length;start+=5){
    const warmupPage=await browser.newPage(options);
    try{
     warmupPage.on('pageerror',error=>errors.push(error.message));
     await warmupPage.goto(pathToFileURL(process.cwd()+'/index.html').href,{waitUntil:'domcontentloaded'});
     const result=await testWarmupTraining(warmupPage,ordered.slice(start,start+5));
     for(const key of Object.keys(totals))totals[key]+=result[key];
    }finally{await warmupPage.close();}
   }
   assert.equal(totals.types,198);
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,warmup:totals}));
   if(process.env.MATKVEST_G8_WARMUP_ONLY)continue;
   for(let start=0;start<adjustedMasterTopics.length;start+=6){
    const masterPage=await browser.newPage(options);
    try{
     masterPage.on('pageerror',error=>errors.push(error.message));
     await masterPage.goto(pathToFileURL(process.cwd()+'/index.html').href,{waitUntil:'domcontentloaded'});
     const result=await testAdjustedMaster(masterPage,adjustedMasterTopics.slice(start,start+6));
     console.log(JSON.stringify({width,...result}));
    }finally{await masterPage.close();}
   }
   for(const section of ['circleAngles','arcs','circles','trigonometry']){
    const geometryPage=await browser.newPage(options);
    geometryPage.on('pageerror',error=>errors.push(error.message));
    await geometryPage.goto(pathToFileURL(process.cwd()+'/index.html').href,{waitUntil:'domcontentloaded'});
    await geometryPage.locator('button[onclick="openGrade(8)"]').click({timeout:20000});
    const result=await testGeometry(geometryPage,section);
    await geometryPage.close();
    console.log(JSON.stringify({width,...result}));
   }
   const page=await browser.newPage(options);
   page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(error.message));
   await testNavigation(page);
   console.log(JSON.stringify({width,navigation:'pass'}));
   const similarity=await testGeometry(page);
   const result=width===390&&!process.env.MATKVEST_G8_NAV_ONLY?await testSessions(page):{};
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,...similarity,...result}));
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
