'use strict';

var controllersModule = require('./_index');

class ParticipantsController {

    /**
     * @ngInject
     */
    constructor() {
        var participants = [];
        for (let i=0; i<17; i++) {
            participants.push({
                lastName: `Last ${i}`,
                firstName: `First-${i}`,
                club: 'club',
                license: 'VTP73648CP',
                category: 'senior',
                bowCategory: 'something',
                squad: (i%5)+1,
                gender: (i%2 == 0) ? 'M' : 'F'
            });
        }
        this.list = participants;
    }
}

controllersModule.controller('ParticipantsController', ParticipantsController);