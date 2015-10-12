function log(message) {
  var now = new Date();
  var monthValue = now.getMonth() + 1;
  var timeFormat = now.getFullYear() + "/" + monthValue + "/" + now.getDate() + "-" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

  var logFile = new File("/tmp/ppro.txt");

  if (!logFile.exists) {
    logFile.open('w');
  } else {
    logFile.open('a');
  }

  var messageToWrite = timeFormat + ": " + message;
  logFile.writeln(messageToWrite);
  logFile.close();
}

function renderSequence(presetPath, outputPath) {
  app.enableQE();
  var jobID = undefined;

  var activeSequence = qe.project.getActiveSequence();
  if (activeSequence != undefined) {
    app.encoder.launchEncoder();

    function onEncoderJobComplete(jobID, outputFilePath) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "io.wipster.ppro.RenderEvent";
      eventObj.data = JSON.stringify({
        'type': 'complete',
        'jobID': jobID,
        'outputFilePath': outputFilePath
      });
      eventObj.dispatch();
    }

    function onEncoderJobError(jobID, errorMessage) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "io.wipster.ppro.RenderEvent";
      eventObj.data = JSON.stringify({
        'type': 'error',
        'jobID': jobID,
        'errorMessage': errorMessage
      });
      eventObj.dispatch();
    }

    function onEncoderJobProgress(jobID, progress) {
      loadPluginLib();
      var eventObj = new CSXSEvent();

      eventObj.type = "io.wipster.ppro.RenderEvent";
      eventObj.data = JSON.stringify({
        'type': 'progress',
        'jobID': jobID,
        'progress': progress
      });
      eventObj.dispatch();
    }

    function onEncoderJobQueued(jobID) {
      app.encoder.startBatch();
    }

    var projPath = new File(app.project.path);
    if (outputPath == undefined) {
      outputPath = Folder.selectDialog("Choose the output directory").fsName;
    }

    if (outputPath != null && projPath.exists) {
      var outputPresetPath = getPresetPath(presetPath);
      var outPreset = new File(outputPresetPath);
      if (outPreset.exists == true) {

        var outputFormatExtension = activeSequence.getExportFileExtension(outPreset.fsName);

        if (outputFormatExtension != null) {
          var fullPathToFile = calculateOutputFilename(outputPath, activeSequence, outputFormatExtension);

          app.encoder.bind('onEncoderJobComplete', onEncoderJobComplete);
          app.encoder.bind('onEncoderJobError', onEncoderJobError);
          app.encoder.bind('onEncoderJobProgress', onEncoderJobProgress);
          app.encoder.bind('onEncoderJobQueued', onEncoderJobQueued);

          // use these 0 or 1 settings to disable some/all metadata creation.

          app.encoder.setSidecarXMPEnabled(0);
          app.encoder.setEmbeddedXMPEnabled(0);

          jobID = app.encoder.encodeSequence(app.project.activeSequence,
            fullPathToFile,
            outPreset.fsName,
            app.encoder.ENCODE_ENTIRE);
          outPreset.close();
        }
      } else {
        alert("Could not find output preset.");
      }
    } else {
      alert("Could not find/create output path.");
    }
    projPath.close();
  }

  return jobID;
}

function getActiveSequence() {
  app.enableQE();
  var activeSequence = qe.project.getActiveSequence();
  var data = {
    'id' : activeSequence.guid,
    'name' : activeSequence.name
  };
  return JSON.stringify(data);
}

function calculateOutputFilename(outputPath, activeSequence, extension) {
  return outputPath + getPathSeparatorByOS() + activeSequence.name + "." + extension;
}

function getPathSeparatorByOS() {
  app.enableQE();
  if (qe === undefined || qe === null || qe.project === undefined || qe.project === null) {
    return;
  }

  if (qe.platform !== undefined && qe.platform === 'Macintosh') {
    return '/';
  } else {
    return '\\';
  }
}

function loadPluginLib() {
  var eoName;
  if (Folder.fs == 'Macintosh') {
    eoName = "PlugPlugExternalObject";
  } else {
    eoName = "PlugPlugExternalObject.dll";
  }

  try {
    new ExternalObject('lib:' + eoName);
  } catch (error) {
    alert(error);
  }
}

function getPresetPath(presetPath) {
  if (presetPath != null) {
    return presetPath;
  }
  if (Folder.fs == 'Macintosh') {
    return "/Applications/Adobe\ Premiere\ Pro\ CC\ 2015/Adobe\ Premiere\ Pro\ CC\ 2015.app/Contents/MediaIO/systempresets/58444341_4d584658/XDCAMHD\ 50\ NTSC\ 60i.epr";
  } else {
    return "C:\\Program Files\\Adobe\\Adobe Media Encoder CC 2015\\MediaIO\\systempresets\\58444341_4d584658\\XDCAMHD 50 NTSC 60i.epr";
  }
}

function clearSequenceMarkers() {
  if (app.project.activeSequence != undefined) {
    var ms = [];
    var markers = app.project.activeSequence.markers;
    for(var current_marker = 	markers.getFirstMarker();
        current_marker !=	undefined;
        current_marker =	markers.getNextMarker(current_marker)){
      ms.push(current_marker);
    }
    for (var i = 0; i < ms.length; i++) {
      markers.deleteMarker(ms[i]);
    }
  }
}

function createSequenceMarkers(inMarkers) {
  var markers = JSON.parse(inMarkers);
  if (app.project.activeSequence != undefined && markers != undefined) {
    var sequenceMarkers = app.project.activeSequence.markers;
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i];
      var newMarker = sequenceMarkers.createMarker(marker.start);
      newMarker.name = marker.name;
      newMarker.comments = marker.comments;
      newMarker.end = marker.end;
    }
  }
}

function getPathAsFile(path) {
  var file = new File(path);
  return file;
}
