import fs from 'node:fs';
const source=fs.readFileSync('index.html','utf8');
const patterns={
  declarations:/\b(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:RARITY|PRICE|SHOP|ECON|PET|CHEST|CAT|REFUND|RESELL|COST|ITEM|REWARD|COIN|ARCHIV)[\w$]*/gi,
  functions:/\b(?:async\s+)?function\s+[a-zA-Z_$][\w$]*(?:shop|buy|purchase|sell|refund|rarity|chest|coin|inventory|equip|reward|pet|collection|trade|unlock|item)[\w$]*/gi,
  props:/\b(?:price|rarity|sellPrice|resale|refund|itemPrice|minLevel|levelRequired|coins|rewardCoins|returnPrice|rarityLabel|cost)\s*:/gi,
  russian:/\b(?:Продать|Возврат|Редкость|Монет|Сундук|Архивные предметы|Купить|Редкие|Легендарные)/gi,
  handlers:/\b(?:buyShopItem|shopBuy|sellShopItem|shopSell|renderShop|openShop|renderCollection|openChest|buyChest|mk861[\w$]+|mk872[\w$]+)\s*\(/gi
};
const lines=source.split('\n'),offsets=[];let pos=0;for(const line of lines){offsets.push(pos);pos+=line.length+1}
const lineAt=index=>{let lo=0,hi=offsets.length-1;while(lo<=hi){const mid=(lo+hi)>>1;if(offsets[mid]<=index)lo=mid+1;else hi=mid-1}return Math.max(0,hi)};
const report={length:source.length,lineCount:lines.length,counts:{},matches:{},definitions:[],catalogCandidates:[]};
for(const [name,regex] of Object.entries(patterns)){
 let m,arr=[],count=0;
 while((m=regex.exec(source))&&count<10000){
  count++;
  if(arr.length<200){
   const li=lineAt(m.index);
   if(lines[li].length<15000)arr.push({line:li+1,at:m.index,token:m[0],excerpt:lines.slice(Math.max(0,li-1),Math.min(lines.length,li+2)).map(x=>x.slice(0,330)).join('\n')});
  }
 }
 report.counts[name]=count;report.matches[name]=arr;
}
for(const [i,line] of lines.entries()){
 if(line.length>12000)continue;
 if(/\b(?:function\s+(?:renderShop|openShop|buy|sell|purchase|equip|shop|claim|coin|chest|rarity|refund)|const\s+[A-Z_]*(?:SHOP|RARITY|PRICE|PET|CHEST|ITEM|ECON|COIN|REWARD)[A-Z_]*\s*=)/i.test(line)){
  if(report.definitions.length<250)report.definitions.push({line:i+1,text:line.slice(0,450)});
 }
 if(/\b(?:rarity|price|sellPrice|resale|refund|cost)\s*:/i.test(line)&&line.length<650)report.catalogCandidates.push({line:i+1,text:line.slice(0,450)});
}
report.catalogCandidates=report.catalogCandidates.slice(0,200);
fs.writeFileSync('audits/ui_stage19d_source_scan.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts:report.counts,definitions:report.definitions.slice(0,100),candidates:report.catalogCandidates.slice(0,55),
  sample: Object.fromEntries(['declarations','functions','handlers'].map(k=>[k,report.matches[k].slice(0,38).map(x=>({line:x.line,token:x.token,excerpt:x.excerpt.slice(0,230)}))]))},null,2).slice(0,32000));