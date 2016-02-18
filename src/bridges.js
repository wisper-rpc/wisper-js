import set from 'lodash-es/set';
import Namespace from './Namespace.js';
import { WisperError, domain, code } from './errors.js';
import { isResponse, isMessage, isPlainError, isResult } from './protocol.js';
import stringId from './stringId.js';

function noop() {}


const nextBridgeId = stringId();


export class BaseBridge {
  constructor() {
    this.id = this.constructor.name + nextBridgeId() + '-';
    this.count = 0;

    this.router = new Namespace();

    this.waiting = Object.create(null);

    // A meta property for attaching metadata.
    this.meta = Object.create(null);
  }

  nextId() {
    return this.id + this.count++;
  }

  send(msg) {
    this.sendJSON(JSON.stringify(msg));
  }

  invoke(method, params=[]) {
    const id = this.nextId();

    return new Promise((resolve, reject) => {
      // In the unlikely event that we get a synchronous response,
      // we'll have to be ready to receive it, or we'll error.
      this.waiting[id] = { resolve, reject };

      // Send the message once we're waiting for the response.
      this.send({ method, params, id });
    });
  }

  notify(method, params=[]) {
    this.send({ method, params });
  }

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
        error: new WisperError(domain.Protocol, code.format, 'Invalid message format')
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
      promise.then(
        result => id && this.send({ id, result }),
        error => this.send({ id, error }));
    }
  }

  handleResponse(msg) {
    const waiting = this.waiting[msg.id];

    delete this.waiting[msg.id];

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
        `Got unexpected response for id: '${msg.id}', but no request was made.`)
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


export class PropertyBridge extends BaseBridge {
  constructor(target, receiveProperty, send) {
    super();
    set( this.target = target, this.receiveProperty = receiveProperty, json => {
      this.receiveJSON(json);
    });
    this.sendJSON = send;
  }

  close() {
    super.close();
    set(this.target, this.receiveProperty, null);
  }
}


export class IframeBridge extends BaseBridge {
  constructor(targetWindow) {
    super();
    this.target = targetWindow;
    window.addEventListener('message', this);
  }

  /**
   * Sends JSON by invoking `targetWindow.postMessage`.
   *
   * @private
   * @override
   * @param {string} json
   */
  sendJSON(json) {
    this.target.postMessage(json, '*');
  }

  /**
   * Handles messages sent to this window. If the source of the Event
   * is our target window, the data is routed into the bridge.
   *
   * @private
   * @param {Event} msg
   */
  handleEvent(msg) {
    if (msg.source === this.target) {
      this.receiveJSON(msg.data);
    }
  }

  close() {
    super.close();
    window.removeEventListener('message', this);
  }
}
