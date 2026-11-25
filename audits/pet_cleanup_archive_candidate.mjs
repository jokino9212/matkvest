// Stage 1: archive only, no automatic compensation or achievement changes.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const file='index.html', original=readFileSync(file,'utf8');
let c=original;
function replace(a,b,n=1){assert.equal(c.split(a).length-1,n,'Unexpected source: '+a.slice(0,100));c=c.split(a).join(b)}
const ids=['pet_robotx','pet_wisecat','pet_royal_dragon'];
for(const id of ids)replace('{id:"'+id+'",name:','{id:"'+id+'",retiredPet:true,hiddenInStore:true,chestEligible:false,name:');
const store=/const items=\(SHOP_CATALOG\[category\]\|\|\[\]\);(?=\s*return shopRarityFilter)/g;
assert.equal([...c.matchAll(store)].length,1);
c=c.replace(store,"const items=(SHOP_CATALOG[category]||[]).filter(item=>category!=='pets'||!item.retiredPet);");
replace('normalizeShop();const item=catalogItem(type,id);if(!item||isOwned(type,id)||item.rewardOnly)return;','normalizeShop();const item=catalogItem(type,id);if(!item||(type==="pets"&&item.retiredPet)||isOwned(type,id)||item.rewardOnly)return;',3);
replace('"pet_penguin","pet_dino","pet_cat","pet_tiger","pet_wisecat",','"pet_penguin","pet_dino","pet_cat","pet_tiger",');
replace('"pet_dragon","pet_robotx","pet_astronaut","pet_phoenix","bg_stars","bg_gold",','"pet_dragon","pet_astronaut","pet_phoenix","bg_stars","bg_gold",');
replace('"pet_royal_dragon","pet_orb","pet_ghost","acc_wizard","acc_halo",','"pet_orb","pet_ghost","acc_wizard","acc_halo",');
replace('const all=SHOP_CATALOG.pets||[];\n const owned=new Set','const all=(SHOP_CATALOG.pets||[]).filter(item=>!item.retiredPet);\n const owned=new Set');
replace('function equipShopItem(type,id,{fromCollection=false}={}){\n normalizeShop();\n if(!isOwned(type,id))return;','function equipShopItem(type,id,{fromCollection=false}={}){\n normalizeShop();\n if((type==="pets"&&catalogItem(type,id)?.retiredPet)||!isOwned(type,id))return;');
replace('profile.equipped[eq]=fallback}\n profile.shopStats','profile.equipped[eq]=fallback}\n if(catalogItem("pets",profile.equipped.pet)?.retiredPet)profile.equipped.pet="pet_none";\n profile.shopStats');
replace('const itemOr=(type,id,fallback)=>owned(type,id)&&catalogItem(type,id)?catalogItem(type,id):catalogItem(type,fallback);','const itemOr=(type,id,fallback)=>owned(type,id)&&catalogItem(type,id)&&!(type==="pets"&&catalogItem(type,id).retiredPet)?catalogItem(type,id):catalogItem(type,fallback);');
const pool=c.slice(c.indexOf('const MK861_CHEST_POOLS='),c.indexOf('const MK861_CHEST_EXCLUSIVE_IDS='));
const archive=c.slice(c.indexOf('const oldPetIds'),c.indexOf('function oldPetRows'));
for(const id of ids){assert(!pool.includes('"'+id+'"'));assert(archive.includes('"'+id+'"'))}
assert.equal(c.length-original.length,496);
if(process.argv.includes('--apply'))writeFileSync(file,c);
console.log('PASS: archive source guards; '+(process.argv.includes('--apply')?'applied in runner':'dry run only'));
