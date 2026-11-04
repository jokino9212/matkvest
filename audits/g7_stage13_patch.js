/* МатКвест G7 этап 13: без содержательных повторов во всех 107 темах */
(function G7Stage13NoSemanticDuplicates(){
 'use strict';
 const previous=freshQuiz;
 const semantic=q=>JSON.stringify([String(q?.text||'').replace(/\s+/g,' ').trim(),String(q?.ans??''),q?.visual?.data||null]);
 freshQuiz=function(id){
  const initial=previous(id);
  const b=blockSession,name=String(id),raw=rawCourseId(id);
  if(!name.startsWith('g7:')||!b||b.kind!=='g7quiz'||b.topicId!==raw||b.finished)return initial;
  const key=raw+':'+b.stageIndex;
  b._g7Stage13Used=b._g7Stage13Used||{};
  const used=b._g7Stage13Used[key]||(b._g7Stage13Used[key]=[]);
  const signatures=new Set(used.map(x=>x.sig)),meanings=new Set(used.map(x=>x.semantic));
  const fits=q=>!!q?.text&&!!q?.sig&&!signatures.has(String(q.sig))&&!meanings.has(semantic(q));
  let chosen=initial;
  if(!fits(chosen)){
   for(let attempt=0;attempt<600;attempt++){
    const candidate=makeG7Question(id,b.stageIndex);
    if(fits(candidate)){chosen=candidate;break;}
   }
  }
  if(!fits(chosen)){
   b._g7Stage13Exhausted=b._g7Stage13Exhausted||[];
   b._g7Stage13Exhausted.push({raw,stage:b.stageIndex,position:used.length+1});
  }
  if(chosen!==initial&&chosen?.sig){
   registerSignature(chosen.sig);
   chosen._signature=chosen.sig;
  }
  used.push({sig:String(chosen?.sig||''),semantic:semantic(chosen)});
  return chosen;
 };
})();
