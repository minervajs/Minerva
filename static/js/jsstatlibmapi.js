(function () {
    'use strict';
    /*jshint browser:true*/
    /*global console:false angular:false*/
    
    var jsll = {};
    console.log("JS Stat Lib² Loaded");

    jsll = angular.module('jsll', ['ngResource']);

    jsll.factory('Account', function ($resource) {
        var Account = $resource('../account');
        return Account;
    });

    jsll.controller('account', function ($scope, $http, Account){
        /*global Account:false*/
        $scope.accountTemplate = 'templates/account/loggedOut.html';
        var user = Account.get(function () {
            if (!user.name) return;
            $scope.accountTemplate = 'templates/account/loggedIn.html';
            $scope.user = user;
        });
        $scope.logout = function () {
            $http.get('../logout').success(function () {
                $scope.accountTemplate = 'templates/account/loggedOut.html';
                $scope.user = null;
            });
        };
    });
    window.jsll = jsll;
})();