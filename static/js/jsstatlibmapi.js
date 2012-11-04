(function () {
    'use strict';
    /*jshint browser:true*/
    /*global console:false angular:false*/
    
    var jsll = {};
    console.log("JS Stat Lib² Loaded");

    jsll = angular.module('jsll', ['ngResource']);

    jsll.config(function ($routeProvider) {
        $routeProvider.
                when('/', {controller:'LibraryList', templateUrl:'templates/library/list.html'}).
                when('/edit/:name', {controller:'LibraryEdit', templateUrl:'templates/library/edit.html'}).
                when('/new', {controller:'LibraryCreate', templateUrl:'templates/library/edit.html'}).
                otherwise({redirectTo:'/'});
    });

    jsll.factory('Account', function ($resource) {
        var Account = $resource('../account');
        return Account;
    });

    jsll.factory('Library', function ($resource){
        var Library = $resource('../library/:name', {"name" : "@name"});
        return Library;
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

    jsll.controller('LibraryList', function ($scope, Library) {
        $scope.libraries = Library.query();
        $scope.message = "Hello";
    });

    jsll.controller('LibraryEdit', function ($scope, $location, $routeParams, Library) {
        var self = this;
 
        Library.get({name: $routeParams.name}, function(library) {
            self.original = library;
            $scope.library = new Library(self.original);
        });

        $scope.isClean = function() {
            return angular.equals(self.original, $scope.library);
        };

        $scope.destroy = function() {
            self.original.destroy(function() {
              $location.path('/list');
            });
        };

        $scope.save = function() {
            $scope.library.$save(function() {
              $location.path('/');
            });
        };
    });

    jsll.controller('LibraryCreate', function ($scope, $location, Library) {
        $scope.save = function() {
            Library.save($scope.library, function(library) {
              $location.path('/edit/' + library.name);
            });
        };
    });

    window.jsll = jsll;
})();