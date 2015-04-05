'use strict';

var angular = require('angular');
var bulk = require('bulk-require');
var register = require('../utils/register.js');

angular.module('app.services', []);

module.exports = register('app.services');

bulk(__dirname, ['./**/!(*_index|*.spec).js']);