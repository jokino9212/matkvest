// МатКвест G7 этап 7: реальные варианты координат, графиков и геометрических примитивов
(function G7Stage7(){
 'use strict';
 const previous=makeG7Question,primitiveSvgBefore=g7GeometryPrimitivesSvg;
 const pick=xs=>xs[ri(0,xs.length-1)];
 const signature=(raw,d,v,parts=[])=>g7QuestionSig(raw,d,'audit7_'+v,parts);
 const audit=(raw,d,v,extra={})=>({type:'g7AuditStage7',raw,d,variant:v,...extra});
 const letters=['A','B','C','D','E','F','K','M','P','T'];
 const drawLetters=n=>shuffleOptions(letters).slice(0,n);
 const number=(raw,d,v,text,ans,ex,parts,extra={})=>
   g7Number(text,ans,ex,signature(raw,d,v,parts),{audit:audit(raw,d,v,{answer:ans,...extra})});
 const choice=(raw,d,v,text,ans,wrong,ex,parts,extra={})=>
   g7StrictChoice(text,ans,wrong,ex,signature(raw,d,v,parts),audit(raw,d,v,{correct:ans,...extra}));
 const coordQuestion=(raw,d,v,text,px,py,ex,parts,extra={})=>
   g6CoordinateInputQuestion(text,px,py,ex,signature(raw,d,v,parts),{audit:audit(raw,d,v,{expectedX:px,expectedY:py,...extra})});
 const coordinateData=(label,x,y)=>({...g7GraphRange(6),points:[{label,x:rational(x),y:rational(y)}],caption:'Координатная плоскость'});
 const lettersSample=['A','B','C','D','E','F','K','M','P','T'];
 const near=(pt,label,dx,dy)=>g7GeoLabelNear(pt,label,dx,dy);
 // Старый рендер жёстко выводил A/B, даже если data.labels отличались.
 // Меняем только рисунки с stage7Labels. Старые чертежи не затрагиваются.
 g7GeometryPrimitivesSvg=function(data){
   if(!data?.stage7Labels)return primitiveSvgBefore(data);
   const [a,b]=data.labels||['A','B'],A={x:150,y:220},B={x:330,y:220},C={x:500,y:220};
   if(data.subtype==='point')return near({x:320,y:200},a,12,-12);
   if(data.subtype==='line'){
     const p={x:80,y:260},q={x:560,y:140},v={x:480,y:-120};
     return g6GeoLine(p.x,p.y,q.x,q.y,'geo-line')+
       '<polygon fill="#315d4d" points="'+g7GeoArrowTip(p,{x:-v.x,y:-v.y})+'"></polygon>'+
       '<polygon fill="#315d4d" points="'+g7GeoArrowTip(q,v)+'"></polygon>'+
       near({x:250,y:217},a,-6,-12)+near({x:410,y:177},b,8,-10);
   }
   if(data.subtype==='segment')return g6GeoLine(A.x,A.y,C.x,C.y,'geo-segment')+near(A,a,-22,-12)+near(C,b,10,-12);
   if(data.subtype==='ray'){
     const end={x:560,y:220};
     return g6GeoLine(A.x,A.y,end.x,end.y,'geo-line')+
       '<polygon fill="#315d4d" points="'+g7GeoArrowTip(end,{x:1,y:0})+'"></polygon>'+
       near(A,a,-22,-12)+near(B,b,8,-12);
   }
   return primitiveSvgBefore(data);
 };
 function makePrimitive(raw,d){
   const variants=d===0?['identify','between','ray_name','ray_origin','membership']:
     d===1?['identify','between','ray_name','ray_origin','membership','ray_through']:
           ['identify','between','ray_name','ray_origin','membership','ray_through','line_identify'];
   const v=pick(variants),ids=drawLetters(4),[a,b,c,off]=ids;
   const shape=(subtype,n=2)=>({kind:'g7-primitives',subtype,labels:ids.slice(0,n),
     stage7Labels:true,aria:'Геометрическая фигура с обозначениями '+ids.slice(0,n).join(', ')});
   const make=(t,ans,wrong,ex,parts,data)=>g7GeoChoice(t,ans,wrong,ex,signature(raw,d,v,parts),
     audit(raw,d,v,{correct:ans,labels:data.labels,subtype:data.subtype,offPoint:data.offPoint||null}),data);
   if(v==='identify'||v==='line_identify'){
     const subtype=v==='line_identify'?'line':pick(['point','line','segment','ray']);
     const names={point:'точка',line:'прямая',segment:'отрезок',ray:'луч'},data=shape(subtype,subtype==='point'?1:2);
     return make('Определи вид изображённой геометрической фигуры.',names[subtype],
       Object.values(names).filter(t=>t!==names[subtype]),'У прямой нет концов, у отрезка два конца, у луча одно начало, точка отмечает положение.',
       [subtype,a,b],data);
   }
   if(v==='ray_name'||v==='ray_origin'||v==='ray_through'){
     const data=shape('ray');
     if(v==='ray_name')return make('Как обозначается луч, изображённый на чертеже?',`луч ${a}${b}`,
       [`луч ${b}${a}`,`отрезок ${a}${b}`,`прямая ${a}${b}`],`Луч начинается в ${a} и проходит через ${b}; порядок букв имеет значение.`,
       [a,b],data);
     if(v==='ray_origin')return make('Какая точка является началом изображённого луча?',a,
       [b,c,off],`Начало луча — точка ${a}; от неё луч идёт через ${b}.`,[a,b],data);
     return make('Через какую отмеченную точку луч проходит после своего начала?',b,
       [a,c,off],`Луч начинается в ${a}, затем проходит через ${b}.`,[a,b],data);
   }
   if(v==='between'){
     const data=shape('collinear',3);
     return make('Какая точка расположена между двумя другими на прямой?',b,[a,c,off],
       `На рисунке точки идут в порядке ${a} — ${b} — ${c}; между крайними точками находится ${b}.`,
       [a,b,c],data);
   }
   const data={...shape('collinear',3),offPoint:off,aria:'Три точки на прямой и одна вне прямой'};
   return make('Какая точка не принадлежит изображённой прямой?',off,[a,b,c],
     `${a}, ${b}, ${c} лежат на прямой, а ${off} расположена вне прямой.`,[a,b,c,off],data);
 }
 function makeCoordinate(raw,d){
   const variants=d===0?['read','quadrant','abscissa','ordinate','axis_name']:
     d===1?['read','quadrant','abscissa','ordinate','dist_ox','dist_oy','reflect_ox','reflect_oy','axis_point']:
           ['read','quadrant','abscissa','ordinate','dist_ox','dist_oy','reflect_ox','reflect_oy','reflect_origin','axis_point'];
   const v=pick(variants),label=pick(['A','M','P','K']),kind=pick(['I','II','III','IV','На Ox','На Oy']);
   const pt=g6PointForClass(v==='axis_point'?pick(['На Ox','На Oy']):kind,5);
   const x=pt.x.n,y=pt.y.n,data=coordinateData(label,x,y),parts=[label,x,y];
   if(v==='axis_name'){
     const xAxis=Math.random()<.5,axis=xAxis?'Ox':'Oy',word=xAxis?'абсцисс':'ординат';
     return choice(raw,d,v,`Как обозначают ось ${word}?`,axis,[xAxis?'Oy':'Ox','O','I четверть'],
       `Ось ${word} — ${xAxis?'горизонтальная':'вертикальная'} ось ${axis}.`,[axis],{axis});
   }
   if(v==='read'){
     const q=coordQuestion(raw,d,v,`Определи координаты точки ${label} по чертежу.`,x,y,
       `От начала координат по Ox откладываем ${x}, по Oy — ${y}: ${label}(${x}; ${y}).`,parts,{x,y});
     return g6AttachCoordinatePlane(q,data);
   }
   if(v==='quadrant'||v==='axis_point'){
     const ans=g6CoordinateClass(pt.x,pt.y);
     const distractors=shuffleOptions(['I','II','III','IV','На Ox','На Oy','Начало координат'].filter(z=>z!==ans));
     const q=choice(raw,d,v,`Где расположена точка ${label} на координатной плоскости?`,ans,distractors,
       `У точки ${label} координаты (${x}; ${y}); её положение — ${ans}.`,parts,{x,y,classification:ans});
     return g6AttachCoordinatePlane(q,data);
   }
   if(v==='abscissa'||v==='ordinate'){
     const isX=v==='abscissa',ans=isX?x:y;
     const q=number(raw,d,v,`Прочитай ${isX?'абсциссу':'ординату'} точки ${label} на рисунке.`,ans,
       `${isX?'Абсцисса x':'Ордината y'} точки ${label} равна ${ans}.`,parts,{x,y});
     return g6AttachCoordinatePlane(q,data);
   }
   if(v==='dist_ox'||v==='dist_oy'){
     const axis=v==='dist_ox'?'Ox':'Oy',ans=Math.abs(v==='dist_ox'?y:x);
     const q=number(raw,d,v,`Чему равно расстояние от точки ${label} до оси ${axis} (в единичных отрезках)?`,ans,
       `Расстояние до ${axis} равно модулю ${axis==='Ox'?'ординаты':'абсциссы'}: ${ans}.`,parts,{x,y,axis});
     return g6AttachCoordinatePlane(q,data);
   }
   const nx=v==='reflect_oy'||v==='reflect_origin'?-x:x;
   const ny=v==='reflect_ox'||v==='reflect_origin'?-y:y;
   const axis=v==='reflect_origin'?'начала координат':v==='reflect_ox'?'оси Ox':'оси Oy';
   const q=coordQuestion(raw,d,v,`Точка ${label} отражена относительно ${axis}. Найди координаты её образа.`,nx,ny,
     `При отражении относительно ${axis} получаем (${nx}; ${ny}).`,parts,{x,y,axis});
   return g6AttachCoordinatePlane(q,data);
 }
 function makeSystem(raw,d){
   const variants=d===0?['intersection','count_cross','count_parallel']:
     d===1?['intersection','count_cross','count_parallel','count_coincident','read_x','read_y']:
           ['intersection','count_cross','count_parallel','count_coincident','read_x','read_y','count_horizontal'];
   const v=pick(variants),range=6,slopes=d===0?[-2,-1,1,2]:[-3,-2,-1,0,1,2,3];
   const isCount=v.startsWith('count_'),same=v==='count_parallel'||v==='count_coincident';
   let k1,k2,b1,b2,x0=null,y0=null;
   if(!isCount||v==='intersection'){
     let found=false;
     for(let i=0;i<100;i++){
       const x=ri(-3,3),y=ri(-3,3),k=pick(slopes),other=pick(slopes.filter(z=>z!==k));
       const a=y-k*x,b=y-other*x;
       if(Math.abs(a)<=5&&Math.abs(b)<=5){x0=x;y0=y;k1=k;k2=other;b1=a;b2=b;found=true;break;}
     }
     if(!found)throw Error('Could not generate an intersection model');
   }else if(same){
     k1=pick(slopes);k2=k1;b1=ri(-3,3);b2=v==='count_coincident'?b1:b1+pick([-2,-1,1,2]);
   }else {
     k1=v==='count_horizontal'?0:pick(slopes);
     k2=pick(slopes.filter(z=>z!==k1));b1=ri(-3,3);b2=ri(-3,3);
   }
   const lines=[g7LineSeries(k1,b1,{range,label:g7LineFormula(k1,b1)}),
     g7LineSeries(k2,b2,{range,label:g7LineFormula(k2,b2),alt:true,dashed:true})];
   const data=g7GraphData(lines,{range,points:x0===null?[]:[{label:'S',x:rational(x0),y:rational(y0)}],caption:'Графики двух линейных функций'});
   const equations=`${g7LineFormula(k1,b1)} и ${g7LineFormula(k2,b2)}`,parts=[k1,b1,k2,b2],model={k1,b1,k2,b2,x0,y0,case:same?(b1===b2?'infinite':'none'):'one'};
   let q;
   if(v==='intersection'){
     q=coordQuestion(raw,d,v,`Найди координаты пересечения графиков ${equations}.`,x0,y0,
       `Подставляем (${x0}; ${y0}) в оба уравнения — получаем верные равенства.`,parts,model);
   }else if(v==='read_x'||v==='read_y'){
     const ans=v==='read_x'?x0:y0;
     q=number(raw,d,v,`По графикам ${equations} найди ${v==='read_x'?'абсциссу':'ординату'} точки пересечения S.`,ans,
       `Графики пересекаются в точке (${x0}; ${y0}), поэтому ответ ${ans}.`,parts,model);
   }else{
     const ans=model.case==='infinite'?'бесконечно много решений':model.case==='none'?'нет решений':'одно решение';
     q=choice(raw,d,v,`Сколько решений имеет система, заданная графиками ${equations}?`,ans,
       ['одно решение','нет решений','бесконечно много решений'].filter(z=>z!==ans),
       model.case==='one'?'Наклоны прямых различны, поэтому они пересекаются один раз.':
       model.case==='none'?'Наклоны одинаковы, свободные члены различны: прямые параллельны.':
       'Обе прямые совпадают: общих точек бесконечно много.',parts,model);
   }
   return g7AttachGraph(q,data,equations);
 }
 makeG7Question=function(id,stageOverride=null){
   const raw=rawCourseId(id);
   if(!['geo_primitives','coordinate_plane','graphical_equations_systems'].includes(raw))return previous(id,stageOverride);
   const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
   const q=raw==='geo_primitives'?makePrimitive(raw,d):
      raw==='coordinate_plane'?makeCoordinate(raw,d):makeSystem(raw,d);
   return gPolishQuestionObject(q);
 };
})();
