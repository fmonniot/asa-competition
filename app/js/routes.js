'use strict';

/**
 * @ngInject
 */
function Routes($stateProvider, $locationProvider, $urlRouterProvider) {

  $locationProvider.html5Mode(true);

  $stateProvider
  .state('Home', {
    url: '/',
    controller: 'HomeController as home',
    template: require('../views/home.html'),
    title: 'Home'
  })
  .state('Participants', {
      url: '/:competition/participants',
      controller: 'ParticipantsController as participants',
      template: require('../views/participants.html'),
      title: 'Participants'
    })
  .state('Squads', {
      url: '/:competition/squads',
      controller: 'SquadsController as squads',
      template: require('../views/squads.html'),
      title: 'Squads'
    })
  .state('ScoreSheet', {
      url: '/:competition/:squadNo/scores',
      controller: 'ScoreSheetController as sheet',
      template: require('../views/score-sheet.html'),
      title: 'Score Sheet'
    })
  ;

  $urlRouterProvider.otherwise('/');

}

module.exports = Routes;