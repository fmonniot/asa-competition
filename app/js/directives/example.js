'use strict';

var directivesModule = require('./_index.js');

class exampleDirective {

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

directivesModule.directive('exampleDirective', exampleDirective);