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
                $scope.processing = false;

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
                    $scope.processing = true;

                    fr.onload = function(e) {
                        var fileResult = e.target.result;
                        if ($scope.audioContext === null) {
                            return;
                        }

                        $scope.audioContext.decodeAudioData(fileResult, function(buffer) {
                            $scope.processing = false;
                            $scope.$apply();
                            _visualize(buffer);
                        }, function(e) {
                            // TODO: error handling
                        })
                    };

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
                    var lowFreqAmount = 8;
                    var lowFreqValues = 0;
                    var lowFreqAverage = 0;
                    var canvas = document.getElementById('canvas');
                    var ctx = canvas.getContext('2d');

                    var drawVisualizer = function() {
                        var drawData = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(drawData);
                        var timeDomainData = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteTimeDomainData(timeDomainData);

                        ctx.save();
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        // Eugh.. Too tired. Group values to an array of a more sensible size
                        var validValues = [];
                        var valueGroupCounter = 0;
                        var valueGroup = 0;
                        for (var i = 0; i < 870; i++) {
                            if (valueGroupCounter == 8) {
                                validValues.push(valueGroup / (valueGroupCounter + 1));
                                valueGroupCounter = 0;
                                valueGroup = 0;
                            } else {
                                valueGroup += drawData[i];
                                valueGroupCounter++;
                            }
                        }

                        var gradient = ctx.createRadialGradient(512, 256, lowFreqAverage * 3, 512, 256, lowFreqAmount );
                        gradient.addColorStop(0, "#31412D");
                        gradient.addColorStop(1, "#7D8B65");
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.rect(0, 0,  canvas.width, canvas.height);
                        ctx.fill();

                        // Time domain graph
                        var xPos = -512;
                        ctx.translate(512, 190);
                        ctx.beginPath();
                        ctx.setLineDash([1, 5])
                        ctx.shadowColor = "white";
                        ctx.shadowBlur = 30;

                        for (var i = 0; i < timeDomainData.length; i++) {
                            ctx.lineTo(xPos, timeDomainData[i] * 0.5);
                            ctx.moveTo(xPos, timeDomainData[i] * 0.5);
                            xPos += 1;
                        }
                        ctx.strokeStyle = "white";
                        ctx.stroke();
                        ctx.closePath();
                        lowFreqAverage = lowFreqValues/lowFreqAmount;
                        lowFreqValues = 0;

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "white";
                        ctx.stroke();

                        // Bar graph
                        ctx.restore();
                        ctx.save();
                        ctx.translate(512, 320);

                        var xPos = -512;
                        var opacity;
                        for (var i = 0; i < validValues.length ; i++) {
                            if (i < lowFreqAmount) {
                                lowFreqValues += validValues[i];
                            }

                            // Draw upper bars
                            ctx.beginPath();
                            ctx.setLineDash([]);
                            ctx.moveTo(xPos, 0);
                            ctx.lineTo(xPos, validValues[i] * -0.5);

                            // Determine opacity
                            if (i > (validValues.length / 2)) {
                               opacity = 0.1 + (1.0 - (i / validValues.length));
                            } else {
                                opacity = 0.1 + (i / validValues.length);
                            }

                            ctx.shadowColor = "#BAC799";
                            ctx.shadowBlur = 5;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            ctx.strokeStyle = "rgba(250, 250, 223, " + opacity + ")";
                            ctx.lineWidth = 1024/validValues.length;
                            ctx.stroke();
                            ctx.closePath();

                            // Draw lower bars
                            ctx.shadowBlur = 0;
                            ctx.beginPath();
                            ctx.moveTo(xPos, 0);
                            ctx.lineTo(xPos, validValues[i] * 0.3);
                            var gradient = ctx.createLinearGradient(xPos, 0, xPos, validValues[i] * 0.3);
                            gradient.addColorStop(0, "rgba(250, 250, 223, " + opacity + ")");
                            gradient.addColorStop(1, "rgba(250, 250, 223, 0)");
                            ctx.strokeStyle = gradient;
                            ctx.stroke();
                            ctx.closePath();

                            xPos += 1024/validValues.length;
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