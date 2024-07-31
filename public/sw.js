// nonce{51e6462ba4} - Automatically generated [DO NOT MODIFY]
/*
 * Template Used: https://gist.github.com/arnav-kr/0ad065605d2fe20967a6da383aef8b72
 */
// SkipWaiting on message from the webpage
self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

const cacheName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

defaultResponseURL = "./";


// TODO: Add your resource's URLs that you want to precache
const preCacheURLs = [
  defaultResponseURL,
  // "./",
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(preCacheURLs);
    })
  );
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});


// Service Worker "fetch" event listener
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('extension:')
  ) return;
  if (event.request.method === 'POST' &&
    url.pathname === '/decode') {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      if (formData.has('image')) {
        const file = formData.get('image');
        console.log(file)
        if (file) {
          let data = await readAsDataURL(file);
          console.log("image url: %s", data);
          return Response.redirect(`/?image=${encodeURIComponent(data)}`, 303);
        }
        else {
          return Response.redirect(`/?image=invalid`, 303);
        }
      }
    })());
  }
  else {
    event.respondWith(
      caches.match(event.request).then((resp) => {
        return resp || fetch(event.request).then((response) => {
          let responseClone = response.clone();
          caches.open(cacheName).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          return caches.match(defaultResponseURL);
        })
      })
    );
  }
});

async function readAsDataURL(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = e => {
      resolve(e.target.result);
    }
    reader.onerror = e => {
      reject(e);
    }
    reader.readAsDataURL(file);
  })
}