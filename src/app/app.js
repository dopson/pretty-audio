(function() {
    'use strict';

    // App base module definition
    angular.module('pretty-audio', [
        'ui.router',
        'ui.bootstrap',
        'pretty-audio.selection',
        'pretty-audio.common',
        'pretty-audio.visualizer'
    ]);

    angular.module('pretty-audio')
        .config(
            [
                '$stateProvider', '$locationProvider', '$urlRouterProvider',
                function config(
                    $stateProvider, $locationProvider, $urlRouterProvider
                ) {
                    // Html 5 :)
                    $locationProvider
                        .html5Mode({
                            enabled: true,
                            requireBase: false
                        }).hashPrefix('!');

                    // Define base state
                    $stateProvider
                        .state('pretty-audio', {
                            abstract: true
                        });

                    // Set default route as the song selection
                    $urlRouterProvider.otherwise('/selection');
                }
            ]
        );
})();

