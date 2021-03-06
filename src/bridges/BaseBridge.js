import noop from 'lodash-es/noop';
import { WisperError, domain, code } from '../errors.js';
import { isResponse, isMessage, isPlainError, isResult } from '../protocol.js';
import { Namespace } from '../routers.js';
import stringId from '../stringId.js';

const nextBridgeId = stringId();

function nullIfUndefined( value ) {
  return value != null ? value : null;
}

export default class BaseBridge {
  constructor() {
    this.id = this.constructor.name + nextBridgeId() + '-';
    this.count = 0;

    this.router = new Namespace();

    this.waiting = Object.create(null);

    // A meta property for attaching metadata.
    this.meta = Object.create(null);
  }

  /**
   * Returns a unique request id.
   *
   * @private
   * @return {string} id
   */
  nextId() {
    return this.id + this.count++;
  }

  /**
   * Sends `msg` across the bridge.
   *
   * @private
   * @param  {Message} msg
   */
  send(msg) {
    this.sendJSON(JSON.stringify(msg));
  }

  /**
   * Invokes `method` with `params` as arguments.
   *
   * @param  {string} method
   * @param  {any[]} params
   * @return {Promise<?>}
   */
  invoke(method, params=[]) {
    const id = this.nextId();

    return new Promise((resolve, reject) => {
      // In the unlikely event that we get a synchronous response,
      // we'll have to be ready to receive it, or we'll error.
      this.waiting[ id ] = { resolve, reject };

      // Send the message once we're waiting for the response.
      this.send({ method, params, id });
    });
  }

  /**
   * Notifies `method` with `params` as arguments.
   *
   * @param  {string} method
   * @param  {any[]} params
   */
  notify(method, params=[]) {
    this.send({ method, params });
  }

  /**
   * Invokes `method` with `params` as arguments.
   * All Promise arguments are resolved before invoking the method.
   *
   * @param  {string} method
   * @param  {any[]} params
   * @return {Promise<?>}
   */
  invokeAsync(method, params=[]) {
    return Promise.all(params).then(this.invoke.bind(this, method));
  }

  /**
   * Notifies `method` with `params` as arguments.
   * All Promise arguments are resolved before sending the notification.
   *
   * @param  {string} method
   * @param  {any[]} params
   */
  notifyAsync(method, params=[]) {
    Promise.all(params).then(this.notify.bind(this, method));
  }

  /**
   * Receive a message encoded as a JSON string.
   *
   * @param  {string} json
   */
  receiveJSON(json) {
    try {
      this.receive(JSON.parse(json));
    } catch (e) {
      this.send({ error: WisperError.cast(e) });
    }
  }

  /**
   * Receive a message, by interpreting the given object as a message if possible.
   *
   * @param  {Object} msg
   */
  receive(msg) {
    if (!isMessage(msg)) {
      this.send({
        error: new WisperError(domain.Protocol, code.format, `Invalid message format, message keys: ${ Object.keys( msg ) }`),
      });
      return;
    }

    if (isResponse(msg)) {
      this.handleResponse(msg);
    } else if (isPlainError(msg)) {
      // TODO: Improve error handling. Log for now.
      console.error(msg.error);
    } else {
      this.sendResponse(msg.id, this.router.route(msg.method, msg));
    }
  }

  /**
   * Sends a response for a request with `id`, if `promise` isn't null.
   *
   * @param  {string} id
   * @param  {Promise?} promise
   */
  sendResponse(id, promise) {
    if (promise) {
      promise.then( nullIfUndefined ).then(
        result => id && this.send({ id, result }),
        error => this.send({ id, error }));
    }
  }

  /**
   * Handle a response for a request awaiting one.
   *
   * @param  {ResponseMessage} msg
   */
  handleResponse(msg) {
    const waiting = this.waiting[ msg.id ];

    delete this.waiting[ msg.id ];

    if (waiting) {
      if (isResult(msg)) {
        waiting.resolve(msg.result);
      } else {
        waiting.reject(WisperError.cast(msg.error));
      }
    } else {
      this.send({
        id: msg.id,
        error: new WisperError(domain.Protocol, code.oddResponse,
        `Got a response for id: '${msg.id}', but no request was made.`),
      });
    }
  }

  /**
   * Exposes a route handler at a given path.
   * @param  {string} path
   * @param  {RouteHandler} handler
   * @return {boolean} whether the expose was successful
   */
  expose(path, handler) {
    return this.router.expose(path, handler);
  }

  /**
   * Exposes a function wrapped in a route handler at a given path.
   * @param  {string} path
   * @param  {function} exposed function
   * @return {boolean} whether the expose was successful
   */
  exposeFunction(path, fn) {
    return this.expose(path, (path, message) => {
      return Promise.resolve(fn.apply(null, message.params));
    });
  }


  /**
   * Closes the bridge preventing any more messages from being sent.
   */
  close() {
    this.sendJSON = noop;
  }
}
