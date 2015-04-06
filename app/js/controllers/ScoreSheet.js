'use strict';

var controllersModule = require('./_index');

class ScoreSheetController {

  /**
   * @ngInject
   */
  constructor() {
    this.participants = [
      {name: 'Dolores'},
      {name: 'Lorem'},
      {name: 'Ipsum'},
      {name: 'Amet'}
    ];
    var scores = [];
    for (let i = 0; i < 40; i++) {
      var targetScore = scores[i] = [];
      for (let [index, participant] of this.participants.entries()) {
        targetScore.push({
          tabindex: index + 2,
          name: participant.name,
          arrow1: 0,
          arrow2: 0
        });
      }
    }
    this.scores = scores;
  }

  cancel (event, val) {
    if(event.keyCode === 27) {
      val.$rollbackViewValue();
    }
  }
  
  update() {

  }
}

controllersModule.controller('ScoreSheetController', ScoreSheetController);