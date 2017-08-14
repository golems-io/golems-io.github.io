angular.module('golems', ['api', 'ngCsv', 'ngCookies']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', { controller: Card, templateUrl: 'card.html' }).
      otherwise({redirectTo:'/'});
  }).config(function($httpProvider){
    delete $httpProvider.defaults.headers.common['X-Requested-With']; // borks CORS 
  });

function Card($scope, $location, Person) {
  $scope.debug = true; // "debug" in $location.search();
  $scope.schema = Schema.get({ aspect: "person" });
  $scope.golem = Person.get({ spore: "random" });
}

