/* UI-only action adapters for the Vue transition. No DOM or persistence.
 * Legacy inline action objects in index.html remain as offline/module-load fallback. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.MatKvestVueActions=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const HEADER_KEYS=["home","profile","wallet","shop","data","journal","leaders"];
  function headerActions(handlers){
    // Preserve an independent action table on each mount/refresh.
    return Object.fromEntries(HEADER_KEYS.map(key=>[key,(...args)=>handlers[key](...args)]));
  }
  function quickSetupActions({isCurrent,isBlocked,choice,smart,start,trainAll,home}){
    return {run(action){
      if(!isCurrent()||isBlocked())return;
      const [group,value]=action.split(":");
      if(group==="choice")return choice(value);
      if(group==="smart")return smart(value);
      if(action==="start")return start();
      if(action==="train-all")return trainAll();
      if(action==="home")return home();
    }};
  }
  function quickResultActions({isCurrent,selection,again,home,hasPlan,returnToPlan}){
    return {
      again:()=>{if(isCurrent())return again(selection)},
      home:()=>{if(isCurrent())return home()},
      returnToPlan:()=>{if(isCurrent()&&hasPlan())return returnToPlan()}
    };
  }
  // V272: Plan UI callbacks only. Profile storage, plan business rules and
  // reward accounting remain owned by index.html; handlers refresh per view.
  const PLAN_KEYS=["back","earlier","later","toggle","remove","start","rebuild","delete","launch","complete"];
  function trainingPlanActions({isCurrent,isBlocked,actions}){
    const result=Object.create(null);
    for(const key of PLAN_KEYS){
      if(typeof actions[key]!=="function")continue;
      result[key]=(...args)=>{
        if(!isCurrent()||(typeof isBlocked==="function"&&isBlocked()))return;
        return actions[key](...args);
      };
    }
    return result;
  }
  // V273: keep all scoring/persistence in legacy school controllers. These
  // adapters only dispatch gestures to the live exercise instance.
  function schoolTableActions({isCurrent,isSolved,hasAttempt,check,next,requestSkip}){
    return {
      primary:()=>{
        if(!isCurrent())return;
        return isSolved()?next():check();
      },
      skip:()=>{
        if(!isCurrent()||isSolved())return;
        return hasAttempt()?requestSkip():next();
      }
    };
  }
  function schoolQuizActions({isCurrent,choose,check,skip,next,keydown}){
    const dispatch=handler=>(...args)=>{
      if(!isCurrent())return;
      return handler(...args);
    };
    return {choose:dispatch(choose),check:dispatch(check),skip:dispatch(skip),
      next:dispatch(next),keydown:dispatch(keydown)};
  }
  return {headerActions,quickSetupActions,quickResultActions,trainingPlanActions,schoolTableActions,schoolQuizActions};
});
