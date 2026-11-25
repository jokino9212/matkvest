// Draft v290 cleanup. Dry run by default; never deploys or edits service worker.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const file = 'index.html';
const original = readFileSync(file, 'utf8');
let c = original;
function replaceOnce(a,b) {
  assert.equal(c.split(a).length - 1, 1, 'unexpected source: '+a.slice(0,100));
  c=c.replace(a,b);
}
const ids=['pet_robotx','pet_wisecat','pet_royal_dragon'];
for(const id of ids) replaceOnce('{id:"'+id+'",name:', '{id:"'+id+'",retiredPet:true,hiddenInStore:true,chestEligible:false,name:');
const target=/const items=\(SHOP_CATALOG\[category\]\|\|\[\]\);(?=\s*return shopRarityFilter)/g;
const n=[...c.matchAll(target)].length;
assert.ok(n>=1&&n<=4,'unexpected store filters');
c=c.replace(target,"const items=(SHOP_CATALOG[category]||[]).filter(item=>category!=='pets'||!item.retiredPet);");
const guard='normalizeShop();const item=catalogItem(type,id);if(!item||isOwned(type,id)||item.rewardOnly)return;';
assert.equal(c.split(guard).length-1,3);
c=c.split(guard).join('normalizeShop();const item=catalogItem(type,id);if(!item||(type==="pets"&&item.retiredPet)||isOwned(type,id)||item.rewardOnly)return;');
replaceOnce('"pet_penguin","pet_dino","pet_cat","pet_tiger","pet_wisecat",','"pet_penguin","pet_dino","pet_cat","pet_tiger",');
replaceOnce('"pet_dragon","pet_robotx","pet_astronaut","pet_phoenix","bg_stars","bg_gold",','"pet_dragon","pet_astronaut","pet_phoenix","bg_stars","bg_gold",');
replaceOnce('"pet_royal_dragon","pet_orb","pet_ghost","acc_wizard","acc_halo",','"pet_orb","pet_ghost","acc_wizard","acc_halo",');
const pool=c.slice(c.indexOf('const MK861_CHEST_POOLS='),c.indexOf('const MK861_CHEST_EXCLUSIVE_IDS='));
assert.ok(pool.length>0);
for(const id of ids) assert.ok(!pool.includes('"'+id+'"'));
assert.ok(c.length>original.length-200&&c.length<original.length+1000);
if(process.argv.includes('--apply')) writeFileSync(file,c);
console.log(JSON.stringify({mode:process.argv.includes('--apply')?'applied':'dry-run',ids,storeFilters:n,sourceChecks:'PASS',releaseReady:false}));
