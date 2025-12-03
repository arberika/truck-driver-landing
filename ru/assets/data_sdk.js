/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PARENT_RESPONSE_TIMEOUT_MS: () => (/* binding */ PARENT_RESPONSE_TIMEOUT_MS),
/* harmony export */   connectToParent: () => (/* binding */ connectToParent)
/* harmony export */ });
/* harmony import */ var _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _base_result_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _api_error_error_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _comms_promise_with_timeout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6);
/* harmony import */ var _comms_sandbox_comms_base__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _init_message__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(13);
// Copyright 2021 Canva Inc. All Rights Reserved.






const PARENT_RESPONSE_TIMEOUT_MS = 1000;
const MAX_NUM_CONNECTION_ATTEMPTS = 4;
/**
 * connectToParent attaches an event listener to the iFrames window
 * and waits for an 'InitialiseMessage' from the parent page.
 *
 * This should be called *immediately* once the iFrame can execute custom scripts.
 */ async function connectToParent(errorService, parentOrigin, { parent, addEventListener, removeEventListener } = window, clientId) {
    let handshakeTimeout = new _comms_promise_with_timeout__WEBPACK_IMPORTED_MODULE_3__.PromiseWithTimeout(PARENT_RESPONSE_TIMEOUT_MS);
    const messageHandler = ({ ports, data })=>{
        const msg = (0,_init_message__WEBPACK_IMPORTED_MODULE_5__.verifyMessage)(data, 'parent', clientId);
        if (!msg.ok) {
            switch(msg.error){
                case _init_message__WEBPACK_IMPORTED_MODULE_5__.VerifyError.INVALID_SOURCE:
                    errorService.info(msg.error, {
                        errorMessagePrefix: 'failed to verify message',
                        extra: new Map([
                            [
                                'data.source',
                                data?.source
                            ]
                        ])
                    });
                    break;
                case _init_message__WEBPACK_IMPORTED_MODULE_5__.VerifyError.MISSING_DATA:
                case _init_message__WEBPACK_IMPORTED_MODULE_5__.VerifyError.MISSING_SOURCE:
                case _init_message__WEBPACK_IMPORTED_MODULE_5__.VerifyError.UNKNOWN_CLIENT_ID:
                    break;
                default:
                    throw new _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__.UnreachableError(msg.error);
            }
            return;
        }
        if (ports.length !== 1) {
            errorService.error('invalid number of ports received from the parent');
            return;
        }
        const [port] = ports;
        handshakeTimeout.resolve(port);
    };
    addEventListener('message', messageHandler);
    const getPortWithRetry = async ()=>{
        let port;
        const initMessage = (0,_init_message__WEBPACK_IMPORTED_MODULE_5__.createInitialiseMessage)('iframe', clientId);
        parent.postMessage(initMessage, parentOrigin);
        let count = 1;
        while(count <= MAX_NUM_CONNECTION_ATTEMPTS)try {
            port = await handshakeTimeout.promise();
            break;
        } catch (e) {
            // total number of timeout after 4 retries is 10_000 ms
            const timeoutWithBackoffMs = count * PARENT_RESPONSE_TIMEOUT_MS;
            handshakeTimeout = new _comms_promise_with_timeout__WEBPACK_IMPORTED_MODULE_3__.PromiseWithTimeout(timeoutWithBackoffMs);
            parent.postMessage(initMessage, parentOrigin);
            count++;
        }
        if (port == null) throw new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_2__.CanvaError({
            code: 'internal_error',
            message: `Iframe connection timed out after ${MAX_NUM_CONNECTION_ATTEMPTS} retries`
        });
        return port;
    };
    try {
        const port = await getPortWithRetry();
        return _base_result_ts__WEBPACK_IMPORTED_MODULE_1__.Result.Ok(new _comms_sandbox_comms_base__WEBPACK_IMPORTED_MODULE_4__.SandboxCommsBase(port, errorService.createChild('comms'), false));
    } catch (e) {
        return _base_result_ts__WEBPACK_IMPORTED_MODULE_1__.Result.Err(e);
    } finally{
        removeEventListener('message', messageHandler);
    }
}


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Preconditions: () => (/* binding */ Preconditions),
/* harmony export */   UnreachableError: () => (/* binding */ UnreachableError)
/* harmony export */ });
// Copyright 2017 Canva Inc. All Rights Reserved.
/**
 * Helpers for checking method preconditions.
 * See {@link https://github.com/google/guava/wiki/PreconditionsExplained}
 *
 * Take care not to confuse precondition checking with other types of checks!
 * Precondition failures are used to signal that the *caller* has made an error
 * by calling a method at the wrong time ({@link #checkState}), or with invalid
 * arguments ({@link #checkArgument} and/or {@link #checkExists}).
 */ class Preconditions {
    /**
   * Checks a condition of a method argument.
   *
   * @param cond condition
   * @param msg optional message template
   * @param args optional arguments for the message template
   * @throws if `cond` is falsey
    @nocollapse __nocollapse_static_properties_plugin__ */ static checkArgument(cond, msg, ...args) {
        if (!cond) throw new Error(msg == null ? 'invalid argument' : Preconditions.format(msg, ...args));
    }
    /**
   * Checks that an object is in an appropriate state to receive a method call.
   *
   * @param cond condition
   * @param msg message template
   * @param args optional arguments for the message template
   * @throws if `cond` is falsey
    @nocollapse __nocollapse_static_properties_plugin__ */ static checkState(cond, msg, ...args) {
        if (!cond) throw new Error(msg == null ? 'invalid state' : Preconditions.format(msg, ...args));
    }
    /** @nocollapse __nocollapse_static_properties_plugin__ */ static checkEquals(a, b, msg, ...args) {
        if (a !== b) throw new Error(msg == null ? Preconditions.format('{} != {}', Preconditions.stringify(a), Preconditions.stringify(b)) : Preconditions.format(msg, ...args));
    }
    /** Stringifies a data value. */ static stringify(x) {
        if (x == null || typeof x === 'symbol') return String(x);
        else try {
            // `JSON.stringify(o)` can throw if `o` is an object with a circular dependency on itself.
            // Even though `x` has been narrowed to the type `string | number | boolean`, for which
            // `JSON.stringify()` is safe, we take additional caution since `Preconditions` is a base
            // module, and a caller could have lied about the type of `x`.
            return JSON.stringify(x);
        } catch (e) {
            return String(x);
        }
    }
    /** @nocollapse __nocollapse_static_properties_plugin__ */ static checkExists(x, msg, ...args) {
        if (x == null) throw new Error(msg == null ? 'argument is null' : Preconditions.format(msg, ...args));
        return x;
    }
    /**
   * Formats a template by interpolating some arguments for `{}` placeholders.
   *
   * @param template template
   * @param args values to substitute for `{}`s in the template
   */ static format(template, ...args) {
        let i = 0;
        return template.replace(/\{}/g, ()=>i < args.length ? args[i++] : '{}');
    }
}
/**
 * An error reporting that the given value represents an unreachable case.
 *
 * It is intended to mark a branch in control flow that should be unreachable, such as the default
 * case in an exhaustive switch. For example:
 * <pre>
 *   const x: 'A' | 'B' | 'C' = ...;
 *   switch (x) {
 *     case 'A':
 *       ...
 *       break;
 *     case 'B':
 *       ...
 *       break;
 *     case 'C':
 *       ...
 *       break;
 *     default:
 *       throw new UnreachableError(x);
 *   }
 * </pre>
 *
 * The `never` type of the parameter `x` is evidence that the surrounding control flow has exhausted
 * the possible values of a discriminating expression, proving that the branch is unreachable.
 * However, since the statically inferred types are not enforced at runtime, this error should still
 * be thrown, in order to guarantee a diversion of control flow at runtime.
 */ class UnreachableError extends Error {
    /** @param x an unreachable value */ constructor(x){
        super(`unhandled case: ${JSON.stringify(x)}`);
    }
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Result: () => (/* binding */ Result)
/* harmony export */ });
class OkImpl {
    get ok() {
        return true;
    }
    map(f) {
        return new OkImpl(f(this.value));
    }
    mapError() {
        return this;
    }
    constructor(value){
        this.value = value;
    }
}
class ErrImpl {
    get ok() {
        return false;
    }
    map() {
        return this;
    }
    mapError(f) {
        return new ErrImpl(f(this.error));
    }
    constructor(error){
        this.error = error;
    }
}
const Result = {
    Ok: OkFactory,
    Err: ErrFactory
};
function OkFactory(a) {
    return new OkImpl(a);
}
function ErrFactory(x) {
    return new ErrImpl(x);
}


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CanvaError: () => (/* binding */ CanvaErrorClass),
/* harmony export */   CanvaErrorClass: () => (/* binding */ CanvaErrorClass),
/* harmony export */   setAppSandboxErrorCodeMapper: () => (/* binding */ setAppSandboxErrorCodeMapper)
/* harmony export */ });
/* harmony import */ var _utils_error_message_formatter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
// Copyright 2023 Canva Inc. All Rights Reserved.

/**
 * @public
 * An error thrown by the Apps SDK.
 */ class CanvaErrorClass extends Error {
    constructor(opts){
        // Support code running in the Apps Sandbox to map V2 error codes to V1 error codes.
        // Notes:
        //   - *When running in the sandbox* `this.code` is only consumed by third-party apps code. This
        //       is important because Canva code *in the sandbox* would see different error codes
        //       depending on whether the third-party app loaded is v1 or v2.
        //   - In a V2 sandbox, and in host-side code, `appSandboxErrorCodeMapper` is the identity
        //       function (the next line does nothing).
        opts.code = appSandboxErrorCodeMapper(opts.code);
        super((0,_utils_error_message_formatter__WEBPACK_IMPORTED_MODULE_0__.formattedErrorMessage)(opts));
        this.code = opts.code;
        this.name = 'CanvaError';
        this.rawMessage = opts.message;
        Object.setPrototypeOf(this, CanvaErrorClass.prototype);
    }
}
/**
 * Set a mapper for converting ErrorCodes into V1 ErrorCodes for consumption by v1 Apps within the
 * apps sandbox.
 */ function setAppSandboxErrorCodeMapper(mapper) {
    appSandboxErrorCodeMapper = mapper;
}
let appSandboxErrorCodeMapper = (code)=>code;
/**
 * This export only exists so internal Canva consumers throw CanvaError, instead of CanvaErrorClass
 * which reads better.
 */ 


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formattedErrorMessage: () => (/* binding */ formattedErrorMessage)
/* harmony export */ });
const formattedErrorMessage = (opts)=>{
    const maybeFullstop = opts.message.endsWith('.') ? '' : '.';
    return `[${opts.code}]:  ${opts.message}${maybeFullstop}`.trim();
};


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PromiseTimeoutError: () => (/* binding */ PromiseTimeoutError),
/* harmony export */   PromiseWithTimeout: () => (/* binding */ PromiseWithTimeout)
/* harmony export */ });
// Copyright 2023 Canva Inc. All Rights Reserved.
class PromiseTimeoutError extends Error {
    constructor(){
        super('[internal_error] Comms promise timed out.');
    }
}
const REJECT_ON_NEXT_TICK_DELAY_MS = 500;
/**
 * A promise wrapper that automatically rejects after a specified timeout period.
 *
 * This class is designed to handle scenarios where processes may wake up from sleep and
 * cause a storm of delayed timeouts that could incorrectly reject promises when valid
 * responses are actually incoming. To mitigate this, the class uses a two-stage timeout:
 *
 * 1. The main timeout fires after the specified duration
 * 2. A secondary delay (REJECT_ON_NEXT_TICK_DELAY_MS) gives a grace period for legitimate
 *    responses to arrive before actually rejecting the promise
 *
 * The minimum effective timeout is 1 second (2 × REJECT_ON_NEXT_TICK_DELAY_MS = 1000ms).
 *
 * The timeout can be reset to extend the deadline, and the promise can be manually resolved
 * or rejected at any time.
 */ class PromiseWithTimeout {
    /**
   * reset the timeout on the promise
   */ reset(newTimeoutMs) {
        if (newTimeoutMs) this.timeoutMs = newTimeoutMs;
        this.setTimeout();
    }
    resolve(value) {
        clearTimeout(this.timeoutId);
        this.resolveFn(value);
    }
    reject(reason) {
        clearTimeout(this.timeoutId);
        this.rejectFn(reason);
    }
    promise() {
        return this.p;
    }
    rejectOnNextTick() {
        // When computers (or processes) wake up from sleep, there can be a storm of IPC and withheld
        // timeouts. Typically the timeouts, being "client side", will hit the event loop first and
        // cause a reject even though an "ack" or response is actually just about to be sent over IPC.
        // So when a timeout happens, use a short delay before actually rejecting things. If a resolve
        // or reset happens before the delay, then the reject will be cancelled.
        // We don't cater for the process going back to sleep in *this* interval. But the period is much
        // shorter, so it's less likely.
        this.timeoutId = setTimeout(()=>{
            this.rejectFn(new PromiseTimeoutError());
        }, REJECT_ON_NEXT_TICK_DELAY_MS);
    }
    setTimeout() {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(()=>{
            this.rejectOnNextTick();
        }, Math.max(this.timeoutMs - REJECT_ON_NEXT_TICK_DELAY_MS, REJECT_ON_NEXT_TICK_DELAY_MS));
    }
    constructor(timeoutMs){
        this.timeoutMs = timeoutMs;
        this.p = new Promise((resolve, reject)=>{
            this.resolveFn = resolve;
            this.rejectFn = reject;
        });
        this.setTimeout();
    }
}


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SandboxCommsBase: () => (/* binding */ SandboxCommsBase)
/* harmony export */ });
/* harmony import */ var _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _bus_bus__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9);
/* harmony import */ var _request_handler__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);
// Copyright 2022 Canva Inc. All Rights Reserved.




