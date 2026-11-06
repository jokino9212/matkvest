import fs from 'node:fs';
const lines=fs.readFileSync('index.html','utf8').split('\n');
const ranges=[[7000,7012],[7180,7200],[7310,7445],[19415,19570],[19730,19925],[20050,20230],[20240,20345],[20520,20675],[20800,20895],[21235,21375]];
const sections=ranges.map(([start,end])=>({start,end,lines:lines.slice(start-1,end).map((s,i)=>({line:start+i,text:s.slice(0,850),truncated:s.length>850}))}));
fs.writeFileSync('audits/ui_stage19d_source_context.json',JSON.stringify({lineCount:lines.length,sections},null,2)+'\n');
console.log(JSON.stringify(sections.map(s=>({start:s.start,end:s.end,n:s.lines.length}))));
