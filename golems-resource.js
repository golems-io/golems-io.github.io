angular.module('api', ['ngResource'])
  .factory('Person', function($resource) {
      var Person = $resource('//api.golems.io/person/:spore');
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
