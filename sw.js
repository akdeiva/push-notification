var port;

self.addEventListener('push', function(event) {
  var obj = event.data.json();
  fireNotification(obj, event);
  port.postMessage(obj);
});

self.onmessage = function(e) {
  console.log(e);
  port = e.ports[0];
}

function fireNotification(obj, event) {
  var title = obj.title;  
  var body = obj.message; 
  var icon = 'notification.png';  
  var tag = 'push';
   
  event.waitUntil(self.registration.showNotification(title, {
    body: body,  
    icon: icon,  
    tag: tag  
  }));
}
