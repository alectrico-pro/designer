importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

//----------------------------------------------------------------
if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);

    //buscar los javascripts en la red pero si no los encuentra, usar los del cache
    workbox.routing.registerRoute( new RegExp('.*\.js'), workbox.strategies.networkFirst());

    //Usar el cache pero actualizar en background tan rápido como se pueda
    workbox.routing.registerRoute(/.*\.css/, workbox.strategies.staleWhileRevalidate({  cacheName: 'css-cache',} ));

   //Almacenar hasta 20 imágenes por una semana
   workbox.routing.registerRoute( /.*\.(?:png|jpg|jpeg|svg|gif|code_image)/,
     // Use the cache if it's available
     workbox.strategies.cacheFirst({ cacheName: 'image-cache', plugins: [new workbox.expiration.Plugin({maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60, }) ], }) );


   //Almacenar hasta 20 imágenes por una semana, imagenes de base de datos code_image
   workbox.routing.registerRoute( /.*code_image/,
     // Use the cache if it's available
     workbox.strategies.cacheFirst({ cacheName: 'code-image', plugins: [new workbox.expiration.Plugin({maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60, }) ], }) );


} else {
    console.log(`Boo! Workbox didn't load 😬`);
}




//-----------------------------------------------------------------
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://www.alectrico.cl/electrico/presupuestos/')
  );
});


//---------------------------------------------------------
// serviceworker.js
// The serviceworker context can respond to 'push' events and trigger
// notifications on the registration property
self.addEventListener("push", (event) => {
  // let title = (event.data && event.data.text()) || "Mensaje del Servidor";
  var json = event.data.json();
  let title  = json.title  ;
  let body   = json.body ; 
  let tag    = "push-simple-demo-notification-tag";
  let icon   = '/img/alectrico_60_40.png';
  let image  = '/img/bici.jpg';
  let vibrate = [200, 100, 200, 100, 200, 100, 400];
  let badge = '/img/logo_alectrico.png';
  let actions = [
    { 'action': 'yes', 'title': 'Tomar',    'icon':'/img/led_60_40.png'},
    { 'action': 'no' , 'title': 'No tomar', 'icon':'/img/favico-32x32.png'}
  ];


  event.waitUntil( 
    self.registration.showNotification(title, {
      body: body, icon: icon, tag:tag, image:image, badge:badge, actions:actions, vibrate:vibrate })
  ) 
}); 

