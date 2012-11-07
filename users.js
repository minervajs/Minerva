'use strict';
/*jshint globalstrict:true node:true*/

var Users, db;

Users = {};

Users.idToKey = function (userId) {
    return "user:"+userId;
};

Users.use = function (database) {
    db = database;
    return Users;
};

Users.get = function (userId, callback) {
    db.get(Users.idToKey(userId), function (err, body) {
        if (err && err.reason === "missing") {
            return callback({
                "error" : "User not found",
                "err" : err
            });
        } else if (err) return callback(err);
        callback(null, body);
    });
};

Users.set = function (user, callback) {
    db.insert(user, Users.idToKey(user.id), function (err, body) {
        if (err) return callback(err);
        Users.get(body.id.slice(5), callback); //slice off the 'user:'
    });
};

module.exports = Users;