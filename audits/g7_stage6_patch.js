/* МатКвест G7 этап 6: вариативность статистики и расстояний */
(function G7Stage6(){
 'use strict';
 const prior=makeG7Question;
 const pick=xs=>xs[ri(0,xs.length-1)];
 const signature=(raw,d,v,params=[])=>g7QuestionSig(raw,d,'audit6_'+v,params);
 const meta=(raw,d,v,extra={})=>({type:'g7AuditStage6',raw,d,variant:v,...extra});
 const statChoice=(raw,d,v,text,correct,wrong,ex,data={})=>g7S13Choice(text,correct,wrong,ex,signature(raw,d,v,[...(data.values||[]),'A',...(data.A||[]),'B',...(data.B||[])]),meta(raw,d,v,{correct, ...data}));
 const statNumber=(raw,d,v,text,answer,ex,nums,model={})=>g7S13Number(text,answer,ex,signature(raw,d,v,nums),meta(raw,d,v,{answer,...model}));
 const geoNumber=(raw,d,v,text,answer,ex,parts,data,unit='см')=>g7GeoNumber(text,answer,ex,signature(raw,d,v,parts),meta(raw,d,v,{answer,...(data?{dataKind:data.kind}:{})}),data,'',unit);
 const geoChoice=(raw,d,v,text,ans,options,ex,parts,data)=>g7GeoChoice(text,ans,options,ex,signature(raw,d,v,parts),meta(raw,d,v,{correct:ans}),data);
 function build(raw,d){
  if(raw==='stat_choose_characteristic'){
   const variants=d===0?['mean_no_outlier','range_measure','max_value','min_value']:
     d===1?['mean_no_outlier','range_measure','median_outlier','compare_spread','median_find','max_value']:
           ['median_outlier','compare_spread','median_find','range_effect','outlier_effect','range_measure','mean_no_outlier'];
   const v=pick(variants),b=ri(8,28),deltas=pick([[ -3,-1,0,1,3 ],[-4,-2,0,2,4],[-5,-1,0,1,5]]),values=deltas.map(x=>b+x);
   if(v==='mean_no_outlier'){
    return statChoice(raw,d,v,`Набор наблюдений: ${g7S13List(values)}. Выбери характеристику для вычисления общего среднего уровня.`,'среднее арифметическое',['размах','максимум','минимум'],`Среднее арифметическое — сумма всех наблюдений, делённая на их число. Здесь среднее равно ${b}.`,{values});
   }
   if(v==='range_measure'){
    const lo=ri(3,15),hi=lo+ri(5,26);
    return statNumber(raw,d,v,`В ряду измерений минимум равен ${lo}, максимум — ${hi}. Найди размах.`,hi-lo,`Размах равен максимальному значению минус минимальное: ${hi} − ${lo} = ${hi-lo}.`,[lo,hi],{min:lo,max:hi});
   }
   if(v==='max_value'){
    const rows=pick([[1,4,7,9,11],[3,6,8,12,16],[5,6,13,14,18]]).map(x=>x+ri(1,12));
    return statNumber(raw,d,v,`Найди максимальное значение ряда: ${g7S13List(rows)}.`,Math.max(...rows),`Максимум — наибольшее значение, здесь это ${Math.max(...rows)}.`,rows,{values:rows});
   }
   if(v==='min_value'){
    const rows=pick([[3,6,8,10,12],[7,9,13,15,20],[4,10,12,18,25]]).map(x=>x+ri(0,7));
    return statNumber(raw,d,v,`Найди минимальное значение ряда: ${g7S13List(rows)}.`,Math.min(...rows),`Минимум — наименьшее значение, здесь это ${Math.min(...rows)}.`,rows,{values:rows});
   }
   if(v==='median_outlier'){
    const out=ri(70,140),ordered=[b-2,b-1,b,b+1,b+out];
    return statChoice(raw,d,v,`Ряд ${g7S13List(ordered)} содержит один очень большой выброс. Какая характеристика лучше показывает типичное центральное значение?`,'медиана',['среднее арифметическое','максимум','размах'],`Медиана этого упорядоченного ряда — ${b}, тогда как большой выброс увеличивает среднее.`,{values:ordered});
   }
   if(v==='compare_spread'){
    const k=ri(3,14),small=[b-2,b,b+2],large=[b-k,b,b+k];
    return statChoice(raw,d,v,`Два ряда имеют одинаковое среднее ${b}: A = ${g7S13List(small)}, Б = ${g7S13List(large)}. Какую характеристику удобно сравнить для оценки разброса?`,'размах',['медиану','среднее арифметическое','моду'],`Размах A равен 4, размах Б равен ${2*k}. Он показывает различие между наибольшим и наименьшим значениями.`,{A:small,B:large});
   }
   if(v==='median_find'){
    const k=ri(4,12),ordered=[b-3,b-1,b,b+1,b+k];
    return statNumber(raw,d,v,`Какова медиана упорядоченного ряда ${g7S13List(ordered)}?`,b,`В ряду из пяти значений медиана — третье число, равное ${b}.`,ordered,{values:ordered});
   }
   if(v==='range_effect'){
    const k=ri(2,19),a=b-3,c=b+3;
    return statNumber(raw,d,v,`Был ряд ${g7S13List([a,b-1,b+1,c])}. Максимум ${c} заменили числом ${c+k}, остальные значения не изменились. На сколько увеличился размах?`,k,`Минимум ${a} сохранился, максимум увеличился на ${k}; размах тоже увеличился на ${k}.`,[a,b,c,k],{increment:k});
   }
   const k=ri(80,160),ordered=[b-2,b-1,b,b+1,b+2],altered=[...ordered.slice(0,4),b+k];
   return statChoice(raw,d,v,`В ряду ${g7S13List(ordered)} последнее значение заменили на ${b+k}. Какой показатель центрального положения не изменится?`,'медиана',['среднее арифметическое','максимум','размах'],`Серединное третье значение остаётся ${b}; среднее и максимум увеличиваются.`,{values:altered});
  }
  if(raw==='stat_random_variability'){
   const variants=d===0?['equal_or_not','range','stable','change_count']:
     d===1?['equal_or_not','range','stable','compare','change_count','offset']:
           ['compare','stable','range','offset','bigger_range','equal_or_not','change_count'];
   const v=pick(variants),b=ri(10,42),s=ri(1,5);
   if(v==='equal_or_not'){
    const varied=Math.random()<.65,rows=varied?[b,b+s,b-s,b+ri(1,4)]:[b,b,b,b];
    return statChoice(raw,d,v,`Есть ли изменчивость в серии результатов: ${g7S13List(rows)}?`,varied?'ДА':'НЕТ',[varied?'НЕТ':'ДА'],varied?'Часть значений различается, следовательно изменчивость наблюдается.':'Все значения одинаковы, значит в этой серии изменчивости нет.',{values:rows});
   }
   if(v==='range'){
    const rows=[b-s,b,b+s],ans=2*s;
    return statNumber(raw,d,v,`Результаты повторных наблюдений: ${g7S13List(rows)}. Найди размах.`,ans,`Максимум ${b+s}, минимум ${b-s}; размах ${b+s} − ${b-s} = ${ans}.`,rows,{values:rows});
   }
   if(v==='stable'){
    const r=ri(3,10),A=[b-1,b,b+1],B=[b-r,b,b+r],stable=Math.random()<.5;
    const first=stable?A:B,second=stable?B:A;
    return statChoice(raw,d,v,`Сравни две серии: A = ${g7S13List(first)}; Б = ${g7S13List(second)}. Какая серия стабильнее по размаху?`,stable?'A':'Б',[stable?'Б':'A','одинакова','недостаточно данных'],`Размах первой серии ${2*(stable?1:r)}, второй ${2*(stable?r:1)}. Стабильнее серия с меньшим размахом.`,{A:first,B:second});
   }
   if(v==='compare'){
    const r=ri(4,13),bigFirst=Math.random()<.5,A=bigFirst?[b-r,b,b+r]:[b-2,b,b+2],B=bigFirst?[b-2,b,b+2]:[b-r,b,b+r];
    return statChoice(raw,d,v,`Какая серия имеет большую изменчивость? A: ${g7S13List(A)}. Б: ${g7S13List(B)}.`,bigFirst?'A':'Б',[bigFirst?'Б':'A','одинаковая','зависит от порядка записи'],`Размах A = ${g7S13Range(A)}, размах Б = ${g7S13Range(B)}; более изменчива серия с большим размахом.`,{A,B});
   }
   if(v==='change_count'){
    const rows=[b,b,b+1,b+ri(2,6)],correct=new Set(rows).size;
    return statNumber(raw,d,v,`Сколько различных значений содержит серия ${g7S13List(rows)}?`,correct,`Здесь ${correct} различных результата; значения могут повторяться, что не отменяет изменчивости.`,rows,{values:rows});
   }
   if(v==='offset'){
    const rows=[b-s,b,b+s],add=ri(2,12),shifted=rows.map(x=>x+add);
    return statNumber(raw,d,v,`Все наблюдения серии ${g7S13List(rows)} увеличили на ${add}: получилась ${g7S13List(shifted)}. Чему равен размах новой серии?`,2*s,`При добавлении одного и того же числа к каждому наблюдению размах не меняется: он равен ${2*s}.`,[...rows,add],{values:shifted});
   }
   const add=ri(3,12),rows=[b-1,b,b+1],spread=[b-add,b,b+add];
   return statNumber(raw,d,v,`У первой серии ${g7S13List(rows)}, у второй ${g7S13List(spread)}. На сколько размах второй больше размаха первой?`,2*add-2,`Размах второй ${2*add}, первой 2; разница ${2*add-2}.`,[...rows,...spread],{A:rows,B:spread});
  }
  if(raw==='geo_perpendicular_oblique_distances'){
   const variants=d===0?['height','parallel','difference','shortest']:
     d===1?['height','parallel','difference','shortest','feasibility','oblique_from_difference']:
           ['height','parallel','difference','shortest','feasibility','oblique_from_difference','difference_inverse'];
   const v=pick(variants),data=g7CircleTopicData('g7-distance',{subtype:v==='parallel'?'parallel':'point_line'}),h=ri(3,18),diff=ri(2,13),long=h+diff;
   if(v==='height')return geoNumber(raw,d,v,`Из точки A к прямой a проведён перпендикуляр AH длиной ${h} см. Найди расстояние от A до a.`,h,`Расстояние от точки до прямой равно длине перпендикуляра AH, то есть ${h} см.`,[h],data);
   if(v==='parallel')return geoNumber(raw,d,v,`Прямые a и b параллельны, длина общего перпендикуляра между ними равна ${h} см. Найди расстояние между прямыми.`,h,`Расстояние между параллельными прямыми равно длине их общего перпендикуляра: ${h} см.`,[h],data);
   if(v==='difference')return geoNumber(raw,d,v,`AH = ${h} см — перпендикуляр от A к прямой a, AB = ${long} см — наклонная. На сколько сантиметров AB длиннее AH?`,diff,`Длина наклонной минус перпендикуляр: ${long} − ${h} = ${diff} см.`,[h,long],data);
   if(v==='shortest')return geoChoice(raw,d,v,`От A к прямой a проведены AH ⟂ a и наклонная AB длиной ${long} см. Какое сравнение верно?`,'AH < AB',['AH = AB','AH > AB','оба отрезка обязательно равны нулю'],`Перпендикуляр короче любой наклонной к той же прямой.`,[long],data);
   if(v==='feasibility'){
    const possible=Math.random()<.5,l=possible?long:h-ri(0,Math.min(2,h-1));
    return geoChoice(raw,d,v,`AH = ${h} см — перпендикуляр от A к прямой a. Может ли другая наклонная AB к a иметь длину ${l} см?`,possible?'да':'нет',[possible?'нет':'да'],`Наклонная должна быть строго длиннее перпендикуляра: AB > AH. Здесь ${l} ${possible?'>':'≤'} ${h}.`,[h,l],data);
   }
   if(v==='oblique_from_difference')return geoNumber(raw,d,v,`Наклонная AB на ${diff} см длиннее перпендикуляра AH = ${h} см. Найди длину AB.`,long,`AB = AH + ${diff} = ${h} + ${diff} = ${long} см.`,[h,diff],data);
   return geoNumber(raw,d,v,`Наклонная AB = ${long} см, перпендикуляр AH на ${diff} см короче AB. Найди AH.`,h,`AH = AB − ${diff} = ${long} − ${diff} = ${h} см.`,[h,diff],data);
  }
  return null;
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id);
  if(!['stat_choose_characteristic','stat_random_variability','geo_perpendicular_oblique_distances'].includes(raw))return prior(id,stageOverride);
  const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  return Math.random()<0.13?prior(id,stageOverride):gPolishQuestionObject(build(raw,d));
 };
})();
