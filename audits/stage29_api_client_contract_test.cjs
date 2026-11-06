'use strict';
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
(async()=>{
 const {MatKvestApiClient,MatKvestApiError,stableStartKey,canonicalTopicId}=await import('../integrations/stage29_api_client.mjs');
 const profile='11111111-1111-4111-8111-111111111111',attempt='local-8.77-attempt-001';
 assert.equal(canonicalTopicId(5,'natural'),'g5:natural');
 assert.equal(canonicalTopicId(6,'g6:divisors_multiples'),'g6:divisors_multiples');
 assert.equal(canonicalTopicId(4,'column'),'g4:column');
 assert.throws(()=>canonicalTopicId(6,'g5:natural'),/Cross-grade/);
 assert.throws(()=>canonicalTopicId(0,'natural'),/Invalid grade/);
 const key1=await stableStartKey(profile,attempt,webcrypto);
 const key2=await stableStartKey(profile,attempt,webcrypto);
 const key3=await stableStartKey(profile,attempt+'-B',webcrypto);
 assert.match(key1,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 assert.equal(key1,key2);assert.notEqual(key1,key3);
 const calls=[];
 let injectedStatus=null;
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(injectedStatus){
   const status=injectedStatus;injectedStatus=null;
   return {ok:false,status,json:async()=>({error:{code:status===429?'FREE_START_LIMIT':'TOPIC_CATALOG_PENDING',message:'Server policy rejected request'}})};
  }
  if(url.endsWith('/auth/login'))return {ok:true,status:200,json:async()=>({user:{id:'u',role:'student'},csrf_token:'csrf-in-memory'})};
  if(url.endsWith('/auth/csrf'))return {ok:true,status:200,json:async()=>({csrf_token:'csrf-in-memory'})};
  if(url.endsWith('/auth/register'))return {ok:true,status:201,json:async()=>({id:'new-account',role:'student'})};
  if(url.endsWith('/auth/logout'))return {ok:true,status:200,json:async()=>({ok:true})};
  if(url.endsWith('/training-starts'))return {ok:true,status:201,json:async()=>({started:true})};
  return {ok:true,status:200,json:async()=>({allowed:true})};
 };
 const api=new MatKvestApiClient({fetchImpl});
 await assert.rejects(api.startTraining(profile,5,'natural',attempt),e=>e.code==='CSRF_REQUIRED');
 assert.throws(()=>api.register('a@b.co','Password123','admin'),/Role cannot be admin/);
 await api.register('pupil@example.test','valid-password-123','student');
 const user=await api.login('pupil@example.test','valid-password-123');
 assert.equal(user.role,'student');
 await api.getMe();
 await api.getEntitlements();
 await api.getStudentEntitlements(profile);
 const allowed=await api.checkTopic(profile,5,'natural');assert.equal(allowed.allowed,true);
 const start=await api.startTraining(profile,5,'natural',attempt);assert.equal(start.started,true);
 api.clearSession();
 await assert.rejects(api.startTraining(profile,5,'natural',attempt),e=>e.code==='CSRF_REQUIRED');
 const resumedUser=await api.resumeSession();
 assert.equal(resumedUser.role,'student');
 await api.startTraining(profile,5,'natural',attempt);
 const last=calls.at(-1);
 assert(last.url.endsWith('/student/profiles/'+profile+'/training-starts'));
 assert.equal(last.options.method,'POST');
 assert.equal(last.options.headers['X-CSRF-Token'],'csrf-in-memory');
 assert.equal(last.options.headers['Idempotency-Key'],key1);
 assert.deepEqual(JSON.parse(last.options.body),{grade:5,topic_id:'g5:natural'});
 for(const call of calls){
  assert.equal(call.options.credentials,'include');
  assert.equal(call.options.cache,'no-store');
  assert(!Object.hasOwn(call.options.headers,'Authorization'),'No bearer token storage');
 }
 injectedStatus=429;
 await assert.rejects(api.startTraining(profile,5,'natural',attempt),e=>e.code==='FREE_START_LIMIT'&&e.status===429);
 injectedStatus=409;
 await assert.rejects(api.checkTopic(profile,5,'natural'),e=>e.code==='TOPIC_CATALOG_PENDING'&&e.status===409);
 await api.logout();
 await assert.rejects(api.startTraining(profile,5,'natural',attempt),e=>e.code==='CSRF_REQUIRED');
 const offlineApi=new MatKvestApiClient({fetchImpl:async()=>{throw Error('offline')}});
 await assert.rejects(offlineApi.getEntitlements(),e=>e.code==='NETWORK_UNAVAILABLE');
 assert.throws(()=>new MatKvestApiClient({baseUrl:'https://api.example.com/api/v1',fetchImpl}),/same-origin/);
 console.log('STAGE29_ADAPTER_PASS',JSON.stringify({checks:23,calls:calls.length,sameStartKey:key1,csrf:'in-memory-only',offline:'fail-closed',source:'backend 9.4 auth/entitlements routes'}));
})().catch(e=>{console.error(e);process.exitCode=1});
