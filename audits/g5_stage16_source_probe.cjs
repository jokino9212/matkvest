'use strict';
const fs=require('node:fs');const s=fs.readFileSync('index.html','utf8');
for(const term of ['frac_div_then_multiply','mixed_add_three','mk5Frac','mk5MixedAnswer','frac_div_pair','mixed_add_0']){
const n=s.indexOf(term);console.log('STAGE16_SOURCE',JSON.stringify({term,offset:n,snippet:n>=0?s.slice(Math.max(0,n-1600),n+2200):''}));
}
console.log('STAGE16_SOURCE_PROBE_PASS');
