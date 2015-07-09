import split from "./split.es6";

export class Namespace {
  constructor() {
    this.routes = Object.create(null);
  }

  route(path, msg) {
    if (!path) {
      return Promise.reject(new TypeError('Invalid path!'));
    }

    const [step, rest] = split(path);

    // Lookup the PathHandler.
    const handler = this.routes[step];

    if (!handler) {
      return Promise.reject(new TypeError('No such route!'));
    }

    // Is it a Router?
    if (typeof handler.route !== 'function') {
      return handler.route(rest, msg);
    }

    // It must be a RouteFunction.
    return handler(rest, msg);
  }

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