class SandboxCommsBase {
    constructor(port, errorService, reportNonCanvaErrors){
        this.request = (path, payload)=>this.client.request(path, payload);
        this.handle = (path, handler)=>this.requestHandler.handle(path, handler);
        this.addErrorObserver = (observer)=>this.requestHandler.addErrorObserver(observer);
        const handleMessage = (message)=>{
            switch(message.type){
                case 'ack':
                case 'error':
                case 'response':
                    this.client.handleReply(message);
                    return;
                case 'request':
                    this.requestHandler.handleRequest(message);
                    return;
                default:
                    throw new _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__.UnreachableError(message);
            }
        };
        const messenger = new MangleSafeMessageBus(handleMessage, port, errorService.createChild('bus'));
        this.client = new _client__WEBPACK_IMPORTED_MODULE_2__.Client(messenger.sendRequest, errorService.createChild('client'));
        this.requestHandler = new _request_handler__WEBPACK_IMPORTED_MODULE_3__.RequestHandler(messenger, errorService.createChild('requestHandler'), reportNonCanvaErrors);
    }
}
/**
 * MangleSafeMessageBus is a wrapper around MessageBus that ensures Closure Compiler
 * mangling does not impact the actual transmitted message, while still allowing consumers
 * and producers on both ends to use mangled names.
 */ class MangleSafeMessageBus {
    sendResponse(requestId, payload) {
        return this.bus.send({
            ['type']: 'response',
            ['requestId']: requestId,
            ['payload']: payload
        });
    }
    sendError(requestId, code, message) {
        return this.bus.send({
            ['type']: 'error',
            ['requestId']: requestId,
            ['code']: code,
            ['message']: message
        });
    }
    sendAck(requestId) {
        return this.bus.send({
            ['type']: 'ack',
            ['requestId']: requestId
        });
    }
    constructor(handleMessage, port, errorService){
        this.handleMessage = handleMessage;
        this.sendRequest = (requestId, path, payload)=>{
            return this.bus.send({
                ['type']: 'request',
                ['requestId']: requestId,
                ['path']: path,
                ['payload']: payload
            });
        };
        this.onReceive = (message)=>{
            switch(message['type']){
                case 'ack':
                    this.handleMessage({
                        type: 'ack',
                        requestId: message['requestId']
                    });
                    return;
                case 'error':
                    this.handleMessage({
                        type: 'error',
                        requestId: message['requestId'],
                        code: message['code'],
                        message: message['message']
                    });
                    return;
                case 'response':
                    this.handleMessage({
                        type: 'response',
                        requestId: message['requestId'],
                        payload: message['payload']
                    });
                    return;
                case 'request':
                    this.handleMessage({
                        type: 'request',
                        requestId: message['requestId'],
                        path: message['path'],
                        payload: message['payload']
                    });
                    return;
                default:
                    throw new _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__.UnreachableError(message);
            }
        };
        this.bus = new _bus_bus__WEBPACK_IMPORTED_MODULE_1__.MessageBus({
            receive: this.onReceive
        }, port, errorService);
    }
}


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MessageBus: () => (/* binding */ MessageBus)
/* harmony export */ });
/* harmony import */ var _base_result_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _api_error_error_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
// Copyright 2023 Canva Inc. All Rights Reserved.


/**
 * MessageBus abstracts the MessagePort API for sending and receiving messages.
 * MessageBus will pass incoming messages to its handler.
 */ class MessageBus {
    constructor(handler, port, errorService){
        this.handler = handler;
        this.port = port;
        this.errorService = errorService;
        /**
   * send emits messages to the receiver.
   * Always check the result of this command to ensure that the message was sent,
   * which can fail when sending data that is not supported by the structured clone algorithm.
   */ this.send = (message)=>{
            try {
                this.port.postMessage(message);
                return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Ok();
            } catch (e) {
                this.errorService.errorException(e);
                return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Err(e);
            }
        };
        /**
   * onMessageError handles incoming messages that cannot be deserialised.
   * A message _might_ not be deserialisable if memory cannot be allocated for the new object.
   * https://html.spec.whatwg.org/multipage/structured-data.html#structureddeserialize
   */ this.onMessageError = (e)=>{
            this.errorService.errorException(e);
        };
        /**
   * onMessage is a handler that directly interacts with the MessagePort and
   * calls the registered handler with the data in the MessageEvent.
   */ this.onMessage = ({ data })=>{
            if (!data) {
                this.errorService.error(new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_1__.CanvaError({
                    code: 'internal_error',
                    message: `missing data in 'MessageEvent'`
                }));
                return;
            }
            try {
                // Note `data` is typed as `any` but becomes `T` here.
                this.handler.receive(data);
            } catch (e) {
                this.errorService.errorException(e);
            }
        };
        this.port.onmessage = this.onMessage;
        this.port.onmessageerror = this.onMessageError;
    }
}


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Client: () => (/* binding */ Client)
/* harmony export */ });
/* harmony import */ var _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _base_result_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _base_uuid_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(10);
/* harmony import */ var _api_error_error_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);
/* harmony import */ var _ack_timings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(11);
/* harmony import */ var _promise_with_timeout__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6);
// Copyright 2021 Canva Inc. All Rights Reserved.






/**
 * Client is responsible for making requests, and handling the reply messages for
 * each request that was made.
 */ class Client {
    request(path, payload) {
        const pendingRequests = this.pendingRequests;
        const requestPromise = new _promise_with_timeout__WEBPACK_IMPORTED_MODULE_5__.PromiseWithTimeout(_ack_timings__WEBPACK_IMPORTED_MODULE_4__.INITIAL_ACK_TIMEOUT);
        const requestId = this.requestIdGenerator();
        const resultPromise = awaitResult();
        const result = this.send(requestId, path, payload);
        if (!result.ok) {
            this.errorService.errorException(result.error, {
                errorMessagePrefix: 'unable to send request',
                tags: new Map([
                    [
                        'type',
                        'request'
                    ],
                    [
                        'path',
                        path
                    ]
                ])
            });
            requestPromise.reject(result.error);
        }
        return resultPromise;
        async function awaitResult() {
            pendingRequests.set(requestId, {
                path,
                requestPromise
            });
            try {
                const response = await requestPromise.promise();
                return _base_result_ts__WEBPACK_IMPORTED_MODULE_1__.Result.Ok(response);
            } catch (e) {
                if (e instanceof _promise_with_timeout__WEBPACK_IMPORTED_MODULE_5__.PromiseTimeoutError) // The stack from `PromiseTimeoutError` is misleading because it's captured with context
                // from a setTimeout rather than the caller of `request`. So create a new stack here.
                return _base_result_ts__WEBPACK_IMPORTED_MODULE_1__.Result.Err(new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_3__.CanvaError({
                    code: 'internal_error',
                    message: `Comms promise timed out (${path}).`
                }));
                // The raised error should NOT be logged with the error service, since it's the handler that
                // threw, and not the sandbox comms. We simply pass the error on to the consumer.
                return _base_result_ts__WEBPACK_IMPORTED_MODULE_1__.Result.Err(e);
            } finally{
                pendingRequests.delete(requestId);
            }
        }
    }
    handleReply(msg) {
        const { requestId, type } = msg;
        const { path, requestPromise: request } = this.pendingRequests.get(requestId) || {};
        if (!request) {
            // Don't log ACKs to the ErrorService because they can easily race with the genuine response.
            if (type !== 'ack') this.errorService.error(`request has already been handled and resolved or was not sent from this client`, {
                tags: new Map([
                    [
                        'type',
                        type
                    ],
                    [
                        'requestId',
                        `${requestId}`
                    ]
                ])
            });
            return;
        }
        switch(type){
            case 'response':
                request.resolve(msg.payload);
                return;
            case 'ack':
                request.reset(_ack_timings__WEBPACK_IMPORTED_MODULE_4__.SUBSEQUENT_ACK_TIMEOUT);
                return;
            case 'error':
                // Log a breadcrumb before rejecting. App code will typically catch these, but sometimes a
                // spike of unhandled exceptions appears in Sentry that are hard to diagnose.
                this.errorService.addBreadCrumb({
                    level: 'info',
                    category: 'sandbox_comms',
                    message: 'Error response received',
                    data: {
                        ['path']: path ?? 'unknown'
                    }
                });
                const { code, message } = msg;
                request.reject(new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_3__.CanvaError({
                    code,
                    message
                }));
                return;
            default:
                throw new _base_preconditions_ts__WEBPACK_IMPORTED_MODULE_0__.UnreachableError(msg);
        }
    }
    constructor(send, errorService, requestIdGenerator = _base_uuid_ts__WEBPACK_IMPORTED_MODULE_2__.uuidv4){
        this.send = send;
        this.errorService = errorService;
        this.requestIdGenerator = requestIdGenerator;
        this.pendingRequests = new Map();
    }
}


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   uuidv4: () => (/* binding */ uuidv4)
/* harmony export */ });
// Copyright 2019 Canva Inc. All Rights Reserved.
/**
 * Generates a type-4 UUID.
 *
 * When run in a client, UUIDs produced by this function should be assumed to be only
 * as unique as the degree to which we control the browser provisioned on that client.
 * That is, values produced by this function should not be trusted, and should instead
 * be treated as a suggested identifier that is probably unique.
 *
 * Examples of suitable uses:
 * <ul>
 *   <li>a client-side event report; or
 *   <li>a client-side token or session where genuine uniqueness is not relied upon; or
 *   <li>a client-side request identifier for logging or tracing.
 * <ul>
 *
 * Examples of unsuitable uses:
 * <ul>
 *   <li>a resource identifier (e.g., a media id), since that should always be a server-issued
 * identifier; and
 *   <li>a value to which some privilege is associated (e.g., a client-specified session id), since
 * that should always be a server-issued identifier.
 * </ul>
 *
 * Adapted from https://stackoverflow.com/questions/105034
 */ function uuidv4(rng) {
    // Prepare random values of amount equal to the number of chars to replace
    const randomValues = getRandomValues(rng, 31);
    let currentRandomValue = 0;
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, function(c) {
        const cN = Number(c);
        return (cN ^ randomValues[currentRandomValue++] & 15 >> cN / 4).toString(16);
    });
}
// Returns an array of random integers in the range [0,255].
// A random number generator (rng) may be provided, otherwise crypto or Math.random will be used.
function getRandomValues(rng, amount) {
    if (!rng && typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues === 'function') return window.crypto.getRandomValues(new Uint8Array(amount));
    const random = rng ?? Math.random;
    return Array.from({
        length: amount
    }, ()=>Math.floor(random() * 0xff));
}


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACK_INTERVAL: () => (/* binding */ ACK_INTERVAL),
/* harmony export */   INITIAL_ACK_TIMEOUT: () => (/* binding */ INITIAL_ACK_TIMEOUT),
/* harmony export */   SUBSEQUENT_ACK_TIMEOUT: () => (/* binding */ SUBSEQUENT_ACK_TIMEOUT)
/* harmony export */ });
// Copyright 2021 Canva Inc. All Rights Reserved.
// ACK_INTERVAL is the delay to wait before sending additional acknowledgements
const ACK_INTERVAL = 9000;
// INITIAL_ACK_TIMEOUT is the time to wait for the first acknowledgement of the message.
// If the message is *not* acknowledged within this time then the message sender signal an error
// has occurred while sending the message.
const INITIAL_ACK_TIMEOUT = 5000;
// SUBSEQUENT_ACK_TIMEOUT is the time *after* the first acknowledgement of a *sent* message to wait
// for either another acknowledgement to arrive or a response
const SUBSEQUENT_ACK_TIMEOUT = 20000;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RequestHandler: () => (/* binding */ RequestHandler),
/* harmony export */   RequestHandlerErrorCodes: () => (/* binding */ RequestHandlerErrorCodes)
/* harmony export */ });
/* harmony import */ var _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _ack_timings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);
// Copyright 2021 Canva Inc. All Rights Reserved.


