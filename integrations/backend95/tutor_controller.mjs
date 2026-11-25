// Read-only views and explicit mutations through existing role/CSRF API.
// Invitation secrets and report data are RAM-only; never cache them offline.
export function createTutorController({api,store,mode,emit}){
 let data=null,report=null,invite=null,error='',busy=false,token=0,scope=null,search='';
 const auth=()=>{const s=store.read();return mode()==='server'&&!store.logoutPending()&&s.user&&['ready','tutor-ready'].includes(s.status)?{owner:s.user.id,role:s.user.role,profile:s.selectedId}:null};
 const same=sc=>!!sc&&JSON.stringify(auth())===JSON.stringify(sc);
 const reset=()=>{token++;data=report=invite=null;scope=null;error='';search='';};
 const notify=()=>emit();
 const tutorPath=id=>'/tutor/students/'+encodeURIComponent(id);
 async function load(sc=auth()){
  if(!sc||sc.role!=='tutor')return;
  const id=++token;data=report=null;busy=true;notify();
  try{
   const [list,license,seats]=await Promise.all([api.request('GET','/tutor/students'),api.request('GET','/me/license'),api.request('GET','/tutor/seats')]);
   if(!same(sc)||id!==token)return;
   if(!Array.isArray(list.students)||!Array.isArray(seats.linked_student_ids)||!Number.isInteger(seats.limit)||!Number.isInteger(seats.allocated)||!Number.isInteger(seats.available)||list.students.some(x=>typeof x.profile_id!=='string'||typeof x.display_name!=='string'))throw Error('TUTOR_RESPONSE_INVALID');
   data={students:list.students,license:license.license,seats};error='';
  }catch(e){if(same(sc)&&id===token)error='Не удалось получить кабинет преподавателя.';}
  finally{if(id===token){busy=false;notify()}}
 }
 async function onAccount(){
  const sc=auth();
  if(!sc){reset();busy=false;notify();return;}
  if(!same(scope)){reset();scope=sc;}
  if(sc.role==='tutor')await load(sc);
 }
 const read=()=>{
  if(!same(scope)||!scope)return null;
  if(scope.role==='student')return {busy,error};
  return {busy,error,invite:invite&&Date.parse(invite.expires_at)>Date.now()?invite:null,report,data,search};
 };
 async function run(action,arg){
  const sc=auth();if(!sc||busy||!navigator.onLine)return;
  if(action==='search'){search=String(arg).slice(0,200);notify();return;}
  if(action==='back'){token++;report=null;notify();return;}
  if(action==='refresh'){await onAccount();return;}
  const isTutor=sc.role==='tutor',isStudent=sc.role==='student';
  const owned=id=>data?.students.some(s=>s.profile_id===id);
  if(isTutor&&!['invite','revoke','trial','seats','unlink','report'].includes(action)||isStudent&&!['accept','student-unlink'].includes(action))return;
  if(['unlink','report'].includes(action)&&!owned(action==='report'?arg?.id:arg))return;
  if(action==='seats'&&(!Array.isArray(arg)||!data||new Set(arg).size!==arg.length||arg.length>data.seats.limit||arg.some(id=>!owned(id))))return;
  if(action==='revoke'&&arg!==invite?.invitation_id)return;
  if(action==='accept'&&(!sc.profile||arg?.consent!==true||typeof arg.code!=='string'||arg.code.length<32||arg.code.length>256))return;
  if(action==='student-unlink'&&!sc.profile)return;
  busy=true;error='';const id=++token;if(action==='report')report=null;notify();
  try{
   const actor=await api.resumeSession();if(actor.id!==sc.owner||actor.role!==sc.role||!same(sc)||id!==token)return;
   if(action==='report'){
    const offset=Number(arg.offset||0);if(!Number.isInteger(offset)||offset<0||offset>100000)return;
    const result=await api.request('GET',tutorPath(arg.id)+'/report?offset='+offset+'&limit=50');
    if(result.profile_id!==arg.id||result.source!=='verified_server'||!Array.isArray(result.rows)||!result.page_stats)throw Error('REPORT_INVALID');
    if(same(sc)&&id===token)report=result;
    return;
   }
   let result;
   if(action==='invite')result=await api.request('POST','/tutor/invitations');
   if(action==='revoke')await api.request('DELETE','/tutor/invitations/'+encodeURIComponent(arg));
   if(action==='trial')await api.request('POST','/tutor/trial');
   if(action==='seats')await api.request('PUT','/tutor/seats',{body:{student_profile_ids:arg}});
   if(action==='unlink')await api.request('DELETE',tutorPath(arg));
   if(action==='accept')await api.request('POST','/student/tutor-links/accept',{body:{student_profile_id:sc.profile,code:arg.code,consent:true}});
   if(action==='student-unlink')await api.request('DELETE','/student/profiles/'+encodeURIComponent(sc.profile)+'/tutor-link');
   if(!same(sc)||id!==token)return;
   if(action==='invite'){if(typeof result.code!=='string'||typeof result.invitation_id!=='string'||!Number.isFinite(Date.parse(result.expires_at)))throw Error('INVITATION_INVALID');invite=result;}
   if(action==='revoke')invite=null;
   if(isStudent){await store.select(sc.profile);}
   else await load(sc);
  }catch(e){if(same(sc)&&id===token){error='Запрос не подтверждён: '+(e.code||'проверьте соединение')+'. Обновите данные перед повтором.';if(action==='report')report=null;}}
  finally{if(id===token){busy=false;notify()}}
 }
 return {read,onAccount,run,reset};
}
