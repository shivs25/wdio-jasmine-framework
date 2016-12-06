'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _jasmine = require('jasmine');

var _jasmine2 = _interopRequireDefault(_jasmine);

var _reporter = require('./reporter');

var _reporter2 = _interopRequireDefault(_reporter);

var _wdioSync = require('wdio-sync');

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
var Jasmine = _jasmine2['default'];

__$Getters__['Jasmine'] = function () {
    return Jasmine;
};

__$Setters__['Jasmine'] = function (value) {
    Jasmine = value;
};

__$Resetters__['Jasmine'] = function () {
    Jasmine = _jasmine2['default'];
};

var JasmineReporter = _reporter2['default'];

__$Getters__['JasmineReporter'] = function () {
    return JasmineReporter;
};

__$Setters__['JasmineReporter'] = function (value) {
    JasmineReporter = value;
};

__$Resetters__['JasmineReporter'] = function () {
    JasmineReporter = _reporter2['default'];
};

var runInFiberContext = _wdioSync.runInFiberContext;
var wrapCommands = _wdioSync.wrapCommands;
var executeHooksWithArgs = _wdioSync.executeHooksWithArgs;

__$Getters__['runInFiberContext'] = function () {
    return runInFiberContext;
};

__$Setters__['runInFiberContext'] = function (value) {
    runInFiberContext = value;
};

__$Resetters__['runInFiberContext'] = function () {
    runInFiberContext = _wdioSync.runInFiberContext;
};

__$Getters__['wrapCommands'] = function () {
    return wrapCommands;
};

__$Setters__['wrapCommands'] = function (value) {
    wrapCommands = value;
};

__$Resetters__['wrapCommands'] = function () {
    wrapCommands = _wdioSync.wrapCommands;
};

__$Getters__['executeHooksWithArgs'] = function () {
    return executeHooksWithArgs;
};

__$Setters__['executeHooksWithArgs'] = function (value) {
    executeHooksWithArgs = value;
};

__$Resetters__['executeHooksWithArgs'] = function () {
    executeHooksWithArgs = _wdioSync.executeHooksWithArgs;
};

var INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
};

var _INTERFACES = INTERFACES;

__$Getters__['INTERFACES'] = function () {
    return INTERFACES;
};

__$Setters__['INTERFACES'] = function (value) {
    INTERFACES = value;
};

__$Resetters__['INTERFACES'] = function () {
    INTERFACES = _INTERFACES;
};

var DEFAULT_TIMEOUT_INTERVAL = 60000;

/**
 * Jasmine 2.x runner
 */
var _DEFAULT_TIMEOUT_INTERVAL = DEFAULT_TIMEOUT_INTERVAL;

__$Getters__['DEFAULT_TIMEOUT_INTERVAL'] = function () {
    return DEFAULT_TIMEOUT_INTERVAL;
};

__$Setters__['DEFAULT_TIMEOUT_INTERVAL'] = function (value) {
    DEFAULT_TIMEOUT_INTERVAL = value;
};

__$Resetters__['DEFAULT_TIMEOUT_INTERVAL'] = function () {
    DEFAULT_TIMEOUT_INTERVAL = _DEFAULT_TIMEOUT_INTERVAL;
};

