import set from 'lodash/object/set';
import noop from 'lodash/utility/noop';

import EventEmitter from 'events';

import { isResponse, isMessage, isPlainError, isResult } from './protocol';
import { ClassRouter, Namespace } from './routing';
import { WisperError, domain, code } from './errors';


export class BaseBridge {
  constructor() {
    this.key = 'base';
    this.count = 0;

    this.router = new Namespace();

    this.waiting = Object.create(null);
  }

  nextId() {
    return this.key + this.count++;
  }

  send(msg) {
    this.sendJSON(JSON.stringify(msg));
  }

  invoke(method, params=[]) {
    const id = this.nextId();

    this.send({ method, params, id });

    return new Promise((resolve, reject) => {
      this.waiting[id] = { reject, resolve };
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
      this.send(WisperError.cast(e))
    }
  }

  receive(msg) {
    if (!isMessage(msg)) {
      return this.send({
        error: new WisperError(domain.Protocol, code.format, "Invalid message format")
      });
    }

    if (isResponse(msg)) {
      this.handleResponse(msg);
    } else if (isPlainError(msg)) {
      // TODO: Improve error handling. Log for now.
      console.error(msg.error.name, msg.error.message);
    } else {
      // TODO: Send responses if a Promise is returned.
      this.sendReponse(msg.id, this.router.route(msg.method, msg));
    }
  }


  sendReponse(id, promise) {
    promise && promise.catch(WisperError.cast).then(
      result => id && this.send({ id, result }),
      error => this.send({ id, error }));
  }


  handleResponse(msg) {
    const waiting = this.waiting[msg.id];
    delete this.waiting[msg.id]

    if (waiting) {
      isResult(msg) ?
        waiting.resolve(msg.result) :
        waiting.reject(WisperError.cast(msg.error));
    } else {
      this.sendError(msg.id, new WisperError(domain.Protocol, code.oddResponse,
        `Got unexpected response for id: '${msg.id}', but no request was made.`));
    }
  }


  // Decorator for `Remote` and `Local` classes. Binds the classes to the bridge.
  exposeClassAs(name) {
    return cls => {
      if (!this.router.expose(name, ClassRouter.routing(name, cls))) {
          console.error(`Route '${name}' already exposed.`);
          return;
      }

      EventEmitter.call(cls);

      Object.defineProperty(cls, 'instances', { value: Object.create(null) });

      Object.defineProperties(cls.prototype, {
        'interfaceName': { value: name },
        'bridge':        { value: this }
      });
    };
  }


  expose(path, handler) {
    return this.router.expose(path, handler);
  }

  close() {
    this.sendJSON = noop;
  }
}


export class GlobalBridge extends BaseBridge {
  constructor(receiveProperty, send) {
    super();
    set(window, this.receiveProperty = receiveProperty, json => {
      this.receiveJSON(json)
    });
    this.sendJSON = send;
  }

  close() {
    super.close();
    set(window, this.receiveProperty, null);
  }
}


export class IframeBridge extends BaseBridge {
  constructor(targetWindow) {
    super();
    this.target = targetWindow;
    window.addEventListener('message', this.decoder = msg => {
      (msg.source == this.target) && this.receiveJSON(msg.data);
    }, false);
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

  close() {
    super.close();
    window.removeEventListener('message', this.decoder, false);
  }
}
