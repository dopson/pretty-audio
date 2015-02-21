// The selection module definitions
(function() {
    'use strict';

    // Define the module
    angular.module('pretty-audio.selection', []);

    // Module config
    angular.module('pretty-audio.selection')
        .config(
            [
                '$stateProvider',
                function($stateProvider) {
                    $stateProvider
                        .state('pretty-audio.selection', {
                            url: '/selection',
                            views: {
                                'content@': {
                                    templateUrl: '/pretty-audio/selection/partials/selection.html',
                                    controller: 'SelectionController'
                                }
                            }
                        });
                }
            ]
        );
})();