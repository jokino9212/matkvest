// Isolated fixture. Not a real server key provider and never a regular review input.
import {mountQuick} from '../../integrations/v307/quick_view.mjs';
import {mountReview} from '../../integrations/v307/review_view.mjs';
import {mountEconomy} from '../../integrations/v307/economy_view.mjs';
import {V307AccountClient} from '../../integrations/v307/account_client.mjs';
import {createDraftKeySession} from '../../integrations/v307/draft_key_session.mjs';
import {migrateRequestJournal,encryptedRequestOutbox} from '../../integrations/v307/encrypted_request_outbox.mjs';
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('b'),profile=id('a');
const status=document.getElementById('audit-status');
async function start(){
 const channel=new URL(location.href).searchParams.get('channel'),mounts={quick:mountQuick,review:mountReview,economy:mountEconomy};
 if(!Object.hasOwn(mounts,channel))throw Error('TEST_CHANNEL');
 const bytes=window.__mkR13JournalSyntheticKey;delete window.__mkR13JournalSyntheticKey;
 if(!Array.isArray(bytes)||bytes.length!==32)throw Error('TEST_KEY_REQUIRED');
 const raw=new Uint8Array(bytes);bytes.fill(0);
 let key;
 try{key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt'])}finally{raw.fill(0)}
 const credential={keyId:'synthetic-journal-'+channel,key},api=new V307AccountClient();
 const actor=await api.login('pupil307','synthetic-password');
 if(actor?.id!==owner||actor.role!=='student')throw Error('TEST_ACTOR');
 const scope={owner,profile,role:'student',ticket:crypto.randomUUID()},context={...scope,channel,scope:owner+':'+profile};
 const databaseName='mk307-synthetic-journal-'+channel;
 const session=createDraftKeySession({scope:()=>context,maxOfflineMs:0,
  fetchKey:async(s,request)=>{
   if(s.owner!==owner||s.profile!==profile||s.role!=='student'||s.channel!==channel||s.scope!==context.scope||request.operation==='open'&&request.keyId!==credential.keyId)throw Error('TEST_SCOPE');
   const verified=await api.resumeSession();
   if(verified?.id!==owner||verified.role!=='student')throw Error('TEST_ACTOR');
   return {credential,offlineForMs:0};
  },
  fetchFloor:async()=>{throw Error('TEST_NO_JOURNAL_FLOOR')}
 });
 await migrateRequestJournal({databaseName,channel,...session,guard:session.guardFor(context)});
 const store=encryptedRequestOutbox({databaseName,channel,...session});
 let view;
 window.addEventListener('pagehide',()=>{session.invalidate();view?.dispose()},{once:true});
 view=await mounts[channel]({host:document.getElementById('app'),api,scope:()=>scope,store,exit:()=>{session.invalidate();view?.dispose();status.textContent='TEST CLOSED'}});
 status.textContent='TEST READY';
}
start().catch(e=>{status.textContent='TEST FAILED '+e.message;console.error(e.message)});
