(function (window) {
    'use strict';
    /*jshint browser:true*/
    /*global console:true*/

    console.log("minerva loaded");

    var minerva = {}, _oldminerva, rootURL;

    rootURL = 'http://minervajs.org';

    minerva.print = function (err, resp) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(resp);
        }
    };

    minerva.safeMode = function () {
        window.minerva = _oldminerva;
        return minerva;
    };

    minerva.getJSON = function (url, callback) {
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

    minerva.loadScript = function (url, callback) {
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

    minerva.find = function (term, callback) {
        minerva.getJSON(rootURL+'/find/'+term, callback);
    };

    minerva.info = function (name, callback) {
        minerva.getJSON(rootURL+'/lib/'+name, callback);
    };

    minerva.load = function (name, callback) {
        minerva.info(name, function (err, lib){
            if (err) return console.error(err);
            minerva.loadScript(lib.url, callback);
        });
    };

    minerva.rootURL = function (url) {
        if (!url) return rootURL;
        rootURL = url;
        return minerva;
    };

    _oldminerva = window.minerva || null;
    window.minerva = minerva;
})(window);