'use strict';

var controllersModule = require('./_index');

class SquadsController {

  /**
   * @ngInject
   */
  constructor() {
    var squads = [];
    for (let i = 1; i <= 5; i++) {
      squads.push({
        no: i,
        participants: [
          {
            firstName: 'Lorem',
            lastName: 'Ipsum',
            gender: 'M'
          },
          {
            firstName: 'Dolores',
            lastName: 'Ipsum',
            gender: 'F'
          },
          {
            firstName: 'Lorem',
            lastName: 'Ipsum',
            gender: 'M'
          },
          {
            firstName: 'Dolores',
            lastName: 'Ipsum',
            gender: 'F'
          },
          {
            firstName: 'Dolores',
            lastName: 'Ipsum',
            gender: 'F'
          }
        ]
      })
    }
    this.list = squads;
  }
}

controllersModule.controller('SquadsController', SquadsController);