'use strict';
// Stage 38: forbid nonsensical real-world quantities in percentage exercises.
const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('g5-decimal-percent-v128.js','utf8');
for(const bad of ["'На складе '+base+' кг.","'Из '+base+' учеников 30%","'В классе 40% учеников"]){
 assert(!src.includes(bad),'Implausible percentage prompt: '+bad);
}
for(const good of ["кг муки. Продали 20% муки","участников городской спортивной программы","На районном спортивном празднике 40% участников"]){
 assert(src.includes(good),'Missing corrected percentage context: '+good);
}
console.log('Stage 38 percentage-context regression: PASS (3 real question families)');
