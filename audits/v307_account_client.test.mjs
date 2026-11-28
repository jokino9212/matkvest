import test from 'node:test';
import assert from 'node:assert/strict';
import {V307AccountClient} from '../integrations/v307/account_client.mjs';
const setup=()=>{const calls=[];const api=new V307AccountClient({fetchImpl:async(url,options)=>{calls.push({url,...options,body:options.body?JSON.parse(options.body):null});return {ok:true,status:200,json:async()=>url.endsWith('/login')?{user:{id:'test',role:'student'},csrf_token:'csrf-test'}:{ok:true}}}});return {api,calls}};
const password='synthetic password';
test('username login is normalized, cookie-bound and no-store',async()=>{const {api,calls}=setup();await api.login('  Pupil_307 ',password);assert.deepEqual(calls[0].body,{username:'pupil_307',password});assert.equal(calls[0].credentials,'include');assert.equal(calls[0].cache,'no-store');assert.equal(api.csrfToken,'csrf-test');});
test('existing email login wire contract preserved',async()=>{const {api,calls}=setup();await api.login('test@example.com',password);assert.deepEqual(calls[0].body,{email:'test@example.com',password});});
test('registration no fabricated mail, tutor requires mail',async()=>{const {api,calls}=setup();await api.register('Pupil_307',password);assert.deepEqual(calls[0].body,{username:'pupil_307',password,role:'student'});assert.throws(()=>api.register('tutor307',password,'tutor'));assert.throws(()=>api.register('test@example.com',password,'admin'));assert.throws(()=>api.register('parent307',password,'parent'));await api.register('parent@example.com',password,'parent');assert.deepEqual(calls[1].body,{email:'parent@example.com',password,role:'parent'});});
test('invalid username rejected before network',async()=>{const {api,calls}=setup();await assert.rejects(api.login('ученик',password));assert.equal(calls.length,0);});
test('profile creation requires stable key, auth, and csrf; retry uses same key',async()=>{const {api,calls}=setup(),key='b1436d1d-0123-4f25-8ae9-df61e8a85370';assert.throws(()=>api.createProfile('Test'));await assert.rejects(api.createProfile('Test',key));await api.login('Pupil307',password);await api.createProfile(' Test ',key);await api.createProfile(' Test ',key);assert.deepEqual(calls[1].body,{display_name:'Test'});assert.equal(calls[1].headers['X-CSRF-Token'],'csrf-test');assert.equal(calls[1].headers['Idempotency-Key'],key);assert.deepEqual(calls[1],calls[2]);});
test('recovery issue protected, redemption uses username, clears session',async()=>{const {api,calls}=setup();await assert.rejects(api.issueRecovery(password));await api.login('Pupil307',password);await api.issueRecovery(password);assert.equal(calls[1].headers['X-CSRF-Token'],'csrf-test');assert.deepEqual(calls[1].body,{current_password:password});await api.redeemRecovery('PUPIL307','a'.repeat(43),'new password');assert.deepEqual(calls[2].body,{username:'pupil307',code:'a'.repeat(43),new_password:'new password'});assert.equal(api.csrfToken,null);});

const profile='a1436d1d-0123-4f25-8ae9-df61e8a85370',lesson='b1436d1d-0123-4f25-8ae9-df61e8a85370',pack='c1436d1d-0123-4f25-8ae9-df61e8a85370';
test('parent link and recovery require explicit consent and CSRF',async()=>{const {api,calls}=setup();assert.throws(()=>api.acceptParent('a'.repeat(43),'parent@example.com',password,false,true));await assert.rejects(api.parentInvite(password));await api.login('pupil307',password);await api.acceptParent('a'.repeat(43),'parent@example.com',password,true,true);assert.deepEqual(calls.at(-1).body,{code:'a'.repeat(43),parent_email:'parent@example.com',current_password:password,consent_all_profiles:true,allow_recovery:true});await api.parentRecovery(lesson,password);assert.equal(calls.at(-1).url,'/api/v1/parent/children/'+lesson+'/recovery');assert.equal(calls.at(-1).headers['X-CSRF-Token'],'csrf-test');});
test('teacher lesson and student routes cannot be confused',async()=>{const {api,calls}=setup();await api.login('tutor@example.com',password);await api.startLesson(profile,lesson);assert.equal(calls.at(-1).headers['Idempotency-Key'],lesson);await api.prepareLesson(profile,lesson,pack,4,'g4:table');assert.equal(calls.at(-1).url,'/api/v1/tutor/students/'+profile+'/lesson/'+lesson+'/offline-school');const body={items:[],abandoned:true};await api.submitBlock(profile,pack,body,lesson);assert.equal(calls.at(-1).url,'/api/v1/tutor/students/'+profile+'/lesson/'+lesson+'/offline-school/'+pack);await api.submitBlock(profile,pack,body);assert.equal(calls.at(-1).url,'/api/v1/student/profiles/'+profile+'/offline-school/'+pack);assert.throws(()=>api.startLesson('../bad',lesson));});
test('homework uses stable idempotency and separate server-issued assignment prepare',async()=>{const {api,calls}=setup();await api.login('tutor@example.com',password);await api.assignHomework(profile,'g4:table',0,null,lesson);await api.assignHomework(profile,'g4:table',0,null,lesson);assert.deepEqual(calls.at(-1),calls.at(-2));await api.prepareHomework(profile,lesson,pack,[lesson]);assert.equal(calls.at(-1).url,'/api/v1/student/profiles/'+profile+'/homework/'+lesson+'/prepare');assert.deepEqual(calls.at(-1).body,{device:pack,unavailable_permits:[lesson]});assert.throws(()=>api.assignHomework(profile,'g4:table',3,null,lesson));});

