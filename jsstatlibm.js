'use strict';
/*jshint globalstrict:true node:true*/

var app, corser, db, everyauth, express, port, redis;

corser = require("corser");
everyauth = require("everyauth");
express = require("express");
redis = require("redis");

//Set up the DB Connection
if (process.env.REDISTOGO_URL) {
    var rtg = require("url").parse(process.env.REDISTOGO_URL);
    db = require("redis").createClient(rtg.port, rtg.hostname);
    db.auth(rtg.auth.split(":")[1]);
} else {
    db = redis.createClient();
}

//Set up EveryAuth for Google's OAuth 2
everyauth.google
    .appId(process.env.CLIENT_ID)
    .appSecret(process.env.CLIENT_SECRET)
    .scope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        var promise, user, userKey;
        promise = this.Promise();
        user = {
            "id" : googleUserMetadata.id,
            "name" : googleUserMetadata.name,
            "accessToken" : accessToken,
            "refreshToken" : accessTokenExtra.refresh_token,
            "expiresIn" : accessTokenExtra.expires_in,
            "email" : googleUserMetadata.email
        };
        userKey = "user:"+user.id;
        db.exists(userKey, function (err, response) {
            if (err) return promise.fail(err);
            if (response === 0) {
                // Create and save the user
                db.multi()
                    //.sadd('users', user.id) //Add the user to the set of users
                    .hmset(userKey, user) //Add the user's hash
                    .hgetall(userKey) //Retrieve the now canonical user's hash
                    .exec(function (err, replies){
                        if (err) return promise.fail(err);
                        promise.fulfill(replies[replies.length-1]);
                    });
            } else {
                db.hgetall(userKey, function (err, reply){
                    if (err) return promise.fail(err);
                    promise.fulfill(reply);
                });
            }

        });
        promise.fulfill(user);
        return promise;
    })
    .redirectPath('/');

everyauth.everymodule.findUserById( function (userId, callback) {
    db.hgetall('user:'+userId, function (err, user) {
        if (err) return callback(err);
        var safeKeys = ['id', 'name', 'email'];
        user.sanitized = {};
        safeKeys.forEach(function (key) {
            user.sanitized[key] = user[key];
        });
        callback(null, user);
    });
});

//Set up the App
app = express();

app.use(corser.create());
app.use(express.bodyParser());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.session());
app.use(everyauth.middleware());

app.options("*", function (req, res){
  //Corser does not end CORS preflight requests itself.
    res.writeHead(204);
    res.end();
});

app.get("/", function (req, res, next) {
    res.redirect("/site/index.html");
});

app.get(/^\/site\/(.*)$/, function (req, res) {
    var path = req.params[0];
    res.sendfile('./static/'+path);
});

app.get('/account', function (req, res) {
    if (req.user) {
        res.jsonp(req.user.sanitized);
    } else {
        res.jsonp({});
    }
});

});

port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port", port);
});