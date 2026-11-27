// v307 candidate API facade. No persistence of credentials or codes.
import {MatKvestApiClient} from '../backend95/stage29_api_client.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function id(v){if(typeof v!=='string'||!uuid.test(v))throw new TypeError('Invalid UUID');return v;}
function student(p){return '/student/profiles/'+id(p);}
function tutor(p){return '/tutor/students/'+id(p);}
function identity(raw) {
 if(typeof raw!=='string')throw new TypeError('Login required');
 const v=raw.trim();
 if(v.includes('@'))return {email:v};
 if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/.test(v))throw new TypeError('Invalid username');
 return {username:v.toLowerCase()};
}
export class V307AccountClient extends MatKvestApiClient {
 register(identifier,password,role='student'){
  if(!['student','tutor','parent'].includes(role))throw new TypeError('Unsupported public registration role');
  const id=identity(identifier);
  if(id.username&&role!=='student')throw new TypeError('Email required for adult account');
  return this.request('POST','/auth/register',{body:{...id,password,role},publicRequest:true});
 }
 async login(identifier,password){
  this.clearSession();
  const response=await this.request('POST','/auth/login',{body:{...identity(identifier),password},publicRequest:true});
  if(!response?.csrf_token||!response?.user)throw new Error('LOGIN_INVALID');
  this.csrfToken=response.csrf_token;return response.user;
 }
 createProfile(name,idempotencyKey){
  if(typeof name!=='string'||!name.trim()||name.trim().length>120)throw new TypeError('Invalid name');
  if(typeof idempotencyKey!=='string'||!idempotencyKey)throw new TypeError('Stable idempotency key required');
  return this.request('POST','/student/profiles',{body:{display_name:name.trim()},idempotencyKey});
 }
 issueRecovery(currentPassword){
  return this.request('POST','/auth/student-recovery/issue',{body:{current_password:currentPassword}});
 }
 async redeemRecovery(username,code,newPassword){
  const id=identity(username);
  if(!id.username||typeof code!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(code))throw new TypeError('Invalid recovery credentials');
  const response=await this.request('POST','/auth/student-recovery/redeem',{body:{username:id.username,code,new_password:newPassword},publicRequest:true});
  this.clearSession();return response;
 }