/** exported for testing */ const RequestHandlerErrorCodes = {
    internalError: ()=>'Something went wrong on our end, if this issue persists please contact us.',
    noHandlerForPath: (path)=>`No request handler configured for path: "${path}".`,
    handlerForPathAlreadyDefined: (path)=>`Handler for '${path}' is already defined.`
};
/**
 * RequestHandler is responsible for handling incoming requests, calling the
 * handler function that is responsible for the requested path as well as sending
 * the reply message back to the Emitter.
 */ class RequestHandler {
    addErrorObserver(observer) {
        this.errorObservers.add(observer);
        return ()=>this.errorObservers.delete(observer);
    }
    /**
   * handle adds a callback that will is triggered when the
   * resource for 'path' is requested. The value returned by this callback
   * is sent back to the original sender
   */ handle(path, handler) {
        if (this.requestHandler.has(path)) throw new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError({
            code: 'internal_error',
            message: RequestHandlerErrorCodes.handlerForPathAlreadyDefined(path)
        });
        this.requestHandler.set(path, handler);
    }
    /**
   * handleRequest parses incoming request messages,
   * triggers the relevant request callback handlers, sends acknowledgement messages
   * and finally responds to the request.
   */ async handleRequest(body) {
        const { requestId, path, payload } = body;
        const handler = this.requestHandler.get(path);
        if (!handler) {
            const result = this.messenger.sendError(requestId, 'internal_error', RequestHandlerErrorCodes.noHandlerForPath(path));
            if (!result.ok) // report error that we were unable to notify the requester that an error occurred whilst processing
            // their request
            this.errorService.criticalException(result.error, {
                errorMessagePrefix: 'unable to send error response',
                tags: new Map([
                    [
                        'type',
                        'request'
                    ],
                    [
                        'path',
                        path
                    ]
                ])
            });
            return;
        }
        // ack immediately and then every 10s so the client knows we're still alive
        this.messenger.sendAck(requestId);
        const intervalId = setInterval(()=>this.messenger.sendAck(requestId), _ack_timings__WEBPACK_IMPORTED_MODULE_1__.ACK_INTERVAL);
        let observableError;
        try {
            const resPayload = await handler(payload);
            // clear the interval and respond with the payload
            clearInterval(intervalId);
            this.messenger.sendResponse(requestId, resPayload);
        } catch (e) {
            clearInterval(intervalId);
            // Handlers throw `CanvaError` to signal known failures to the peer, and sometimes other
            // things. Convert them to the `ErrorMessage` type, starting with a generic internal error.
            let errorCode = 'internal_error';
            let errorMessage = RequestHandlerErrorCodes.internalError();
            if (e instanceof _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError) {
                observableError = e;
                if (e.code === 'internal_error') // For internal errors, we'd like to report the error, but not propagate the details over
                // the message bus to external clients.
                this.errorService.errorException(e, {
                    errorMessagePrefix: 'Internal error in comms handler',
                    tags: new Map([
                        [
                            'type',
                            'request'
                        ],
                        [
                            'path',
                            path
                        ]
                    ])
                });
                else {
                    // For other, known errors, the message details should propagate without reporting.
                    errorCode = e.code;
                    errorMessage = e.rawMessage;
                }
            } else // For unknown errors, the client and host have different logic:
            if (this.reportNonCanvaErrors) // For internal code: send it to Sentry.
            this.errorService.errorException(e, {
                errorMessagePrefix: 'Unexpected error type thrown from comms handler',
                tags: new Map([
                    [
                        'type',
                        'request'
                    ],
                    [
                        'path',
                        path
                    ]
                ])
            });
            else // For third-party code in the app sandbox: log it to the console. We do not also `throw`
            // because, unless something is definitely `await`ing the result, it will just end up in
            // the onunhandledrejection handler anyway (which will end up in Sentry).
            this.devConsole.error(e);
            const result = this.messenger.sendError(requestId, errorCode, errorMessage);
            if (!result.ok) this.errorService.criticalException(result.error, {
                errorMessagePrefix: 'unable to send error response',
                tags: new Map([
                    [
                        'type',
                        'request'
                    ],
                    [
                        'path',
                        path
                    ]
                ])
            });
        }
        // Fire all error observers if we've encountered an error.
        if (observableError == null) return;
        for (const cb of this.errorObservers)try {
            cb(observableError);
        } catch (e) {
            /**
         * Observers should catch their own errors. We can't determine severity on their behalf, so
         * we'll go with a warning here.
         **/ this.errorService.warningException(e, {
                errorMessagePrefix: 'Error executing errorObserver'
            });
        }
    }
    /**
   * Constructs a RequestHandler.
   *
   * @param sendMessage Method bound to send messages to the peer.
   * @param errorService Handler for comms failure, or when handlers throw unexpected things.
   * @param reportNonCanvaErrors Whether to report to `errorService` errors that are not `instanceof
   * CanvaError`. This should only be enabled for host-side handlers, or internal clients.
   * @param devConsole Console to log errors to when `reportNonCanvaErrors` is false.
   *
   * We don't want to report errors thrown from third-party code. These will be logged to console
   * instead. They are not re-thrown, since that would cause Sentry to report anyway, should they go
   * to onunhandledrejection.
   */ constructor(messenger, errorService, reportNonCanvaErrors, devConsole = console){
        this.messenger = messenger;
        this.errorService = errorService;
        this.reportNonCanvaErrors = reportNonCanvaErrors;
        this.devConsole = devConsole;
        this.requestHandler = new Map();
        this.errorObservers = new Set();
    }
}


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   VerifyError: () => (/* binding */ VerifyError),
/* harmony export */   createInitialiseMessage: () => (/* binding */ createInitialiseMessage),
/* harmony export */   verifyMessage: () => (/* binding */ verifyMessage)
/* harmony export */ });
/* harmony import */ var _base_result_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
// Copyright 2022 Canva Inc. All Rights Reserved.

/** @enum {string} */
const VerifyError = {
  MISSING_DATA: "missing 'data' field in MessageEvent",
  MISSING_SOURCE: "'source' is missing in MessageEvent data object",
  INVALID_SOURCE: "invalid source",
  UNKNOWN_CLIENT_ID: "unknown client id"
};
// This may seem pointless, but we aren't explicitly adding this to externs and even
// though plenty of libraries include the 'source' symbol in our generated externs,
// it's better to be safe than sorry, so we're using the old [''] wrapping trick.
function createInitialiseMessage(source, clientId) {
  return {
    ['source']: source,
    ['sandboxCommsSource']: source,
    ['clientId']: clientId
  };
}
/**
 * Verify that the message is valid and matches the expected source. If an expected
 * handshake id is provided, it will also verify that the message handshake id matches
 * it to ensure that the message is intended for this handshake.
 */
function verifyMessage(data, expectedSource, expectedClientId) {
  if (!data) return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Err("missing 'data' field in MessageEvent");
  const msg = data;
  const source = msg['sandboxCommsSource'] ?? msg['source'];
  if (!source) return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Err("'source' is missing in MessageEvent data object");
  if (source !== expectedSource) return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Err("invalid source");
  if (msg['clientId'] !== expectedClientId) return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Err("unknown client id");
  return _base_result_ts__WEBPACK_IMPORTED_MODULE_0__.Result.Ok();
}

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DATA_CLIENT_ID: () => (/* binding */ DATA_CLIENT_ID),
/* harmony export */   DataClientComms: () => (/* binding */ DataClientComms),
/* harmony export */   setupDataRequestHandlers: () => (/* binding */ setupDataRequestHandlers)
/* harmony export */ });
/* harmony import */ var _apps_developing_sandbox_comms_comms_helpers_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(15);
/* harmony import */ var _message_paths__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(16);
/* harmony import */ var _payloads_proto__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(17);
// Copyright 2025 Canva Inc. All Rights Reserved.



// ID used to ensure that the SDK handshake is only responded to by the correct
// host controller. It needs to be unique for each SDK and used across both sides
// of the iframe connection handshake in connectToParent and connectToIFrame.
const DATA_CLIENT_ID = 'canva-code-data-sdk';
function setupDataRequestHandlers(comms, handler) {
    (0,_apps_developing_sandbox_comms_comms_helpers_ts__WEBPACK_IMPORTED_MODULE_0__.handleMessageFromHost)(comms, _message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.INIT_DATA, _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.InitDataRequest, (request)=>handler.handleInitData(request), _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.InitDataResponse);
    (0,_apps_developing_sandbox_comms_comms_helpers_ts__WEBPACK_IMPORTED_MODULE_0__.handleMessageFromHost)(comms, _message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.DATA_RENDER_READY, _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.RenderReadyRequest, (request)=>handler.handleRenderReady(request), _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.RenderReadyResponse);
}
class DataClientComms {
    async sendInitData(request) {
        const result = await this.comms.request(_message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.INIT_DATA, _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.InitDataRequest.serialize(request));
        const value = extractValue(result, _message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.INIT_DATA);
        return _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.InitDataResponse.deserialize(value);
    }
    async sendRenderReady(request) {
        const result = await this.comms.request(_message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.DATA_RENDER_READY, _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.RenderReadyRequest.serialize(request));
        const value = extractValue(result, _message_paths__WEBPACK_IMPORTED_MODULE_1__.MessagePaths.DATA_RENDER_READY);
        return _payloads_proto__WEBPACK_IMPORTED_MODULE_2__.RenderReadyResponse.deserialize(value);
    }
    constructor(comms){
        this.comms = comms;
    }
}
function extractValue(result, messagePath) {
    if (!result.ok) throw new Error(`Encountered an error while sending ${messagePath} request: ${result.error}`);
    if (result.value == null) throw new Error(`${messagePath}: Result cannot be empty`);
    return result.value;
}


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleMessageFromHost: () => (/* binding */ handleMessageFromHost),
/* harmony export */   runRequest: () => (/* binding */ runRequest)
/* harmony export */ });
/* harmony import */ var _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);

function deserializeRequest(message_path, proto, request) {
    if (request === undefined) throw new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError({
        code: 'internal_error',
        message: `${message_path}: request cannot be undefined.`
    });
    return proto.deserialize(request);
}
/**
 * Implementation of the overloads above. This can't be invoked directly. Note that no overload
 * matches the generic signature to ensure that using a `messageHandler` that returns a value also
 * requires a Serializer for that value.
 */ function handleMessageFromHost(comms, message_path, messageArgProto, messageHandler, responseProto) {
    comms.handle(message_path, async (messageObject)=>{
        const message = deserializeRequest(message_path, messageArgProto, messageObject);
        const response = await messageHandler(message);
        if (responseProto) return responseProto.serialize(response);
    });
}
async function runRequest(comms, messagePath, requestProto, request, responseProto) {
    const response = await comms.request(messagePath, requestProto.serialize(request));
    if (!response.ok) {
        if (response.error instanceof _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError) throw response.error;
        throw new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError({
            code: 'internal_error',
            message: `Something went wrong during request ${messagePath}`
        });
    }
    if (responseProto) {
        if (response.value === undefined) throw new _api_error_error_ts__WEBPACK_IMPORTED_MODULE_0__.CanvaError({
            code: 'internal_error',
            message: `Expected a response from ${messagePath}, but got nothing`
        });
        return responseProto.deserialize(response.value);
    }
}


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MessagePaths: () => (/* binding */ MessagePaths)
/* harmony export */ });
/** @enum {string} */
// Copyright 2025 Canva Inc. All Rights Reserved.
/**
 * We used shared message paths for codelet SDKs as we have a single port
 * system in the embed-preview worker for understanding whether a codelet
 * is ready to render.
 *
 * This allows us to ensure that we don't have clashing message paths between
 * the different SDKs or at least have a clear understanding of what they are.
 */
const MessagePaths = {
  INIT_DATA: "INIT_DATA",
  DATA_RENDER_READY: "DATA_RENDER_READY",
  SET_EDITING_CONFIG: "SET_EDITING_CONFIG",
  SELECTION_CHANGED: "SELECTION_CHANGED",
  TEXT_CONTENT_CHANGED: "TEXT_CONTENT_CHANGED",
  INTERACTION_MODE_CHANGED: "INTERACTION_MODE_CHANGED",
  INIT_ELEMENT: "INIT_ELEMENT",
  SET_CAPABILITY: "SET_CAPABILITY",
  SET_EDIT_PANEL_VALUE: "SET_EDIT_PANEL_VALUE",
  SET_FONT: "SET_FONT",
  RENDER_ELEMENT: "RENDER_ELEMENT",
  RESIZE_EVENT: "RESIZE_EVENT",
  SET_CONFIG: "SET_CONFIG"
};

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InitDataRequest: () => (/* binding */ InitDataRequest),
/* harmony export */   InitDataResponse: () => (/* binding */ InitDataResponse),
/* harmony export */   RenderReadyRequest: () => (/* binding */ RenderReadyRequest),
/* harmony export */   RenderReadyResponse: () => (/* binding */ RenderReadyResponse),
/* harmony export */   WebsiteContext: () => (/* binding */ WebsiteContext)
/* harmony export */ });
/* harmony import */ var _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(18);
// @formatter:off
// Copyright Canva Inc. All Rights Reserved.
// Generated from ui/rendering/codelet/sdk/data/payloads.proto.

const InitDataRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({}));
const WebsiteContext = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  deploymentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* A */1),
  accessToken: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* B */2)
}));
const InitDataResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  documentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString('documentId', 1),
  elementId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString('elementId', 2),
  websiteContext: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalObject('websiteContext', 3, WebsiteContext),
  isPreview: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalBoolean('isPreview', 4)
}), {
  dualDeserializationConfig: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.DualDeserializationConfig.MINI_PRIMARY_FULL_SECONDARY
});
const RenderReadyRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({}));
const RenderReadyResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({}));

/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DualDeserializationConfig: () => (/* binding */ DualDeserializationConfig),
/* harmony export */   Proto: () => (/* binding */ Proto)
/* harmony export */ });
/* harmony import */ var _memoize_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/* harmony import */ var _preconditions_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _internal_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(20);
/* eslint-disable @canva/ts/no-this-in-static */ // Copyright 2019 Canva Inc. All Rights Reserved.



