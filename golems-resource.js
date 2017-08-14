angular.module('api', ['ngResource'])
  .factory('Person', function($resource) {
      // TODO: switch to api.golems.io if/when can enable SNI SSL on heroku (requires paid dynos) or switch to lambda or whatever
      var Person = $resource('//golems.herokuapp.com/person/:spore');
      return Person;
    })
;

/*
ff.factory('Node', function($resource) {
      var Node = $resource('/nodes/:snid/:action', {snid: "@snid"}, {
        activate: {method:'PUT', params: {action: 'activate'}},
        pressButton: {method:'PUT', params: {action: 'pressButton'}},
        deactivate: {method:'PUT', params: {action: 'daectivate'}},
        shake: {method:'PUT', params: {action: 'shake'}},
        getWet: {method:'PUT', params: {action: 'getWet'}},
        dryOff: {method:'PUT', params: {action: 'dryOff'}}
      });
      return Node;
    });
*/
