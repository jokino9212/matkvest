/* МатКвест 8.72: G7 stage 3, topics 43/44 only. Independent QA branch. */
(function(){
 'use strict';
 const beforeStage3=makeG7Question;
 const pick3=arr=>arr[ri(0,arr.length-1)];
 const one=m=>[g7MonoCopy(m)];
 const pol=(...terms)=>g7PolynomialNormalize(terms);
 const add=(a,b,k=1)=>g7PolynomialAdd(a,b,k);
 const mul=(a,b)=>g7PolynomialMul(a,b);
 const scale=(p,k)=>g7PolynomialScale(p,k);
 const polyKey=p=>g7PolynomialKey(g7PolynomialNormalize(p));
 const h=m=>g7MonomialBodyHtml(m,{absolute:true});
 const bin=(a,b,s)=>'('+g7BinomialBodyHtml(a,b,s)+')';
 const sq=(a,b,s)=>bin(a,b,s)+'<span class="sup">2</span>';
 const form=s=>'<span class="math">'+s+'</span>';
 const audit=(raw,d,variant,extra={})=>({type:'g7AuditStage3',raw,d,variant,...extra});
 function transform43(raw,d){
  const variants=d===0?['difference_squares','cancel_double','cross_only','numeric_value']:
     d===1?['difference_squares','sum_squares','cancel_double','cross_only','conjugate_plus','conjugate_minus','numeric_value','coefficient']:
           ['difference_squares','sum_squares','conjugate_plus','conjugate_minus','linear_combo','scaled_difference','product_minus_square','coefficient'];
  const variant=pick3(variants);
  if(variant==='numeric_value'){
   const b=ri(2,9+d*2),x=ri(-6,6)||3,ans=4*b*x;
   const text=form('(x + '+b+')<span class="sup">2</span> − (x − '+b+')<span class="sup">2</span>');
   return g7Number('Найди значение '+text+' при x = '+x+'.',ans,
    'По формуле разности квадратов двучленов получаем 4·'+b+'·x; при x = '+x+' это '+ans+'.',
    g7QuestionSig(raw,d,'audit3_'+variant,[b,x]),{audit:audit(raw,d,variant,{b,x,answer:ans})});
  }
  if(variant==='coefficient'){
   const a=ri(1,4+d),b=ri(2,8+d),ans=4*a*b;
   return g7Number('Найди коэффициент при x после упрощения '+form('('+a+'x + '+b+')<span class="sup">2</span> − ('+a+'x − '+b+')<span class="sup">2</span>')+'.',ans,
     'Разность квадратов двучленов равна 4·'+a+'·'+b+'·x = '+ans+'x. Значит коэффициент равен '+ans+'.',
     g7QuestionSig(raw,d,'audit3_'+variant,[a,b]),{audit:audit(raw,d,variant,{a,b,answer:ans})});
  }
  const {A,B}=g7FormulaPair(d),plus=g7SquareFormulaModel(A,B,1),
    minus=g7SquareFormulaModel(A,B,-1),ds=g7DifferenceSquaresModel(A,B);
  let expr='',result;
  if(variant==='difference_squares'){
   expr=sq(A,B,1)+' − '+sq(A,B,-1);
   result=add(plus.expansion,minus.expansion,-1);
  }else if(variant==='sum_squares'){
   expr=sq(A,B,1)+' + '+sq(A,B,-1);
   result=add(plus.expansion,minus.expansion,1);
  }else if(variant==='cancel_double'){
   expr=sq(A,B,1)+' − 2·'+h(A)+'·'+h(B);
   result=add(plus.expansion,[g7MonoScale(plus.ab,2)],-1);
  }else if(variant==='cross_only'){
   expr=sq(A,B,1)+' − '+h(plus.a2)+' − '+h(plus.b2);
   result=add(add(plus.expansion,one(plus.a2),-1),one(plus.b2),-1);
  }else if(variant==='conjugate_plus'){
   expr=bin(A,B,-1)+bin(A,B,1)+' + '+h(ds.b2);
   result=add(ds.target,one(ds.b2));
  }else if(variant==='conjugate_minus'){
   expr=bin(A,B,-1)+bin(A,B,1)+' − '+h(ds.a2);
   result=add(ds.target,one(ds.a2),-1);
  }else if(variant==='linear_combo'){
   const m=ri(2,5),n=ri(2,5);expr=m+bin(A,B,1)+' − '+n+bin(A,B,-1);
   result=add(scale(g7BinomialPoly(A,B,1),m),scale(g7BinomialPoly(A,B,-1),n),-1);
  }else if(variant==='scaled_difference'){
   const m=ri(2,6);expr=m+sq(A,B,1)+' − '+m+sq(A,B,-1);
   result=scale(add(plus.expansion,minus.expansion,-1),m);
  }else{
   expr=bin(A,B,1)+bin(A,B,-1)+' − '+sq(A,B,-1);
   result=add(ds.target,minus.expansion,-1);
  }
  const key=polyKey(result),wrong=[scale(result,-1),add(result,[{coef:1,powers:{}}]),add(result,[{coef:3,powers:{}}])];
  return g7PolynomialChoice('Упрости выражение: '+form(expr)+'.',result,wrong,
   'Раскрываем скобки по формулам, затем приводим подобные слагаемые: '+g7PolynomialHtml(result)+'.',
   g7QuestionSig(raw,d,'audit3_'+variant,[g7MonomialPlain(A),g7MonomialPlain(B),key]),
   audit(raw,d,variant,{A,B,result}));
 }
 function factors44(raw,d){
  const variants=d===0?['common_difference','common_square','square_of_difference']:
    d===1?['common_difference','common_square','square_of_difference','group_difference','fourth_powers']:
          ['common_difference','common_square','group_difference','group_square','fourth_powers','group_extra','common_cube'];
  const variant=pick3(variants);
  let A,B,G,factors;
  if(variant==='fourth_powers'){
   A={coef:1,powers:{x:1}};B={coef:ri(2,7),powers:{}};
   const diff=g7BinomialPoly(A,B,-1),sum=g7BinomialPoly(A,B,1);
   const quad=pol(g7MonomialPow(A,2),g7MonomialPow(B,2));
   factors=[diff,sum,quad];
  }else{
   ({A,B}=g7FormulaPair(d,{cubes:variant==='common_cube'}));
   G={coef:ri(2,d===0?6:9),powers:d===0?{}:d===1?(Math.random()<.5?{z:1}:{}):{z:ri(1,2)}};
   if(variant==='common_difference'){
    const ds=g7DifferenceSquaresModel(A,B);
    factors=[one(G),ds.minus,ds.plus];
   }else if(variant==='common_square'||variant==='square_of_difference'){
    const sign=variant==='square_of_difference'?-1:pick3([1,-1]),p=g7BinomialPoly(A,B,sign);
    factors=[one(G),p,p];
   }else if(variant==='common_cube'){
    const cube=g7CubeFormulaModel(A,B,pick3([1,-1]));
    factors=[one(G),cube.first,cube.second];
   }else if(variant==='group_extra'){
    const ds=g7DifferenceSquaresModel(A,B),t={coef:ri(1,6),powers:{}};
    factors=[ds.minus,add(ds.plus,one(t))];
   }else{
    const left=pol({coef:ri(1,3),powers:{a:1}},{coef:ri(1,5),powers:{b:1}});
    if(variant==='group_square'){
     const p=g7BinomialPoly(A,B,pick3([1,-1]));
     factors=[left,p,p];
    }else{
     const ds=g7DifferenceSquaresModel(A,B);factors=[left,ds.minus,ds.plus];
    }
   }
  }
  const target=g7FactorizationExpand(factors),wrong=[];
  for(let i=0;i<Math.min(3,factors.length);i++){
   const w=factors.map(f=>g7PolynomialNormalize(f).map(g7MonoCopy));
   w[i][0].coef+=(w[i][0].coef>=0?1:-1);wrong.push(w);
  }
  return g7FactorizationChoice('Разложи на множители полностью: '+g7PolynomialHtml(target)+'.',
    factors,wrong,'Выделяем общий множитель, применяем формулы сокращённого умножения и при необходимости группировку. Получаем '+g7FactorizationHtml(factors)+'.',
    g7QuestionSig(raw,d,'audit3_'+variant,[polyKey(target)]),
    audit(raw,d,variant,{target,factors,A,B,G}));
 }
 makeG7Question=function(id,stageOverride=null){
  const raw=rawCourseId(id);
  if(raw!=='integer_expression_transform'&&raw!=='combined_factorization')return beforeStage3(id,stageOverride);
  const d=Math.max(0,Math.min(2,Number.isInteger(stageOverride)?stageOverride:activeDifficulty()));
  const q=raw==='integer_expression_transform'?transform43(raw,d):factors44(raw,d);
  return gPolishQuestionObject(q);
 };
})();