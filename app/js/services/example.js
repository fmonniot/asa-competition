'use strict';

var servicesModule = require('./_index.js');

class ExampleService {

    /**
     * @ngInject
     */
    constructor($q, $http) {

        var service = {};

        service.get = function () {
            var deferred = $q.defer();

            $http.get('apiPath').success(function (data) {
                deferred.resolve(data);
            }).error(function (err, status) {
                deferred.reject(err, status);
            });

            return deferred.promise;
        };

        return service;
    }
}

servicesModule.service('ExampleService', ExampleService);