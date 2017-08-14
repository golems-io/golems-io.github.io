// TODO: switch to api.golems.io if/when can enable SNI SSL on heroku (requires paid dynos) or switch to lambda or whatever
angular.module('api', ['ngResource'])
  .factory('Schema', function($resource) {
      var Schema = $resource('//golems.herokuapp.com/schema/:aspect');
      return Schema;
  })
  .factory('Person', function($resource) {
      var Person = $resource('//golems.herokuapp.com/person/:spore');
      return Person;
  })
;
