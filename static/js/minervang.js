(function () {
    'use strict';
    /*jshint browser:true jquery:true*/
    /*global console:false angular:false DISQUS:false*/
    
    var minervang = {};

    minervang = angular.module('minervang', ['ngResource', 'ngSanitize']);

    minervang.config(function ($routeProvider, $locationProvider) {
        $routeProvider.
                when('/', {controller:'LibraryList', templateUrl:'templates/library/list.html'}).
                when('/edit/:name', {controller:'LibraryEdit', templateUrl:'templates/library/edit.html'}).
                when('/view/:name', {controller:'LibraryView', templateUrl:'templates/library/view.html'}).
                when('/new', {controller:'LibraryCreate', templateUrl:'templates/library/edit.html'}).
                when('/rate/:name', {controller:'LibraryRate', templateUrl:'templates/library/rate.html'}).
                otherwise({redirectTo:'/'});
        $locationProvider.hashPrefix("!");
    });

    minervang.factory('Account', function ($resource) {
        var Account = $resource('../account');
        return Account;
    });

    minervang.factory('Library', function ($resource) {
        var Library = $resource('../lib/:name', {"name" : "@name"});
        Library.prototype.destroy = function(cb) {
            return Library.remove({name: this.name}, cb);
        };
        return Library;
    });

    minervang.factory('Rating', function ($resource) {
        var Rating = $resource('../lib/:name/rating/:rating', {"name" : "@name", "rating" : "@rating"});
        return Rating;
    });

    minervang.controller('account', function ($scope, $http, Account){
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

    minervang.controller('LibraryList', function ($scope, Library, Account) {
        $scope.libraries = Library.query();
        $scope.user = Account.get();
        $scope.message = "Hello";
    });

    minervang.controller('LibraryEdit', function ($scope, $location, $routeParams, Library) {
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

    minervang.controller('LibraryView', function ($scope, $routeParams, $sanitize, Library, Account) {
        $scope.user = Account.get();
        $scope.library = Library.get({name: $routeParams.name});
    });

    minervang.controller('LibraryCreate', function ($scope, $location, Library) {
        $scope.save = function () {
            Library.save($scope.library, function(library) {
              $location.path('/');
            });
        };
    });

    minervang.controller('LibraryRate', function ($scope, $routeParams, $location, Library, Rating) {
        var self = this;
        Library.get({name: $routeParams.name}, function(library) {
            self.original = library;
            $scope.library = new Library(self.original);
        });
        $scope.rate = function () {
            Rating.save({
                name : $scope.library.name,
                rating : $scope.rating
            }, function () {
                $location.path('/');
            });
        };
    });

    minervang.directive('rating', function () {
        var ratingDirective = {
            template : "<div style=\"white-space:nowrap\"><i class=\"icon-star-empty\"></i><i class=\"icon-star-empty\"></i><i class=\"icon-star-empty\"></i><i class=\"icon-star-empty\"></i><i class=\"icon-star-empty\"></i></div>",
            link : function (scope, element, attributes) {
                attributes.$observe("rating", function (rating) {
                    var intRating = parseInt(rating, 10);
                    $("i", element).slice(0,intRating).removeClass("icon-star-empty").addClass("icon-star");
                });
            }
        };
        return ratingDirective;
    });

    minervang.directive('disquscomments', function ($location, $window) {
        var disqusCommentsDirective;
        disqusCommentsDirective = {
            restrict : "E",
            template : "<div id=\"disqus_thread\"></div><a href=\"http://disqus.com\" class=\"dsq-brlink\">comments powered by <span class=\"logo-disqus\">Disqus</span></a>",
            link : function (scope,  elements, attributes) {
                scope.$watch( function () { return $location.path(); }, function (path) {
                    var disqus_url, disqus_identifier;
                    disqus_identifier = path;//$location.path();
                    disqus_url = 'http://minerva.org'+disqus_identifier;
                    if ($window.DISQUS) {
                        $window.DISQUS.reset({
                            reload : true,
                            config : function () {
                                this.page.identifier = disqus_identifier;
                                this.page.url = disqus_url;
                            }
                        });
                    } else {
                        /* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
                        $window.disqus_shortname = 'minervajs'; // required: replace example with your forum shortname
                        $window.disqus_url = disqus_url;
                        $window.disqus_identifier = disqus_identifier;

                        /* * * DON'T EDIT BELOW THIS LINE * * */
                        (function() {
                            var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
                            dsq.src = 'http://' + $window.disqus_shortname + '.disqus.com/embed.js';
                            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
                        })();
                    }
                });
            }
        };
        return disqusCommentsDirective;
    });

    minervang.controller('analytics', function ($scope, $location, $window) {
        $scope.$watch( function () { return $location.path(); }, function (path) {
            $window._gaq.push(['_trackPageview', $location.path()]);
        });
    });

    console.log("minervang loaded");
    window.minervang = minervang;
})();