/* МатКвест G7 этап 9: защита от содержательных повторов внутри тренировки */
(function G7Stage9SessionUniqueness(){
 'use strict';
 const before=freshQuiz;
 const targets=new Set([
  'fraction_word_problems','number_line_distance','absolute_value_function',
  'graphical_equations_systems','linear_system_substitution',
  'geo_right_triangle_properties','geo_circle_chord_diameter'
 ]);
 const sigOf=q=>String(q?.sig||q?._signature||'');
 const semOf=q=>JSON.stringify([String(q?.text||''),String(q?.ans??''),q?.visual?.data||null]);
 const variantOf=q=>String(q?.audit?.variant||q?.templateId||q?.audit?.type||'legacy');
 freshQuiz=function(id){
  const name=String(id),raw=rawCourseId(id),current=before(id);
  const b=blockSession;
  if(!name.startsWith('g7:')||!targets.has(raw)||!b||b.kind!=='g7quiz'||b.topicId!==raw)return current;
  const stage=b.stageIndex,key=raw+':'+stage;
  b._g7Stage9Used=b._g7Stage9Used||{};
  b._g7Stage9LastVariant=b._g7Stage9LastVariant||{};
  const used=b._g7Stage9Used[key]||(b._g7Stage9Used[key]=[]);
  const seenSigs=new Set(used.map(x=>x.sig)),seenSemantic=new Set(used.map(x=>x.semantic));
  const fits=q=>!!q&&!!q.text&&!!sigOf(q)&&!seenSigs.has(sigOf(q))&&!seenSemantic.has(semOf(q));
  let chosen=current;
  const last=b._g7Stage9LastVariant[key]||null;
  if(!fits(chosen)||(last&&variantOf(chosen)===last)){
   let alternative=null;
   for(let tries=0;tries<600;tries++){
    const q=makeG7Question(id,stage);
    if(!fits(q))continue;
    if(!alternative)alternative=q;
    if(!last||variantOf(q)!==last){alternative=q;break;}
   }
   if(alternative)chosen=alternative;
  }
  if(!fits(chosen)&&used.length){
   b._g7Stage9Exhausted=b._g7Stage9Exhausted||[];
   b._g7Stage9Exhausted.push({raw,stage,position:used.length+1});
  }
  if(chosen!==current&&chosen?.sig){
   registerSignature(chosen.sig);
   chosen._signature=chosen.sig;
  }
  used.push({sig:sigOf(chosen),semantic:semOf(chosen)});
  b._g7Stage9LastVariant[key]=variantOf(chosen);
  return chosen;
 };
})();
