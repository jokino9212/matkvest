import {MatKvestApiClient} from './stage29_api_client.mjs?v=291';
export function createAccountStore(api=new MatKvestApiClient(), options={}){
 let current={status:'local',user:null,profiles:[],selectedId:null,snapshot:null}, revision=0, authBusy=false;
 const listeners=new Set();
 const read=()=>structuredClone(current);
 const update=patch=>{current={...current,...patch};for(const fn of listeners)fn(read());};
 const remember=()=>{if(current.user&&current.selectedId)options.saveSelection?.({owner:current.user.id,id:current.selectedId})};
 const clear=status=>{revision++;api.clearSession();update({status,user:null,profiles:[],selectedId:null,snapshot:null});};
 const onError=(error,token)=>{if(token!==revision)return;if(error.status===401||error.code==='CSRF_INVALID'||error.status===403)clear('signed-out');else update({status:error.status===0?'offline':'error',snapshot:null});};
 async function select(id){
  if(!current.user||!current.profiles.some(p=>p.id===id))throw new Error('PROFILE_NOT_OWNED');
  const token=++revision,p=current.profiles.find(p=>p.id===id),path='/student/profiles/'+encodeURIComponent(id);
  update({selectedId:id,snapshot:null,status:'loading'});remember();
  try{
   const [wallet,progress,entitlements,history]=await Promise.all([api.request('GET','/student-profiles/'+encodeURIComponent(id)+'/wallet'),api.request('GET',path+'/progress'),api.getStudentEntitlements(id),api.request('GET',path+'/history?limit=50')]);
   if(token!==revision)return;
   if(wallet.profile_id!==id||!Array.isArray(progress.course_progress)||!Array.isArray(history.attempts))throw new Error('PROFILE_RESPONSE_INVALID');
   update({snapshot:{profile:p,wallet,progress,entitlements,history},status:'ready'});
  }catch(e){onError(e,token);}
 }
 async function connect(kind,email,password){
  if(authBusy)return;
  authBusy=true;const token=++revision;
  const remembered=kind==='resume'?options.loadSelection?.():null;
  const oldOwner=current.user?.id,oldId=kind==='resume'?current.selectedId:null;
  update({status:'connecting',user:null,profiles:[],selectedId:null,snapshot:null});
  try{
   const user=kind==='login'?await api.login(email,password):await api.resumeSession();
   if(token!==revision)return;
   if(kind==='login')options.authChanged?.();
   if(user.role!=='student'){clear('unsupported-role');return;}
   const profiles=await api.request('GET','/student/profiles');
   if(token!==revision)return;
   if(!Array.isArray(profiles)||profiles.some(p=>p.user_id&&p.user_id!==user.id))throw new Error('PROFILE_LIST_INVALID');
   update({user,profiles,status:'select'});
   const preferred=remembered?.owner===user.id?remembered.id:oldOwner===user.id?oldId:null;
   const selected=profiles.find(p=>p.id===preferred)||(profiles.length===1?profiles[0]:null);
   if(selected)await select(selected.id);
  }catch(e){onError(e,token);}finally{authBusy=false;}
 }
 async function logout(){
  if(authBusy)return;
  authBusy=true;revision++;update({status:'connecting',snapshot:null,profiles:[],selectedId:null});
  options.saveSelection?.(null);
  try{await api.logout();clear('signed-out');}catch{clear('logout-unconfirmed');}
  finally{options.authChanged?.();authBusy=false;}
 }
 return {read,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},resume:()=>connect('resume'),login:(e,p)=>connect('login',e,p),select,logout,invalidate:clear};
}
