'use strict';

var directivesModule = require('./_index.js');

class ExampleDirective {

    /**
     * @ngInject
     */
    constructor() {
        this.restrict = 'EA';
    }

    link(scope, element) {
        element.on('click', function () {
            console.log('element clicked');
        });
    }
}

directivesModule.directive('exampleDirective', ExampleDirective);