angular.module('golems', ['api', 'ngCsv', 'ngCookies']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', { controller: Card, templateUrl: 'card.html' }).
      otherwise({redirectTo:'/'});
  }).filter('fromNow', function() {
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

function Card($scope, $location, Person) {
  $scope.debug = true; // "debug" in $location.search();
  $scope.schema = Schema.get({ aspect: "person" });
  $scope.golem = Person.get({ spore: "random" });
}
