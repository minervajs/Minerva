'use strict';
/*jshint globalstrict:true node:true*/

var app, corser, express, port;

express = require("express");
corser = require("corser");

app = express();

app.use(corser.create());

// Corser does not end CORS preflight requests itself.
app.options("*", function (req, res){
    res.writeHead(204);
    res.end();
});

app.get("/*", function (req, res) {
    res.writeHead(200);
    res.end("jsstatlibm");
});

port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on port", port);
});