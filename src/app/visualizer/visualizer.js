// The selection module definitions
(function() {
    'use strict';

    // Define the module
    angular.module('pretty-audio.visualizer', []);

    // Module config
    angular.module('pretty-audio.visualizer')
        .config(
        [
            '$stateProvider',
            function($stateProvider) {
                $stateProvider
                    .state('pretty-audio.visualizer', {
                        url: '/visualizer',
                        views: {
                            'content@': {
                                templateUrl: '/pretty-audio/visualizer/partials/visualizer.html',
                                controller: 'VisualizerController'
                            }
                        },
                        params: {
                            _file: { value: null }
                        }
                    });
            }
        ]
    );
})();