var JasmineAdapter = (function () {
    function JasmineAdapter(cid, config) {
        var specs = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
        var capabilities = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        _classCallCheck(this, JasmineAdapter);

        this.cid = cid;
        this.capabilities = capabilities;
        this.specs = specs;
        this.config = _Object$assign({
            jasmineNodeOpts: {}
        }, config);
        this.jrunner = {};
        this.reporter = new JasmineReporter(this.cid, this.capabilities, this.specs);
    }

    _createClass(JasmineAdapter, [{
        key: 'run',
        value: function run() {
            var self, jasmine, beforeAllMock, executeMock, result;
            return _regeneratorRuntime.async(function run$(context$2$0) {
                var _this = this;

                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        self = this;

                        this.jrunner = new Jasmine();
                        jasmine = this.jrunner.jasmine;

                        this.jrunner.projectBaseDir = '';
                        this.jrunner.specDir = '';
                        this.jrunner.addSpecFiles(this.specs);
                        this.context = {};

                        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.getDefaultInterval();
                        jasmine.getEnv().addReporter(this.reporter);
                        // jasmine.getEnv().throwOnExpectationFailure(true)

                        /**
                         * Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert
                         */
                        jasmine.getEnv().specFilter = function (spec) {
                            var grepMatch = _this.getGrepMatch(spec);
                            var invertGrep = !!_this.config.jasmineNodeOpts.invertGrep;
                            if (grepMatch === invertGrep) {
                                spec.pend();
                            }
                            return true;
                        };

                        /**
                         * enable expectHandler
                         */
                        jasmine.Spec.prototype.addExpectationResult = this.getExpectationResultHandler(jasmine);

                        /**
                         * patch jasmine to support promises
                         */
                        INTERFACES['bdd'].forEach(function (fnName) {
                            var origFn = global[fnName];
                            global[fnName] = function () {
                                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                                    args[_key] = arguments[_key];
                                }

                                var retryCnt = typeof args[args.length - 1] === 'number' ? args.pop() : 0;
                                var specFn = typeof args[0] === 'function' ? args.shift() : typeof args[1] === 'function' ? args.pop() : undefined;
                                var specTitle = args[0];
                                var patchedOrigFn = function patchedOrigFn(done) {
                                    // specFn will be replaced by wdio-sync and will always return a promise
                                    return specFn.call(this).then(function () {
                                        return done();
                                    }, function (e) {
                                        return done.fail(e);
                                    });
                                };
                                var newArgs = [specTitle, patchedOrigFn, retryCnt].filter(function (a) {
                                    return Boolean(a);
                                });

                                if (!specFn) {
                                    return origFn(specTitle);
                                }
                                return origFn.apply(_this, newArgs);
                            };
                        });

                        /**
                         * wrap commands with wdio-sync
                         */
                        wrapCommands(global.browser, this.config.beforeCommand, this.config.afterCommand);
                        INTERFACES['bdd'].forEach(function (fnName) {
                            return runInFiberContext(['it', 'fit'], _this.config.beforeHook, _this.config.afterHook, _this.wrapRunHook(_this.beforeRun, 'beforeRun'), _this.wrapRunHook(_this.afterRun, 'afterRun'), _this.wrapRunHook(_this.runErrored, 'runErrored'), fnName);
                        });

                        /**
                         * for a clean stdout we need to avoid that Jasmine initialises the
                         * default reporter
                         */
                        Jasmine.prototype.configureDefaultReporter = function () {};

                        /**
                         * wrap Suite and Spec prototypes to get access to their data
                         */
                        beforeAllMock = jasmine.Suite.prototype.beforeAll;

                        jasmine.Suite.prototype.beforeAll = function () {
                            self.lastSpec = this.result;

                            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                                args[_key2] = arguments[_key2];
                            }

                            beforeAllMock.apply(this, args);
                        };
                        executeMock = jasmine.Spec.prototype.execute;

                        jasmine.Spec.prototype.execute = function () {
                            self.context = { tries: 0, numBefore: 0, numAfter: 0, errored: false };
                            self.lastTest = this.result;
                            self.lastTest.start = new Date().getTime();

                            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                                args[_key3] = arguments[_key3];
                            }

                            executeMock.apply(this, args);
                        };

                        context$2$0.next = 21;
                        return _regeneratorRuntime.awrap(executeHooksWithArgs(this.config.before, [this.capabilities, this.specs]));

                    case 21:
                        context$2$0.next = 23;
                        return _regeneratorRuntime.awrap(new _Promise(function (resolve) {
                            _this.jrunner.env.beforeAll(_this.wrapHook('beforeSuite'));
                            _this.jrunner.env.beforeEach(_this.wrapHook('beforeTest'));
                            _this.jrunner.env.afterEach(_this.wrapAfterTestHook());
                            _this.jrunner.env.afterAll(_this.wrapHook('afterSuite'));

                            _this.jrunner.onComplete(function () {
                                return resolve(_this.reporter.getFailedCount());
                            });
                            _this.jrunner.execute();
                        }));

                    case 23:
                        result = context$2$0.sent;
                        context$2$0.next = 26;
                        return _regeneratorRuntime.awrap(executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs]));

                    case 26:
                        return context$2$0.abrupt('return', result);

                    case 27:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'beforeRun',
        value: function beforeRun(params) {
            params.context.numBefore = params.numFailedExpectations;
        }
    }, {
        key: 'afterRun',
        value: function afterRun(params) {
            params.context.numAfter = params.numFailedExpectations;
            return {
                expectationFailedOnRun: params.context.numAfter !== params.context.numBefore
            };
        }
    }, {
        key: 'runErrored',
        value: function runErrored(params) {
            params.context.errored = true;
        }
    }, {
        key: 'wrapAfterTestHook',
        value: function wrapAfterTestHook() {
            var _this2 = this;

            return function (done) {
                return executeHooksWithArgs(_this2.config['afterTest'], _this2.applyAndPrepareMessage()).then(function () {
                    return done();
                }, function (e) {
                    console.log('Error in ' + 'afterTest' + ' hook: ' + e.stack.slice(7));
                    done();
                });
            };
        }
    }, {
        key: 'applyAndPrepareMessage',
        value: function applyAndPrepareMessage() {
            if (this.context.tries > 1 && !this.context.errored && this.lastTest.failedExpectations.length > 0 && this.context.numBefore === this.context.numAfter) {
                console.log('Success on try number ' + this.context.tries);
                this.lastTest.failedExpectations = [];
                this.lastTest.passed = true;
            }

            return this.prepareMessage('afterTest');
        }
    }, {
        key: 'wrapRunHook',
        value: function wrapRunHook(hookFn, hookName) {
            var _this3 = this;

            return function () {
                return executeHooksWithArgs(hookFn, _this3.prepareMessage(hookName));
            };
        }

        /**
         * Hooks which are added as true Mocha hooks need to call done() to notify async
         */
    }, {
        key: 'wrapHook',
        value: function wrapHook(hookName) {
            var _this4 = this;

            return function (done) {
                return executeHooksWithArgs(_this4.config[hookName], _this4.prepareMessage(hookName)).then(function () {
                    return done();
                }, function (e) {
                    console.log('Error in ' + hookName + ' hook: ' + e.stack.slice(7));
                    done();
                });
            };
        }
    }, {
        key: 'prepareMessage',
        value: function prepareMessage(hookName) {
            var params = { type: hookName };

            switch (hookName) {
                case 'beforeSuite':
                case 'afterSuite':
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastSpec);
                    break;
                case 'beforeTest':
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastTest);
                    break;
                case 'afterTest':
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastTest, { context: this.context });
                    break;
                case 'beforeRun':
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastTest, { context: this.context });
                    break;
                case 'afterRun':
                    this.context.tries++;
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastTest, { context: this.context });
                    break;
                case 'runErrored':
                    params.payload = _Object$assign({
                        file: this.jrunner.specFiles[0]
                    }, this.lastTest, { context: this.context });
                    break;
            }
            return this.formatMessage(params);
        }
    }, {
        key: 'formatMessage',
        value: function formatMessage(params) {
            var message = {
                type: params.type
            };

            if (params.err) {
                message.err = {
                    message: params.err.message,
                    stack: params.err.stack
                };
            }

            if (params.payload) {
                message.title = params.payload.description;
                message.fullName = params.payload.fullName || null;
                message.file = params.payload.file;

                if (params.payload.type && params.payload.type === 'test') {
                    message.parent = this.lastSpec.description;
                    message.passed = params.payload.failedExpectations.length === 0;
                }

                if (params.type === 'beforeRun' || params.type === 'afterRun' || params.type === 'runErrored') {
                    message.numFailedExpectations = params.payload.failedExpectations.length;
                    message.context = params.payload.context;
                }

                if (params.type === 'afterTest') {
                    message.duration = new Date().getTime() - params.payload.start;
                }

                if (typeof params.payload.duration === 'number') {
                    message.duration = params.payload.duration;
                }
            }

            return message;
        }
    }, {
        key: 'getDefaultInterval',
        value: function getDefaultInterval() {
            var jasmineNodeOpts = this.config.jasmineNodeOpts;

            if (jasmineNodeOpts.defaultTimeoutInterval) {
                return jasmineNodeOpts.defaultTimeoutInterval;
            }

            return DEFAULT_TIMEOUT_INTERVAL;
        }
    }, {
        key: 'getGrepMatch',
        value: function getGrepMatch(spec) {
            var grep = this.config.jasmineNodeOpts.grep;

            return !grep || spec.getFullName().match(new RegExp(grep)) !== null;
        }
    }, {
        key: 'getExpectationResultHandler',
        value: function getExpectationResultHandler(jasmine) {
            var jasmineNodeOpts = this.config.jasmineNodeOpts;

            var origHandler = jasmine.Spec.prototype.addExpectationResult;

            if (typeof jasmineNodeOpts.expectationResultHandler !== 'function') {
                return origHandler;
            }

            return this.expectationResultHandler(origHandler);
        }
    }, {
        key: 'expectationResultHandler',
        value: function expectationResultHandler(origHandler) {
            var expectationResultHandler = this.config.jasmineNodeOpts.expectationResultHandler;

            return function (passed, data) {
                try {
                    expectationResultHandler.call(global.browser, passed, data);
                } catch (e) {
                    /**
                     * propagate expectationResultHandler error if actual assertion passed
                     */
                    if (passed) {
                        passed = false;
                        data = {
                            passed: false,
                            message: 'expectationResultHandlerError: ' + e.message
                        };
                    }
                }

                return origHandler.call(this, passed, data);
            };
        }
    }]);

    return JasmineAdapter;
})();

