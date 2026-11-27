/* R12: offline navigation fallback only; no storage or API caching. */
'use strict';
const ACCOUNT = new URL('account_review.html', self.location.href).href;
const LOCKED = "<!doctype html><html lang=\"ru\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>МатКвест — нет связи</title></head><body><main><h1>МатКвест — нет связи</h1><p>Для открытия серверного черновика необходимо снова подтвердить вход. Данные профиля не отображаются без связи с сервером.</p><p>Если черновик был сохранён на этом устройстве, он останется доступным после входа в тот же аккаунт и выбора того же профиля и блока.</p><p><a href=\"account_review.html\">Проверить соединение и войти</a></p></main></body></html>";
const HEADERS = Object.freeze({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
 const r=event.request;
 if(r.method!=='GET'||r.mode!=='navigate'||r.url!==ACCOUNT)return;
 event.respondWith(fetch(r,{cache:'no-store'}).catch(()=>new Response(LOCKED,{status:200,headers:HEADERS})));
});
