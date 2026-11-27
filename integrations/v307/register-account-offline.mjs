export async function registerAccountOffline(nav=globalThis.navigator,loc=globalThis.location,secure=globalThis.isSecureContext){
 if(!secure||!nav?.serviceWorker||!loc||loc.pathname!=='/integrations/v307/account_review.html'||loc.search||loc.hash)return null;
 const script=new URL('account-offline-sw.js',loc.href),scope=new URL('account_review.html',loc.href);
 if(script.origin!==loc.origin||scope.origin!==loc.origin)return null;
 return nav.serviceWorker.register(script.href,{scope:scope.href,updateViaCache:'none'});
}
if(typeof window!=='undefined')registerAccountOffline().catch(()=>{});
