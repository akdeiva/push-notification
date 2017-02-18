# push-notification-demo

This is an attempt to create a simple subscription based push notification demo to demonstrate the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API). It also illustrates some uses of [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## Current status

At the moment this demo works for both Chrome / FireFox except for iOS devices. The working parts are:

* Requesting permission to send notifications/push messages.
* Registering and activating a service worker to handle the Push Notification Messages.
* Subscribing to the push sevice.
* Sending a push message from the server.
* Receiving a push message in the SW via the `onpush` handler and firing a notification .

See [Using the Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Using_the_Push_API) for more details about how this works.

## Still to do

* Improving the Node server so that it will handle the push messages, AND serve the static files. This is needed for it to start working on Chrome (and Chrome doesn't yet support the PushMessageData either.)


## Running the demo

To get it running:


1. Clone this repo locally (you'll need to [install git](http://git-scm.com/downloads)):

        git clone https://github.com/akdeiva/push-notification.git

2. Install [NodeJS](https://nodejs.org/) if you haven't already.
3. Install dependencies:

        cd push-notification
        npm install

4. Run the app:

        node server.js

5. Open the app at
   [https://127.0.0.1:7000/index.html](https://127.0.0.1:7000/index.html)
   (Note: You will need to add a security exception)

Note: This code is forked and influenced by Chris David Mills repo of push demo (https://github.com/chrisdavidmills/push-api-demo). The code base is extended for different type of subscription and server side implementation with MongoDB and node for targeted audience based notifications.

