'use strict';

var angular = require('angular');
var bulk = require('bulk-require');
var register = require('../utils/register.js');

angular.module('app.directives', []);

module.exports = register('app.directives');

bulk(__dirname, ['./**/!(*_index|*.spec).js']);