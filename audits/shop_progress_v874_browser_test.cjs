'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const R={common:0,uncommon:1,rare:2,epic:3,legendary:4};
function compare(a,b){return (R[a.rarity]??9)-(R[b.rarity]??9)||Number(a.price||0)-Number(b.price||0)}
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:width<768,hasTouch:width<768});
   const errs=[];page.on('pageerror',e=>errs.push(e.message));
   await page.goto('file://'+path.resolve('index.html'),{waitUntil:'domcontentloaded'});
   const report=await page.evaluate(()=>{
    const shopTypes=['avatars','frames','pets','titles','backgrounds','badges','stickers','effects','nicknameStyles','accessories'];
    const categories={};
    shopRarityFilter='all';
    shopTypes.forEach(type=>{
      const arr=filteredShopItems(type);
      const rank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
      const violations=[];
      for(let i=1;i<arr.length;i++){
        const a=arr[i-1],b=arr[i];
        const comp=(rank[a.rarity]??9)-(rank[b.rarity]??9)||Number(a.price||0)-Number(b.price||0);
        if(comp>0)violations.push({prev:{id:a.id,rarity:a.rarity,price:a.price},next:{id:b.id,rarity:b.rarity,price:b.price}});
      }
      categories[type]={count:arr.length,violations};
    });
    const collection={};
    for(const type of ['avatars','frames','pets','stickers','backgrounds']){
      const samples=mk872ActiveCollectionItems(type).slice(0,12);
      const orig=state.inventory?.[type] ? [...state.inventory[type]] : null;
      if(!state.inventory) state.inventory={};
      state.inventory[type]=[...new Set([...(orig||[]),...samples.map(x=>x.id)])];
      const arr=mk872CollectionOwned(type);
      const rank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
      let violations=0;
      for(let i=1;i<arr.length;i++) if((rank[arr[i-1].rarity]??9)-(rank[arr[i].rarity]??9)||Number(arr[i-1].price||0)-Number(arr[i].price||0)>0) violations++;
      collection[type]={count:arr.length,violations};
      if(orig===null)delete state.inventory[type];else state.inventory[type]=orig;
    }
    openCollection();
    const collectionSortVisible=!!document.querySelector('#modal .v71-sort-control select');
    openShop('avatars','all');
    const sortVisible=!!document.querySelector('#modal .v71-sort-control select');
    const grades={};
    [1,2,3,4,5,6,7,8].forEach(g=>{
      openGrade(g);if(typeof mkV71RefreshSections==='function')mkV71RefreshSections();
      const root=document.getElementById('mainView');
      const nodes=[...root.querySelectorAll('.v71-section-progress')];
      grades[g]={count:nodes.length,labels:nodes.map(n=>n.textContent.trim()).slice(0,8),hasGradeTitle:root.querySelector('.grade-hero h1')?.textContent||''};
    });
    return {categories,collection,collectionSortVisible,sortVisible,grades};
   });
   assert(report.collectionSortVisible,'Collection sort selector not displayed at '+width);
   for(const [type,data] of Object.entries(report.collection)) assert.equal(data.violations,0,'Collection unsorted '+type+' at '+width);
   assert(report.sortVisible,'Sort selector not displayed at '+width);
   for(const [type,data] of Object.entries(report.categories)){
      assert.equal(data.violations.length,0,'Incorrect rarity/price order in '+type+' at '+width+': '+JSON.stringify(data.violations.slice(0,3)));
   }
   for(const g of [1,2,3,4,5,6,7,8]){
      assert(report.grades[g].count>0,'No section progress on grade '+g+' at '+width+': '+JSON.stringify(report.grades[g]));
      assert(report.grades[g].labels.every(s=>/Пройдено \d+ из \d+ тем/.test(s)),'Invalid section progress '+g+': '+JSON.stringify(report.grades[g]));
   }
   console.log('PASS shop order, selector and section progress at',width,'px:',JSON.stringify(report.grades));
   await page.close();
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
