describe('codemill.premiere.cmPremiereService', function () {

  var service, exceptionHandler, scope, $q, eventCallback;
  var spy = {
    openURLInDefaultBrowser : null,
    getFilePath : null,
    callCS : null,
    openDirectoryDialog : null,
    registerEventListener : null
  };
  var promise = {};

  var spies = function() {
    for (var f in spy) {
      if (spy.hasOwnProperty(f)) {
        spy[f] = jasmine.createSpy(f);
      }
    }
  };

  function pFake(spy) {
    var deferred = $q.defer();
    spy.and.callFake(function () {
      return deferred.promise;
    });
    return deferred;
  }

  var promises = function() {
    promise.openURLInDefaultBrowser = pFake(spy.openURLInDefaultBrowser);
    promise.callCS = pFake(spy.callCS);
  };

  function pResolve(deferred, data) {
    deferred.resolve(data);
    scope.$apply();
  }

  angular.module('codemill.adobe', []);

  beforeEach(module('codemill.premiere'));

  beforeEach(module(function ($provide) {
    spies();
    spy.getFilePath.and.callFake(function(input) {
      if (input === null || input === undefined) {
        return input;
      }
      if (input.pathType === 'full') {
        return input.filePath;
      }
      if (input.pathType === 'null') {
        return null;
      }
      if (input.pathType === 'undefined') {
        return undefined;
      }
      return '/tmp/' + (input.pathType ? input.pathType : 'documents') + '/' + input.filePath + (input.isFile ? '' : '/');
    });
    eventCallback = undefined;
    spy.registerEventListener.and.callFake(function(id, callback) {
      eventCallback = callback;
    });
    $provide.service('cmAdobeService', function() {
      this.isHostAvailable = function() { return true; };
      this.registerEventListener = spy.registerEventListener;
      this.openURLInDefaultBrowser = spy.openURLInDefaultBrowser;
      this.callCS = spy.callCS;
      this.openDirectoryDialog = spy.openDirectoryDialog;
      this.getFilePath = spy.getFilePath;
    });
  }));

  beforeEach(module(function ($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function (_cmPremiereService_, $exceptionHandler, _$rootScope_, _$q_) {
    service = _cmPremiereService_;
    exceptionHandler = $exceptionHandler;
    scope = _$rootScope_;
    $q = _$q_;
    promises();
  }));

  var defaultRenderConfig = {output: {filePath: 'Test'}};

  var compareObject = function(result, expected) {
    if (expected === null) {
      expect(result).toBeNull();
    } else if (expected === undefined) {
      expect(result).not.toBeDefined();
    } else {
      expect(typeof(result)).toBe(typeof(expected));
      switch (typeof(expected)) {
        case 'object':
          for (var f in expected) {
            if (expected.hasOwnProperty(f)) {
              compareObject(result[f], expected[f]);
            }
          }
          break;
        case 'array':
          expect(result.length).toBe(expected.length);
          for (var i = 0; i < expected.length; i++) {
            compareObject(result[i], expected[i]);
          }
          break;
        default:
          expect(result).toBe(expected);
          break;
      }
    }
  };

  var result = function(method, args, data, isObject, resetPromise) {
    expect(spy.callCS).toHaveBeenCalled();
    expect(spy.callCS.calls.mostRecent().args[0].method).toBe(method);
    compareObject(spy.callCS.calls.mostRecent().args[0].args, args);
    if (isObject) {
      expect(spy.callCS.calls.mostRecent().args[0].returnsObject).toBe(true);
    }
    spy.callCS.calls.reset();
    var p = promise.callCS;
    if (resetPromise) {
      promise.callCS = pFake(spy.callCS);
    }
    pResolve(p, data);
  };

  var goodSequence = function() {
    result('getActiveSequence', undefined, { id : '1234', name : 'Test sequence name' }, true, true);
  };

  var badSequence = function() {
    result('getActiveSequence', undefined, { id : null, name : null }, true, true);
  };

  var event = function(data) {
    if (eventCallback) {
      eventCallback({data: data});
      scope.$digest();
    }
  };

  it('should be initialized', function () {
    expect(!!service).toBe(true);
    expect(spy.registerEventListener).toHaveBeenCalled();
    expect(spy.registerEventListener.calls.argsFor(0)[0]).toBe('se.codemill.ppro.RenderEvent');
    expect(eventCallback).toBeDefined();
  });

  // getActiveSequence
  it('getActiveSequence should match return value from callback', function () {
    var handler = jasmine.createSpy('success');
    service.getActiveSequence().then(handler);
    goodSequence();
    expect(handler).toHaveBeenCalled();
    expect(handler.calls.mostRecent().args[0].name).toBe('Test sequence name');
    expect(handler.calls.mostRecent().args[0].id).toBe('1234');
  });

  // clearSequenceMarkers
  it('clearSequenceMarkers should resolve for good sequence', function () {
    var handler = jasmine.createSpy('success');
    service.clearSequenceMarkers().then(handler);
    goodSequence();
    result('clearSequenceMarkers'); // to return clear marker result
    expect(handler).toHaveBeenCalled();
  });

  it('clearSequenceMarkers should reject for bad sequence', function () {
    var handler = jasmine.createSpy('success');
    var error = jasmine.createSpy('error');
    service.clearSequenceMarkers().then(handler).catch(error);
    badSequence();
    expect(handler).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  // createSequenceMarkers
  it('createSequenceMarkers should resolve for good sequence', function () {
    var handler = jasmine.createSpy('success');
    service.createSequenceMarkers([]).then(handler);
    goodSequence();
    result('createSequenceMarkers', [[]]); // to return create marker result
    expect(handler).toHaveBeenCalled();
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
    result('createSequenceMarkers', [markers]); // to return create marker result
    expect(handler).toHaveBeenCalled();
  });

  it('createSequenceMarkers should reject for bad sequence', function () {
    var handler = jasmine.createSpy('success');
    var error = jasmine.createSpy('error');
    service.createSequenceMarkers().then(handler).catch(error);
    badSequence();
    expect(handler).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  // renderActiveSequence
  it('renderActiveSequence should resolve with correct filename', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [undefined, '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename for documents', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: 'Test',
        pathType: 'documents'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [undefined, '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename for extension', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: 'Test',
        pathType: 'extension'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [undefined, '/tmp/extension/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/extension/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/extension/Test/test.mp4');
  });

  it('renderActiveSequence should resolve with correct filename for full', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {
        filePath: '/test/Test/',
        pathType: 'full'
      }
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [undefined, '/test/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/test/Test/test.mp4'});
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
    result('renderSequence', ['/preset/Test.epr', '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set to null should not send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {pathType : 'null'}
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [null, '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', ['/tmp/documents/Test.epr', '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'documents', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', ['/tmp/documents/Test.epr', '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'extension', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', ['/tmp/extension/Test.epr', '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with preset path set should send preset path to CSInterface', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({
      output: {filePath: 'Test'},
      preset: {filePath: 'Test.epr', pathType: 'userdata', isFile: true}
    }).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', ['/tmp/userdata/Test.epr', '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence should reject for no active sequence', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    var error = jasmine.createSpy('error');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify).catch(error);
    badSequence();
    expect(success).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('No active sequence');
  });

  it('renderActiveSequence should reject if render fails', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    var error = jasmine.createSpy('error');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify).catch(error);
    goodSequence();
    result('renderSequence', [undefined, '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'error', error: 'Bad stuff'});
    expect(success).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Failed rendering sequence');
  });

  it('renderActiveSequence should call notify for progress events', function () {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(defaultRenderConfig).then(success).finally(null, notify);
    goodSequence();
    result('renderSequence', [undefined, '/tmp/documents/Test/'], 12);
    event({jobID: 12, type: 'progress', progress: 0.1});
    event({jobID: 12, type: 'complete', outputFilePath: '/tmp/documents/Test/test.mp4'});
    expect(notify).toHaveBeenCalledWith(10);
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });


});
