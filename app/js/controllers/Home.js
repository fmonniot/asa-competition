'use strict';

var controllersModule = require('./_index');

class HomeController {

    /**
     * @ngInject
     */
    constructor() {
        this.title = 'AngularJS, Gulp, and Browserify!';
        this.number = 1234;
    }
}

controllersModule.controller('HomeController', HomeController);