// Inert AST renderer: never parse server HTML, never allow event handlers, remote
// URLs, foreignObject, arbitrary CSS, or references outside this question.
const TAGS=new Set('div span b strong i em small br p sup sub table caption thead tbody tr th td ul ol li kbd svg g rect circle ellipse line polyline polygon path text tspan title desc defs marker lineargradient radialgradient stop clippath pattern use'.split(' '));
const ATTR=new Set('class style role aria-label aria-hidden aria-labelledby aria-describedby id title scope colspan rowspan width height viewbox xmlns preserveaspectratio x y x1 y1 x2 y2 cx cy r rx ry d points fill fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity opacity transform font-size font-weight font-family text-anchor dominant-baseline alignment-baseline dx dy marker-start marker-end marker-mid markerwidth markerheight markerunits refx refy orient offset stop-color stop-opacity gradientunits gradienttransform xlink:href href clip-path clip-rule fill-rule patternunits patterntransform'.split(' '));
const STYLES=new Set('width max-width min-width height max-height min-height overflow overflow-x overflow-y margin margin-top margin-bottom margin-left margin-right padding padding-top padding-bottom padding-left padding-right display text-align vertical-align border border-width border-style border-color border-radius border-collapse border-spacing background background-color color font-size font-weight font-family line-height letter-spacing white-space gap row-gap column-gap align-items justify-content grid-template-columns grid-template-rows flex flex-wrap flex-direction flex-shrink box-sizing opacity'.split(' '));
const local=/^#[\w.-]+$/,localUrl=/^url\(#[\w.-]+\)$/;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function validateNodes(nodes){
 if(!Array.isArray(nodes)||!nodes.length)throw Error('INVALID_VISUAL_NODES');
 let count=0,bytes=0;const ids=new Set(),refs=[];
 function visit(n,depth){
  if(++count>3000||depth>32)throw Error('VISUAL_LIMIT');
  if(typeof n==='string'){bytes+=n.length;if(bytes>200000)throw Error('VISUAL_LIMIT');return;}
  if(!object(n)||Object.keys(n).length!==3||typeof n.tag!=='string'||!TAGS.has(n.tag.toLowerCase())||!object(n.attrs)||!Array.isArray(n.children))throw Error('INVALID_VISUAL_NODE');
  for(const [k,v] of Object.entries(n.attrs)){
   const key=k.toLowerCase();if(!ATTR.has(key))throw Error('INVALID_VISUAL_ATTRIBUTE');
   if(key==='style'){
    if(!object(v))throw Error('INVALID_VISUAL_STYLE');
    for(const [p,value] of Object.entries(v))if(!STYLES.has(p)||typeof value!=='string'||value.length>300||/[{}<>;\\@]|url\s*\(|expression/i.test(value))throw Error('INVALID_VISUAL_STYLE');
   }else{
    if(typeof v!=='string'||v.length>30000||(/[<>]/.test(v)&&!key.startsWith('aria-')))throw Error('INVALID_VISUAL_ATTRIBUTE');
    bytes+=v.length;if(bytes>200000)throw Error('VISUAL_LIMIT');
    if(key==='id'){if(!/^[\w.-]+$/.test(v)||ids.has(v))throw Error('INVALID_VISUAL_ID');ids.add(v);}
    if(key==='href'||key==='xlink:href'){if(!local.test(v))throw Error('INVALID_VISUAL_REF');refs.push(v.slice(1));}
    if(/url\s*\(/i.test(v)){if(!localUrl.test(v))throw Error('INVALID_VISUAL_REF');refs.push(v.slice(5,-1));}
    if(['aria-labelledby','aria-describedby'].includes(key))refs.push(...v.split(/\s+/));
   }
  }
  n.children.forEach(c=>visit(c,depth+1));
 }
 nodes.forEach(n=>visit(n,0));if(refs.some(x=>!ids.has(x)))throw Error('INVALID_VISUAL_REF');return nodes;
}
export function renderNodes(h,nodes,prefix){
 validateNodes(nodes);
 const render=n=>{if(typeof n==='string')return n;const attrs={};for(const [k,v] of Object.entries(n.attrs)){const key=k.toLowerCase();if(key==='id')attrs[k]=prefix+v;else if(key==='href'||key==='xlink:href')attrs[k]='#'+prefix+v.slice(1);else if(typeof v==='string'&&localUrl.test(v))attrs[k]='url(#'+prefix+v.slice(5,-1)+')';else if(['aria-labelledby','aria-describedby'].includes(key))attrs[k]=v.split(/\s+/).map(x=>prefix+x).join(' ');else attrs[k]=v;}return h(n.tag,attrs,n.children.map(render));};
 return nodes.map(render);
}
