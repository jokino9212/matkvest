import test from 'node:test';
import assert from 'node:assert/strict';
import {sealDraft,openDraft,rotateDraft,canonicalDraftJSON,assertDraftEnvelope} from '../integrations/v307/draft_cipher.mjs';
const id=n=>n+'1436d1d-0123-4f25-8ae9-df61e8a85370',owner=id('a'),profile=id('b'),pack=id('c'),assignment=id('d');
const context={owner,profile,role:'student',kind:'homework',assignment};
const row={key:JSON.stringify([owner,profile,pack]),owner,profile,context,pack,revision:4,draft:[{answer:'private-answer',checks:[{'answer:0':'123'}]}],body:{items:[{skipped:false}]},questions:[{a:2,b:3}]};
const credential=async keyId=>({keyId,key:await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])});
test('AES-256-GCM roundtrip, random nonce, no raw key or plaintext fields',async()=>{
 const k=await credential('key-1'),a=await sealDraft(row,k),b=await sealDraft(row,k);
 assert.notDeepEqual(a.iv,b.iv);assert.notDeepEqual(a.ciphertext,b.ciphertext);assert.equal(a.iv.length,12);
 assert.deepEqual(await openDraft(a,k,context,4,pack),row);assert.equal(k.key.extractable,false);
 assert.equal(JSON.stringify(a).includes('private-answer'),false);
 assert.equal(Object.hasOwn(a,'draft'),false);assert.equal(Object.hasOwn(a,'body'),false);
});
test('ciphertext, IV and authenticated metadata tampering rejected',async()=>{
 const k=await credential('key-1'),a=await sealDraft(row,k);
 for(const field of ['ciphertext','iv']){const b=structuredClone(a);b[field][0]^=1;await assert.rejects(openDraft(b,k,context,0,b.pack),/AUTHENTICATION/)}
 for(const b of [{...a,revision:5},{...a,pack:id('e'),key:JSON.stringify([owner,profile,id('e')])}])await assert.rejects(openDraft(b,k,context,0,b.pack),/AUTHENTICATION/);
 const foreign={...context,assignment:id('e')};await assert.rejects(openDraft({...a,context:foreign},k,foreign,0,pack),/AUTHENTICATION/);
 assert.throws(()=>assertDraftEnvelope({...a,draft:row.draft}),/ENVELOPE/);
});
test('wrong actor, profile, context, key id, actual key, and trusted revision floor fail closed',async()=>{
 const k=await credential('key-1'),a=await sealDraft(row,k);
 for(const s of [{...context,owner:id('e')},{...context,profile:id('e')},{owner,profile,role:'student',kind:'practice'}])await assert.rejects(openDraft(a,k,s,0,pack),/SCOPE/);
 await assert.rejects(openDraft(a,{...k,keyId:'key-2'},context,0,pack),/SCOPE/);
 await assert.rejects(openDraft(a,await credential('key-1'),context,0,pack),/AUTHENTICATION/);
 await assert.rejects(openDraft(a,k,context,5,pack),/REVISION_FLOOR/);
 await assert.rejects(openDraft(a,k,context,undefined,pack),/REVISION_FLOOR/);
});
test('rotation preserves exact journal, accepts new key only, requires distinct key id',async()=>{
 const a=await credential('key-1'),b=await credential('key-2'),old=await sealDraft(row,a);
 const next=await rotateDraft(old,a,b,context,4,pack);
 assert.deepEqual(await openDraft(next,b,context,4,pack),row);
 await assert.rejects(openDraft(next,a,context,0,pack),/SCOPE/);
 await assert.rejects(rotateDraft(old,a,a,context,4,pack),/ROTATION/);
});
test('reject extractable or non-AES-256 keys and invalid row identities before writing',async()=>{
 const bad=await crypto.subtle.generateKey({name:'AES-GCM',length:128},false,['encrypt','decrypt']);
 const extractable=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
 for(const key of [bad,extractable])await assert.rejects(sealDraft(row,{keyId:'bad',key}),/KEY_INVALID/);
 const k=await credential('good');
 for(const r of [{...row,key:'foreign'},{...row,owner:id('e')},{...row,revision:-1}])await assert.rejects(sealDraft(r,k),/IDENTITY/);
});
test('canonical snapshot rejects values that JSON would silently lose',()=>{
 assert.equal(canonicalDraftJSON({b:2,a:1}),canonicalDraftJSON({a:1,b:2}));
 for(const value of [{x:undefined},{x:NaN},{x:new Date()},[,,1],{x:1n}])assert.throws(()=>canonicalDraftJSON(value),/NOT_JSON/);
});

test('valid encrypted envelope for another pack cannot substitute for requested pack',async()=>{
 const k=await credential('key-1'),other=id('e');
 const alternate=await sealDraft({...row,pack:other,key:JSON.stringify([owner,profile,other])},k);
 await assert.rejects(openDraft(alternate,k,context,4,pack),/SCOPE/);
 await assert.rejects(openDraft(alternate,k,context,4),/SCOPE/);
 assert.equal((await openDraft(alternate,k,context,4,other)).pack,other);
});
