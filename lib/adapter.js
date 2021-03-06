import Jasmine from 'jasmine'
import JasmineReporter from './reporter'
import { runInFiberContext, wrapCommands, executeHooksWithArgs } from 'wdio-sync'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}

const DEFAULT_TIMEOUT_INTERVAL = 60000

/**
 * Jasmine 2.x runner
 */
class JasmineAdapter {
    constructor (cid, config, specs = [], capabilities = {}) {
        this.cid = cid
        this.capabilities = capabilities
        this.specs = specs
        this.config = Object.assign({
            jasmineNodeOpts: {}
        }, config)
        this.jrunner = {}
        this.reporter = new JasmineReporter(this.cid, this.capabilities, this.specs)
    }

    async run () {
        let self = this

        this.jrunner = new Jasmine()
        let jasmine = this.jrunner.jasmine

        this.jrunner.projectBaseDir = ''
        this.jrunner.specDir = ''
        this.jrunner.addSpecFiles(this.specs)
        this.context = {}

        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.getDefaultInterval()
        jasmine.getEnv().addReporter(this.reporter)
        // jasmine.getEnv().throwOnExpectationFailure(true)

        /**
         * Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert
         */
        jasmine.getEnv().specFilter = (spec) => {
            let grepMatch = this.getGrepMatch(spec)
            let invertGrep = !!this.config.jasmineNodeOpts.invertGrep
            if (grepMatch === invertGrep) {
                spec.pend()
            }
            return true
        }

        /**
         * enable expectHandler
         */
        jasmine.Spec.prototype.addExpectationResult = this.getExpectationResultHandler(jasmine)

        /**
         * patch jasmine to support promises
         */
        INTERFACES['bdd'].forEach((fnName) => {
            const origFn = global[fnName]
            global[fnName] = (...args) => {
                const retryCnt = typeof args[args.length - 1] === 'number' ? args.pop() : 0
                const specFn = typeof args[0] === 'function' ? args.shift() : (typeof args[1] === 'function' ? args.pop() : undefined)
                const specTitle = args[0]
                const patchedOrigFn = function (done) {
                    // specFn will be replaced by wdio-sync and will always return a promise
                    return specFn.call(this).then(() => done(), (e) => done.fail(e))
                }
                const newArgs = [specTitle, patchedOrigFn, retryCnt].filter(a => Boolean(a))

                if (!specFn) {
                    return origFn(specTitle)
                }
                return origFn.apply(this, newArgs)
            }
        })

        /**
         * wrap commands with wdio-sync
         */
        wrapCommands(global.browser, this.config.beforeCommand, this.config.afterCommand)
        INTERFACES['bdd'].forEach((fnName) => runInFiberContext(
            ['it', 'fit'],
            this.config.beforeHook,
            this.config.afterHook,
            this.wrapRunHook(this.beforeRun, 'beforeRun'),
            this.wrapRunHook(this.afterRun, 'afterRun'),
            this.wrapRunHook(this.runErrored, 'runErrored'),
            fnName
        ))

        /**
         * for a clean stdout we need to avoid that Jasmine initialises the
         * default reporter
         */
        Jasmine.prototype.configureDefaultReporter = () => {}

        /**
         * wrap Suite and Spec prototypes to get access to their data
         */
        let beforeAllMock = jasmine.Suite.prototype.beforeAll
        jasmine.Suite.prototype.beforeAll = function (...args) {
            self.lastSpec = this.result
            beforeAllMock.apply(this, args)
        }
        let executeMock = jasmine.Spec.prototype.execute
        jasmine.Spec.prototype.execute = function (...args) {
            self.context = { tries: 0, numBefore: 0, numAfter: 0, errored: false }
            self.lastTest = this.result
            self.lastTest.start = new Date().getTime()
            executeMock.apply(this, args)
        }

        await executeHooksWithArgs(this.config.before, [this.capabilities, this.specs])
        let result = await new Promise((resolve) => {
            this.jrunner.env.beforeAll(this.wrapHook('beforeSuite'))
            this.jrunner.env.beforeEach(this.wrapHook('beforeTest'))
            this.jrunner.env.afterEach(this.wrapAfterTestHook())
            this.jrunner.env.afterAll(this.wrapHook('afterSuite'))

            this.jrunner.onComplete(() => resolve(this.reporter.getFailedCount()))
            this.jrunner.execute()
        })

        await executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs])
        return result
    }

    beforeRun (params) {
        params.context.numBefore = params.numFailedExpectations
    }

    afterRun (params) {
        params.context.numAfter = params.numFailedExpectations
        return {
            expectationFailedOnRun: params.context.numAfter !== params.context.numBefore
        }
    }

    runErrored (params) {
        params.context.errored = true
    }

    wrapAfterTestHook () {
        return (done) => executeHooksWithArgs(
            this.config['afterTest'],
            this.applyAndPrepareMessage()
        ).then(() => done(), (e) => {
            console.log(`Error in ${'afterTest'} hook: ${e.stack.slice(7)}`)
            done()
        })
    }

    applyAndPrepareMessage () {
        if (this.context.tries > 1 && !this.context.errored && this.lastTest.failedExpectations.length > 0 && this.context.numBefore === this.context.numAfter) {
            console.log('Success on try number ' + this.context.tries)
            this.lastTest.failedExpectations = []
            this.lastTest.passed = true
        }

        return this.prepareMessage('afterTest')
    }

    wrapRunHook (hookFn, hookName) {
        return () => executeHooksWithArgs(
            hookFn,
            this.prepareMessage(hookName)
        )
    }

    /**
     * Hooks which are added as true Mocha hooks need to call done() to notify async
     */
    wrapHook (hookName) {
        return (done) => executeHooksWithArgs(
            this.config[hookName],
            this.prepareMessage(hookName)
        ).then(() => done(), (e) => {
            console.log(`Error in ${hookName} hook: ${e.stack.slice(7)}`)
            done()
        })
    }

    prepareMessage (hookName) {
        const params = { type: hookName }

        switch (hookName) {
        case 'beforeSuite':
        case 'afterSuite':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastSpec)
            break
        case 'beforeTest':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest)
            break
        case 'afterTest':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest, { context: this.context })
            break
        case 'beforeRun':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest, { context: this.context })
            break
        case 'afterRun':
            this.context.tries++
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest, { context: this.context })
            break
        case 'runErrored':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest, { context: this.context })
            break
        }
        return this.formatMessage(params)
    }

    formatMessage (params) {
        let message = {
            type: params.type
        }

        if (params.err) {
            message.err = {
                message: params.err.message,
                stack: params.err.stack
            }
        }

        if (params.payload) {
            message.title = params.payload.description
            message.fullName = params.payload.fullName || null
            message.file = params.payload.file

            if (params.payload.type && params.payload.type === 'test') {
                message.parent = this.lastSpec.description
                message.passed = params.payload.failedExpectations.length === 0
            }

            if (params.type === 'beforeRun' || params.type === 'afterRun' || params.type === 'runErrored') {
                message.numFailedExpectations = params.payload.failedExpectations.length
                message.context = params.payload.context
            }

            if (params.type === 'afterTest') {
                message.duration = new Date().getTime() - params.payload.start
            }

            if (typeof params.payload.duration === 'number') {
                message.duration = params.payload.duration
            }
        }

        return message
    }

    getDefaultInterval () {
        let { jasmineNodeOpts } = this.config
        if (jasmineNodeOpts.defaultTimeoutInterval) {
            return jasmineNodeOpts.defaultTimeoutInterval
        }

        return DEFAULT_TIMEOUT_INTERVAL
    }

    getGrepMatch (spec) {
        let { grep } = this.config.jasmineNodeOpts
        return !grep || spec.getFullName().match(new RegExp(grep)) !== null
    }

    getExpectationResultHandler (jasmine) {
        let { jasmineNodeOpts } = this.config
        const origHandler = jasmine.Spec.prototype.addExpectationResult

        if (typeof jasmineNodeOpts.expectationResultHandler !== 'function') {
            return origHandler
        }

        return this.expectationResultHandler(origHandler)
    }

    expectationResultHandler (origHandler) {
        let { expectationResultHandler } = this.config.jasmineNodeOpts
        return function (passed, data) {
            try {
                expectationResultHandler.call(global.browser, passed, data)
            } catch (e) {
                /**
                 * propagate expectationResultHandler error if actual assertion passed
                 */
                if (passed) {
                    passed = false
                    data = {
                        passed: false,
                        message: 'expectationResultHandlerError: ' + e.message
                    }
                }
            }

            return origHandler.call(this, passed, data)
        }
    }
}

const _JasmineAdapter = JasmineAdapter
const adapterFactory = {}

adapterFactory.run = async function (cid, config, specs, capabilities) {
    const adapter = new _JasmineAdapter(cid, config, specs, capabilities)
    return await adapter.run()
}

export default adapterFactory
export { JasmineAdapter, adapterFactory }
