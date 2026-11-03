const {chromium}=require("playwright");
const path=require("path"),fs=require("fs");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const pageErrors=[],consoleErrors=[];
 page.on("pageerror",e=>pageErrors.push(String(e)));
 page.on("console",m=>{if(m.type()==="error"&&!/service.worker|serviceworker|file:/i.test(m.text()))consoleErrors.push(m.text())});
 await page.goto("file://"+path.resolve("index.html"),{waitUntil:"load",timeout:90000});
 const results=await page.evaluate(()=>{
  const bad=[],counts={grade7:0,grade8:0,focus:0},variants={};
  const inspect=(id,d)=>{
   try{
    const q=id.startsWith("g8:")?makeG8Question(id,d):makeG7Question(id,d);
    if(!q||typeof q.text!=="string"||!q.text.trim()||typeof q.ex!=="string"||!q.ex.trim())throw Error("missing prompt/explanation");
    if(q.ans===undefined||q.ans===null)throw Error("missing answer");
    if(q.choices){
     const ks=q.choices.map(x=>String(x.key));
     if(new Set(ks).size!==ks.length)throw Error("duplicate choice keys");
     if(ks.filter(x=>x===String(q.ans)).length!==1)throw Error("missing/ambiguous correct choice");
    }
    return q;
   }catch(e){if(bad.length<30)bad.push({id,d,error:String(e)});return null}
  };
  const G7=G7_GROUPS.flatMap(x=>x.topics.map(t=>t.id)),G8=G8_GROUPS.flatMap(x=>x.topics.map(t=>t.id));
  if(G7.length!==107||G8.length!==110)throw Error("Unexpected catalog sizes "+G7.length+" "+G8.length);
  for(const id of G7)for(let d=0;d<3;d++)for(let i=0;i<3;i++){inspect(id,d);counts.grade7++}
  for(const id of G8)for(let d=0;d<3;d++){inspect(id,d);counts.grade8++}
  const focus=["direct_inverse_proportion","common_factor","factorization_grouping","integer_expression_transform","combined_factorization","geo_triangle_elements","geo_isosceles_equilateral","geo_isosceles_properties_criteria","geo_congruence_sas","geo_congruence_asa","geo_congruence_sss","geo_triangle_inequality","geo_side_angle_relation","geo_locus_points","geo_circumcircle_triangle"];
  for(const raw of focus)for(let d=0;d<3;d++){
   const key=raw+":"+d,seen=new Set();
   for(let j=0;j<110;j++){
    const q=inspect("g7:"+raw,d);if(q)seen.add(q.audit?.variant||q.audit?.type||q.templateId||q.sig?.split(":")[3]||q.text.slice(0,30));
    counts.focus++;
   }
   variants[key]=seen.size;
  }
  return {counts,variants,bad};
 });
 const result={...results,pageErrors,consoleErrors,checkedAt:new Date().toISOString()};
 fs.mkdirSync("reports",{recursive:true});
 fs.writeFileSync("reports/g7_stage3_browser_result.json",JSON.stringify(result,null,2));
 console.log(JSON.stringify({counts:result.counts,failures:result.bad.length,pageErrors:pageErrors.length,consoleErrors:consoleErrors.length,minVariants:Math.min(...Object.values(result.variants))},null,2));
 if(result.bad.length)console.error("Question failures:",JSON.stringify(result.bad.slice(0,10)));
 if(pageErrors.length)console.error("Page errors:",pageErrors.slice(0,10));
 await browser.close();
 if(result.bad.length||pageErrors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
