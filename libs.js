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

Libs.set = function (lib, user, callback) {
    Libs.get(lib.name, function (err, currentLib) {
        if (err && err.reason === "missing") {
            lib.maintainer = {
                userId : user.id,
                email : user.email
            };
            db.insert(lib, Libs.nameToKey(lib.name), function (err, lib){
                if (err) return callback(err);
                callback(null, lib);
            });
        } else if (err) {
            return callback(err);
        } else if (currentLib.maintainer.userId !== user.id) {
            callback({ error : "unauthorized", reason : "You are not authorized to modify that library." });
        } else {
            lib.maintainer = currentLib.maintainer;
            db.insert(lib, Libs.nameToKey(lib.name), function (err, lib){
                if (err) return callback(err);
                callback(null, lib);
            });
        }
    });
};

module.exports = Libs;