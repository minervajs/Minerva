'use strict';
/*jshint globalstrict:true node:true*/

var Libs = {}, db;

Libs.use = function (database) {
    db = database;
    return Libs;
};

Libs.nameToKey = function (name) {
    return "library:"+name;
};

Libs.get = function () {
    var name, callback;
    if (arguments.length === 2) {
        name = arguments[0];
        callback = arguments[1];
        db.get(Libs.nameToKey(name), function (err, lib){
            if (err) return callback(err);
            callback(null, lib);
        });
    } else {
        callback = arguments[0];
        db.list({
            "startkey" : Libs.nameToKey(""),
            "endkey" : Libs.nameToKey("\u9999"),
            "limit" : 100,
            "include_docs" : true
        }, function (err, body) {
            if (err) return callback(err);
            var libs = body.rows.map(function (row) { return row.doc; });
            callback(null, libs);
        });
    }
};

Libs.set = function (lib, callback) {
    db.insert(lib, Libs.nameToKey(lib.name), callback);
};

Libs.del = function (name, callback) {
    Libs.get(name, function (err, lib) {
        if (err) return callback(err);
        lib._deleted = true;
        Libs.set(lib, callback);
    });
};

Libs.rate = function (name, ratingIn, callback) {
    var rating = parseInt(ratingIn, 10);
    if (rating > 5 || rating < 0) {
        callback({
            error : "invalid_rating",
            reason : "ratings must be an integer from 0-5"
        });
    } else {
        Libs.get(name, function (err, lib) {
            if (err) return callback(err);
            var average, count;
            if (!lib.ratings) lib.ratings = {};
            average = lib.ratings.average || 0;
            count = lib.ratings.count || 0;
            average = (average*count + rating) / (count + 1);
            lib.ratings.average = average;
            lib.ratings.count = count + 1;
            db.insert(lib, Libs.nameToKey(lib.name), function (err, lib){
                if (err) return callback(err);
                callback(null, average);
            });
        });
    }
};

Libs.update = function (name, params, callback) {
    Libs.get(name, function (err, lib) {
        if (err) return callback(err);
        var mergedLib = lib, param;
        for (param in params) {
            if (!params.hasOwnProperty(param)) continue;
            mergedLib[param] = params[param];
        }
        Libs.set(mergedLib, callback);
    });
};

Libs.find = function (keyword, callback) {
    db.view('minerva', 'find', {
        startkey : keyword,
        endkey : keyword+"\u9999"
        //include_docs : true
    }, function (err, body) {
        if (err) return callback (err);
        var libs = body.rows.map(function (row) {
            return row.value;
        });
        callback (null, libs);
    });
};

module.exports = Libs;