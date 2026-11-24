/**
 * MatKvest stage 9.5 API adapter draft, NOT loaded by index.html until server integration is approved.
 *
 * Based on backend 9.4 routes, cookie-session auth and CSRF double-submit contract.
 * Never persist credentials, CSRF or effective entitlements in localStorage.
 * Do not treat a successful local attempt or local coins as server-trusted progress.
 */
const writable = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MatKvestApiError extends Error {
  constructor(code,message,status=0) {
    super(message);this.name='MatKvestApiError';this.code=code;this.status=status;
  }
}

export function canonicalTopicId(grade,rawId) {
  if(!Number.isInteger(grade)||grade<1||grade>8)throw new TypeError('Invalid grade');
  const id=String(rawId||'');
  if(!/^[a-z0-9_]+(?::[a-z0-9_]+)?$/i.test(id))throw new TypeError('Invalid topic ID');
  const prefix='g'+grade+':';
  if(/^g\d+:/.test(id)&&!id.startsWith(prefix))throw new TypeError('Cross-grade topic ID');
  return id.startsWith(prefix)?id:prefix+id;
}

export async function stableStartKey(serverProfileId,localAttemptId,cryptoImpl=globalThis.crypto) {
  if(!uuidPattern.test(serverProfileId))throw new TypeError('Invalid server profile UUID');
  if(!localAttemptId||typeof localAttemptId!=='string'||localAttemptId.length>180)
    throw new TypeError('Invalid local attempt ID');
  if(!cryptoImpl?.subtle?.digest)throw new MatKvestApiError('CRYPTO_UNAVAILABLE','Cannot derive safe idempotency key');
  const bytes=new TextEncoder().encode('matkvest-training-start-v1|'+serverProfileId+'|'+localAttemptId);
  const hash=new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',bytes));
  hash[6]=(hash[6]&15)|0x40;
  hash[8]=(hash[8]&63)|0x80;
  const h=[...hash.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-');
}

export class MatKvestApiClient {
  constructor({baseUrl='/api/v1',fetchImpl=globalThis.fetch,origin=null}={}) {
    if(typeof fetchImpl!=='function')throw new TypeError('Fetch unavailable');
    this.fetchImpl=fetchImpl;
    this.baseUrl=String(baseUrl).replace(/\/+$/,'');
    if(!this.baseUrl.startsWith('/')||this.baseUrl.startsWith('//')) {
      throw new TypeError('Stage 9.5 requires same-origin /api/v1 proxy for cookie sessions');
    }
    this.csrfToken=null;
  }
  async request(method,endpoint,{body=null,idempotencyKey=null,publicRequest=false}={}) {
    method=String(method).toUpperCase();
    if(!/^(GET|POST|PATCH|DELETE|PUT)$/.test(method))throw new TypeError('Invalid HTTP method');
    if(!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('..'))throw new TypeError('Invalid endpoint');
    const mutation=writable.has(method);
    if(mutation&&!publicRequest&&!this.csrfToken)
      throw new MatKvestApiError('CSRF_REQUIRED','Sign in before modifying server state',403);
    const headers={'Accept':'application/json'};
    if(body!==null)headers['Content-Type']='application/json';
    if(mutation&&!publicRequest)headers['X-CSRF-Token']=this.csrfToken;
    if(idempotencyKey){
      if(!uuidPattern.test(idempotencyKey))throw new TypeError('Idempotency-Key must be UUID');
      headers['Idempotency-Key']=idempotencyKey;
    }
    let response;
    try {
      response=await this.fetchImpl(this.baseUrl+endpoint,{
        method,headers,credentials:'include',cache:'no-store',
        ...(body!==null?{body:JSON.stringify(body)}:{})
      });
    }catch(error){
      throw new MatKvestApiError('NETWORK_UNAVAILABLE','Server unavailable; preserve local attempt for retry',0);
    }
    let json=null;
    try{json=await response.json()}catch(e){}
    if(!response.ok) {
      const code=json?.error?.code||json?.code||'HTTP_'+response.status;
      const message=json?.error?.message||json?.message||'API request failed';
      throw new MatKvestApiError(code,message,response.status);
    }
    if(json===null)throw new MatKvestApiError('INVALID_RESPONSE','Expected JSON from API',response.status);
    return json;
  }
  register(email,password,role='student') {
    if(!['student','tutor'].includes(role))throw new TypeError('Role cannot be admin');
    return this.request('POST','/auth/register',{body:{email,password,role},publicRequest:true});
  }
  async login(email,password) {
    const response=await this.request('POST','/auth/login',{body:{email,password},publicRequest:true});
    if(!response?.csrf_token||!response?.user)throw new MatKvestApiError('LOGIN_INVALID','Server did not return user and CSRF');
    this.csrfToken=response.csrf_token;return response.user;
  }
  async resumeSession() {
    // Backend 9.5 Phase B: authenticated GET reads the existing CSRF cookie at
    // /api/v1/auth/csrf. Never persist this token in localStorage.
    const session=await this.request('GET','/auth/csrf');
    if(!session?.csrf_token)throw new MatKvestApiError('CSRF_INVALID','Session cannot be resumed');
    this.csrfToken=session.csrf_token;
    return this.getMe();
  }
  getMe(){return this.request('GET','/auth/me')}
  getPlans(){return this.request('GET','/plans')}
  getEntitlements(){return this.request('GET','/me/entitlements')}
  getStudentEntitlements(profileId) {
    if(!uuidPattern.test(profileId))throw new TypeError('Invalid profile UUID');
    return this.request('GET',`/student/profiles/${profileId}/entitlements`);
  }
  async checkTopic(profileId,grade,rawTopicId){
    if(!uuidPattern.test(profileId))throw new TypeError('Invalid profile UUID');
    const id=canonicalTopicId(grade,rawTopicId);
    return this.request('GET',`/student/profiles/${profileId}/topics/${grade}/${encodeURIComponent(id)}/access`);
  }
  async startTraining(profileId,grade,rawTopicId,localAttemptId) {
    if(!uuidPattern.test(profileId))throw new TypeError('Invalid profile UUID');
    const topicId=canonicalTopicId(grade,rawTopicId);
    const key=await stableStartKey(profileId,localAttemptId);
    return this.request('POST',`/student/profiles/${profileId}/training-starts`,{
      body:{grade,topic_id:topicId},idempotencyKey:key
    });
  }
  async logout(){
    try{return await this.request('POST','/auth/logout')}finally{this.csrfToken=null}
  }
  clearSession(){this.csrfToken=null}
}
