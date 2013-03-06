'use strict';
/*jshint globalstrict:true, node:true, couch:true*/

var app, couchapp;

app = {
    _id : "_design/minerva",
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
        },
        wapps : {
            map : function (doc) {
                if (doc._id.slice(0,8) === "library:" && doc.wapp) {
                    emit(doc._id.slice(8), doc);
                }
            }
        }
    },
    lists : {
        manifests : function (doc, req) {
            /*globals registerType:true, provides:true*/
            var row, manifest;
            send("wApps.manifest.apps.push(\n");
            while ((row = getRow()) !== null) {
                send(" {\n");
                send("  name : '"+row.value.title+"',\n");
                send("  description : '"+row.value.description+"',\n");
                send("  url : '"+row.value.homepage+"',\n");
                send("  author : '"+row.value.maintainer.name+"',\n");
                send("  buildUI : function(id){ this.require('"+row.value.url+"', function () {"+row.value.buildui+"});}\n");
                send(" },\n");
            }
            send(");\n");
        }
    }
};

module.exports = app;