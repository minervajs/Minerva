'use strict';
/*jshint globalstrict:true node:true*/

var app, corser, db, express, port, redis;

express = require("express");
corser = require("corser");
redis = require("redis");

// Set up the DB Connection
if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    db = require("redis").createClient(rtg.port, rtg.hostname);
    db.auth(rtg.auth.split(":")[1]);
} else {
    db = redis.createClient();
}


// Test DB Connection
var pkg = {
    "name" : "usm",
    "version" : "1.0.0",
    "url" : "https://raw.github.com/usm/usm.github.com/master/usm.js"
};
db.hmset(pkg.name, pkg, redis.print);
db.hgetall(pkg.name, function (err, replies) {
    console.log("Connected to DB: ", JSON.stringify(replies));
});

// Set up the App
app = express();

app.use(corser.create());

app.options("*", function (req, res){
  //Corser does not end CORS preflight requests itself.
    res.writeHead(204);
    res.end();
});

app.get("/*", function (req, res) {
    res.writeHead(200);
    res.end("jsstatlibm");

app.get(/^\/site\/(.*)$/, function (req, res) {
    var path = req.params[0];
    res.sendfile('./static/'+path);
});
});

port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port", port);
});