var _JasmineAdapter = JasmineAdapter;
var _JasmineAdapter2 = _JasmineAdapter;

__$Getters__['_JasmineAdapter'] = function () {
    return _JasmineAdapter;
};

__$Setters__['_JasmineAdapter'] = function (value) {
    _JasmineAdapter = value;
};

__$Resetters__['_JasmineAdapter'] = function () {
    _JasmineAdapter = _JasmineAdapter2;
};

var adapterFactory = {};

var _adapterFactory = adapterFactory;

__$Getters__['adapterFactory'] = function () {
    return adapterFactory;
};

__$Setters__['adapterFactory'] = function (value) {
    exports.adapterFactory = adapterFactory = value;
};

__$Resetters__['adapterFactory'] = function () {
    exports.adapterFactory = adapterFactory = _adapterFactory;
};

adapterFactory.run = function callee$0$0(cid, config, specs, capabilities) {
    var adapter;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                adapter = new _JasmineAdapter(cid, config, specs, capabilities);
                context$1$0.next = 3;
                return _regeneratorRuntime.awrap(adapter.run());

            case 3:
                return context$1$0.abrupt('return', context$1$0.sent);

            case 4:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

var _defaultExport = adapterFactory;

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
exports.JasmineAdapter = JasmineAdapter;
exports.adapterFactory = adapterFactory;
exports.__GetDependency__ = __GetDependency__;
exports.__get__ = __GetDependency__;
exports.__Rewire__ = __Rewire__;
exports.__set__ = __Rewire__;
exports.__ResetDependency__ = __ResetDependency__;
exports.__RewireAPI__ = __RewireAPI__;
