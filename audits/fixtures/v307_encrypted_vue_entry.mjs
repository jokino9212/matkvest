// Synthetic test harness only. Never include in an account or deployment build.
import {mountTraining} from '../../integrations/v307/training_view.mjs';
import {createV307Queue} from '../../integrations/v307/training_queue.mjs';
import {V307AccountClient} from '../../integrations/v307/account_client.mjs';
import {migrateDraftStore} from '../../integrations/v307/draft_migration.mjs';
import {encryptedSchoolOutbox} from '../../integrations/v307/encrypted_school_outbox.mjs';
import {createDraftKeySession} from '../../integrations/v307/draft_key_session.mjs';
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),device=id('d'),assignment=id('e');
const context={owner,profile,role:'student',kind:'homework',assignment},databaseName='mk307-synthetic-vue-audit';
const status=document.getElementById('audit-status');
async function start(){
 // The Playwright runner injects a fresh random synthetic fixture key for each context.
 // This is not a production key endpoint or a mechanism for retaining secrets on F5.
 const bytes=window.__mkR13SyntheticKey;delete window.__mkR13SyntheticKey;
 if(!Array.isArray(bytes)||bytes.length!==32)throw Error('TEST_KEY_REQUIRED');
 const raw=new Uint8Array(bytes);bytes.fill(0);
 let key;
 try{key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt'])}finally{raw.fill(0)}
 const credential={keyId:'synthetic-vue-key',key};
 const api=new V307AccountClient(),actor=await api.login('pupil307','synthetic-password');
 if(actor?.id!==owner||actor.role!=='student')throw Error('TEST_ACTOR');
 const scope={...context,ticket:crypto.randomUUID()};
 function authorize(s){
  if(s?.owner!==owner||s?.profile!==profile||s?.role!=='student'||s?.kind!=='homework'||s?.assignment!==assignment)throw Error('TEST_SCOPE');
 }
 // Deliberately injected fixture grant source. The actual session adapter enforces
 // actor/context, lifetime, exact request and revision floor at the IDB boundary.
 const session=createDraftKeySession({scope:()=>scope,maxOfflineMs:120000,
  fetchKey:async(s,request)=>{
   authorize(s);
   if(request.pack!==pack||request.operation==='open'&&request.keyId!==credential.keyId)throw Error('TEST_KEY');
   const verified=await api.resumeSession();
   if(verified?.id!==owner||verified.role!=='student')throw Error('TEST_ACTOR');
   return {credential,offlineForMs:120000};
  },
  fetchFloor:async(s,p)=>{
   authorize(s);if(p!==pack)throw Error('TEST_PACK');
   const verified=await api.resumeSession();
   if(verified?.id!==owner||verified.role!=='student')throw Error('TEST_ACTOR');
   return {minimum:0,offlineForMs:120000};
  }
 });
 await migrateDraftStore({databaseName,...session,initializeEmpty:true,guard:session.guardFor(context)});
 const outbox=encryptedSchoolOutbox({databaseName,...session});
 window.addEventListener('pagehide',()=>session.invalidate());
 const queue=createV307Queue({api,scope:()=>scope,outbox});
 await mountTraining({host:document.getElementById('audit-host'),queue,topic:'g4:table',stage:0,device,exit:()=>{}});
 status.textContent='TEST READY';
}
start().catch(e=>{status.textContent='TEST FAILED '+e.message;console.error(e.message)});
