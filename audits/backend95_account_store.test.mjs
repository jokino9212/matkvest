import assert from 'node:assert/strict';
import {createAccountStore} from '../integrations/backend95/account_store.mjs';
const profiles=[{id:'a',display_name:'A',xp_total:3},{id:'b',display_name:'B',xp_total:9}];
let release,slow=false,network=false,unauthorized=false;
const api={clearSession(){},resumeSession:async()=>({id:'owner',role:'student'}),login:async()=>({id:'owner',role:'student'}),logout:async()=>({ok:true}),getStudentEntitlements:async()=>({}),request:async(method,path)=>{
 if(path==='/student/profiles')return profiles;
 if(unauthorized)throw Object.assign(new Error('401'),{status:401});
 if(network)throw Object.assign(new Error('network'),{status:0});
 if(path.endsWith('/wallet')){const id=path.split('/')[2];if(slow&&id==='a')await new Promise(r=>release=r);return {profile_id:id,balance:id==='a'?2:8};}
 return {course_progress:[]};
}};
const store=createAccountStore(api);await store.resume();assert.equal(store.read().status,'select');
await store.select('a');assert.equal(store.read().snapshot.wallet.balance,2);
slow=true;const old=store.select('a');await store.select('b');release();await old;
assert.equal(store.read().selectedId,'b');assert.equal(store.read().snapshot.wallet.balance,8);
await assert.rejects(store.select('foreign'));
network=true;await store.select('a');assert.equal(store.read().status,'offline');assert.equal(store.read().snapshot,null);
network=false;unauthorized=true;await store.select('b');assert.equal(store.read().user,null);assert.equal(store.read().snapshot,null);
unauthorized=false;await store.login('test@example.test','dummy-password');await store.select('b');await store.logout();assert.equal(store.read().selectedId,null);
console.log('PASS_ACCOUNT_STORE ownership, stale response, offline, logout');
