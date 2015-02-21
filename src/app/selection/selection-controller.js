// The selection controller definitions
(function() {
    'use strict';

    angular.module('pretty-audio.selection')
        .controller('SelectionController',
            [
                '$scope', '$state',
                function(
                    $scope, $state
                ) {
                    $scope.$watch('selectedFile', function(newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            $state.go('pretty-audio.visualizer', { _file: newValue });
                        }
                    });
                }
            ]
        );
})();