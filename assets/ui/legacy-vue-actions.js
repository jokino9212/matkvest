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
  return {headerActions,quickSetupActions,quickResultActions};
});
