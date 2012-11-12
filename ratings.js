'use strict';
/*jshint globalstrict:true node:true*/

var Ratings, Users, Libs, db;

Users = require('./users');
Libs = require('./libs');

Ratings = {};

Ratings.use = function (database) {
    db = database;
    return Libs;
};

Ratings.makeKey = function (libName, userId) {
    return "rating:"+libName+":"+userId;
};

Ratings.set = function (rating, callback) {
    if (!rating || !rating.lib || !rating.userId || !rating.rating) {
        return callback({ error: "invalid", reason : "malformed rating object"});
    }
    db.insert(rating, Ratings.makeKey(rating.lib, rating.userId), callback);
};

Ratings.get = function (lib, userId, callback) {
    db.get(Ratings.makeKey(lib, userId), callback);
};

Ratings.getAll = function (libName) {

};

module.exports = Ratings;