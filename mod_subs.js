window.BROWSER_NOTIFICATION = {};

(function(){

  var serviceURLHost;
  var serviceWorker;
  var subscribeCallback;
  var unsubscribeCallback;
  var handleMessageCallback;
  const ERROR_PREFIX = 'BROWSER_NOTIFICATION || ';

  function _init(options) {

    if(!options.urlRoot) {
      throw new Error(ERROR_PREFIX + 'Missing, subscription url host'); 
    }

    if(!options.serviceWorker) {
      throw new Error(ERROR_PREFIX + 'Missing, service worker file name'); 
    }

    serviceURLHost = options.urlRoot || '';
    serviceWorker = options.serviceWorker || '';
    unsubscribeCallback = options.unsubscribeCallback || (function(){console.log("unsubscribed successfully")});
    subscribeCallback = options.subscribeCallback || (function(){console.log("subscribed successfully")});
    handleMessageCallback = options.handleMessageCallback || (function(data){console.log(data)});

    window.Notification.requestPermission();
  }

  //Define SomeClass (js uses functions as class constructors, utilized with the "new" keyword)
  this.Notifications = function(options) {
    //if the function is called directly, return an instance of SomeClass
    if (!(this instanceof BROWSER_NOTIFICATION.Notifications)) {
      return new BROWSER_NOTIFICATION.Notifications(options); 
    }
    _init(options);
  };

  //Register the service worker which handles the Push notifications
  this.Notifications.prototype.registerWorker = function() {
    var _this = this;
    window.addEventListener('load', function() {   
      // Check that service workers are supported, if so, progressively  
      // enhance and add push messaging support, otherwise continue without it.  
      if ('serviceWorker' in navigator) {  
        navigator.serviceWorker.register(serviceWorker).then(function(reg) {
          _this.initialize(reg);
        });  
      } else {  
        throw new Error(ERROR_PREFIX + 'Service workers aren\'t supported in this browser.');  
      }  
    });    
  };

  //Initialize the Browser Notification, and see whether the user has subscribed already else initiate
  // new subscription
  this.Notifications.prototype.initialize = function(reg) {
    var _this = this;
    // Are Notifications supported in the service worker?  
    if (!(reg.showNotification)) {  
      throw new Error(ERROR_PREFIX + 'Notifications aren\'t supported on service workers.');  
    }

    // Check the current Notification permission.  
    // If its denied, it's a permanent block until the  
    // user changes the permission  
    if (Notification.permission === 'denied') {  
      throw new Error(ERROR_PREFIX + 'User has blocked notifications.');  
      return;  
    }

    // Check if push messaging is supported  
    if (!('PushManager' in window)) {  
      throw new Error(ERROR_PREFIX + 'Push messaging isn\'t supported.');  
      return;  
    }

    _this.hasSubscribed(reg);
    
  };

  this.Notifications.prototype.channelListener = function(reg) {
    var _this = this;
    // set up a message channel to communicate with the SW
    var channel = new MessageChannel();
    channel.port1.onmessage = function(e) {
      _this.handleChannelMessage(e.data);
    }
    
    var mySW = reg.active;
    mySW.postMessage('hello', [channel.port2]);
  };

  this.Notifications.prototype.hasSubscribed = function(reg) {
    var _this = this;
    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function(reg) {  
      // Do we already have a push message subscription?  
      reg.pushManager.getSubscription() 
        .then(function(subscription) {  
          if (!subscription) {  
            console.log('Not yet subscribed to Push service');
            _this.doSubscribe(reg);
            return false;  
          }

          _this.invokeSubscribeService(subscription.toJSON(), 'update');
          _this.channelListener(reg);
          return true;  
        })  
        .catch(function(err) {  
          throw err;
        }); 

    });  
  };

  this.Notifications.prototype.doSubscribe = function(reg) {
    var _this = this;
    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function(reg) {  
      // Do we already have a push message subscription?  
      reg.pushManager.subscribe({userVisibleOnly: true}) 
        .then(function(subscription) {  
          if (!subscription) {  
            throw new Error(ERROR_PREFIX + 'Seems issue with Push Notification Subscriptions');
            return;  
          }

          // initialize status, which includes setting UI elements for subscribed status
          // and updating Subscribers list via push
          _this.invokeSubscribeService(subscription.toJSON(), 'new');
          _this.channelListener(reg);
        })  
        .catch(function(err) {  
          throw err;
        }); 
    });  
  };

  this.Notifications.prototype.handleChannelMessage = function(data) {
    var _this = this;
    if(typeof handleMessageCallback == 'function') {
      handleMessageCallback.call(data);
    }
  };

  this.Notifications.prototype.invokeSubscribeService = function(subscription, action) {
    var _this = this;
    // Create a new XHR and send an array to the server containing
    // and the push subscription endpoint + key the server needs
    // to send push messages
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {//Call a function when the state changes.
      if(request.readyState == XMLHttpRequest.DONE && request.status == 200) {
        if(typeof subscribeCallback == 'function') {
          subscribeCallback.call();
        }
      }
    }
    if(action == 'new') {
      request.open('POST', serviceURLHost + '/subscribe');
    } else if(action == 'update') {
      request.open('PUT', serviceURLHost + '/subscribe');
    } else {
      request.open('DELETE', serviceURLHost + '/subscribe');
    }
    request.setRequestHeader('Content-Type', 'application/json');
    
    request.send(JSON.stringify(subscription));
  };

  this.Notifications.prototype.getHost = function() {
    return serviceURLHost;
  };

}).call(BROWSER_NOTIFICATION);

var pushNotification = BROWSER_NOTIFICATION.Notifications({
  'urlRoot': 'https://deiva-push.herokuapp.com',
  'serviceWorker': 'sw.js',
  'subscribeCallback': triggerNotification
});
pushNotification.registerWorker();

function triggerNotification() {
  setTimeout(function() {
    // Create a new XHR and request trigger call
    //to fire the server side push notification
    var request = new XMLHttpRequest();
    request.open('GET', pushNotification.getHost() + '/trigger');
    request.send();            
  }, 1000);
}

function checkHandleMessage(data) {
  console.log("service worker message handler");
  console.log(data);
}