const makeType = t => t;
const ProtoType = {
  STRING: makeType({
    typeOfValue: 'string'
  }),
  BOOLEAN: makeType({
    typeOfValue: 'boolean',
    defaultValue: false,
    fixedSize: 1
  }),
  DOUBLE: makeType({
    typeOfValue: 'number',
    defaultValue: 0,
    fixedSize: 8
  }),
  INT32: makeType({
    typeOfValue: 'number',
    defaultValue: 0
  }),
  INT64: makeType({
    typeOfValue: 'number',
    defaultValue: 0
  }),
  BYTES: makeType({
    typeOfValue: 'Uint8Array'
  })
};
function constantField(params) {
  const {
    tag,
    jsonFullKeyOrJsonMiniKey,
    jsonFullValue,
    value,
    defaults
  } = params;
  return {
    tag,
    fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT,
    // if we ever want to support nested oneofs, we'll need to change the
    // `constantString` calling convention to support the parameterisation of
    // the full and mini keys simultaneously, as we won't be able to assume
    // the mini key is 'A?'. This is also assumed in a few places below.
    jsonFullKey: jsonFullKeyOrJsonMiniKey === DISCRIMINATOR_JSON_MINI_KEY ?
    // if it's the JSON mini discriminator key, then we have no idea
    // what the JSON full discriminator key could be
    undefined :
    // if it's not the JSON mini discriminator key,
    // it's the JSON full discriminator key
    jsonFullKeyOrJsonMiniKey,
    jsonFullValue,
    value,
    defaults,
    typeOfValue: 'string'
  };
}
function requiredField(valueType, jsonFullKey, tag, def) {
  return {
    tag,
    fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED,
    jsonFullKey,
    default: def != null ? def : valueType.defaultValue,
    defaultValue: valueType.defaultValue,
    typeOfValue: valueType.typeOfValue
  };
}
function optionalField(valueType, jsonFullKey, tag) {
  return {
    tag,
    fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL,
    jsonFullKey,
    defaultValue: valueType.defaultValue,
    typeOfValue: valueType.typeOfValue
  };
}
function repeatedField(valueType, jsonFullKey, tag) {
  return {
    tag,
    fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED,
    jsonFullKey,
    typeOfValue: valueType.typeOfValue
  };
}
function mapField(keyType, valueType) {
  return (tagOrJsonFullKey, tagOrObj, maybeObj) => {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    let typeOfValue;
    if (valueType === 'object') typeOfValue = 'object';else if (valueType === 'enum') typeOfValue = 'string';else typeOfValue = valueType.typeOfValue;
    return {
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.MAP,
      tag,
      jsonFullKey,
      obj: obj,
      typeOfKey: keyType.typeOfValue,
      typeOfValue
    };
  };
}
class Proto {
  /** @nocollapse __nocollapse_static_properties_plugin__ */static constantString(jsonFullKeyOrJsonMiniKey, jsonFullValueOrTag, tagOrValue, maybeValue) {
    const {
      tag,
      jsonFullKey: jsonFullValue,
      other1: value
    } = getOptions(jsonFullValueOrTag, tagOrValue, maybeValue);
    return constantField({
      tag,
      jsonFullKeyOrJsonMiniKey,
      jsonFullValue,
      value,
      defaults: false
    });
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static constantStringWithDefault(jsonFullKeyOrJsonMiniKey, jsonFullValueOrTag, tagOrValue, maybeValue) {
    const {
      tag,
      jsonFullKey: jsonFullValue,
      other1: value
    } = getOptions(jsonFullValueOrTag, tagOrValue, maybeValue);
    return constantField({
      tag,
      jsonFullKeyOrJsonMiniKey,
      jsonFullValue,
      value,
      defaults: true
    });
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static requiredObject(tagOrJsonFullKey, tagOrObj, maybeObj) {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED,
      jsonFullKey,
      obj: obj,
      typeOfValue: 'object'
    };
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static optionalObject(tagOrJsonFullKey, tagOrObj, maybeObj) {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL,
      jsonFullKey,
      obj: obj,
      typeOfValue: 'object'
    };
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static repeatedObject(tagOrJsonFullKey, tagOrObj, maybeObj) {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED,
      jsonFullKey,
      obj: obj,
      typeOfValue: 'object'
    };
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static requiredStringEnum(tagOrJsonFullKey, tagOrObj, objOrDef, maybeDef) {
    const {
      tag,
      jsonFullKey,
      other1: obj,
      other2: def
    } = getOptions(tagOrJsonFullKey, tagOrObj, objOrDef, maybeDef);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED,
      jsonFullKey,
      obj,
      default: def,
      typeOfValue: 'string'
    };
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static optionalStringEnum(tagOrJsonFullKey, tagOrObj, maybeObj) {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL,
      jsonFullKey,
      obj,
      typeOfValue: 'string'
    };
  }
  /** @nocollapse __nocollapse_static_properties_plugin__ */
  static repeatedStringEnum(tagOrJsonFullKey, tagOrObj, maybeObj) {
    const {
      tag,
      jsonFullKey,
      other1: obj
    } = getOptions(tagOrJsonFullKey, tagOrObj, maybeObj);
    return {
      tag,
      fieldLabel: _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED,
      jsonFullKey,
      obj,
      typeOfValue: 'string'
    };
  }
  /**
  * Generates a class for a given proto configuration. Note the returned value is not strongly
  * typed and it's expected that the assigned variable will have explicit types.
  @nocollapse __nocollapse_static_properties_plugin__ */
  static createMessage(schema, options = {}) {
    // As large bootstraps are deserialized on every web2 page load the message classes
    // are optimised for deserialization and validation.
    //
    // Dynamic classes do not play nicely with browser optimisations, and although a simple
    // deserialization implementation out performs hard coded per-message functions in initial
    // executions, the per-message functions become 2-3x faster over time as the browser JITs
    // them and memiozes generates object shapes.
    const init = (0,_memoize_ts__WEBPACK_IMPORTED_MODULE_0__.memoize)(() => {
      const fields = schema();
      const fieldNames = Object.keys(fields);
      const fieldsByTag = {};
      const constantsByTag = {};
      for (const name of fieldNames) {
        const config = fields[name];
        switch (config.fieldLabel) {
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT:
            constantsByTag[config.tag] = {
              ...config,
              name
            };
            break;
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED:
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL:
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED:
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.MAP:
            fieldsByTag[config.tag] = {
              ...config,
              name
            };
            break;
          default:
            throw new _preconditions_ts__WEBPACK_IMPORTED_MODULE_1__.UnreachableError(config);
        }
      }
      return {
        kind: _internal_types__WEBPACK_IMPORTED_MODULE_2__.MessageKind.CONCRETE,
        fields,
        fieldMetadata: deriveFieldMetadata(fields, options.dualDeserializationConfig),
        fieldsByTag,
        constantsByTag
      };
    });
    class Message {
      /** @nocollapse __nocollapse_static_properties_plugin__ */static createUnchecked(opts = {}) {
        return new Message(opts);
      }
      /** @nocollapse __nocollapse_static_properties_plugin__ */
      static serialize(message) {
        return Message.serializeWithPath(message, []);
      }
      /** @nocollapse __nocollapse_static_properties_plugin__ */
      static serializeValue(value, metadatum, path) {
        const {
          config: field
        } = metadatum;
        // if the field runtime representation is a Uint8Array,
        // we need to Base64 encode it before sending it over the wire
        if (field.typeOfValue === 'Uint8Array') return toBase64(value);
        if (field.obj) return field.obj.serializeWithPath(value, path);
        return value;
      }
      /** @nocollapse __nocollapse_static_properties_plugin__ */
      static deserialize(o) {
        return Message.deserializeWithPath(o, []);
      }
      /** @nocollapse __nocollapse_static_properties_plugin__ */
      static deserializeValue(value, metadatum, path) {
        const {
          config: field
        } = metadatum;
        // if the the runtime representation of a value is a Uint8Array,
        // we should reasonably expect it to be Base64 encoded string of binary data,
        // and thus need to decode.
        if (field.typeOfValue === 'Uint8Array') return fromBase64(value);
        if (field.obj) return field.obj.deserializeWithPath(value, path);
        return value;
      }
      /** @nocollapse __nocollapse_static_properties_plugin__ */
      static deserializeWithPath(o, path) {
        const {
          fieldMetadata
        } = init();
        // The above deserialization code applies all defaults, so calling the Message constructor
        // which re-applies defaults would introduce unnecessary overhead. Simply calling
        // a constructor which does nothing also introduces a lot of overhead. So instead use
        // Object.create which assigns the prototype but does not call the constructor.
        const result = Object.create(Message.prototype);
        for (const metadatum of fieldMetadata) {
          const {
            config: field,
            name: fieldName,
            primaryJsonKey,
            secondaryJsonKey
          } = metadatum;
          let jsonKey = primaryJsonKey;
          let value = o[jsonKey];
          // Dual Deserialization lives here
          if (value == null && secondaryJsonKey != null && o[secondaryJsonKey] != null) {
            jsonKey = secondaryJsonKey;
            value = o[jsonKey];
          }
          switch (field.fieldLabel) {
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL:
              if (value == null) {
                result[fieldName] = undefined;
                break;
              } else if (!isCorrectWireType(value, field.typeOfValue)) {
                const keyEncodings = {
                  primaryJsonKey,
                  secondaryJsonKey
                };
                throw makeOptionalTypeError(keyEncodings, value, field.typeOfValue, path);
              }
              path.push(jsonKey);
              result[fieldName] = Message.deserializeValue(value, metadatum, path);
              path.pop();
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED:
              if (value == null && field.defaultValue != null) {
                result[fieldName] = field.defaultValue;
                break;
              } else if (value == null || !isCorrectWireType(value, field.typeOfValue)) {
                // Since null is an object type and `deserialize` doesn't perform a null check, the
                // above null check ensures a custom error (with a path) is thrown when null is
                // supplied for a required object.
                const keyEncodings = {
                  primaryJsonKey,
                  secondaryJsonKey
                };
                throw makeRequiredTypeError(keyEncodings, value, field.typeOfValue, path);
              }
              path.push(jsonKey);
              result[fieldName] = Message.deserializeValue(value, metadatum, path);
              path.pop();
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT:
              {
                const {
                  primaryJsonValue,
                  secondaryJsonValue
                } = metadatum;
                // if the constant field has a default, use the expected value as the default value
                if (value == null && field.defaults) {
                  result[fieldName] = field.value;
                  break;
                }
                if (value === primaryJsonValue) {
                  result[fieldName] = field.value;
                  break;
                }
                if (secondaryJsonValue != null && value === secondaryJsonValue) {
                  result[fieldName] = field.value;
                  break;
                }
                const keyEncodings = {
                  primaryJsonKey,
                  secondaryJsonKey
                };
                const valueEncodings = {
                  primaryJsonValue: primaryJsonValue,
                  secondaryJsonValue
                };
                throw new TypeError(`Expected value ${expectedValues(valueEncodings)} for key ${expectedKeys(keyEncodings)} found: ${JSON.stringify(value)} ${pathTrace(path)}`);
              }
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED:
              {
                if (value == null) {
                  result[fieldName] = [];
                  break;
                } else if (!Array.isArray(value)) {
                  const keyEncodings = {
                    primaryJsonKey,
                    secondaryJsonKey
                  };
                  throw makeRepeatedTypeError(keyEncodings, value, field.typeOfValue, path);
                }
                const values = new Array(value.length);
                for (let j = 0; j < value.length; ++j) {
                  if (!isCorrectWireType(value[j], field.typeOfValue)) {
                    const keyEncodings = {
                      primaryJsonKey,
                      secondaryJsonKey
                    };
                    throw makeRequiredTypeError(keyEncodings, value[j], field.typeOfValue, [...path, jsonKey], j);
                  }
                  path.push(`${jsonKey}[${j}]`);
                  values[j] = Message.deserializeValue(value[j], metadatum, path);
                  path.pop();
                }
                result[fieldName] = values;
                break;
              }
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.MAP:
              {
                if (value == null) {
                  result[fieldName] = new Map();
                  break;
                } else if (typeof value !== 'object') {
                  const keyEncodings = {
                    primaryJsonKey,
                    secondaryJsonKey
                  };
                  throw new TypeError(`Expected Map for key ${expectedKeys(keyEncodings)}, found: ${moreSpecificTypeof(value)} ${pathTrace(path)}`);
                }
                const isNumber = field.typeOfKey === 'number';
                const entries = Object.entries(value);
                const pairs = new Array(entries.length);
                for (let i = 0; i < entries.length; ++i) {
                  const [serializedKey, serializedValue] = entries[i];
                  let deserializedKey;
                  if (isNumber) {
                    deserializedKey = Number(serializedKey);
                    if (isNaN(deserializedKey)) throw new TypeError(`Expected number map key, found: NaN ${pathTrace([...path, jsonKey])}`);
                  } else deserializedKey = serializedKey;
                  if (!isCorrectWireType(serializedValue, field.typeOfValue)) throw new TypeError(`Expected ${field.typeOfValue} map value for map key "${deserializedKey}", found: ${moreSpecificTypeof(serializedValue)} ${pathTrace([...path, jsonKey])}`);
                  path.push(`${jsonKey}["${deserializedKey}"]`);
                  const deserializedValue = Message.deserializeValue(serializedValue, metadatum, path);
                  path.pop();
                  pairs[i] = [deserializedKey, deserializedValue];
                }
                result[fieldName] = new Map(pairs);
                break;
              }
            default:
              throw new _preconditions_ts__WEBPACK_IMPORTED_MODULE_1__.UnreachableError(field);
          }
        }
        return result;
      }
      constructor(opts = {}) {
        const {
          fieldMetadata
        } = init();
        for (const metadatum of fieldMetadata) {
          const {
            config: field,
            name: fieldName
          } = metadatum;
          const value = opts[fieldName];
          switch (field.fieldLabel) {
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT:
              this[fieldName] = field.value;
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED:
              this[fieldName] = value == null ? field.default : value;
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL:
              this[fieldName] = value;
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED:
              this[fieldName] = value == null ? [] : value;
              break;
            case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.MAP:
              this[fieldName] = value == null ? new Map() : value;
              break;
            default:
              throw new _preconditions_ts__WEBPACK_IMPORTED_MODULE_1__.UnreachableError(field);
          }
        }
      }
    }
    /** @nocollapse __nocollapse_static_properties_plugin__ */
    Message.init = init;
    /** @nocollapse __nocollapse_static_properties_plugin__ */
    Message.serializeWithPath = options.unproducible ? (_message, path) => {
      throw new TypeError(`Unproducible oneof case ${pathTrace(path)}`);
    } : (message, path) => {
      if (message == null || typeof message !== 'object') throw new TypeError(`Expected type object, found: ${moreSpecificTypeof(message)} ${pathTrace(path)}`);
      const {
        fieldMetadata
      } = init();
      const res = {};
      for (const metadatum of fieldMetadata) {
        const {
          config: field,
          name: fieldName,
          primaryJsonKey
        } = metadatum;
        const value = message[fieldName];
        const jsonKey = primaryJsonKey;
        switch (field.fieldLabel) {
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT:
            if (value !== field.value) throw new TypeError(`Expected value ${JSON.stringify(field.value)} for key "${primaryJsonKey}", found: ${JSON.stringify(value)} ${pathTrace(path)}`);
            // when FieldLabel.CONSTANT, primaryJsonValue is always
            // a non-undefined `string`.
            res[jsonKey] = metadatum.primaryJsonValue;
            break;
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REQUIRED:
            {
              if (field.defaultValue != null && value === field.defaultValue) break;
              path.push(jsonKey);
              const serializedValue = Message.serializeValue(value, metadatum, path);
              path.pop();
              if (!isCorrectWireType(serializedValue, field.typeOfValue)) throw makeRequiredTypeError({
                primaryJsonKey
              }, value, field.typeOfValue, path);
              res[jsonKey] = serializedValue;
              break;
            }
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.OPTIONAL:
            {
              if (value == null) break;
              path.push(jsonKey);
              const serializedValue = Message.serializeValue(value, metadatum, path);
              path.pop();
              if (!isCorrectWireType(serializedValue, field.typeOfValue)) throw makeOptionalTypeError({
                primaryJsonKey
              }, value, field.typeOfValue, path);
              res[jsonKey] = serializedValue;
              break;
            }
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.REPEATED:
            {
              if (value == null) break;else if (!Array.isArray(value)) throw makeRepeatedTypeError({
                primaryJsonKey
              }, value, field.typeOfValue, path);else if (value.length === 0) break;
              const result = new Array(value.length);
              for (let i = 0; i < value.length; ++i) {
                path.push(`${jsonKey}[${i}]`);
                const serializedValue = Message.serializeValue(value[i], metadatum, path);
                path.pop();
                if (!isCorrectWireType(serializedValue, field.typeOfValue)) throw makeRequiredTypeError({
                  primaryJsonKey
                }, serializedValue, field.typeOfValue, [...path, jsonKey], i);
                result[i] = serializedValue;
              }
              res[jsonKey] = result;
              break;
            }
          case _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.MAP:
            {
              if (!(value instanceof Map)) throw new TypeError(`Expected Map for key "${primaryJsonKey}", found: ${moreSpecificTypeof(value)} ${pathTrace(path)}`);else if (value.size === 0) break;
              const map = {};
              for (const [key, mapValue] of value) {
                if (typeof key !== field.typeOfKey) throw new TypeError(`Expected ${field.typeOfKey} map key, found: ${moreSpecificTypeof(key)} ${pathTrace([...path, jsonKey])}`);
                path.push(`${jsonKey}["${key}"]`);
                const serializedValue = Message.serializeValue(mapValue, metadatum, path);
                path.pop();
                if (!isCorrectWireType(serializedValue, field.typeOfValue)) throw new TypeError(`Expected ${field.typeOfValue} map value for map key "${key}", found: ${moreSpecificTypeof(serializedValue)} ${pathTrace([...path, jsonKey])}`);
                map[key] = serializedValue;
              }
              res[jsonKey] = map;
              break;
            }
          default:
            throw new _preconditions_ts__WEBPACK_IMPORTED_MODULE_1__.UnreachableError(field);
        }
      }
      return res;
    };
    return Message;
  }
  /**
  * Creates a oneOf util from a given key and list of oneOf cases pair. The passed object
  * must contain a single key which is the runtime name of the discriminator field.
  * T must be provided and is the union type of the cases.
  *
  * <pre>
  *  const Baa: { type: 'BAA' } = createMessage(() => ({ type: constantString('A?', 'B', 'BAA')
  * })); const Zee: { type: 'ZEE' } = createMessage(() => ({ type: constantString('A?', 'Z',
  * 'ZEE') }));
  *
  *  type Foo = Baa | Zee;
  *
  *  const FooUtil = createOneof<Foo>(() => ({ type: [Baa, Fee] }));
  * </pre>
  @nocollapse __nocollapse_static_properties_plugin__ */
  static createOneof(schema, commonFields, options = {}) {
    const init = (0,_memoize_ts__WEBPACK_IMPORTED_MODULE_0__.memoize)(() => {
      // The cast here is to retrieve the private getFields method from MessageCtr type.
      // As proto.ts is intended for use only in generated protos, it's safe as createOneof is
      // only ever called with return values from createMessage.
      const config = schema();
      // retrieve the single key which is the runtime name of the discriminator field.
      const discriminatorKey = Object.keys(config)[0];
      let discriminatorTag;
      let discriminatorJsonKeyEncodings;
      const nameToObject = new Map();
      const serializedToObject = new Map();
      const tagToObject = new Map();
      // retrieve the jsonKey, json value and runtime value from the message field configs.
      for (let i = 0; i < config[discriminatorKey].length; i += 2) {
        const tag = config[discriminatorKey][i];
        const msg = config[discriminatorKey][i + 1];
        const msgFields = msg.init().fields;
        const discriminator = msgFields[discriminatorKey];
        if (!discriminator) throw new TypeError(`Missing discriminator.`);
        if (discriminator.fieldLabel !== _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT) throw new TypeError(`Discriminator must be FieldLabel.CONSTANT, was ${discriminator.fieldLabel}.}`);
        const caseDiscriminatorJsonKeyEncodings = choosePrimaryAndSecondaryJSONFromConfig(DISCRIMINATOR_JSON_MINI_KEY, discriminator.jsonFullKey, options.dualDeserializationConfig);
        const {
          primary: primaryJsonValue,
          secondary: secondaryJsonValue
        } = choosePrimaryAndSecondaryJSONFromConfig(toJsonMini(tag - 1), discriminator.jsonFullValue, options.dualDeserializationConfig);
        tagToObject.set(tag, {
          Msg: msg,
          value: discriminator.value
        });
        nameToObject.set(discriminator.value, msg);
        serializedToObject.set(primaryJsonValue, msg);
        if (secondaryJsonValue) serializedToObject.set(secondaryJsonValue, msg);
        // We want to confirm that all cases are trying to deserailize the same discriminator JSON key.
        if (discriminatorJsonKeyEncodings && discriminatorJsonKeyEncodings.primaryJsonKey !== caseDiscriminatorJsonKeyEncodings.primary) throw new TypeError(`oneOf JSON keys are not consistent. ${discriminatorJsonKeyEncodings.primaryJsonKey} ${caseDiscriminatorJsonKeyEncodings.primary}`);
        // ... even its secondary JSON key.
        if (discriminatorJsonKeyEncodings && discriminatorJsonKeyEncodings.secondaryJsonKey !== caseDiscriminatorJsonKeyEncodings.secondary) throw new TypeError(`oneOf secondary JSON keys are not consistent. ${discriminatorJsonKeyEncodings.secondaryJsonKey} ${caseDiscriminatorJsonKeyEncodings.secondary}`);
        discriminatorTag = discriminator.tag;
        // Update the discriminator JSON key encodings if we haven't already
        const {
          primary: primaryJsonKey,
          secondary: secondaryJsonKey
        } = caseDiscriminatorJsonKeyEncodings;
        discriminatorJsonKeyEncodings = {
          primaryJsonKey,
          secondaryJsonKey
        };
      }
      if (discriminatorJsonKeyEncodings == null || discriminatorTag == null) throw new TypeError('OneOf has no cases.');
      const fields = commonFields();
      const fieldNames = Object.keys(fields);
      const fieldsByTag = {};
      for (const name of fieldNames) fieldsByTag[fields[name].tag] = {
        ...fields[name],
        name
      };
      const defaultObject = options.defaultCase != null ? options.defaultCase() : undefined;
      return {
        kind: _internal_types__WEBPACK_IMPORTED_MODULE_2__.MessageKind.ONEOF,
        fieldMetadata: deriveFieldMetadata(fields, options.dualDeserializationConfig),
        discriminatorKey,
        nameToObject,
        discriminatorTag,
        discriminatorJsonKeyEncodings,
        serializedToObject,
        defaultObject,
        fields,
        fieldsByTag,
        constantsByTag: {},
        tagToObject
      };
    });
    const serializeWithPath = (t, path) => {
      const {
        discriminatorKey,
        nameToObject
      } = init();
      const type = t[discriminatorKey];
      const obj = nameToObject.get(type);
      if (!obj) throw new TypeError(`Unknown oneof deserialized case: ${JSON.stringify(type)} ${pathTrace(path)}`);
      return obj.serializeWithPath(t, path);
    };
    const deserializeWithPath = (o, path) => {
      const {
        serializedToObject,
        discriminatorJsonKeyEncodings,
        defaultObject
      } = init();
      const {
        primaryJsonKey,
        secondaryJsonKey
      } = discriminatorJsonKeyEncodings;
      let type = o[primaryJsonKey];
      if (type == null && secondaryJsonKey) type = o[secondaryJsonKey];
      if (type == null && defaultObject) return defaultObject.deserializeWithPath(o, path);
      const obj = serializedToObject.get(type);
      if (!obj) throw new TypeError(`Unknown oneof serialized case: ${JSON.stringify(type)} ${pathTrace(path)}`);
      return obj.deserializeWithPath(o, path);
    };
    return {
      init,
      serialize: t => serializeWithPath(t, []),
      serializeWithPath,
      deserialize: o => deserializeWithPath(o, []),
      deserializeWithPath
    };
  }
  /**
  * Creates an enum serialization and deserialization utility. Runtime values, json values
  * and configurations are passed in a single array to reduce the size of code.
  *
  * E.g.
  *
  * <pre>
  *   const enum Foo {
  *     VALUE_1 = 1,
  *     VALUE_2,
  *   }
  *
  *   const FooUtil = createEnumUtil<Foo>(() => [
  *    1, 'VALUE_1', { unproducible: true }
  *    2, 'VALUE_2',
  *   ])
  * </pre>
  @nocollapse __nocollapse_static_properties_plugin__ */
  static createEnumUtil(schema, baseNumber = 0, options = {}) {
    const init = (0,_memoize_ts__WEBPACK_IMPORTED_MODULE_0__.memoize)(() => {
      const config = schema();
      const values = [];
      const serializedToValue = new Map();
      const valueToSerialized = new Map();
      const valueToProtobufSerialized = new Map();
      const protobufSerializedToValue = new Map();
      const unproducible = new Set();
      // this is cursor that we'll walk through the config
      // when we "parse" a config element we increment it
      let i = 0;
      let index = 1;
      while (i < config.length) {
        const value = index++;
        // The 0th element is always the enum number
        const protobufSerialized = config[i];
        const jsonMiniValue = toJsonMini(protobufSerialized - baseNumber);
        i += 1;
        // The next element could be the JSON full value encoding
        let jsonFullValue;
        const maybeJsonFullValue = config[i];
        if (typeof maybeJsonFullValue === 'string') {
          jsonFullValue = maybeJsonFullValue;
          i += 1;
        }
        const {
          primary: primaryJsonValue,
          secondary: secondaryJsonValue
        } = choosePrimaryAndSecondaryJSONFromConfig(jsonMiniValue, jsonFullValue, options.dualDeserializationConfig);
        // The next element could also be an option object that indicates
        // something about an element prior to it.
        const maybeOptions = config[i];
        if (typeof maybeOptions === 'object' && maybeOptions.unproducible) {
          unproducible.add(value);
          i += 1;
        }
        values.push(value);
        serializedToValue.set(primaryJsonValue, value);
        if (secondaryJsonValue) serializedToValue.set(secondaryJsonValue, value);
        valueToSerialized.set(value, primaryJsonValue);
        valueToProtobufSerialized.set(value, protobufSerialized);
        protobufSerializedToValue.set(protobufSerialized, value);
      }
      return {
        values,
        valueToSerialized,
        valueToProtobufSerialized,
        protobufSerializedToValue,
        serializedToValue,
        unproducible: unproducible.size ? unproducible : undefined
      };
    });
    const getSerialized = (value, map, path) => {
      const {
        unproducible
      } = init();
      if (unproducible && unproducible.has(value)) throw new TypeError(`Unproducible enum value: ${JSON.stringify(value)} ${path ? pathTrace(path) : ''}`);
      const serialized = map.get(value);
      if (serialized == null) throw new TypeError(`The proto enum serializer failed to serialize value ${JSON.stringify(value)} into JSON.
It does not recognize value ${JSON.stringify(value)} as a valid member of the TypeScript enum.
${path ? pathTrace(path) : ''}`);
      return serialized;
    };
    const deserializeWithPath = (jsonValue, path) => {
      const value = init().serializedToValue.get(jsonValue);
      if (value == null) throw new TypeError(`The proto enum deserializer failed to deserialize JSON ${JSON.stringify(jsonValue)} into an enum value.
It does not recognize JSON ${JSON.stringify(jsonValue)} as a valid JSON value encoding of the enum.
${pathTrace(path)}`);
      return value;
    };
    return {
      values: () => init().values,
      producibleValues: () => {
        const {
          values,
          unproducible
        } = init();
        if (unproducible == null) return values;
        return values.filter(value => !unproducible.has(value));
      },
      serialize: value => {
        return getSerialized(value, init().valueToSerialized, []);
      },
      serializeWithPath: (value, path) => {
        return getSerialized(value, init().valueToSerialized, path);
      },
      deserialize: jsonValue => {
        return deserializeWithPath(jsonValue, []);
      },
      deserializeWithPath
    };
  }
}
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredDouble = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.DOUBLE, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredInt32 = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.INT32, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredInt64 = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.INT64, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalDouble = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.DOUBLE, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalInt32 = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.INT32, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalInt64 = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.INT64, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedDouble = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.DOUBLE, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedInt32 = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.INT32, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedInt64 = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.INT64, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredString = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.STRING, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalString = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.STRING, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedString = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.STRING, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredBoolean = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.BOOLEAN, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalBoolean = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.BOOLEAN, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedBoolean = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.BOOLEAN, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.requiredBytes = (a, b, c) => {
  const {
    tag,
    jsonFullKey,
    other1
  } = getOptions(a, b, c);
  return requiredField(ProtoType.BYTES, jsonFullKey, tag, other1);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.optionalBytes = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return optionalField(ProtoType.BYTES, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.repeatedBytes = (a, b) => {
  const {
    tag,
    jsonFullKey
  } = getOptions(a, b);
  return repeatedField(ProtoType.BYTES, jsonFullKey, tag);
};
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32Int32Map = mapField(ProtoType.INT32, ProtoType.INT32);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32Int64Map = mapField(ProtoType.INT32, ProtoType.INT64);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32BoolMap = mapField(ProtoType.INT32, ProtoType.BOOLEAN);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32DoubleMap = mapField(ProtoType.INT32, ProtoType.DOUBLE);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32StringMap = mapField(ProtoType.INT32, ProtoType.STRING);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32StringEnumMap = mapField(ProtoType.INT32, 'enum');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32ObjectMap = mapField(ProtoType.INT32, 'object');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int32BytesMap = mapField(ProtoType.INT32, ProtoType.BYTES);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64Int32Map = mapField(ProtoType.INT64, ProtoType.INT32);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64Int64Map = mapField(ProtoType.INT64, ProtoType.INT64);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64BoolMap = mapField(ProtoType.INT64, ProtoType.BOOLEAN);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64DoubleMap = mapField(ProtoType.INT64, ProtoType.DOUBLE);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64StringMap = mapField(ProtoType.INT64, ProtoType.STRING);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64StringEnumMap = mapField(ProtoType.INT64, 'enum');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64ObjectMap = mapField(ProtoType.INT64, 'object');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.int64BytesMap = mapField(ProtoType.INT64, ProtoType.BYTES);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleInt32Map = mapField(ProtoType.DOUBLE, ProtoType.INT32);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleInt64Map = mapField(ProtoType.DOUBLE, ProtoType.INT64);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleBoolMap = mapField(ProtoType.DOUBLE, ProtoType.BOOLEAN);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleDoubleMap = mapField(ProtoType.DOUBLE, ProtoType.DOUBLE);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleStringMap = mapField(ProtoType.DOUBLE, ProtoType.STRING);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleStringEnumMap = mapField(ProtoType.DOUBLE, 'enum');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleObjectMap = mapField(ProtoType.DOUBLE, 'object');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.doubleBytesMap = mapField(ProtoType.DOUBLE, ProtoType.BYTES);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringInt32Map = mapField(ProtoType.STRING, ProtoType.INT32);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringInt64Map = mapField(ProtoType.STRING, ProtoType.INT64);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringBooleanMap = mapField(ProtoType.STRING, ProtoType.BOOLEAN);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringDoubleMap = mapField(ProtoType.STRING, ProtoType.DOUBLE);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringStringMap = mapField(ProtoType.STRING, ProtoType.STRING);
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringStringEnumMap = mapField(ProtoType.STRING, 'enum');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringObjectMap = mapField(ProtoType.STRING, 'object');
/** @nocollapse __nocollapse_static_properties_plugin__ */
Proto.stringBytesMap = mapField(ProtoType.STRING, ProtoType.BYTES);
/**
 * Given a map of names to field configs, creates a list of field metadata.
 *
 * Each field metadatum contains the field config, the field name, and all
 * associated JSON encodings - all the data necessary to serialize and
 * deserialize a field.
 */
function deriveFieldMetadata(fields,
//
dualDeserializationConfig) {
  return Object.entries(fields).map(([name, config]) => {
    const fieldEncodings = deriveFieldEncodings(config, dualDeserializationConfig);
    return {
      config,
      name,
      primaryJsonKey: fieldEncodings.keyEncodings.primaryJsonKey,
      secondaryJsonKey: fieldEncodings.keyEncodings.secondaryJsonKey,
      primaryJsonValue: fieldEncodings.valueEncodings?.primaryJsonValue,
      secondaryJsonValue: fieldEncodings.valueEncodings?.secondaryJsonValue
    };
  });
}
/**
 * Given a field config, this function will return its JSON key encodings,
 * and if its a constant field, its JSON value encodings.
 */
function deriveFieldEncodings(fieldConfig, dualDeserializationConfig) {
  let valueEncodings;
  let jsonMiniKey = toJsonMini(fieldConfig.tag - 1);
  if (fieldConfig.fieldLabel === _internal_types__WEBPACK_IMPORTED_MODULE_2__.FieldLabel.CONSTANT) {
    const {
      primary: primaryJsonValue,
      secondary: secondaryJsonValue
    } = choosePrimaryAndSecondaryJSONFromConfig(jsonMiniKey, fieldConfig.jsonFullValue, dualDeserializationConfig);
    jsonMiniKey = DISCRIMINATOR_JSON_MINI_KEY;
    valueEncodings = {
      primaryJsonValue,
      secondaryJsonValue
    };
  }
  const {
    primary: primaryJsonKey,
    secondary: secondaryJsonKey
  } = choosePrimaryAndSecondaryJSONFromConfig(jsonMiniKey, fieldConfig.jsonFullKey, dualDeserializationConfig);
  const keyEncodings = {
    primaryJsonKey,
    secondaryJsonKey
  };
  return {
    keyEncodings,
    valueEncodings
  };
}
/**
 * This function forms the core of the Dual Deserialization feature. It
 * configures key and value lookups in response to different Dual Deserialization configs
 * and parameterisations of field descriptor options.
 *
 * @param encodings The JSON mini and full encodings of the key or value.
 * @param dualDeserializationConfig The Dual Deserialization config for the construct,
 *   which we need to determine the correct ordering of the primary and secondary
 *   JSON.
 * @returns The primary and secondary JSON for the key or value.
 */
function choosePrimaryAndSecondaryJSONFromConfig(jsonMini, jsonFull, dualDeserializationConfig) {
  if (!jsonFull) {
    // If we have only the mini key, then we can't do Dual Deserialization.
    // This rules out having a secondary key.
    if (dualDeserializationConfig !== undefined)
      // We'd also expect there to be no Dual Deserialization config otherwise
      // something is gravely wrong with the Protogen<->proto.ts templating
      // contract.
      throw new Error("Dual Deserialization config templated but JSON full key/value wasn't");
    return {
      primary: jsonMini
    };
  }
  if (dualDeserializationConfig === undefined)
    // In the case that we do have a JSON full key but no Dual Deserialization
    // config, the full key was provided by the Protogen templating engine
    // for the explicit purpose of deserializing the JSON full key. Thus,
    // we can set it to be the primary key.
    return {
      primary: jsonFull
    };else if (dualDeserializationConfig === 0) return {
    primary: jsonMini,
    secondary: jsonFull
  };else if (dualDeserializationConfig === 1) return {
    primary: jsonFull,
    secondary: jsonMini
  };
  throw new Error("function should have been exhaustive, but wasn't");
}
function makeRepeatedTypeError(keyEncodings, value, expectedType, path) {
  return new TypeError(`Expected repeated ${expectedType} value for key ${expectedKeys(keyEncodings)}, found: ${moreSpecificTypeof(value)} ${pathTrace(path)}`);
}
function makeOptionalTypeError(keyEncodings, value, expectedType, path) {
  return new TypeError(`Expected optional ${expectedType} value for key ${expectedKeys(keyEncodings)}, found: ${moreSpecificTypeof(value)} ${pathTrace(path)}`);
}
function makeRequiredTypeError(keyEncodings, value, expectedType, path, index) {
  const atIndex = index !== undefined ? ` at index ${index}` : '';
  return new TypeError(`Expected ${expectedType} value${atIndex} for key ${expectedKeys(keyEncodings)}, found: ${moreSpecificTypeof(value)} ${pathTrace(path)}`);
}
function expectedKeys(keyEncodings) {
  const {
    primaryJsonKey,
    secondaryJsonKey
  } = keyEncodings;
  if (secondaryJsonKey) return `either "${primaryJsonKey}" OR "${secondaryJsonKey}"`;
  return `"${primaryJsonKey}"`;
}
function expectedValues(valueEncodings) {
  const {
    primaryJsonValue,
    secondaryJsonValue
  } = valueEncodings;
  if (secondaryJsonValue) return `either "${primaryJsonValue}" OR "${secondaryJsonValue}"`;
  return `"${primaryJsonValue}"`;
}
function pathTrace(path) {
  return `(path: .${path.join('.')})`;
}
/**
 * An alternative to the typeof operator that provides slightly better type names.
 */
function moreSpecificTypeof(value) {
  // eslint-disable-next-line eqeqeq
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
/** @enum {number} */
const DualDeserializationConfig = {
  MINI_PRIMARY_FULL_SECONDARY: 0,
  FULL_PRIMARY_MINI_SECONDARY: 1
};
/** String used for oneof discriminators under JSON mini encoding. */
const DISCRIMINATOR_JSON_MINI_KEY = 'A?';
/** Characters used for constructing JSON mini keys and values. */
const JSON_MINI_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** Maps a 0-based number to a short string, suitable for use as a JSON key. */
function toJsonMini(x) {
  // Like Integer.toString(id, radix), but for radix = 64, since JDK only goes up to 36.
  if (x < JSON_MINI_ALPHABET.length) return JSON_MINI_ALPHABET.charAt(x);else {
    const builder = [];
    while (x > 0) {
      builder.push(JSON_MINI_ALPHABET.charAt(x % JSON_MINI_ALPHABET.length));
      x = Math.floor(x / JSON_MINI_ALPHABET.length);
    }
    return builder.reverse().join('');
  }
}
function getOptions(tagOrJsonFullKey, tagOrOther1, other1OrOther2, maybeOther2) {
  if (typeof tagOrJsonFullKey === 'string') return {
    jsonFullKey: tagOrJsonFullKey,
    tag: tagOrOther1,
    other1: other1OrOther2,
    other2: maybeOther2
  };else return {
    tag: tagOrJsonFullKey,
    other1: tagOrOther1,
    other2: other1OrOther2
  };
}
/**
 * This function verifies that value is of the correct wire type as per
 * the field's metadata.
 * It's used both:
 * - pre-deserialization (as a validation), and
 * - post-serialization (as an assertion).
 *
 * In some cases, the wiretype representation is the same as the runtime representation
 * (a JSON number is a JavaScript number), sometimes they diverge:
 * the runtime representation of a `bytes` field is a `Uint8Array`,
 * while its wiretype representation is a Base64 string.
 *
 * This function's semantics are intrinsically related to the behaviour of
 * `Message.deserializeValue` and `Message.serializeValue`.
 */
function isCorrectWireType(value, typeOfValue) {
  // we need to special case the Uint8Array check because `typeof new Uint8Array()` is 'object'
  return typeof value === typeOfValue || isCorrectBytesWireType(value, typeOfValue);
}
function isCorrectBytesWireType(value, typeOfValue) {
  // This method name is a bit of a lie, in that it doesn't technically check
  // if the value is a Base64 string. We let `atob` at deserialization time
  // do that for us.
  return typeOfValue === 'Uint8Array' && typeof value === 'string';
}
// The following are _the_ MDN endorsed functions for Base64 encoding and decoding.
function toBase64(bytes) {
  const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}
function fromBase64(base64) {
  // @ts-ignore no overload matches this call.
  // We have to assume that the input is a valid Base64 string and checking
  // whether codePointAt returns `undefined` tanks performance.
  return Uint8Array.from(atob(base64), m => m.codePointAt(0));
}

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   memoize: () => (/* binding */ memoize),
/* harmony export */   memoize1: () => (/* binding */ memoize1)
/* harmony export */ });
/* harmony import */ var _preconditions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _result__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
// Copyright 2021 Canva Inc. All Rights Reserved.


function isPromiseLike(p) {
  return p != null && p.then != null;
}
/**
 * Returns a function that caches the result returned by invoking `fn`, with an option
 * to have the cache invalidated on errors or on promise rejection.
 *
 * If `fn` is successfully invoked, repeat calls to the returned function will
 * return the cached value from the successful invocation. `fn` won't be invoked
 * anymore from that point on.
 *
 * If `fn` is a synchronous function and `fn` throws an error:
 *   - if `invalidateOnError` is `true`: the cache will be invalidated;
 *   - if `invalidateOnError` is `false`: errors are cached and rethrown on
 *     subsequent calls.
 *
 * If `fn` is a PromiseLike-returning function and the returned promise rejects:
 *   - if `invalidateOnError` is `true`: the cache will be invalidated once the
 *     promise rejects, or immediately if the promise is already rejected;
 *   - if `invalidateOnError` is `false`: the returned promise will always be
 *     cached and returned as is, even after it rejects.
 *
 * The returned function will not forward any arguments to `fn`.
 *
 * Example for synchronous functions:
 * <pre>
 *   const expensiveFn = () => { return 5; }
 *   const memoizedFn = memoize(expensiveFn);
 *   const result = memoizedFn(); // 5
 *   const cachedResult = memoizedFn(); // 5
 * </pre>
 *
 * Example for promise-returning functions:
 * <pre>
 *   const loader = async () => {
 *     const { SomeClient } = await import('some/client');
 *     return new SomeClient(someService);
 *   };
 *   const memoizedLoader = memoize(loader);
 *   const result = await memoizedLoader(); // SomeService
 *   const cachedResult = await memoizedLoader(); // SomeService
 * </pre>
 *
 * @param fn Function to be memoized
 * @param opts Optional configuration. Defaults to `{ invalidateOnError: false }`
 * @returns The memoized function
 */
function memoize(fn, {
  invalidateOnError
} = {
  invalidateOnError: false
}) {
  // A fn.length === 0 check is not performed here, as it would reject a valid use case of optional
  // args i.e. `(x?) => ...` and `(x = a) => ...`.
  let promiseDidReject = false;
  let result;
  // This function is called a lot. Avoid capturing any state we don't strictly need in the closure.
  const memoFn = (...args) => {
    _preconditions__WEBPACK_IMPORTED_MODULE_0__.Preconditions.checkArgument(args.length === 0);
    if (result == null || invalidateOnError && (!result.ok || promiseDidReject)) try {
      // Ensure we havent cached the error from the last time we called function.
      promiseDidReject = false;
      result = _result__WEBPACK_IMPORTED_MODULE_1__.Result.Ok(fn());
      if (isPromiseLike(result.value))
        // On promise rejection, we keep track of this state via `promiseDidReject`
        // instead of reassigning 'result' to a `Result.Err(e)`. When `invalidateOnError`
        // is `false`, the latter would cause subsequent function calls to synchronously
        // throw, which isn't what consumers would expect when dealing with an `fn` that
        // returns a PromiseLike. The former honours the asynchronous rejection path, which is
        // what we want when `memoFn` has a PromiseLike return type.
        /**
        * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
        * ```
        * If you call the then() method twice on the same promise object (instead of chaining),
        * then this promise object will have two pairs of settlement handlers. All handlers
        * attached to the same promise object are always called in the order they were added.
        * ```
        * Because of this, the following .then should resolve before any await on the returned promise.
        */ //
        result.value.then(null, _e => promiseDidReject = true);
    } catch (e) {
      result = _result__WEBPACK_IMPORTED_MODULE_1__.Result.Err(e);
    }
    if (result.ok) return result.value;else throw result.error;
  };
  return memoFn;
}
/**
 * Returns a function that caches the result returned by invoking `fn(key)`.
 *
 * Like {@link memoize}, a new cache is created for every `memoize1(fn)` call (i.e. the cache is not
 * globally shared).
 *
 * This differs from `memoize` in the following ways:
 * - It supports functions that have a single non-primitive argument, and results are memoized per
 *   argument reference.
 * - There is no special handling of `PromiseLike` results.
 * - Errors are not memoized.
 *
 * @example
 * ```
 * let i = 1;
 * const fn = memoize1((_: WeakKey) => i++);
 * const a = {};
 * fn(a)  // 1
 * fn(a)  // 1
 * fn({}) // 2
 * ```
 */
function memoize1(fn) {
  const cache = new WeakMap();
  const memoFn = (key, ...rest) => {
    _preconditions__WEBPACK_IMPORTED_MODULE_0__.Preconditions.checkArgument(rest.length === 0);
    if (!cache.has(key)) cache.set(key, fn(key));
    return cache.get(key);
  };
  return memoFn;
}

/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FieldLabel: () => (/* reexport safe */ _public_types__WEBPACK_IMPORTED_MODULE_0__.FieldLabel),
/* harmony export */   MessageKind: () => (/* reexport safe */ _public_types__WEBPACK_IMPORTED_MODULE_0__.MessageKind)
/* harmony export */ });
/* harmony import */ var _public_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21);
// Copyright 2021 Canva Inc. All Rights Reserved.

