const CACHE='spendnote-v3';
const ASSETS=['./','./index.html','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST' && u.pathname.endsWith('/share')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData();
        const file=fd.get('receipt');
        if(file && file.type){
          const db=await openDB();
          await putFile(db,file);
        }
      }catch(err){console.warn('share target',err)}
      return Response.redirect(new URL('./index.html?shared=1',u).href,303);
    })()); return;
  }
  if(e.request.method==='GET'){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;
    }).catch(()=>caches.match('./index.html'))));
  }
});
function openDB(){return new Promise((res,rej)=>{let r=indexedDB.open('SpendNoteShare',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function putFile(db,file){return new Promise((res,rej)=>{let tx=db.transaction('files','readwrite');tx.objectStore('files').put({id:'latest',blob:file});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}