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
    db.insert(rating, Ratings.makeKey(rating.lib, rating.userId), function (err) {
        if (err) return callback(err);
        Ratings.updateLib(rating.lib, callback);
    });
};

Ratings.get = function (lib, userId, callback) {
    db.get(Ratings.makeKey(lib, userId), callback);
};

Ratings.getAverage = function (lib, callback) {
    db.view('minerva', 'rating', {
        reduce : true,
        key : lib
    }, function (err, response) {
        if (err) return callback(err);
        var stats = response.rows[0].value;
        callback(null, stats.sum / stats.count);
    });
};

Ratings.updateLib = function (lib, callback) {
    Ratings.getAverage(lib, function (err, average) {
        if (err) return callback(err);
        Libs.update(lib, {ratings : { average : average}}, callback);
    });
};

module.exports = Ratings;