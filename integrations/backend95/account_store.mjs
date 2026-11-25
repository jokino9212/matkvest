import {MatKvestApiClient} from './stage29_api_client.mjs?v=297';
import {validateCollection} from './economy_read.mjs?v=297';
export function createAccountStore(api=new MatKvestApiClient(), options={}){
 let current={status:'local',user:null,profiles:[],selectedId:null,snapshot:null}, revision=0, authBusy=false;
 // Persist only a non-sensitive logout intent, never a session or account snapshot.
 let logoutPending=false;
 const pending=()=>{const persisted=options.loadLogoutPending?.();return typeof persisted==='boolean'?persisted:logoutPending;};
 const markPending=value=>{logoutPending=value;options.saveLogoutPending?.(value);};
 const listeners=new Set();
 const read=()=>structuredClone(current);
 const update=patch=>{current={...current,...patch};for(const fn of listeners)fn(read());};
 const remember=()=>{if(current.user&&current.selectedId)options.saveSelection?.({owner:current.user.id,id:current.selectedId})};
 const clear=status=>{revision++;api.clearSession();update({status,user:null,profiles:[],selectedId:null,snapshot:null});};
 const onError=(error,token)=>{if(token!==revision)return;if(error.status===401||error.code==='CSRF_INVALID'||error.status===403)clear('signed-out');else update({status:error.status===0?'offline':'error',snapshot:null});};
 async function select(id){
  if(!current.user||!current.profiles.some(p=>p.id===id))throw new Error('PROFILE_NOT_OWNED');
  const token=++revision,owner=current.user.id,path='/student/profiles/'+encodeURIComponent(id);
  update({selectedId:id,snapshot:null,status:'loading'});remember();
  try{
   const [wallet,progress,entitlements,history,collection,profiles]=await Promise.all([api.request('GET','/student-profiles/'+encodeURIComponent(id)+'/wallet'),api.request('GET',path+'/progress'),api.getStudentEntitlements(id),api.request('GET',path+'/history?limit=50'),api.request('GET',path+'/collection'),api.request('GET','/student/profiles')]);
   if(token!==revision)return;
   const p=Array.isArray(profiles)?profiles.find(x=>x.id===id):null;
   if(!p||profiles.some(x=>x.user_id&&x.user_id!==owner)||wallet.profile_id!==id||!Number.isSafeInteger(wallet.balance)||wallet.balance<0||!Array.isArray(progress.course_progress)||!Array.isArray(history.attempts))throw new Error('PROFILE_RESPONSE_INVALID');
   update({profiles,snapshot:{profile:p,wallet,progress,entitlements,history,collection:validateCollection(collection)},status:'ready'});
  }catch(e){onError(e,token);}
 }
 async function connect(kind,email,password){
  if(authBusy)return;
  if(pending()){clear('logout-unconfirmed');return;}
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
  authBusy=true;markPending(true);revision++;
  update({status:'connecting',user:null,snapshot:null,profiles:[],selectedId:null});
  options.saveSelection?.(null);
  options.authChanged?.();
  try{
   // Recover cookie-bound CSRF even after offline invalidation or F5.
   // A missing/expired session already satisfies the logout intent.
   try{await api.resumeSession();}catch(error){if(error.status!==401)throw error;markPending(false);clear('signed-out');return;}
   await api.logout();
   markPending(false);clear('signed-out');
  }catch(error){
   if(error.status===401){markPending(false);clear('signed-out');}
   else clear('logout-unconfirmed');
  }finally{options.authChanged?.();authBusy=false;}
 }
 return {read,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},resume:()=>connect('resume'),login:(e,p)=>connect('login',e,p),select,logout,invalidate:status=>clear(status==='local'?status:pending()?'logout-unconfirmed':status),logoutPending:pending};
}
