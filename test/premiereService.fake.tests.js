describe('codemill.premiere.cmPremiereService', function () {

  var service, exceptionHandler, scope, open, $timeout;
  var config = {};

  beforeEach(module('codemill.premiere'));

  beforeEach(module(function ($provide) {
    config = {};
    $provide.value('Premiere', config);
    open = jasmine.createSpy('open');
    $provide.value('$window', {
      open: open
    });
    CSInterface = function() {}
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
    expect(service.isHostAvailable()).toBe(false);
  });

  // getActiveSequence
  it('getActiveSequence should return fake sequence', function () {
    var handler = jasmine.createSpy('success');
    service.getActiveSequence().then(handler);
    scope.$digest();
    expect(handler).toHaveBeenCalled();
    expect(handler.calls.mostRecent().args[0].name).toBe('Sequence name');
    expect(handler.calls.mostRecent().args[0].id).toBeDefined();
  });

  // openURLInDefaultBrowser
  it('openURLInDefaultBrowser tries to launch url in $window', function () {
    service.openURLInDefaultBrowser('http://test.com');
    expect(open).toHaveBeenCalledWith('http://test.com');
  });

  // clearSequenceMarkers
  it('clearSequenceMarkers should just resolve', function () {
    var handler = jasmine.createSpy('success');
    service.clearSequenceMarkers().then(handler);
    scope.$digest();
    expect(handler).toHaveBeenCalled();
  });

  // createSequenceMarkers
  it('createSequenceMarkers should just resolve', function () {
    var handler = jasmine.createSpy('success');
    service.createSequenceMarkers([]).then(handler);
    scope.$digest();
    expect(handler).toHaveBeenCalled();
  });

  // renderActiveSequence
  it('renderActiveSequence should resolve with correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(null, 'Test').then(success).finally(null, notify);
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
    expect(success).toHaveBeenCalledWith('/tmp/Test/test.mp4');
  });

  it('renderActiveSequence with full output path set should return correct filename', function() {
    var success = jasmine.createSpy('success');
    var notify = jasmine.createSpy('notify');
    service.renderActiveSequence(null, '/test/Test/', false).then(success).finally(null, notify);
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
});
