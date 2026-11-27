// Read-only preflight, not an import or proof of ownership.
const LIMIT=32*1024*1024,MAX_FILES=20;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>typeof x==='string'&&/^student_[a-zA-Z0-9_-]{1,160}$/.test(x);
const balance=x=>Number.isSafeInteger(x)&&x>=0;
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':record(x)?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
function checkTree(root){
 const stack=[[root,0]];
 while(stack.length){const [x,depth]=stack.pop();if(depth>80)throw Error('BACKUP_TOO_DEEP');
 if(typeof x==='number'&&!Number.isFinite(x))throw Error('INVALID_NUMBER');
 if(record(x)){for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k))throw Error('UNSAFE_KEY');stack.push([x[k],depth+1]);}}
 else if(Array.isArray(x))for(const v of x)stack.push([v,depth+1]);
 }
}
export function analyzeV306Backups(files){
 if(!Array.isArray(files)||files.length<1||files.length>MAX_FILES)throw Error('BACKUP_COUNT');
 const groups=new Map(),unresolved=[],errors=[];
 for(const [index,file] of files.entries()){
  // Labels are only UI metadata, not trusted device or ownership IDs.
  const source={index,label:typeof file?.label==='string'?file.label.slice(0,160):'Копия '+(index+1)};
  try{
   if(typeof file?.text!=='string'||new TextEncoder().encode(file.text).length>LIMIT)throw Error('BACKUP_SIZE');
   const b=JSON.parse(file.text);checkTree(b);
   if(!record(b)||b.scope!=='all'||!record(b.profiles)||!Object.keys(b.profiles).length)throw Error('FULL_BACKUP_REQUIRED');
   const entries=Object.entries(b.profiles),ids=new Set(),prepared=[];
   for(const [name,p] of entries){
    if(!name.trim()||!record(p)||!balance(p.xp)||!balance(p.coins))throw Error('INVALID_PROFILE');
    if(validId(p.profileId)){if(ids.has(p.profileId))throw Error('DUPLICATE_ID_IN_FILE');ids.add(p.profileId);}
    prepared.push({name,profile:p,source});
   }
   for(const p of prepared){
    if(!validId(p.profile.profileId)){unresolved.push({name:p.name,source,reason:'IDENTITY_REVIEW',xp:p.profile.xp,coins:p.profile.coins});continue;}
    const id=p.profile.profileId;
    if(!groups.has(id))groups.set(id,[]);
    const rows=groups.get(id),key=canonical({name:p.name,profile:p.profile});
    const same=rows.find(x=>x.key===key);
    if(same)same.sources.push(source);
    else rows.push({key,name:p.name,profile:p.profile,sources:[source]});
   }
  }catch(e){errors.push({source,reason:e instanceof SyntaxError?'INVALID_JSON':String(e.message||'INVALID_BACKUP')});}
 }
 const profiles=Array.from(groups,([id,rows])=>({id,status:rows.length===1?'REVIEW_SINGLE_SNAPSHOT':'CONFLICT_REQUIRES_REVIEW',variants:rows.map(({name,profile,sources})=>({name,xp:profile.xp,coins:profile.coins,sources}))}));
 const names=new Map();
 for(const p of profiles)for(const v of p.variants){const k=v.name.normalize('NFKC').trim().toLocaleLowerCase('ru');if(!names.has(k))names.set(k,new Set());names.get(k).add(p.id);}
 const sameNameDifferentIds=Array.from(names,([name,ids])=>({name,ids:[...ids]})).filter(x=>x.ids.length>1);
 return {profiles,unresolved,errors,sameNameDifferentIds,hasConflicts:profiles.some(x=>x.variants.length>1)||unresolved.length>0||errors.length>0||sameNameDifferentIds.length>0,mayCommit:false};
}
