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






/*ttps://github.com/ampproject/amphtml/blob/master/extensions/amp-web-push/0.1/amp-web-push.service-worker.js
/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/** @fileoverview
  This file is an example implementation for a service worker compatible with
  amp-web-push. This means the service worker accepts window messages (listened
  to via the service worker's 'message' handler), performs some action, and
  replies with a result.
  The service worker listens to postMessage() messages sent from a lightweight
  invisible iframe on the canonical origin. The AMP page sends messages to this
  "helper" iframe, which then forwards the message to the service worker.
  Broadcast replies from the service worker are received by the helper iframe,
  which broadcasts the reply back to the AMP page.
 */

/** @enum {string} */

const WorkerMessengerCommand = {
  /*
    Used to request the current subscription state.
   */
  AMP_SUBSCRIPTION_STATE: 'amp-web-push-subscription-state',
  /*
    Used to request the service worker to subscribe the user to push.
    Notification permissions are already granted at this point.
   */
  AMP_SUBSCRIBE: 'amp-web-push-subscribe',
  /*
    Used to unsusbcribe the user from push.
   */
  AMP_UNSUBSCRIBE: 'amp-web-push-unsubscribe',
};


function deleteSubscriptionToBackEnd(subscription) {
  return fetch('/api/v1/notificaciones/0', {
    credentials: 'same-origin',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
         body: JSON.stringify(subscription)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }
    return response.json();
  })
  .then(function(responseData) {
    if (!(responseData.data && responseData.data.success)) {
      throw new Error('Bad response from server.');
    }
  });
}



/*
  According to
  https://w3c.github.io/ServiceWorker/#run-service-worker-algorithm:
  "user agents are encouraged to show a warning that the event listeners
  must be added on the very first evaluation of the worker script."
  We have to register our event handler statically (not within an
  asynchronous method) so that the browser can optimize not waking up the
  service worker for events that aren't known for sure to be listened for.
  Also see: https://github.com/w3c/ServiceWorker/issues/1156
*/
self.addEventListener('message', event => {
  /*
    Messages sent from amp-web-push have the format:
    - command: A string describing the message topic (e.g.
      'amp-web-push-subscribe')
    - payload: An optional JavaScript object containing extra data relevant to
      the command.
   */
  const {command} = event.data;

  switch (command) {
    case WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE:
      onMessageReceivedSubscriptionState();
      break;
    case WorkerMessengerCommand.AMP_SUBSCRIBE:
      onMessageReceivedSubscribe();
      break;
    case WorkerMessengerCommand.AMP_UNSUBSCRIBE:
      onMessageReceivedUnsubscribe();
      break;
  }
});

/**
  Broadcasts a single boolean describing whether the user is subscribed.
 */
function onMessageReceivedSubscriptionState() {
  return;
  let retrievedPushSubscription = null;
  self.registration.pushManager
    .getSubscription()
    .then(pushSubscription => {
      retrievedPushSubscription = pushSubscription;
      if (!pushSubscription) {
        return null;
      } else {
        return self.registration.pushManager.permissionState(
          pushSubscription.options
        );
      }
    })
    .then(permissionStateOrNull => {
      if (permissionStateOrNull == null) {
        broadcastReply(WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE, false);
      } else {
        const isSubscribed =
          !!retrievedPushSubscription && permissionStateOrNull === 'granted';
        broadcastReply(
          WorkerMessengerCommand.AMP_SUBSCRIPTION_STATE,
          isSubscribed
        );
      }
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
	    .replace(/\-/g, '+')
	        .replace(/_/g, '/')
		  ;
        const rawData = atob(base64);
	  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}




var vapidPublicKey = new urlBase64ToUint8Array("BJgcGAFGOCwJEKyBxKfCHa14ekjhmqaf2h793YWUsZc3MVeAqjwBLYWhD8CCU3JhONBOZcLA0KxdaagEXH4-f6w=");

function sendSubscriptionToBackEnd(subscription) {
  return fetch("/api/v1/notificaciones", {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
         body: JSON.stringify(subscription)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }
    return response.json();
  })
  .then(function(responseData) {
    if (!(responseData.data && responseData.data.success)) {
      throw new Error('Bad response from server.');
    }
  });
}




/**
  Subscribes the visitor to push.
  The broadcast value is null (not used in the AMP page).
 */
function onMessageReceivedSubscribe() {
  /*
    If you're integrating amp-web-push with an existing service worker, use your
    existing subscription code. The subscribe() call below is only present to
    demonstrate its proper location. The 'fake-demo-key' value will not work.
    If you're setting up your own service worker, you'll need to:
      - Generate a VAPID key (see:
        https://developers.google.com/web/updates/2016/07/web-push-interop-wins)
      - Using urlBase64ToUint8Array() from
        https://github.com/web-push-libs/web-push, convert the VAPID key to a
        UInt8 array and supply it to applicationServerKey
   */

  self.registration.pushManager
    .subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
      /*,
      applicationServerKey: 'vapid_public',*/
    })
    .then((subscription) => {
      // IMPLEMENT: Forward the push subscription to your server here
      sendSubscriptionToBackEnd(subscription);
      broadcastReply(WorkerMessengerCommand.AMP_SUBSCRIBE, null);
    });
}

/**
  Unsubscribes the subscriber from push.
  The broadcast value is null (not used in the AMP page).
 */
function onMessageReceivedUnsubscribe() {
  self.registration.pushManager
    .getSubscription()
    .then((subscription) => {
      deleteSubscriptionToBackEnd(subscription);
      subscription => subscription.unsubscribe();

      // OPTIONALLY IMPLEMENT: Forward the unsubscription to your server here
      broadcastReply(WorkerMessengerCommand.AMP_UNSUBSCRIBE, null);
    });
}

/**
 * Sends a postMessage() to all window frames the service worker controls.
 * @param {string} command
 * @param {!JsonObject} payload
 */
function broadcastReply(command, payload) {
  self.clients.matchAll().then(clients => {
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      client.postMessage({
        command,
        payload,
      });
    }
  });
}



// The serviceworker context can respond to 'push' events and trigger
// notifications on the registration property
self.addEventListener("push", (event) => {
  //let title = (event.data && event.data.text()) || "Mensaje del Servidor";
  var json = event.data.json();
  let title  = json.title;
  let body   = json.body ;
  let tag    = "push-simple-demo-notification-tag";
  let icon   = '/img/alectrico_60_40.png';
  let image  = '/img/bici.jpg';
  let vibrate = [200, 100, 200, 100, 200, 100, 400];
  let badge = '/img/logo_alectrico.png';
  let actions = [
    { 'action': 'yes', 'title': 'Tomar',    'icon':'/img/led_60_40.png'},
    { 'action': 'no' , 'title': 'No tomar', 'icon':'/img/favicon-32x32.png'}
  ];


  event.waitUntil(
    self.registration.showNotification(title, {
      body: body, icon: icon, tag:tag, image:image, badge:badge, actions:actions, vibrate:vibrate })
  )
});



//-----------------------------------------------------------------
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://shop.alectrico.cl/')
  );
});