// reexports



/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FieldKind: () => (/* binding */ FieldKind),
/* harmony export */   FieldLabel: () => (/* binding */ FieldLabel),
/* harmony export */   MessageKind: () => (/* binding */ MessageKind)
/* harmony export */ });
/** @enum {number} */
const MessageKind = {
  CONCRETE: 1,
  ONEOF: 2
};
/** @enum {number} */
const FieldLabel = {
  CONSTANT: 1,
  REQUIRED: 2,
  OPTIONAL: 3,
  REPEATED: 4,
  MAP: 5
};
/** @enum {number} */
const FieldKind = {
  PRIMITIVE: 1,
  MESSAGE: 2,
  ENUM: 3
};

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ErrorServiceImpl: () => (/* binding */ ErrorServiceImpl)
/* harmony export */ });
// Copyright 2025 Canva Inc. All Rights Reserved.
class ErrorServiceImpl {
    createChild(name) {
        return this;
    }
    withOfflineStatus() {
    // noop
    }
    setContext(context) {
        this.logger.debug('context set', context);
    }
    setTag(key, value) {
        this.logger.debug('tag set', key, value);
    }
    addBeforeSendHandler() {
    // noop
    }
    setFilters() {
    // noop
    }
    setSensitiveStrings(sensitiveStrings) {
    // noop
    }
    addBreadCrumb(breadCrumb) {
        this.logger.debug('breadcrumb added', breadCrumb);
    }
    debug(error, extra) {
        this.logger.debug(error, extra);
    }
    info(error, extra) {
        this.logger.info(error, extra);
    }
    warning(error, extra) {
        this.logger.warn(error, extra);
    }
    warningException(error, extra) {
        this.logger.warn(error, extra);
    }
    error(error, extra) {
        this.logger.error(error, extra);
    }
    errorException(error, extra) {
        this.logger.error(error, extra);
    }
    critical(error, extra) {
        this.logger.error(error, extra);
    }
    criticalException(error, extra) {
        this.logger.error(error, extra);
    }
    constructor(logger){
        this.logger = logger;
    }
}


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Logger: () => (/* binding */ Logger)
/* harmony export */ });
class Logger {
    log(method, ...args) {
        // eslint-disable-next-line no-console
        console[method](`[CLIENT (${this.context})]`, ...args);
    }
    info(...args) {
        this.log('info', ...args);
    }
    warn(...args) {
        this.log('warn', ...args);
    }
    error(...args) {
        this.log('error', ...args);
    }
    debug(...args) {
        this.log('debug', ...args);
    }
    constructor(context){
        this.context = context;
    }
}


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SdkResult: () => (/* binding */ SdkResult)
/* harmony export */ });
/**
 * A Result type that represents either a successful operation with data or a failed operation with an error.
 * This is returned by window.dataSdk methods to indicate success or failure without throwing exceptions.
 *
 * @template T The type of the success value
 * @template E The type of the error value (defaults to Error)
 *
 * @example
 * ```javascript
 * // Results are returned by window.dataSdk methods
 * const result = await window.dataSdk.create({ name: "Item Name", active: true });
 * if (result.isOk) {
 *   // Handle success appropriately within the application if necessary
 * } else {
 *   // Display an error message to the user
 * }
 * ```
 */ class SdkResult {
    /** @internal Creates a successful Result - used internally by the SDK  @nocollapse __nocollapse_static_properties_plugin__ */ static ok(data) {
        return new SdkResult(true, data, undefined);
    }
    /** @internal Creates a failed Result - used internally by the SDK  @nocollapse __nocollapse_static_properties_plugin__ */ static error(error) {
        return new SdkResult(false, undefined, error);
    }
    get isOk() {
        return this._success;
    }
    get isError() {
        return !this._success;
    }
    get data() {
        if (!this._success) throw new Error('Cannot access data on error result');
        return this._data;
    }
    get error() {
        if (this._success) throw new Error('Cannot access error on success result');
        return this._error;
    }
    constructor(_success, _data, _error){
        this._success = _success;
        this._data = _data;
        this._error = _error;
    }
}


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FetchPersistenceService: () => (/* binding */ FetchPersistenceService),
/* harmony export */   HttpError: () => (/* binding */ HttpError)
/* harmony export */ });
/* harmony import */ var _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26);

