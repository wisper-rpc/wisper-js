import split from './split.js';
import { WisperError, domain, code } from './errors.js';


export default class Namespace {
  constructor() {
    this.routes = Object.create(null);
  }

  route(path, msg) {
    if (!path) {
      return Promise.reject(new WisperError(domain.Protocol,
        code.missingProcedure, `Invalid path '${msg.method}'!`));
    }

    const [step, rest] = split(path);

    // Lookup the PathHandler.
    const handler = this.routes[step];

    if (!handler) {
      return Promise.reject(new WisperError(domain.Protocol,
        code.missingProcedure, `No route for '${msg.method}'!`));
    }

    // Is it a Router?
    if (typeof handler.route === 'function') {
      return handler.route(rest, msg);
    }

    // It must be a RouteFunction.
    return handler(rest, msg);
  }

  // Tries to expose `handler` at the given `path`.
  expose(path, handler) {
    const [step, rest] = split(path);

    // Does there currently exist a handler?
    let existing = this.routes[step];

    if (!existing) {

      if (!rest) {
        this.routes[step] = handler;
        return true;
      }

      existing = this.routes[step] = new Namespace();
    }

    if (existing instanceof Namespace) {
      return existing.expose(rest, handler);
    }

    return false;
  }
}
