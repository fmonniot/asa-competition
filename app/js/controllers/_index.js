'use strict';

var angular = require('angular');
var bulk = require('bulk-require');
var register = require('../utils/register.js');

angular.module('app.controllers', []);

module.exports = register('app.controllers');

bulk(__dirname, ['./**/!(*_index|*.spec).js']);