const MUTATION_RATE_LIMIT_MS = 500;
const RATE_LIMIT_THRESHOLD = 5;
/**
 * Custom error type that includes HTTP status code information
 */ class HttpError extends Error {
    constructor(message, status, statusText){
        super(message), this.status = status, this.statusText = statusText;
        this.name = 'HttpError';
    }
}
function maybeRemoveHtmlFileFromUrl(urlString) {
    try {
        const url = new URL(urlString);
        const pathname = url.pathname;
        const lastSegment = pathname.split('/').pop() || '';
        if (!lastSegment.toLowerCase().endsWith('.html')) return urlString;
        // Remove the last segment (the HTML file)
        const pathParts = pathname.split('/');
        pathParts.pop();
        const newPath = pathParts.join('/');
        // Ensure trailing slash
        url.pathname = newPath.endsWith('/') || newPath === '' ? newPath || '/' : newPath + '/';
        return url.toString();
    } catch (error) {
        // If something fails (i.e. URL parsing), return the original string
        return urlString;
    }
}
function createFullUrl(localPath, documentId, elementId, websiteContext) {
    const baseUrl = window.location.href;
    // Remove any trailing HTML file reference from baseUrl if present.
    // For example:
    // - https://codeletId.canvacode.com/codelet/codeletAccessToken/index.html -> https://codeletId.canvacode.com/codelet/codeletAccessToken/
    // - https://codeletId.canvacode.com/codelet/codeletAccessToken/ -> https://codeletId.canvacode.com/codelet/codeletAccessToken/
    const baseUrlWithoutHtmlFile = maybeRemoveHtmlFileFromUrl(baseUrl);
    // Remove trailing slash from baseUrl if present
    const normalizedBaseUrl = baseUrlWithoutHtmlFile.endsWith('/') ? baseUrlWithoutHtmlFile.slice(0, -1) : baseUrlWithoutHtmlFile;
    // Add leading slash to localPath if not present
    const normalizedLocalPath = localPath.startsWith('/') ? localPath : '/' + localPath;
    const url = new URL(normalizedBaseUrl + normalizedLocalPath);
    if (documentId) url.searchParams.set('document_id', documentId);
    if (elementId) url.searchParams.set('element_id', elementId);
    if (websiteContext) {
        url.searchParams.set('website_deployment_id', websiteContext.deploymentId);
        url.searchParams.set('website_access_token', websiteContext.accessToken);
    }
    return url.toString();
}
/**
 * Persistence service to send data to the cloudflare worker using protobuf definitions.
 */ class FetchPersistenceService {
    /**
   * Rate limits mutation operations (create, update) to prevent cascading effects.
   * Throws an error if mutations happen more frequently than MUTATION_RATE_LIMIT_MS.
   */ checkRateLimit() {
        const now = Date.now();
        const timeSinceLastMutation = now - this.lastMutationTimestamp;
        if (timeSinceLastMutation < this.rateLimitMs) {
            this.consecutiveRateLimitBreaches++;
            if (this.consecutiveRateLimitBreaches >= this.rateLimitThreshold) {
                const waitTime = this.rateLimitMs - timeSinceLastMutation;
                throw new HttpError(`Rate limit exceeded. Please wait ${waitTime}ms before making another mutation request.`, 429, 'Too Many Requests');
            }
        } else this.consecutiveRateLimitBreaches = 0;
        this.lastMutationTimestamp = now;
    }
    async create(record, documentId, elementId, websiteContext) {
        this.checkRateLimit();
        const request = new _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.CreateCodeletSdkSubmissionRequest({
            data: JSON.stringify(record),
            documentId,
            elementId,
            websiteDeploymentId: websiteContext?.deploymentId,
            websiteAccessToken: websiteContext?.accessToken
        });
        const response = await fetch(createFullUrl('/data/create'), {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify(_codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.CreateCodeletSdkSubmissionRequest.serialize(request))
        });
        if (!response.ok) throw new HttpError(`Failed to create record: ${response.status} ${response.statusText}`, response.status, response.statusText);
        const responseData = await response.json();
        const responseProto = _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.CreateCodeletSdkSubmissionResponse.deserialize(responseData);
        if (!responseProto?.submission?.id) throw new Error('Failed to create record: backend did not return an id');
        return {
            ...record,
            __backendId: responseProto.submission.id
        };
    }
    async update(record, documentId, elementId, websiteContext) {
        this.checkRateLimit();
        const cleanRecord = {
            ...record
        };
        delete cleanRecord.__backendId;
        const request = new _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.UpdateCodeletSdkSubmissionRequest({
            submissionId: record.__backendId,
            data: JSON.stringify(cleanRecord),
            documentId,
            elementId,
            websiteDeploymentId: websiteContext?.deploymentId,
            websiteAccessToken: websiteContext?.accessToken
        });
        const response = await fetch(createFullUrl('/data/update'), {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify(_codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.UpdateCodeletSdkSubmissionRequest.serialize(request))
        });
        if (!response.ok) throw new HttpError(`Failed to update record: ${response.status} ${response.statusText}`, response.status, response.statusText);
        const responseData = await response.json();
        _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.UpdateCodeletSdkSubmissionResponse.deserialize(responseData);
        return record;
    }
    async delete(id, documentId, elementId, websiteContext) {
        const request = new _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.DeleteCodeletSdkSubmissionRequest({
            submissionId: id,
            documentId,
            elementId,
            websiteDeploymentId: websiteContext?.deploymentId,
            websiteAccessToken: websiteContext?.accessToken
        });
        const response = await fetch(createFullUrl('/data/remove'), {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json'
            },
            body: JSON.stringify(_codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.DeleteCodeletSdkSubmissionRequest.serialize(request))
        });
        if (!response.ok) throw new HttpError(`Failed to delete record: ${response.status} ${response.statusText}`, response.status, response.statusText);
        const responseData = await response.json();
        _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.DeleteCodeletSdkSubmissionResponse.deserialize(responseData);
    }
    async read(documentId, elementId, websiteContext) {
        const response = await fetch(createFullUrl('/data/getAll', documentId, elementId, websiteContext), {
            method: 'GET',
            headers: {
                ['Content-Type']: 'application/json'
            }
        });
        if (!response.ok) throw new HttpError(`Failed to read record: ${response.status} ${response.statusText}`, response.status, response.statusText);
        const responseData = await response.json();
        const submissionData = _codelet_data_cloudflare_sdk_proto__WEBPACK_IMPORTED_MODULE_0__.FindCodeletSdkSubmissionsResponse.deserialize(responseData);
        // Parse the serialized submissions back to T objects
        const deserializedSubmissions = [];
        for (const submission of submissionData.enrichedSubmissions)try {
            const id = submission.id;
            const parsed = JSON.parse(submission.data);
            deserializedSubmissions.push({
                ...parsed,
                __backendId: id
            });
        } catch (error) {
            throw new Error(`Failed to parse submission: ${submission}, ${error}`);
        }
        return {
            submissions: deserializedSubmissions,
            pollingRateMs: submissionData.pollEveryMs
        };
    }
    constructor(rateLimitMs = MUTATION_RATE_LIMIT_MS, rateLimitThreshold = RATE_LIMIT_THRESHOLD){
        this.rateLimitMs = rateLimitMs;
        this.rateLimitThreshold = rateLimitThreshold;
        this.lastMutationTimestamp = 0;
        this.consecutiveRateLimitBreaches = 0;
    }
}


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CodeletSdkSubmission: () => (/* binding */ CodeletSdkSubmission),
/* harmony export */   CreateCodeletSdkSubmissionRequest: () => (/* binding */ CreateCodeletSdkSubmissionRequest),
/* harmony export */   CreateCodeletSdkSubmissionResponse: () => (/* binding */ CreateCodeletSdkSubmissionResponse),
/* harmony export */   DeleteCodeletSdkSubmissionRequest: () => (/* binding */ DeleteCodeletSdkSubmissionRequest),
/* harmony export */   DeleteCodeletSdkSubmissionResponse: () => (/* binding */ DeleteCodeletSdkSubmissionResponse),
/* harmony export */   FindCodeletSdkSubmissionsRequest: () => (/* binding */ FindCodeletSdkSubmissionsRequest),
/* harmony export */   FindCodeletSdkSubmissionsResponse: () => (/* binding */ FindCodeletSdkSubmissionsResponse),
/* harmony export */   UpdateCodeletSdkSubmissionRequest: () => (/* binding */ UpdateCodeletSdkSubmissionRequest),
/* harmony export */   UpdateCodeletSdkSubmissionResponse: () => (/* binding */ UpdateCodeletSdkSubmissionResponse)
/* harmony export */ });
/* harmony import */ var _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(18);
// @formatter:off
// Copyright Canva Inc. All Rights Reserved.
// Generated from ui/rendering/codelet/sdk/scripts/data/codelet_data_cloudflare_sdk.proto.

