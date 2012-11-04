(function (window) {
    'use strict';
    /*jshint browser:true*/
    /*global console:true*/

    console.log("jssll loaded");

    var jssll = {}, _oldjssll, rootURL;

    jssll.safeMode = function () {
        window.jssll = _oldjssll;
        return jssll;
    };

    jssll.loadScript = function (url) {

    };

    jssll.rootURL = function (url) {
        if (!url) return rootURL;
        rootURL = url;
        return jssll;
    };

    _oldjssll = window.jssll || null;
    window.jssll = jssll;
})(window);