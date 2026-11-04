/* МатКвест G7 этап 11: сброс прокрутки при запуске другой тренировки */
(function G7Stage11ModalScrollReset(){
  'use strict';
  const before=startG7QuizStage;
  startG7QuizStage=function(...args){
    const result=before.apply(this,args);
    const modal=document.getElementById('modal');
    if(modal&&modal.scrollTop!==0)modal.scrollTop=0;
    return result;
  };
})();
