describe('codemill.premiere.cmPremiereService', function () {

  var service, exceptionHandler, scope;
  var openURLInDefaultBrowser = jasmine.createSpy('openURLInDefaultBrowser');
  var eventCallback = null, evalCallback = null;
  var evalScriptStr = null;
  var config = {};

  beforeEach(module('codemill.premiere'));

  beforeEach(module(function ($provide) {
    config = {};
    $provide.value('Premiere', config);

    CSInterface = function () {
      this.openURLInDefaultBrowser = openURLInDefaultBrowser;

      this.getOSInformation = function () {
        return "Mac";
      };

      this.getSystemPath = function (type) {
        return "/tmp/" + type;
      };

      this.addEventListener = function (type, callback) {
        eventCallback = callback;
      };

      this.evalScript = function (script, callback) {
        evalScriptStr = script;
        evalCallback = callback;
      }
    };

    SystemPath = {
      MY_DOCUMENTS: 'MY_DOCUMENTS',
      EXTENSION: 'EXTENSION',
      USER_DATA: 'USER_DATA'
    };

    cep = {
      fs: {
        makedir: jasmine.createSpy('makedir')
      }
    };

  }));

  beforeEach(module(function ($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function (_cmPremiereService_, $exceptionHandler, _$rootScope_) {
    service = _cmPremiereService_;
    exceptionHandler = $exceptionHandler;
    scope = _$rootScope_;
  }));

  var defaultRenderConfig = {output: {filePath: 'Test'}};

  var result = function (data) {
    var call = evalCallback;
    if (call !== null) {
      evalCallback = null;
      call(JSON.stringify(data));
    }
  };

  var event = function (data) {
    if (eventCallback !== null) {
      eventCallback({data: data});
    }
  };

  var goodSequence = function () {
    result({"id": "1234", "name": "Test sequence name"});
  };

  var badSequence = function () {
    result({"id": null, "name": null});
  };

  it('should be initialized', function () {
    expect(!!service).toBe(true);
    expect(service.isHostAvailable()).toBe(true);
  });

  // openURLInDefaultBrowser
  it('openURLInDefaultBrowser tries to launch url in $window', function () {
    service.openURLInDefaultBrowser('http://test.com');
    expect(openURLInDefaultBrowser).toHaveBeenCalledWith('http://test.com');
  });

  // getActiveSequence
  it('getActiveSequence should match return value from callback', function () {
    var handler = jasmine.createSpy('success');
    service.getActiveSequence().then(handler);
    goodSequence();
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(handler.calls.mostRecent().args[0].name).toBe('Test sequence name');
    expect(handler.calls.mostRecent().args[0].id).toBe('1234');
  });

  // clearSequenceMarkers
  it('clearSequenceMarkers should resolve for good sequence', function () {
    var handler = jasmine.createSpy('success');
    service.clearSequenceMarkers().then(handler);
    goodSequence();
    result(); // to return clear marker result
    scope.$digest();
    expect(handler).toHaveBeenCalled();
  });

  it('clearSequenceMarkers should reject for bad sequence', function () {
    var handler = jasmine.createSpy('success');
    var error = jasmine.createSpy('error');
    service.clearSequenceMarkers().then(handler).catch(error);
    badSequence();
    scope.$digest();
    expect(handler).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  // createSequenceMarkers
  it('createSequenceMarkers should resolve for good sequence', function () {
    var handler = jasmine.createSpy('success');
    service.createSequenceMarkers([]).then(handler);
    goodSequence();
    result(); // to return create marker result
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(evalScriptStr).toBe('createSequenceMarkers(\'' + JSON.stringify([]) + '\')');
  });

  it('createSequenceMarkers should have marker parameter set correctly', function () {
    var handler = jasmine.createSpy('success');
    var markers = [
      {
        comment: 'Test comment',
        name: 'Test user',
        in: 0.0,
        out: 5.0
      }
    ];
    service.createSequenceMarkers(markers).then(handler);
    goodSequence();
    result(); // to return create marker result
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(evalScriptStr).toBe('createSequenceMarkers(\'' + JSON.stringify(markers) + '\')');
  });

  it('createSequenceMarkers should reject for bad sequence', function () {
    var handler = jasmine.createSpy('success');
    var error = jasmine.createSpy('error');
    service.createSequenceMarkers().then(handler).catch(error);
    badSequence();
    scope.$digest();
    expect(handler).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  // renderActiveSequence
  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: 'Test',
        pathType: 'documents'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: 'Test',
        pathType: 'extension'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/EXTENSION/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/EXTENSION/Test/');
    expect(success).toHaveBeenCalledWith('/tmp/EXTENSION/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: 'Test',
        pathType: 'userdata'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/USER_DATA/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/USER_DATA/Test/');
    expect(success).toHaveBeenCalledWith('/tmp/USER_DATA/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: '/test/Test/',
        pathType: 'full'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/test/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/test/Test/');
    expect(success).toHaveBeenCalledWith('/test/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: '/preset/Test.epr', pathType: 'full', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('/preset/Test.epr');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set to null should not send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {pathType : 'null'}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('null');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test.epr');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'documents', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test.epr');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'extension', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('/tmp/EXTENSION/Test.epr');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'userdata', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(evalScriptStr).toContain('/tmp/USER_DATA/Test.epr');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

  it('renderActiveSequence should reject for no active sequence', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    var error = jasmine.createSpy('error');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify).catch(error);
    badSequence();
    scope.$digest();
    expect(success).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  it('renderActiveSequence should reject if render fails', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    var error = jasmine.createSpy('error');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify).catch(error);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'error', error: 'Bad stuff'});
    scope.$digest();
    expect(success).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Failed rendering sequence');
  });

  it('renderActiveSequence should call notify for progress events', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify);
    goodSequence();
    result(12);
    event({jobID: 12, type: 'progress', progress: 0.1});
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/MY_DOCUMENTS/Test/test.mp4'});
    scope.$digest();
    expect(notify).toHaveBeenCalledWith(10);
    expect(evalScriptStr).toContain('/tmp/MY_DOCUMENTS/Test/');
    expect(success).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/Test/test.mp4');
  });

});
