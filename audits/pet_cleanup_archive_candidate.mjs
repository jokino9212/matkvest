// Stage 1: archive only, no automatic compensation or achievement changes.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
assert.equal(createHash('sha256').update(readFileSync('index.html')).digest('hex'),'bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce','v290 base mismatch');
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
// Reuse the existing pre-cached premium artwork; label each reward distinctly.
const artwork=[
 ['pet_streak_owl','pet_owl','10','streak10','series'],
 ['pet_fraction_dragon','pet_dragon','⅗','fractions','fraction'],
 ['pet_golden_turtle','pet_turtle','★','remediation50','gold']
];
for(const [id,asset,mark,achievement,style] of artwork){
 assert(readFileSync('assets/source/pets/'+asset+'.webp').length>0);
 const marker='data-reward-pet="'+id+'"';
 const art='<span class="mk-pet-reward-art mk-pet-reward-'+style+'" '+marker+'><img class="emoji-fallback-img mk-ux103-pet-image mk-ux103-premium-image mk-ux104-premium-image" alt="" loading="eager" decoding="async" src="assets/source/pets/'+asset+'.webp"><span class="mk-pet-reward-mark" aria-hidden="true">'+mark+'</span></span>';
 // Match only the icon property before price in the original record.
 const re=new RegExp('(\\{id:"'+id+'",name:"[^"]+",icon:)([^\\n]+?)(,price:0,level:1,rarity:"[^"]+",rewardOnly:true,achievement:")','g');
 assert.equal([...c.matchAll(re)].length,1,id);
 assert(c.slice(c.indexOf('{id:"'+id+'",name:'),c.indexOf('\n',c.indexOf('{id:"'+id+'",name:'))).includes('achievement:"'+achievement+'"'));
 c=c.replace(re,(_,prefix,old,suffix)=>prefix+JSON.stringify(art)+suffix);
 if(id==='pet_streak_owl')replace('pet_streak_owl:badgeEmojiIcon("🦉","owl","10")','pet_streak_owl:'+JSON.stringify(art));
}
replace('</head>','<style id="mk-pet-cleanup-reward-art">.mk-pet-reward-art{position:relative;display:inline-block;width:100%;height:100%;max-width:100%;max-height:100%;line-height:1;vertical-align:middle}.mk-pet-reward-art img{width:100%;height:100%;object-fit:contain}.mk-pet-reward-mark{position:absolute;bottom:4%;right:4%;border-radius:50%;background:#153e53;color:#fff;border:1px solid #f8d66d;font-size:clamp(8px,1.5em,20px);font-weight:800;line-height:1.2;padding:2px 4px;pointer-events:none}.mk-pet-reward-fraction img{filter:hue-rotate(28deg) saturate(1.15)}.mk-pet-reward-gold img{filter:sepia(.8) saturate(2.1)}.pet-mini .mk-pet-reward-mark{font-size:7px;padding:0 1px}</style></head>');
// PWA version bump isolated from v300 backend branch.
assert.equal(c.split('?v=290').length-1,28);
c=c.replaceAll('?v=290','?v=301');
let sw=readFileSync('sw.js','utf8');
assert.equal(sw.split('const CACHE_NAME = "matkvest-iphone-v290";').length,2);
sw=sw.replace('const CACHE_NAME = "matkvest-iphone-v290";','const CACHE_NAME = "matkvest-iphone-v301";');
for(const asset of ['pet_owl','pet_dragon','pet_turtle'])assert(sw.includes('assets/source/pets/'+asset+'.webp'));
if(process.argv.includes('--apply')){writeFileSync(file,c);writeFileSync('sw.js',sw);}
console.log('PASS_PET_REWARD_ART_SOURCE',artwork.map(a=>a[0]).join(','));
console.log('PASS: archive source guards; '+(process.argv.includes('--apply')?'applied in runner':'dry run only'));
