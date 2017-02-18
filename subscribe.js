var isPushEnabled = false;
var useNotifications = false;
var serviceURLHost = 'https://deiva-push-notification.herokuapp.com/';
Notification.requestPermission();

window.addEventListener('load', function() {   

  // Check that service workers are supported, if so, progressively  
  // enhance and add push messaging support, otherwise continue without it.  
  if ('serviceWorker' in navigator) {  
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      if(reg.installing) {
        console.log('Service worker installing');
      } else if(reg.waiting) {
        console.log('Service worker installed');
      } else if(reg.active) {
        console.log('Service worker active');
      }

      initialiseState(reg);
    });  
  } else {  
    console.log('Service workers aren\'t supported in this browser.');  
  }  
});


// Once the service worker is registered set the initial state  
function initialiseState(reg) {  
  // Are Notifications supported in the service worker?  
  if (!(reg.showNotification)) {  
    console.log('Notifications aren\'t supported on service workers.');  
    useNotifications = false;  
  } else {
    useNotifications = true; 
  }

  // Check the current Notification permission.  
  // If its denied, it's a permanent block until the  
  // user changes the permission  
  if (Notification.permission === 'denied') {  
    console.log('The user has blocked notifications.');  
    return;  
  }

  // Check if push messaging is supported  
  if (!('PushManager' in window)) {  
    console.log('Push messaging isn\'t supported.');  
    return;  
  }

  // We need the service worker registration to check for a subscription  
  navigator.serviceWorker.ready.then(function(reg) {  
    // Do we already have a push message subscription?  
    reg.pushManager.subscribe({userVisibleOnly: true}) 
      .then(function(subscription) {  
        if (!subscription) {  
          console.log('Not yet subscribed to Push service')
          // We aren't subscribed to push, so set UI  
          // to allow the user to enable push  
          return;  
        }

        isPushEnabled = true;  
        
        // initialize status, which includes setting UI elements for subscribed status
        // and updating Subscribers list via push
        postSubscribeObj(subscription.toJSON());
      })  
      .catch(function(err) {  
        console.log('Error during getSubscription()', err);  
      }); 

      // set up a message channel to communicate with the SW
      var channel = new MessageChannel();
      channel.port1.onmessage = function(e) {
        console.log("notification message received:");
        console.log(e);
        handleChannelMessage(e.data);
      }
      
      mySW = reg.active;
      mySW.postMessage('hello', [channel.port2]);
  });  
}

function postSubscribeObj(subscription) {
    // Create a new XHR and send an array to the server containing
    // the type of the request, the name of the user subscribing, 
    // and the push subscription endpoint + key the server needs
    // to send push messages
    var request = new XMLHttpRequest();

    request.open('POST', serviceURLHost + '/subscribe');
    request.setRequestHeader('Content-Type', 'application/json');
    
    request.send(JSON.stringify(subscription));
}


function handleChannelMessage(data) {
  
}

