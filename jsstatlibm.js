'use strict';
/*jshint globalstrict:true node:true*/

var app, corser, db, everyauth, express, nano, port, Libs, Users;

corser = require("corser");
everyauth = require("everyauth");
express = require("express");
Libs = require("./libs");
Users = require("./users");
nano = require("nano")(process.env.CLOUDANT_URL);

// Set up DB connection
nano.db.get('jsstatll', function (err, body) {
    if (err && err.error === 'not_found') {
        console.log("db not found...creating");
        nano.db.create('jsstatll', function (err) {
            if (err) {
                console.log("Unable to connect to db. Exiting.");
                process.exit(1);
            }
            console.log("db created");
            db = nano.db.use('jsstatll');
            Users.use(db);
            Libs.use(db);
        });
    } else {
        db = nano.db.use('jsstatll');
        Users.use(db);
        Libs.use(db);
    }
});

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

app.get('/library', function (req, res) {
    Libs.get(function (err, libs) {
        res.jsonp(libs);
    });
});

app.get('/library/:name', function (req, res) {
    Libs.get(req.params.name, function (err, lib) {
        res.jsonp(lib);
    });
});

app.post('/library/:name', function (req, res) {
    Libs.set(req.body, req.user, function (err, lib){
        if (err) return res.jsonp(err);
        res.jsonp(lib);
    });
});

port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port", port);
});