/** A codelets submission data with the associated id */
const CodeletSdkSubmission = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  id: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* A */1),
  data: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* B */2)
}));
/**
 * Request to create a new submission via the Codelet SDK.
 * A submission represents a single data object defined by an LLM-generated codelet application that
 * needs to be persisted. The SDK handles serialization of the data object into a string format for
 * storage.
 */
const CreateCodeletSdkSubmissionRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  data: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* A */1),
  documentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* B */2),
  elementId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* C */3),
  websiteDeploymentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* D */4),
  websiteAccessToken: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* E */5)
}));
/**
 * Response returned after successfully creating a codelet submission.
 * Currently empty as the operation only needs to confirm successful creation.
 */
const CreateCodeletSdkSubmissionResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  submission: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalObject(/* A */1, CodeletSdkSubmission)
}));
/**
 * Request to retrieve all submissions for a codelet.
 * Used by the SDK's polling mechanism to fetch the latest data for the embedded codelet
 * application. No parameters are required as submissions are scoped to the current codelet context
 * and the codelet id is extracted from the url that the cloudflare worker intercepts,
 * https://<codelet-id>.canva-hosted-embed.com/codelet/<access-token>/data/<method>
 */
const FindCodeletSdkSubmissionsRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  documentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* A */1),
  elementId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* B */2),
  websiteDeploymentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* C */3),
  websiteAccessToken: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* D */4)
}));
/**
 * Response containing all available submissions for the requesting codelet.
 * The SDK will deserialize these string submissions back into their original data object format for
 * use by the codelet application.
 */
const FindCodeletSdkSubmissionsResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  enrichedSubmissions: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.repeatedObject(/* B */2, CodeletSdkSubmission),
  pollEveryMs: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalInt32(/* C */3)
}));
/**
 * Request to update an existing submission via the Codelet SDK.
 * Updates the data of an existing submission identified by its ID.
 */
const UpdateCodeletSdkSubmissionRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  submissionId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* A */1),
  data: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* B */2),
  documentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* C */3),
  elementId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* D */4),
  websiteDeploymentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* E */5),
  websiteAccessToken: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* F */6)
}));
/**
 * Response returned after successfully updating a codelet submission.
 * Currently empty as the operation only needs to confirm successful update.
 */
const UpdateCodeletSdkSubmissionResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({}));
/**
 * Request to delete an existing submission via the Codelet SDK.
 * Removes a submission identified by its ID from the codelet's stored data.
 */
const DeleteCodeletSdkSubmissionRequest = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({
  submissionId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.requiredString(/* A */1),
  documentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* B */2),
  elementId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* C */3),
  websiteDeploymentId: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* D */4),
  websiteAccessToken: _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.optionalString(/* E */5)
}));
/**
 * Response returned after successfully deleting a codelet submission.
 * Currently empty as the operation only needs to confirm successful deletion.
 */
const DeleteCodeletSdkSubmissionResponse = _base_proto_proto_ts__WEBPACK_IMPORTED_MODULE_0__.Proto.createMessage(() => ({}));

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CodeletDataSdk: () => (/* binding */ CodeletDataSdk),
/* harmony export */   areDataObjectArraysEqual: () => (/* binding */ areDataObjectArraysEqual)
/* harmony export */ });
/* harmony import */ var _apps_developing_sandbox_comms_connect_to_parent_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _data_comms_client_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(14);
/* harmony import */ var _data_payloads_proto_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(17);
/* harmony import */ var _error_service_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);
/* harmony import */ var _logger_ts__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(23);
/* harmony import */ var _sdk_result__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(24);
/* harmony import */ var _fetch_persistence_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(25);
// Copyright 2025 Canva Inc. All Rights Reserved.







const TARGET_ORIGIN = '*';
const DEFAULT_POLLING_INTERVAL_MS = 2500;
const TERMINAL_POLLING_ERROR_CODES = [
    403,
    501
];
/**
 * Deeply compares two `DataObject`s where values are primitives.
 * Key presence matters: a missing key is not equal to a key with value `undefined`.
 */ function areDataObjectsEqual(a, b) {
    if (a === b) return true;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys){
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        const aValue = a[key];
        const bValue = b[key];
        if (!Object.is(aValue, bValue)) return false;
    }
    return true;
}
/**
 * Deeply compares two arrays of `DataObject`s (order-sensitive).
 * Arrays are considered equal only if they have the same length and each
 * corresponding element is deeply equal according to `areDataObjectsEqual`.
 */ function areDataObjectArraysEqual(a, b) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for(let index = 0; index < a.length; index += 1){
        if (!areDataObjectsEqual(a[index], b[index])) return false;
    }
    return true;
}
class CodeletDataSdk {
    async setupCommsClient() {
        const errorService = new _error_service_ts__WEBPACK_IMPORTED_MODULE_3__.ErrorServiceImpl(this.logger);
        const result = await this.connectToParent(errorService, TARGET_ORIGIN, window, _data_comms_client_ts__WEBPACK_IMPORTED_MODULE_1__.DATA_CLIENT_ID);
        if (!result.ok) return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(new Error('Failed to establish connection to parent'));
        this.logger.info('Successfully connected to parent');
        const commsClient = this.createDataClientComms(result.value);
        this.commsClient = commsClient;
        return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(commsClient);
    }
    async create(record) {
        try {
            if (!this.dataHandler) return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(new Error('SDK must be initialized with init() before calling create()'));
            await this.persistenceService.create(record, this.documentId, this.elementId, this.websiteContext);
            const readResult = await this.read();
            return readResult.isError ? _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(readResult.error) : _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(undefined);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(error);
        }
    }
    async update(record) {
        try {
            if (!this.dataHandler) return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(new Error('SDK must be initialized with init() before calling update()'));
            await this.persistenceService.update(record, this.documentId, this.elementId, this.websiteContext);
            const readResult = await this.read();
            return readResult.isError ? _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(readResult.error) : _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(undefined);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(error);
        }
    }
    async delete(record) {
        try {
            if (!this.dataHandler) return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(new Error('SDK must be initialized with init() before calling delete()'));
            await this.persistenceService.delete(record.__backendId, this.documentId, this.elementId, this.websiteContext);
            const readResult = await this.read();
            return readResult.isError ? _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(readResult.error) : _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(undefined);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(error);
        }
    }
    /**
   * Reads all submissions for a codelet. Only public for testing purposes.
   * @returns A Result containing the submissions array or undefined if no data exists
   */ async read() {
        try {
            if (!this.dataHandler) return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(new Error('SDK must be initialized with init() before calling read()'));
            this.pollingState.lastReadTimestamp = Date.now();
            const { submissions, pollingRateMs } = await this.persistenceService.read(this.documentId, this.elementId, this.websiteContext);
            if (pollingRateMs && pollingRateMs !== this.pollingState.pollingIntervalMs) {
                this.pollingState.pollingIntervalMs = pollingRateMs;
                // Restart polling with the new rate if we're currently polling and polling hasn't been stopped.
                // We only want to do this if polling, otherwise we aren't able to call once off
                // reads for initialization in the preview worker
                if (this.pollingState.pollingInterval != null && !this.pollingState.hasTerminalErrors) this.startPolling();
            }
            // Only notify if the data has changed
            if (!areDataObjectArraysEqual(this.lastKnownData, submissions)) {
                this.lastKnownData = submissions;
                this.dataHandler.onDataChanged(this.lastKnownData);
            }
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(submissions);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(error);
        }
    }
    /**
   * Starts polling for data changes from the backend.
   * This method is called internally by init() and should not be called directly.
   */ startPolling() {
        // Don't start polling if it's already been stopped due to errors
        if (this.pollingState.hasTerminalErrors) {
            this.logger.warn('Not starting polling because polling was previously stopped due to errors');
            return;
        }
        // Clear any existing polling interval
        this.stopPolling();
        this.pollingState.pollingInterval = setInterval(async ()=>{
            try {
                // Skip this poll if a read occurred less than the polling interval ago
                const timeSinceLastRead = Date.now() - this.pollingState.lastReadTimestamp;
                if (timeSinceLastRead < this.pollingState.pollingIntervalMs) {
                    this.logger.info('Skipping poll due to recent read)');
                    return;
                }
                const result = await this.read();
                // If read was successful, reset error count
                if (result.isOk) this.resetErrorCount();
                else // If read returned an error result, check if we should stop polling
                if (this.shouldStopPollingOnError(result.error)) this.stopPolling();
            } catch (error) {
                // Handle exceptions during polling
                if (this.shouldStopPollingOnError(error)) this.stopPolling();
            }
        }, this.pollingState.pollingIntervalMs);
    }
    /**
   * Stops the automatic polling interval.
   */ stopPolling() {
        if (this.pollingState.pollingInterval != null) {
            clearInterval(this.pollingState.pollingInterval);
            this.pollingState.pollingInterval = null;
        }
    }
    /**
   * Handles errors during polling and determines if polling should be stopped.
   * Returns true if polling should be stopped, false otherwise.
   */ shouldStopPollingOnError(error) {
        if (this.pollingState.hasTerminalErrors) return true;
        // Check if it's an HttpError with status code
        if (error instanceof _fetch_persistence_service__WEBPACK_IMPORTED_MODULE_6__.HttpError) // Stop immediately on 403 (forbidden) or 501 (not implemented)
        {
            if (TERMINAL_POLLING_ERROR_CODES.includes(error.status)) {
                this.logger.error(`Stopping polling due to status ${error.status}: ${error.message}`);
                this.pollingState.hasTerminalErrors = true;
                return true;
            }
        }
        // Increment consecutive error count for all errors
        this.pollingState.consecutiveErrorCount += 1;
        // Stop polling after 5 consecutive errors
        if (this.pollingState.consecutiveErrorCount >= 5) {
            this.logger.error(`Stopping polling after ${this.pollingState.consecutiveErrorCount} consecutive errors. Last error: ${error}`);
            this.pollingState.hasTerminalErrors = true;
            return true;
        }
        this.logger.warn(`Polling error ${this.pollingState.consecutiveErrorCount}/5: ${error}`);
        return false;
    }
    /**
   * Resets the consecutive error count when a successful operation occurs.
   */ resetErrorCount() {
        this.pollingState.consecutiveErrorCount = 0;
    }
    async triggerInitialReadAndPreviewReady(isPreview) {
        try {
            const result = await this.read();
            if (!result.isOk) this.logger.error('Failed to initialize with data', result.error);
        } finally{
            if (isPreview) this.commsClient?.sendRenderReady(new _data_payloads_proto_ts__WEBPACK_IMPORTED_MODULE_2__.RenderReadyRequest());
        }
    }
    async init(handler) {
        try {
            // Wait for connection to be established before proceeding
            const setupResult = await this.setupCommsClient();
            if (setupResult?.isError) {
                this.logger.error('Failed to establish connection to parent & initialize Data SDK', setupResult.error);
                return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(setupResult.error);
            }
            const commsClient = setupResult.data;
            const initRes = await commsClient.sendInitData(new _data_payloads_proto_ts__WEBPACK_IMPORTED_MODULE_2__.InitDataRequest());
            const { documentId, elementId, websiteContext } = initRes;
            if (documentId) this.documentId = documentId;
            if (elementId) this.elementId = elementId;
            if (websiteContext) this.websiteContext = websiteContext;
            this.dataHandler = handler;
            this.logger.info('Data SDK initialized');
            // Previews are always expected to send a document and element id, if they are missing
            // we tell the preview to render asap rather than wait.
            if (initRes.isPreview && !(initRes.documentId && initRes.elementId)) {
                commsClient.sendRenderReady(new _data_payloads_proto_ts__WEBPACK_IMPORTED_MODULE_2__.RenderReadyRequest());
                return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(undefined);
            }
            // Initially call for data and send a render ready if the init has said this is a preview
            this.triggerInitialReadAndPreviewReady(initRes.isPreview);
            // Start polling for data changes if this isn't a preview, previews should call for data
            // once to load it before the preview is taken.
            if (!initRes.isPreview) this.startPolling();
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.ok(undefined);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            return _sdk_result__WEBPACK_IMPORTED_MODULE_5__.SdkResult.error(error);
        }
    }
    constructor(persistenceService, connectToParent, createDataClientComms, logger = new _logger_ts__WEBPACK_IMPORTED_MODULE_4__.Logger('Data')){
        this.persistenceService = persistenceService;
        this.connectToParent = connectToParent;
        this.createDataClientComms = createDataClientComms;
        this.logger = logger;
        this.dataHandler = null;
        this.lastKnownData = [];
        // Grouping polling state into a single object for easier management
        this.pollingState = {
            pollingInterval: null,
            consecutiveErrorCount: 0,
            hasTerminalErrors: false,
            pollingIntervalMs: DEFAULT_POLLING_INTERVAL_MS,
            lastReadTimestamp: 0
        };
    }
}
// eslint-disable-next-line @canva/ts/no-window-outside-extern-imports
window.dataSdk = new CodeletDataSdk(new _fetch_persistence_service__WEBPACK_IMPORTED_MODULE_6__.FetchPersistenceService(), _apps_developing_sandbox_comms_connect_to_parent_ts__WEBPACK_IMPORTED_MODULE_0__.connectToParent, (comms)=>new _data_comms_client_ts__WEBPACK_IMPORTED_MODULE_1__.DataClientComms(comms));

})();

/******/ })()
;