test('subscription is profile-specific and cannot activate premium from client',async()=>{const {api,calls}=setup();await assert.rejects(api.requestSubscription(profile,lesson));await api.login('parent@example.com',password);await api.subscription(profile);await api.requestSubscription(profile,lesson);await api.requestSubscription(profile,lesson);assert.deepEqual(calls.at(-1),calls.at(-2));assert.equal(calls.at(-1).body,null);assert.equal(calls.at(-1).url,'/api/v1/profiles/'+profile+'/subscription/requests');await api.cancelSubscriptionRequest(profile,pack);assert.equal(calls.at(-1).url,'/api/v1/profiles/'+profile+'/subscription/requests/'+pack);assert.throws(()=>api.requestSubscription('../bad',lesson));assert.equal(api.confirmSubscription,undefined);});

const reply=(body,status=200)=>({ok:status===200,status,json:async()=>body});
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
test('late login cannot restore CSRF after logout or overwrite a newer login',async()=>{
 const delayed=deferred();let count=0;
 const api=new V307AccountClient({fetchImpl:async()=>++count===1?delayed.promise:reply({user:{id:'new',role:'student'},csrf_token:'new-token'})});
 const old=api.login('old-user',password);api.clearSession();
 await api.login('new-user',password);
 delayed.resolve(reply({user:{id:'old',role:'student'},csrf_token:'old-token'}));
 await assert.rejects(old,/STALE_SESSION/);assert.equal(api.csrfToken,'new-token');
});
test('resume does not publish CSRF before actor verification and stale response cannot overwrite login',async()=>{
 const delayed=deferred(),started=deferred();
 const api=new V307AccountClient({fetchImpl:async url=>{
  if(url.endsWith('/csrf'))return reply({csrf_token:'old-token'});
  if(url.endsWith('/me')){started.resolve();return delayed.promise}
  if(url.endsWith('/login'))return reply({user:{id:'new',role:'student'},csrf_token:'new-token'});
 }});
 const old=api.resumeSession();await started.promise;assert.equal(api.csrfToken,null);
 await api.login('new-user',password);delayed.resolve(reply({id:'old',role:'student'}));
 await assert.rejects(old,/STALE_SESSION/);assert.equal(api.csrfToken,'new-token');
});
test('late logout or failed old request cannot clear a newer session',async()=>{
 const delayed=deferred(),oldGet=deferred();
 const api=new V307AccountClient({fetchImpl:async url=>{
  if(url.endsWith('/logout'))return delayed.promise;
  if(url.endsWith('/student/profiles'))return oldGet.promise;
  return reply({user:{id:'new',role:'student'},csrf_token:'new-token'});
 }});
 await api.login('old-user',password);const old=api.logout(),get=api.profiles();
 await api.login('new-user',password);delayed.resolve(reply({ok:true}));oldGet.resolve(reply({error:{code:'UNAUTHORIZED'}},401));
 await assert.rejects(old,/STALE_SESSION/);await assert.rejects(get,/STALE_SESSION/);assert.equal(api.csrfToken,'new-token');
});
test('failed actor verification never publishes newly returned CSRF',async()=>{
 const api=new V307AccountClient({fetchImpl:async url=>url.endsWith('/csrf')?reply({csrf_token:'unverified'}):reply({error:{code:'UNAUTHORIZED'}},401)});
 await assert.rejects(api.resumeSession(),e=>e.status===401);assert.equal(api.csrfToken,null);
});