 profiles(){return this.request('GET','/student/profiles');}
 parentInvite(password){return this.request('POST','/parent/invitations',{body:{current_password:password}});}
 parentLinks(){return this.request('GET','/student/parent-links');}
 acceptParent(code,parentEmail,password,consent,allowRecovery){
  if(consent!==true||typeof allowRecovery!=='boolean')throw new TypeError('Explicit consent required');
  return this.request('POST','/student/parent-links/accept',{body:{code,parent_email:parentEmail,current_password:password,consent_all_profiles:true,allow_recovery:allowRecovery}});
 }
 children(){return this.request('GET','/parent/children');}
 revokeParent(link,asParent=false){return this.request('DELETE',(asParent?'/parent/children/':'/student/parent-links/')+id(link));}
 parentRecovery(link,password){return this.request('POST','/parent/children/'+id(link)+'/recovery',{body:{current_password:password}});}
 tutorStudents(){return this.request('GET','/tutor/students');}
 tutorInvite(){return this.request('POST','/tutor/invitations');}
 acceptTutor(profile,code,consent){if(consent!==true)throw new TypeError('Explicit consent required');return this.request('POST','/student/tutor-links/accept',{body:{student_profile_id:id(profile),code,consent:true}});}
 lessonPermission(profile){return this.request('GET',student(profile)+'/lesson-permission');}
 grantLesson(profile,password,consent){if(consent!==true)throw new TypeError('Explicit consent required');return this.request('POST',student(profile)+'/lesson-permission',{body:{current_password:password,consent:true}});}
 revokeLesson(profile){return this.request('DELETE',student(profile)+'/lesson-permission');}
 lesson(profile){return this.request('GET',tutor(profile)+'/lesson');}
 startLesson(profile,key){return this.request('POST',tutor(profile)+'/lesson',{idempotencyKey:id(key)});}
 endLesson(profile,lesson){return this.request('DELETE',tutor(profile)+'/lesson/'+id(lesson));}
 homework(profile,asTutor=false,offset=0){if(!Number.isInteger(offset)||offset<0||offset>100000)throw new TypeError('Invalid offset');return this.request('GET',(asTutor?tutor(profile):student(profile))+'/homework?offset='+offset);}
 assignHomework(profile,topic,stage,due,key){
  if(typeof topic!=='string'||!/^g[45]:[a-z0-9_:]+$/.test(topic)||!Number.isInteger(stage)||stage<0||stage>2)throw new TypeError('Invalid assignment');
  return this.request('POST',tutor(profile)+'/homework',{body:{topic_id:topic,stage,due_at:due||null},idempotencyKey:id(key)});
 }
 homeworkDetail(profile,assignment){return this.request('GET',tutor(profile)+'/homework/'+id(assignment));}
 cancelHomework(profile,assignment){return this.request('DELETE',tutor(profile)+'/homework/'+id(assignment));}
 prepareHomework(profile,assignment,device,unavailable=[]){return this.request('POST',student(profile)+'/homework/'+id(assignment)+'/prepare',{body:{device:id(device),unavailable_permits:unavailable.map(id)}});}
 prepareLesson(profile,lesson,device,grade,topic,unavailable=[]){return this.request('POST',tutor(profile)+'/lesson/'+id(lesson)+'/offline-school',{body:{device:id(device),grade,topic,unavailable_permits:unavailable.map(id)}});}
 submitBlock(profile,pack,body,lesson=null){const path=lesson?tutor(profile)+'/lesson/'+id(lesson):student(profile);return this.request('PUT',path+'/offline-school/'+id(pack),{body});}
 subscription(profile){return this.request('GET','/profiles/'+id(profile)+'/subscription');}
 requestSubscription(profile,key){return this.request('POST','/profiles/'+id(profile)+'/subscription/requests',{idempotencyKey:id(key)});}
 cancelSubscriptionRequest(profile,request){return this.request('DELETE','/profiles/'+id(profile)+'/subscription/requests/'+id(request));}
 economyCatalog(profile){return this.request('GET',student(profile)+'/economy-v307/catalog');}
 economyState(profile){return this.request('GET',student(profile)+'/economy-v307/state');}
 economyOperation(profile,body,key){return this.request('POST',student(profile)+'/economy-v307/operations',{body,idempotencyKey:id(key)});}
 quickDraft(profile){return this.request('GET',student(profile)+'/draft');}
 quickStart(profile,count,key){if(![5,10].includes(count))throw new TypeError('Invalid quick length');return this.request('POST',student(profile)+'/training-starts',{body:{grade:4,topic_id:'quick:multiplication',question_count:count},idempotencyKey:id(key)});}
 quickQuestions(profile,start){return this.request('GET',student(profile)+'/training-starts/'+id(start)+'/questions');}
 quickSave(profile,body,key){return this.request('PUT',student(profile)+'/draft',{body,idempotencyKey:id(key)});}
 quickFinish(profile,start,body){return this.request('PUT',student(profile)+'/training-starts/'+id(start)+'/result',{body});}
 quickLatest(profile){return this.request('GET',student(profile)+'/verified-training/latest');}
 trainingGoals(profile){return this.request('GET',student(profile)+'/training-goals');}
 startGoal(profile,type,key){if(!['correct','streak'].includes(type))throw new TypeError('Invalid goal type');return this.request('POST',student(profile)+'/training-goals',{body:{type},idempotencyKey:id(key)});}
 cancelGoal(profile,goal){return this.request('DELETE',student(profile)+'/training-goals/'+id(goal));}
}
