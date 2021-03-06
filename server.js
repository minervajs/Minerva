'use strict';
/*jshint globalstrict:true, node:true*/

var app, connectRedis, corser, db, everyauth, express, mustbeloggedin, nano, port,
    redis, request, redisClient, senderror, Libs, Users, Ratings;

corser = require("corser");
everyauth = require("everyauth");
express = require("express");
nano = require("nano")(process.env.CLOUDANT_URL);
connectRedis = require("connect-redis")(express);
redis = require("redis");
request = require("request");
Libs = require("./libs");
Users = require("./users");
Ratings = require("./ratings");

//---------------------------------------------------------
// Set up custom middleware
//---------------------------------------------------------
mustbeloggedin = function (req, res, next) {
    if (!req.user) return res.jsonp(403, { error : "unauthorized", reason : "You must be logged in to perform that action."});
    next();
};

senderror = function (res, err) {
    var error = {};
    console.error("Error:",err);
    error.error = err.error || "unspecified";
    error.reason = err.reason || "Unspecified server error.";
    res.jsonp(500, error);
};

//---------------------------------------------------------
// Set up DB connections
//---------------------------------------------------------
var dbname = process.env.DBNAME || 'minerva';
nano.db.get(dbname, function (err, body) {
    if (err && err.error === 'not_found') {
        console.log("db not found...creating");
        nano.db.create(dbname, function (err) {
            if (err) {
                console.log("Unable to connect to db. Exiting.");
                process.exit(1);
            }
            console.log("db created and opened");
            db = nano.db.use(dbname);
            Users.use(db);
            Libs.use(db);
            Ratings.use(db);
        });
    } else {
        console.log("db opened");
        db = nano.db.use(dbname);
        Users.use(db);
        Libs.use(db);
        Ratings.use(db);
    }
});

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    redisClient = require("redis").createClient(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
} else {
    redisClient = redis.createClient();
}

//---------------------------------------------------------
// Set up EveryAuth for Google's OAuth 2
//---------------------------------------------------------
everyauth.google
    .appId(process.env.CLIENT_ID)
    .appSecret(process.env.CLIENT_SECRET)
    .scope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        var userId, promise, userKey;
        promise = this.Promise();
        userId = googleUserMetadata.id;
        Users.get(userId, function (err, user){
            if (err && err.error === "User not found") {
                // Create and return user
                user = {
                    "id" : userId,
                    "name" : googleUserMetadata.name,
                    "accessToken" : accessToken,
                    "refreshToken" : accessTokenExtra.refresh_token,
                    "expiresIn" : accessTokenExtra.expires_in,
                    "email" : googleUserMetadata.email
                };
                Users.set(user, function (err, user) {
                    promise.fulfill(user);
                });
            } else if (err) {
                // Pass unknown errors up the chain
                promise.fail(err);
            } else {
                // Return the created user
                promise.fulfill(user);
            }
        });
        return promise;
    })
    .redirectPath('/');

everyauth.everymodule.findUserById( function (userId, callback) {
    Users.get(userId, function (err, user) {
        if (err) return callback(err);
        var safeKeys = ['id', 'name', 'email'];
        user.sanitized = {};
        safeKeys.forEach(function (key) {
            user.sanitized[key] = user[key];
        });
        callback(null, user);
    });
});

//---------------------------------------------------------
// Set up and start the server
//---------------------------------------------------------
app = express();

app.use(corser.create());
app.use(express.bodyParser());
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.session({
    store : new connectRedis({
        client : redisClient
    }),
    secret : process.env.COOKIE_SECRET
}));
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
    //Get static files for the web interface
    var path = req.params[0];
    res.sendfile('./static/'+path);
});

app.get('/api', function (req, res) {
    //Send the api for use in the javascript console
    res.sendfile('./static/js/minerva.js');
});

app.get('/account', function (req, res) {
    //Get user information for current user
    if (req.user) {
        res.jsonp(req.user.sanitized);
    } else {
        res.jsonp({});
    }
});

app.get('/manifests', function (req, res) {
    request.get(process.env.CLOUDANT_URL+"/"+dbname+"/_design/minerva/_list/manifests/wapps").pipe(res);
});

app.get('/lib', function (req, res) {
    //Get list of all libraries
    Libs.get(function (err, libs) {
        if (err) return senderror(res, err);
        res.jsonp(libs);
    });
});

app.get('/lib/:name', function (req, res) {
    //Get a particular library by name
    Libs.get(req.params.name, function (err, lib) {
        if (err) return senderror(res, err);
        res.jsonp(lib);
    });
});

app.post('/lib/:name', mustbeloggedin, function (req, res) {
    //Post (save) a particular library
    var name = req.params.name;
    Libs.get(name, function (err, lib) {
        if (err && ( err.reason === 'missing' || err.reason === 'deleted')) {
            //Append maintainer information to the new library
            req.body.maintainer = {
                userId : req.user.id,
                email : req.user.email,
                name : req.user.name
            };
            req.body.ratings = {
                average : 0,
                count : 0
            };
        } else if (err) {
            return senderror(res, err);
        } else if (lib.maintainer.userId  !== req.user.id) {
            res.jsonp(403, { error : "unauthorized", reason : "You may only modify your own libraries."});
        } else {
            req.body.maintainer = lib.maintainer;
            req.body.ratings = lib.ratings;
        }
        Libs.set(req.body, function (err, savedLib){
            if (err) return senderror(res, err);
            res.jsonp(savedLib);
        });
    });
});

app['delete']('/lib/:name', mustbeloggedin, function (req, res) {
    //Delete a particular library
    var name = req.params.name;
    Libs.get(name, function (err, lib) {
        if (err) return senderror(res, err);
        if (lib.maintainer.userId  !== req.user.id) {
            res.jsonp(403, { error : "unauthorized", reason : "You may only delete your own libraries."});
        } else {
            Libs.del(name, function (err, result) {
                if (err) return senderror(res, err);
                res.jsonp(result);
            });
        }

    });
});

app.post('/lib/:name/rating/:rating', mustbeloggedin, function (req, res) {
    var name, userId, rating;
    userId = req.user.id;
    name = req.params.name;
    rating = parseInt(req.params.rating, 10);
    Ratings.get(req.params.name, req.user.id, function (err, ratingObj) {
        if (err && err.reason !== "missing") {
            return senderror(res, err);
        }
        if (err) { // missing rating, create
            ratingObj = {
                userId : userId,
                lib : name,
                rating : rating
            };
        } else {
            ratingObj.rating = rating;
        }
        Ratings.set(ratingObj, function (err, resp) {
            if (err) return senderror(res, err);
            else res.jsonp(resp);
        });
    });
});

app.get('/find/:keyword', function (req, res) {
    Libs.find(req.params.keyword, function (err, libs){
        if (err) return senderror(res, err);
        res.jsonp(libs);
    });
});

port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port", port);
});