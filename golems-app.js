// TODO: switch to api.golems.io if/when can enable SNI SSL on heroku (requires paid dynos) or switch to lambda or whatever
var api = angular.module('api', ['ngResource'])
  .factory('Schema', function($resource) {
      var Schema = $resource('//golems.herokuapp.com/schema/:aspect');
      return Schema;
  })
  .factory('Person', function($resource) {
      var Person = $resource('//golems.herokuapp.com/person/:spore');
      return Person;
  })
;

var app = angular.module('golems', ['ngRoute', 'api'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/', { controller: "CardController", templateUrl: 'card.html' }).
      otherwise({redirectTo:'/'});
  }])
  .filter('fromNow', function() {
    return function(maybeDate) {
      if (typeof(maybeDate) === "string" && maybeDate.match(/^20[12][0-9]-.*Z$/)) {
        var d = Date.parse(maybeDate);
        return isNaN(d) ? maybeDate: moment(d).from(moment(Math.max(d, Date.now()))); // if server is ahead of us use its time
      } else {
        return maybeDate;
      }
    };
  }).filter('title', function() {
    return function(s) {
      return s.replace(/[-_]/g, ' ').replace(/([^A-Z ])([A-Z])/g, '$1 $2');
    };
  }).filter('filename', function() {
    return function(s) {
      return s.toLowerCase().split(' ').join('_');
    };
  }).filter('uri', function() {
    return function(s) {
      return encodeURIComponent(s);
    };
  }).filter('querystring', function() {
    return function(p) {
      return Object.keys(p).map(function (key) { return [key, p[key]].map(encodeURIComponent).join('='); }).join('&'); 
    };
  }).config(function($httpProvider){
    delete $httpProvider.defaults.headers.common['X-Requested-With']; // borks CORS 
  });

app.controller('CardController', function Card($scope, $location, Schema, Person) {
  $scope.debug = ("debug" in $location.search());
  console.log("$scope.debug =", $scope.debug);
  $scope.schema = Schema.get({ aspect: "person" });
  $scope.golem = Person.get({ spore: "random" });
});
