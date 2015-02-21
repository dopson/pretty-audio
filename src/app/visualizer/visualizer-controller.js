// The selection controller definitions
(function() {
    'use strict';

    angular.module('pretty-audio.visualizer')
        .controller('VisualizerController',
        [
            '$scope', '$state', '$stateParams', '$window',
            function(
                $scope, $state, $stateParams, $window
            ) {
                // Grab the file from $stateparams
                $scope.file = $stateParams._file;

                /**
                 * Initialization function for setting up the audio context and audio hooks
                 *
                 * @private
                 */
                function _init() {
                    _prepareAudioContext();
                    _prepareFileReader();
                }

                /**
                 * Handles preparing the audio context
                 *
                 * @private
                 */
                function _prepareAudioContext() {
                    $window.AudioContext = $window.AudioContext || $window.webkitAudioContext || $window.mozAudioContext || $window.msAudioContext;
                    $window.requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame || $window.msRequestAnimationFrame;
                    $window.cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.mozCancelAnimationFrame || window.msCancelAnimationFrame;

                    $scope.audioContext = new AudioContext();
                }

                /**
                 * Prepares the file reader and connects it to visualizing
                 *
                 * @private
                 */
                function _prepareFileReader() {
                    var fr = new FileReader();

                    fr.onload = function(e) {
                        var fileResult = e.target.result;
                        if ($scope.audioContext === null) {
                            return;
                        }

                        $scope.audioContext.decodeAudioData(fileResult, function(buffer) {
                            _visualize(buffer);
                        }, function(e) {
                            // TODO: error handling
                        })
                    }

                    $scope.fileReader = fr;
                }

                /**
                 * Handles hooking up the audio context and passing it's data to our visualizer
                 *
                 * @param       buffer
                 *
                 * @private
                 */
                function _visualize(buffer) {
                    var audioBufferSouceNode = $scope.audioContext.createBufferSource();
                    var analyser = $scope.audioContext.createAnalyser();

                    audioBufferSouceNode.connect(analyser);

                    analyser.connect($scope.audioContext.destination);

                    audioBufferSouceNode.buffer = buffer;

                    if (!audioBufferSouceNode.start) {
                        audioBufferSouceNode.start = audioBufferSouceNode.noteOn
                        audioBufferSouceNode.stop = audioBufferSouceNode.noteOff
                    }

                    audioBufferSouceNode.start(0);

                    _draw(analyser);
                }

                /**
                 * Starts the visualization
                 *
                 * @private
                 */
                function _start() {
                    $scope.fileReader.readAsArrayBuffer($scope.file);
                }

                /**
                 * Handles drawing the visualization on the canvas. This should be refactored to smaller components :)
                 *
                 * @param       analyser
                 * @private
                 */
                function _draw(analyser) {
                    var prevRotation = 0;
                    var twoPi = 2*Math.PI;
                    var lowFreqAmount = 8;
                    var lowFreqValues = 0;
                    var lowFreqAverage = 0;
                    var canvas = document.getElementById('canvas');
                    var ctx = canvas.getContext('2d');
                    var balls = 5;

                    var drawVisualizer = function() {
                        var drawData = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(drawData);
                        var timeDomainData = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteTimeDomainData(timeDomainData);

                        ctx.save();
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        var validValues = [];
                        for (var i = 0; i < drawData.length; i++) {
                            if (drawData[i] > 0) {
                                validValues.push(drawData[i]);
                            }
                        }

                        var gradient = ctx.createRadialGradient(512, 512, lowFreqAverage * 3, 512, 512, lowFreqAmount );
                        gradient.addColorStop(0, "#000000");
                        gradient.addColorStop(1, "#004CB3");
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.rect(0, 0,  canvas.width, canvas.height);
                        ctx.fill();

                        var change = twoPi / validValues.length;
                        // Bar graph
                        var xPos = -512;
                        ctx.translate(512, 512);
                        ctx.beginPath();
                        ctx.setLineDash([1, 5])
                        ctx.shadowColor = "white";
                        ctx.shadowBlur = 30;

                        //ctx.moveTo(xPos, 0);
                        for (var i = 0; i < timeDomainData.length; i++) {
                            ctx.lineTo(xPos, timeDomainData[i]);
                            ctx.moveTo(xPos, timeDomainData[i]);
                            xPos += 1;
                        }
                        ctx.strokeStyle = "white";
                        ctx.stroke();
                        ctx.closePath();
                        lowFreqAverage = lowFreqValues/lowFreqAmount;
                        lowFreqValues = 0;

                        //ctx.translate(512, 512);
                        var ballChange = twoPi / balls;
                        ctx.rotate(prevRotation);
                        for (var i = 0; i < twoPi; i+=ballChange) {
                            var x = lowFreqAverage * Math.cos(i);
                            var y = lowFreqAverage * Math.sin(i);

                            ctx.beginPath();
                            ctx.arc(x, y, lowFreqAverage * 0.2, 0, twoPi, false);
                            ctx.fillStyle = "#FFFF00";
                            ctx.fill();
                        }

                        if (lowFreqAverage > 230) {
                            prevRotation -= 15;
                        } else {
                            prevRotation += 5;
                        }

                        ctx.restore();
                        ctx.save();
                        ctx.translate(512, 512);

                        // Rotated graph
                        for (var i = 0; i < validValues.length ; i++) {
                            if (i < lowFreqAmount) {
                                lowFreqValues += validValues[i];
                            }
                            ctx.rotate(change);
                            ctx.beginPath();
                            ctx.fillStyle = "#FF5B0A";
                            ctx.rect(0, 50, 1, validValues[i] * 1.5);
                            ctx.fill();
                        }
                        ctx.restore();

                        requestAnimationFrame(drawVisualizer);
                    };

                    requestAnimationFrame(drawVisualizer)
                }

                // Get everything ready
                _init();
                _start();
            }
        ]
    );
})();