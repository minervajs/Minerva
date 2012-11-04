'use strict';
/*jshint globalstrict:true node:true*/

var Libs = {};

Libs.data = {
    "usm" : {
        "name" : "usm",
        "description" : "Universal Sequence Maps",
        "url" : "https://raw.github.com/usm/usm.github.com/master/usm.js",
        "maintainer" : {
            "email" : "jalmeida@mathbiol.org",
            "userId" : "1234567890"
        }
    },
    "spearson" : {
        "name" : "spearson",
        "description" : "Poor Mans Javascript Stats Library",
        "url" : "https://raw.github.com/agrueneberg/Spearson/master/lib/spearson.js",
        "maintainer" : {
            "email" : "agrueneberg@googlemail.com",
            "userId" : "0987654321"
        }
    }
};

Libs.get = function () {
    var name, callback;
    if (arguments.length === 2) {
        name = arguments[0];
        callback = arguments[1];
        return callback(null, Libs.data[name]);
    } else {
        callback = arguments[0];
        callback(null, Libs.data);
    }
};

Libs.set = function (lib, user, callback) {
    Libs.get(lib.name, function (err, currentLib) {
        if (!currentLib) {
            lib.maintainer = {
                userId : user.id,
                email : user.email
            };
            Libs.data[lib.name] = lib;
            callback(null, lib);
        } else if (currentLib.maintainer.userId !== user.id) {
            callback("Error: you may only modify your own libaries.");
        } else {
            lib.maintainer.userId = user.id;
            Libs.data[lib.name] = lib;
            callback(null, lib);
        }
    });
};

module.exports = Libs;