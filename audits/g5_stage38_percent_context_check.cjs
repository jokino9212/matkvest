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
const arithmetic=fs.readFileSync('g5-arithmetic-tiers-v123.js','utf8');
assert(arithmetic.includes("'В школьный склад привезли '+b+' партий коробок."),'Missing clear multiplication context');
assert(arithmetic.includes("'В одной партии '+d+' коробок по '+a+' предметов"),'Missing clear comparison context');
assert(arithmetic.includes("'Число x разделили на '+b+', затем на '+pack+' и получили '+a+'. Найди первоначальное число x.'"),'Inverse division family not found');
assert(!arithmetic.includes("В каждом большом ящике '+d+' маленьких"),'Original ambiguous multiplication remains');
const fractions=fs.readFileSync('g5-fraction-concepts-v129.js','utf8');
for(const required of [
 'Найди НОД числителя и знаменателя дроби',
 'и удвой полученную сумму.',
 'Вторую сторону уменьшили в 2 раза.',
 'Последовательно разделим числитель и знаменатель на '
])assert(fractions.includes(required),'Missing fraction pedagogy improvement: '+required);
assert(!fractions.includes('На какой общий множитель гарантированно делятся'),'Ambiguous divisor question remains');
assert(!fractions.includes('Вычтем оба общих множителя'),'Incorrect reduction explanation remains');
console.log('Stage 38-39 methodological context regressions: PASS (10 families and wording changes)');
