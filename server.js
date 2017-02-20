var express = require('express'),
    fs = require('fs'),
    https = require('https'),
    http = require('http'),
    serveStatic = require('serve-static'),
    url = require('url'),
    path = require('path'),
    webPush = require('web-push');
var cookieParser = require('cookie-parser');

const MongoClient = require('mongodb').MongoClient;
var gcmKey = process.env.GCM_KEY || '';
var mangoDbURI= process.env.MONGO_DB_URI || '';
var db;
var dupe = 'true';
var app = express();
var userId;
webPush.setGCMAPIKey(gcmKey);

// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.userId;
  if (cookie === undefined)
  {
    /* note: set a new cookie to differentiate the uniue user 
    (Typically in real world example this could be unique user id or key associated 
    with that particular user)
    */
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('userId',randomNumber, { maxAge: 900000, httpOnly: true });
  } 
  next(); 
});

app.use(serveStatic(__dirname, {'index': false}));

app.post('/subscribe', function (request, response) {
    var body = "";
    var userID = request.cookies.userId;
    
    request.on('data', function(chunk) {
      body += chunk;
    });

    request.on('end', function() {
      if (!body) return;
      var obj = JSON.parse(body);
      console.log('POSTed: ');
      console.log(obj);
      obj.userId = userID;
      obj._id = userID;
      db.collection('subscriptions').save(obj, (err, result) => {
        if (err) {
          console.log(err);
          response.writeHead(203, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("subscription not successfull");

          response.end();
        } else {
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("subscribed successfully");

          response.end();

        }
      });
    });
});


app.put('/subscribe', function (request, response) {
    var body = "";
    var userID = request.cookies.userId;
    
    request.on('data', function(chunk) {
      body += chunk;
    });

    request.on('end', function() {
      if (!body) return;
      var obj = JSON.parse(body);
      console.log('POSTed: ');
      console.log(obj);
      obj.userId = userID;
      obj._id = userID;
      db.collection('subscriptions').save(obj, (err, result) => {
        if (err) {
          console.log(err);
          response.writeHead(203, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("subscription update not successfull");

          response.end();
        } else {
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("subscribed updated successfully");

          response.end();

        }
      });
    });
});

app.delete('/subscribe', function (request, response) {
    var body = "";
    var userID = request.cookies.userId;
    
    request.on('data', function(chunk) {
      body += chunk;
    });
    //db.products.remove( { qty: { $gt: 20 } }, true )
    request.on('end', function() {

      db.collection('subscriptions').remove({"_id": userID}, (err, result) => {
        if (err) {
          console.log(err);
          response.writeHead(203, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("unsubscription not successfull");

          response.end();
        } else {
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

          response.write("unsubscription done successfully");

          response.end();

        }
      });

    });
});

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/trigger', function(req, res) {
    console.log("inside trigger function:");
    db.collection('subscriptions').find().toArray(function(err, results) {
      for(i = 0; i < (results.length-1); i++) {
          console.log(results[i]);
          if(results[i].keys && results[i].keys.auth && results[i].keys.p256dh) {
            //if(results[i].endpoint.indexOf('https://android.googleapis.com/gcm/send') === -1) {
              webPush.sendNotification({
                  'endpoint':results[i].endpoint,
                  'keys': {
                      'auth':results[i].keys.auth,
                      'p256dh': results[i].keys.p256dh
                  }
                }, JSON.stringify({
                  title: 'Item getting out of stock',
                  message: 'Elizabeth Arden Always Red eau de toilette, 1.7 oz in your bag is getting out of stock'
              }));             
              console.log("Non Google Chrome based Push notification");  
            //} else {
            //  console.log("Google Chrome based Push notification");
            //}    
          }
      };
      res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers"});

      res.write("triggered successfully");

      res.end();
    });

});


MongoClient.connect(mangoDbURI, (err, database) => {
  if (err) return console.log(err)
  db = database
  db.collection('subscriptions').drop();
  http.createServer(app).listen(process.env.PORT || 3000);
  console.log("Server Running on ." + (process.env.PORT || 3000));   
});

