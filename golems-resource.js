angular.module('api', ['ngResource'])
  .factory('Person', function($resource) {
      var Person = $resource('/api/person/:spore.json');
      return Person;
    })
  .factory('Account', function($resource) {
      var Account = $resource('http://api.golems.io/v1/accounts/:email/:children', { email: "@email" }, { 
          clients: { method: 'GET', isArray: true, params: { children: 'clients' } },
          devices: { method: 'GET', isArray: true, params: { children: 'devices' } },
          gateways: { method: 'GET', isArray: true, params: { children: 'gateways' } }
        });
      return Account;
    })
  .factory('Gateway', function($resource) {
      var Gateway = $resource('http://api.golems.io/v1/gateways/:snid/:action', { action: "", snid: "@snid" }, {
        unpair: { method: 'POST', params: { action: "unpair", snid: "@snid" } }
      });
      return Gateway;
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
