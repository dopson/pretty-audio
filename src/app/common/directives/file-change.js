// A custom on change directive to hook us up to file input changes
(function() {
    'use strict';

    angular.module('pretty-audio.common.directives')
        .directive('fileChange', function() {
             return {
                 require: 'ngModel',
                 restrict: 'A',
                 link: function($scope, element, attrs, ngModel) {
                     element.bind('change', function(event) {
                         var files = event.target.files;
                         var file = files[0];

                         ngModel.$setViewValue(file);
                     });
                 }
             }
        });
})();