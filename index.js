/* globals CSInterface, cep, SystemPath */
'use strict';

angular.module('codemill.premiere', [])
  .service('cmPremiereService', ['$window', '$q', '$log', 'Premiere', '$timeout',
    function ($window, $q, $log, config, $timeout) {

      var csInterface = new CSInterface();
      var hostAvailable = typeof(csInterface.openURLInDefaultBrowser) !== 'undefined';
      var jobs = {};

      function evalCSScript(script, callback) {
        csInterface.evalScript(script, callback);
      }

      function variableAsString(variable) {
        return variable === undefined ? 'undefined' :
          (variable === null ? 'null' : '\'' + variable + '\'');
      }

      function registerJob(jobID, process) {
        jobs[jobID] = process;
      }

      function unregisterJob(jobID) {
        delete jobs[jobID];
      }

      if (hostAvailable) {
        csInterface.addEventListener('io.wipster.ppro.RenderEvent', function (event) {
          var jobID = event.data.jobID;
          if (jobID in jobs) {
            var deferred = jobs[jobID];
            switch (event.data.type) {
              case 'error':
                $log.error('Failed rendering sequence', event.data.error);
                deferred.reject('Failed rendering sequence');
                unregisterJob(jobID);
                break;
              case 'progress':
                deferred.notify(event.data.progress * 100);
                break;
              case 'complete':
                $log.info('File from host: ', event.data.outputFilePath);
                deferred.resolve(event.data.outputFilePath);
                unregisterJob(jobID);
                break;
            }
          }
        });
      }

      this.openURLInDefaultBrowser = function (url) {
        if (hostAvailable) {
          csInterface.openURLInDefaultBrowser(url);
        } else {
          $window.open(url);
        }
      };

      var pathSeparator = function () {
        var OSVersion = csInterface.getOSInformation();
        if (OSVersion.indexOf('Mac') >= 0) {
          return '/';
        } else {
          return '\\';
        }
      };

      var getOutputDirectory = function (dirName) {
        var base = null;
        if (hostAvailable) {
          base = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS) + pathSeparator();
        } else {
          base = '/tmp/';
        }
        var dir = base + dirName;
        if (hostAvailable) {
          cep.fs.makedir(dir);
          dir += pathSeparator();
        } else {
          dir += '/';
        }
        $log.info('Directory ' + dir);
        return dir;
      };

      var checkActiveSequenceAndRun = function (script, deferred, callback) {
        evalCSScript('getActiveSequence()', function (sequence) {
          var seq = JSON.parse(sequence);
          if (seq.id === null || seq.id === undefined) {
            deferred.reject('No active sequence');
          } else {
            evalCSScript(script, callback);
          }
        });
      };

      this.renderActiveSequence = function (dirName) {
        var deferred = $q.defer();
        var outputPath = getOutputDirectory(dirName);
        if (!hostAvailable) {
          var iteration = 0;
          var iterationFunc = function () {
            if (iteration >= 10) {
              deferred.resolve(outputPath + 'test.mp4');
            } else {
              deferred.notify(iteration * 10);
              iteration += 1;
              $timeout(iterationFunc, 250);
            }
          };
          $timeout(iterationFunc, 250);
        } else {
          checkActiveSequenceAndRun(
            'renderSequence(' + variableAsString(config.preset) + ', ' + variableAsString(outputPath) + ')',
            deferred,
            function (jobID) {
              registerJob(jobID, deferred);
            });
        }
        return deferred.promise;
      };

      this.clearSequenceMarkers = function () {
        var deferred = $q.defer();
        if (hostAvailable) {
          checkActiveSequenceAndRun('clearSequenceMarkers()', deferred, function () {
            deferred.resolve();
          });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      this.createSequenceMarkers = function (markers) {
        var deferred = $q.defer();
        if (hostAvailable) {
          checkActiveSequenceAndRun(
            'createSequenceMarkers(' + variableAsString(JSON.stringify(markers)) + ')',
            deferred,
            function () {
              deferred.resolve();
            });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      var guid = function () {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      };

      this.getActiveSequence = function () {
        var deferred = $q.defer();
        if (hostAvailable) {
          evalCSScript('getActiveSequence()', function (sequence) {
            deferred.resolve(JSON.parse(sequence));
          });
        } else {
          deferred.resolve({
            'id': guid(),
            'name': 'Sequence name'
          });
        }
        return deferred.promise;
      };

      this.isHostAvailable = function () {
        return hostAvailable;
      };

    }]);
