'use strict';
/*jshint globalstrict:true node:true couch:true*/

var app, couchapp;

app = {
    _id : "_design/jssll",
    views : {
        find : {
            map : function (doc) {
                if (doc._id.slice(0,8) === "library:") {
                    emit(doc._id.slice(8), doc._id.slice(8));
                    doc.keywords.forEach(function (keyword) {
                        emit(keyword, doc._id.slice(8));
                    });
                }
            }
        },
        rating : {
            map : function (doc) {
                if (doc._id.slice(0,7) === "rating:") {
                    emit(doc.lib, doc.rating);
                }
            },
            reduce : "_stats"
        }
    }
};

module.exports = app;