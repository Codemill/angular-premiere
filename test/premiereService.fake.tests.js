describe('codemill.premiere.cmPremiereService', function () {

  var service, exceptionHandler, scope, $timeout;

  var spy = {
    openURLInDefaultBrowser : null,
    getFilePath : null,
    callCS : null,
    openDirectoryDialog : null
  };

  var spies = function() {
    for (var f in spy) {
      if (spy.hasOwnProperty(f)) {
        spy[f] = jasmine.createSpy(f);
      }
    }
  };

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
      return '/tmp/' + (input.pathType ? input.pathType : 'documents') + '/' + input.filePath + (input.isFile ? '' : '/');
    });
    $provide.service('cmAdobeService', function() {
      this.isHostAvailable = function() { return false; };
      this.openURLInDefaultBrowser = spy.openURLInDefaultBrowser;
      this.callCS = spy.callCS;
      this.openDirectoryDialog = spy.openDirectoryDialog;
      this.getFilePath = spy.getFilePath;
    });
  }));

  beforeEach(module(function ($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function (_cmPremiereService_, $exceptionHandler, _$rootScope_, _$timeout_) {
    service = _cmPremiereService_;
    exceptionHandler = $exceptionHandler;
    scope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  it('should be initialized', function () {
    expect(!!service).toBe(true);
  });

  // getActiveSequence
  it('getActiveSequence should return fake sequence', function () {
    var handler = jasmine.createSpy('success');
    service.getActiveSequence().then(handler);
    expect(spy.callCS).not.toHaveBeenCalled();
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(handler.calls.mostRecent().args[0].name).toBe('Sequence name');
    expect(handler.calls.mostRecent().args[0].id).toBeDefined();
  });

  // clearSequenceMarkers
  it('clearSequenceMarkers should just resolve', function () {
    var handler = jasmine.createSpy('success');
    service.clearSequenceMarkers().then(handler);
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(spy.callCS).not.toHaveBeenCalled();
  });

  // createSequenceMarkers
  it('createSequenceMarkers should just resolve', function () {
    var handler = jasmine.createSpy('success');
    service.createSequenceMarkers([]).then(handler);
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(spy.callCS).not.toHaveBeenCalled();
  });

  // renderActiveSequence
  it('renderActiveSequence should resolve with correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({ output : { filePath : 'Test' }}).then(success).finally(null, notify);
    scope.$digest();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    expect(notify.calls.count()).toBe(10);
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with full output path set should return correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({ output : { filePath : '/test/Test/', pathType : 'full'}}).then(success).finally(null, notify);
    scope.$digest();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    expect(notify.calls.count()).toBe(10);
    expect(success).toHaveBeenCalledWith('/test/Test/test.mp4');
  });

  it('renderActiveSequence with extension output path set should return correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({ output : { filePath : 'Test', pathType : 'extension'}}).then(success).finally(null, notify);
    scope.$digest();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    expect(notify.calls.count()).toBe(10);
    expect(success).toHaveBeenCalledWith('/tmp/extension/Test/test.mp4');
  });

  it('renderActiveSequence with extension output path set should return correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({ output : { filePath : 'Test', pathType : 'documents'}}).then(success).finally(null, notify);
    scope.$digest();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    expect(notify.calls.count()).toBe(10);
    expect(success).toHaveBeenCalledWith('/tmp/documents/Test/test.mp4');
  });

  it('renderActiveSequence with extension output path set should return correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence({ output : { filePath : 'Test', pathType : 'userdata'}}).then(success).finally(null, notify);
    scope.$digest();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    $timeout.flush();
    expect(notify.calls.count()).toBe(10);
    expect(success).toHaveBeenCalledWith('/tmp/userdata/Test/test.mp4');
  });
});
