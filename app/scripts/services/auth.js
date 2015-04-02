'use strict';

angular.module('tweetabaseApp')
  .factory('auth', ['$q', '$http', '$rootScope', 'localStorageService', function ($q, $http, $rootScope, localStorageService) {

    // Public API

    var login = function(user,callback) {
      var cb = callback || angular.noop;
      // var deferred = $q.defer();

      // console.log(user.email + '...' + user.password);
      $rootScope.currentUser = null;

      $http.post('/api/checkCredentials', {uid: user.email, password: user.password}).success(function(uResponse) {
        // console.log('/api/checkCredentials uResponse: ' + JSON.stringify(uResponse));
        if (uResponse.status === 'Ok'){
          localStorageService.set(uidKey,uResponse.uid);
          localStorageService.set(authKey,uResponse.auth);
          var authKey = 'auth';
          var uidKey = 'uid';
          user.uid = uResponse.uid;
          user.auth = uResponse.auth;
          $rootScope.currentUser = user;
          return cb({status : 'Ok'});
        } else {
          return cb();
        }
      });

      // return deferred.promise;
    };

    var logout = function(callback) {
      var cb = callback || angular.noop;
      var authKey = 'auth';
      var uidKey = 'uid';
      localStorageService.set(uidKey,null);
      localStorageService.set(authKey,null);
      $rootScope.currentUser = null;
      return cb("Logged out");
    };

    var isLoggedIn = function() {
      var authKey = localStorageService.get('auth');
      // console.log(authKey);
      if (authKey === null || authKey === undefined)  {
        return false;
      }
      return true;
    };

    return {
      login: login,
      logout: logout,
      isLoggedIn: isLoggedIn
    };

  }]);
