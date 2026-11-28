'use strict';
const assert=require('node:assert/strict'),{randomBytes}=require('node:crypto');
const enabled=process.env.MK307_ENCRYPTED_JOURNALS==='1';
function path(channel){return enabled?'/audits/fixtures/v307_encrypted_journals.html?channel='+channel:'/integrations/v307/account_review.html'}
async function prepare(context){
 if(enabled)await context.addInitScript({content:'Object.defineProperty(window,"__mkR13JournalSyntheticKey",{value:'+JSON.stringify(Array.from(randomBytes(32)))+',configurable:true})'});
}
async function ready(page){if(enabled)await page.getByText('TEST READY',{exact:true}).waitFor()}
async function check(page,channel,pending){
 if(!enabled)return null;
 const result=await page.evaluate(async({channel})=>{
  const name='mk307-synthetic-journal-'+channel,dbs=await indexedDB.databases();
  const fallback=dbs.some(d=>['matkvest-v307-quick-outbox','matkvest-v307-review-outbox','matkvest-v307-economy-outbox'].includes(d.name));
  if(!dbs.some(d=>d.name===name&&d.version===2))throw Error('TEST_ENCRYPTED_DB_MISSING');
  const db=await new Promise((ok,no)=>{const r=indexedDB.open(name,2);r.onupgradeneeded=()=>{r.transaction.abort();no(Error('TEST_DB_VERSION'))};r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result)});
  try{return await new Promise((ok,no)=>{
   const tx=db.transaction(['pending','v307JournalMigration'],'readonly'),rows=tx.objectStore('pending').getAll(),marker=tx.objectStore('v307JournalMigration').get('encrypted-v1');
   tx.onabort=()=>no(tx.error);tx.oncomplete=()=>ok({fallback,marker:marker.result?.channel,rows:rows.result.map(e=>({key:e.key,keyId:e.keyId,channel:e.channel,version:e.version,iv:[...e.iv],ciphertext:[...e.ciphertext],noPlain:!Object.hasOwn(e,'body')&&e.iv instanceof Uint8Array&&e.ciphertext instanceof Uint8Array}))});
  })}finally{db.close()}
 },{channel});
 assert.equal(result.fallback,false,'No plaintext journal fallback');
 assert.equal(result.marker,channel);assert.equal(result.rows.length,pending?1:0);
 if(pending){const e=result.rows[0];assert.equal(e.keyId,'synthetic-journal-'+channel);assert.equal(e.channel,channel);assert.equal(e.version,1);assert.equal(e.noPlain,true);assert.equal(e.iv.length,12);assert(e.ciphertext.length>16)}
 return result.rows;
}
module.exports={enabled,path,prepare,ready,check};
