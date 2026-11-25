import assert from 'node:assert/strict';
import {createAccountStore} from '../integrations/backend95/account_store.mjs';
const profiles=[{id:'a',display_name:'A',xp_total:3},{id:'b',display_name:'B',xp_total:9}];
let release,slow=false,network=false,unauthorized=false,selection=null;
const api={clearSession(){},resumeSession:async()=>({id:'owner',role:'student'}),login:async()=>({id:'owner',role:'student'}),logout:async()=>({ok:true}),getStudentEntitlements:async()=>({}),request:async(method,path)=>{
 if(path==='/student/profiles')return profiles;
 if(unauthorized)throw Object.assign(new Error('401'),{status:401});
 if(network)throw Object.assign(new Error('network'),{status:0});
 if(path.endsWith('/wallet')){const id=path.split('/')[2];if(slow&&id==='a')await new Promise(r=>release=r);return {profile_id:id,balance:id==='a'?2:8};}
 if(path.includes('/history?'))return {attempts:[],next_offset:null};
 return {course_progress:[]};
}};
const store=createAccountStore(api,{loadSelection:()=>selection,saveSelection:v=>selection=v});
await store.resume();assert.equal(store.read().status,'select');
await store.select('a');assert.equal(store.read().snapshot.wallet.balance,2);
slow=true;const old=store.select('a');await store.select('b');release();await old;
assert.equal(store.read().selectedId,'b');assert.equal(store.read().snapshot.wallet.balance,8);
await assert.rejects(store.select('foreign'));
store.invalidate('session-changed');assert.equal(store.read().snapshot,null);await store.resume();assert.equal(store.read().selectedId,'b');
network=true;await store.select('a');assert.equal(store.read().status,'offline');assert.equal(store.read().snapshot,null);
network=false;unauthorized=true;await store.select('b');assert.equal(store.read().user,null);assert.equal(store.read().snapshot,null);
unauthorized=false;await store.login('test@example.test','dummy-password');await store.select('b');await store.logout();assert.equal(store.read().selectedId,null);assert.equal(selection,null);
console.log('PASS_ACCOUNT_STORE ownership, stale response, offline, resume, logout');

// Regression: failed logout must not silently restore the still-valid cookie after F5.
let persisted=false,available=true,session=true,logins=0;
const offlineError=()=>Object.assign(new Error('network'),{status:0});
const fixture={...api,resumeSession:async()=>{if(!available)throw offlineError();if(!session)throw Object.assign(new Error('401'),{status:401});return {id:'owner',role:'student'}},login:async()=>{logins++;session=true;return {id:'owner',role:'student'}},logout:async()=>{if(!available)throw offlineError();session=false}};
const options={loadLogoutPending:()=>persisted,saveLogoutPending:v=>persisted=v};
let isolated=createAccountStore(fixture,options);
await isolated.resume();await isolated.select('b');available=false;await isolated.logout();
assert.equal(isolated.read().status,'logout-unconfirmed');assert.equal(persisted,true);assert.equal(isolated.read().snapshot,null);
available=true;isolated=createAccountStore(fixture,options);await isolated.resume();
assert.equal(isolated.read().status,'logout-unconfirmed');assert.equal(isolated.read().snapshot,null);
await isolated.login('test@example.test','dummy');assert.equal(logins,0);
await isolated.logout();assert.equal(isolated.read().status,'signed-out');assert.equal(persisted,false);assert.equal(session,false);
console.log('PASS_LOGOUT_INTENT_RELOAD');
