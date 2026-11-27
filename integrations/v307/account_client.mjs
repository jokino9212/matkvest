// v307 candidate API facade. No persistence of credentials or codes.
import {MatKvestApiClient} from '../backend95/stage29_api_client.mjs';
function identity(raw) {
 if(typeof raw!=='string')throw new TypeError('Login required');
 const v=raw.trim();
 if(v.includes('@'))return {email:v};
 if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/.test(v))throw new TypeError('Invalid username');
 return {username:v.toLowerCase()};
}
export class V307AccountClient extends MatKvestApiClient {
 register(identifier,password,role='student'){
  if(!['student','tutor'].includes(role))throw new TypeError('Unsupported public registration role');
  const id=identity(identifier);
  if(id.username&&role!=='student')throw new TypeError('Email required for tutor');
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
}
