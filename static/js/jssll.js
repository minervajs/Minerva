(function (window) {
    'use strict';
    /*jshint browser:true*/
    /*global console:true*/

    console.log("jssll loaded");

    var jssll = {}, _oldjssll, rootURL;

    rootURL = 'http://jssll.heroku.com';

    jssll.print = function (err, resp) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(resp);
        }
    };

    jssll.safeMode = function () {
        window.jssll = _oldjssll;
        return jssll;
    };

    jssll.getJSON = function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        //xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(null, JSON.parse(xhr.responseText));
            } else if (xhr.readyState === 4){
                callback({ error : "Ajax Error", xhr : xhr });
            }
        };
        xhr.send(null);
    };

    jssll.loadScript = function (url, callback) {
        if (typeof callback !== 'function') {
            callback = function () {
                console.log("thingy loaded", url);
            };
        }
        var head, script;
        head = document.head;
        script = document.createElement("script");
        script.src = url;
        script.onload = function () {
            head.removeChild(script);
            callback();
        };
        script.onerror = function () {
            head.removeChild(script);
            callback({
                name: "Error",
                message: "Loading the script failed. The browser log might have more details."
            });
        };
        head.appendChild(script);
    };

    jssll.find = function (term, callback) {
        jssll.getJSON(rootURL+'/find/'+term, callback);
    };

    jssll.info = function (name, callback) {
        jssll.getJSON(rootURL+'/lib/'+name, callback);
    };

    jssll.load = function (name, callback) {
        jssll.info(name, function (err, lib){
            if (err) return console.error(err);
            jssll.loadScript(lib.url, callback);
        });
    };

    jssll.rootURL = function (url) {
        if (!url) return rootURL;
        rootURL = url;
        return jssll;
    };

    _oldjssll = window.jssll || null;
    window.jssll = jssll;
})(window);