import noop from 'lodash-es/noop';
import { WisperError, domain, code } from '../errors.js';
import { isResponse, isMessage, isPlainError, isResult } from '../protocol.js';
import Namespace from '../Namespace.js';
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
   * Invokes `method` with `params` as arguments.
   *
   * @param  {string} method
   * @param  {any[]} params
   * @return {Promise<?>}
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

  notifyAsync(method, params=[]) {
    Promise.all(params).then(this.notify.bind(this, method));
  }

  receiveJSON(json) {
    try {
      this.receive(JSON.parse(json));
    } catch (e) {
      this.send({ error: WisperError.cast(e) });
    }
  }

  receive(msg) {
    if (!isMessage(msg)) {
      return this.send({
        error: new WisperError(domain.Protocol, code.format, 'Invalid message format'),
      });
    }

    if (isResponse(msg)) {
      this.handleResponse(msg);
    } else if (isPlainError(msg)) {
      // TODO: Improve error handling. Log for now.
      console.error(msg.error.name, msg.error.message);
    } else {
      this.sendResponse(msg.id, this.router.route(msg.method, msg));
    }
  }

  sendResponse(id, promise) {
    if (promise) {
      promise.then( nullIfUndefined ).then(
        result => id && this.send({ id, result }),
        error => this.send({ id, error }));
    }
  }

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
        `Got unexpected response for id: '${msg.id}', but no request was made.`),
      });
    }
  }

  expose(path, handler) {
    return this.router.expose(path, handler);
  }

  close() {
    this.sendJSON = noop;
  }
}
