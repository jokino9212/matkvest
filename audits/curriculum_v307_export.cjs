'use strict';
// Exact pinned public runtime only. Export no student/session data.
// Preserve the original prompt, SVG, tables, fractions and choice markup as inert structured nodes.
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('node:http'),{readFile}=require('node:fs/promises'),{resolve,sep,extname}=require('node:path'),{mkdirSync,writeFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const root=resolve(__dirname,'../v306-fixture'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const build='7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318';
(async()=>{
 assert.equal(createHash('sha256').update(await readFile(resolve(root,'index.html'))).digest('hex'),build);
 const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+sep))return res.writeHead(404).end();const data=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)}catch(e){if(!res.headersSent)res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
 await page.goto(origin+'/index.html');await page.waitForFunction(()=>typeof makeG5Question==='function'&&typeof mk305FlushWrites==='function');
 const out=await page.evaluate(()=>{
  const g4=g4AchievementKeys(),g5=g5AchievementKeys();
  const supported=["g4:column:add","g4:column:div","g4:column:mul","g4:column:sub","g4:equations","g4:moro_missing_add","g4:moro_missing_muldiv","g4:moro_missing_sub","g4:moro_order_1000","g4:order","g4:table","g5:average","g5:dec_add","g5:dec_compare","g5:dec_div10","g5:dec_div_dec","g5:dec_div_nat","g5:dec_mul10","g5:dec_mul_dec","g5:dec_mul_nat","g5:dec_place","g5:dec_round","g5:dec_sub","g5:dec_to_common","g5:frac_add","g5:frac_add_diff","g5:frac_common_lcm","g5:frac_compare_den","g5:frac_compare_diff","g5:frac_compare_num","g5:frac_div_common","g5:frac_division","g5:frac_equal","g5:frac_mul_common","g5:frac_part_number","g5:frac_parts","g5:frac_ray","g5:frac_read","g5:frac_reduce","g5:frac_restore","g5:frac_shapes","g5:frac_sub","g5:frac_sub_diff","g5:frac_to_mixed","g5:frac_types","g5:frac_word","g5:mixed_add","g5:mixed_compare","g5:mixed_sub","g5:mixed_to_frac","g5:natural_add","g5:natural_compare","g5:natural_divide","g5:natural_multiply","g5:natural_subtract","g5:percent","g5:percent_whole"];
  const titles=new Map([...TOPICS.map(t=>['g4:'+t.id,t.title]),...g5AllTopics().map(t=>['g5:'+t.id,t.title])]);
  const missing=[...g4,...g5].filter(k=>!supported.includes(k)),details=[];
  const old=blockSession,oldQid=qid;
  try{for(const k of missing){const modes=new Set(),tags=new Set(),errors=new Set();for(let stage=0;stage<3;stage++){for(let i=0;i<5;i++){try{qid=k;blockSession={key:k,kind:k.startsWith('g5:')?'g5quiz':'quiz',topicId:k.slice(3),grade:Number(k[1]),stageIndex:stage,done:i,total:[5,7,10][stage],usedSignatures:[],items:[]};const q=freshQuiz(k);modes.add(q.answerMode||'choice');for(const m of String(q.text).matchAll(/<(svg|img|table|canvas|math)\b/gi))tags.add(m[1].toLowerCase());}catch(e){errors.add(String(e.message));}}}details.push({id:k,title:titles.get(k),modes:[...modes],visual:[...tags],errors:[...errors]});}}finally{blockSession=old;qid=oldQid;}
  return {g4,g5,supported,missing:details};
 });
 assert.equal(new Set(out.g4).size,out.g4.length);assert.equal(new Set(out.g5).size,out.g5.length);assert.equal(out.g5.length,74);assert(out.supported.every(k=>[...out.g4,...out.g5].includes(k)));
 const target=resolve(__dirname,'../v307-curriculum-audit');mkdirSync(target,{recursive:true});writeFileSync(resolve(target,'curriculum.json'),JSON.stringify(out,null,2)+'\n');
 console.log('V307_CURRICULUM_COVERAGE',JSON.stringify({g4:out.g4.length,g5:out.g5.length,supported:out.supported.length,missing:out.missing}));
 await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
