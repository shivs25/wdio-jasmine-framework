'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
var __$Getters__ = [];
var __$Setters__ = [];
var __$Resetters__ = [];

function __GetDependency__(name) {
    return __$Getters__[name]();
}

function __Rewire__(name, value) {
    __$Setters__[name](value);
}

function __ResetDependency__(name) {
    __$Resetters__[name]();
}

var __RewireAPI__ = {
    '__GetDependency__': __GetDependency__,
    '__get__': __GetDependency__,
    '__Rewire__': __Rewire__,
    '__set__': __Rewire__,
    '__ResetDependency__': __ResetDependency__
};

var JasmineReporter = (function () {
    function JasmineReporter(cid, capabilities, specs) {
        _classCallCheck(this, JasmineReporter);

        this._cid = cid;
        this._capabilities = capabilities;
        this._specs = specs;
        this._parent = [];
        this._failedCount = 0;
    }

    _createClass(JasmineReporter, [{
        key: 'suiteStarted',
        value: function suiteStarted() {
            var suite = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            this._suiteStart = new Date();
            suite.type = 'suite';
            this.emit('suite:start', suite);
            this._parent.push(suite.description);
        }
    }, {
        key: 'specStarted',
        value: function specStarted() {
            var test = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            this._testStart = new Date();
            test.type = 'test';
            this.emit('test:start', test);
        }
    }, {
        key: 'specDone',
        value: function specDone(test) {
            /**
             * jasmine can't set test pending if async (`pending()` got called)
             * this is a workaround until https://github.com/jasmine/jasmine/issues/937 is resolved
             */
            if (Array.isArray(test.failedExpectations)) {
                test.failedExpectations.forEach(function (e) {
                    if (e.message === 'Failed: => marked Pending') {
                        test.status = 'pending';
                        test.failedExpectations = [];
                    }
                });
            }

            var e = 'test:' + test.status.replace(/ed/, '');
            test.type = 'test';
            test.duration = new Date() - this._testStart;
            this.emit(e, test);
            this._failedCount += test.status === 'failed' ? 1 : 0;
            this.emit('test:end', test);
        }
    }, {
        key: 'suiteDone',
        value: function suiteDone() {
            var suite = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            this._parent.pop();
            suite.type = 'suite';
            suite.duration = new Date() - this._suiteStart;
            this.emit('suite:end', suite);
        }
    }, {
        key: 'emit',
        value: function emit(event, payload) {
            var message = {
                cid: this._cid,
                event: event,
                title: payload.description,
                pending: payload.status === 'pending',
                parent: this._parent.length ? this._parent[this._parent.length - 1] : null,
                type: payload.type,
                file: '',
                err: payload.failedExpectations && payload.failedExpectations.length ? payload.failedExpectations[0] : null,
                duration: payload.duration,
                runner: {},
                specs: this._specs
            };

            message.runner[this._cid] = this._capabilities;
            this.send(message);
        }
    }, {
        key: 'send',
        value: function send() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            process.send.apply(process, args);
        }
    }, {
        key: 'getFailedCount',
        value: function getFailedCount() {
            return this._failedCount;
        }
    }]);

    return JasmineReporter;
})();

var _defaultExport = JasmineReporter;

if (typeof _defaultExport === 'object' || typeof _defaultExport === 'function') {
    Object.defineProperty(_defaultExport, '__Rewire__', {
        'value': __Rewire__,
        'enumberable': false
    });
    Object.defineProperty(_defaultExport, '__set__', {
        'value': __Rewire__,
        'enumberable': false
    });
    Object.defineProperty(_defaultExport, '__ResetDependency__', {
        'value': __ResetDependency__,
        'enumberable': false
    });
    Object.defineProperty(_defaultExport, '__GetDependency__', {
        'value': __GetDependency__,
        'enumberable': false
    });
    Object.defineProperty(_defaultExport, '__get__', {
        'value': __GetDependency__,
        'enumberable': false
    });
    Object.defineProperty(_defaultExport, '__RewireAPI__', {
        'value': __RewireAPI__,
        'enumberable': false
    });
}

exports['default'] = _defaultExport;
exports.__GetDependency__ = __GetDependency__;
exports.__get__ = __GetDependency__;
exports.__Rewire__ = __Rewire__;
exports.__set__ = __Rewire__;
exports.__ResetDependency__ = __ResetDependency__;
exports.__RewireAPI__ = __RewireAPI__;
module.exports = exports['default'];
