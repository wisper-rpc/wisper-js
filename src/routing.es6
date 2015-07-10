import split from "./split.es6";
import { WisperError, domain, code } from './errors.es6';


function error(id, error) {
  return Promise.reject({ id, error });
}


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


function parse(path) {
  const instance = path[0] === ':',
    event = path.endsWith('!'),
    tilde = path.endsWith('~'),
    method = path.slice(1);

  return {
    method: !(event || tilde) ? null : path.slice(1),
    event, instance, tilde
  };
}


export class Class {
  constructor(cls) {
    this.cls = cls;
  }

  route(path, msg) {
    const target = parse(path);

    const instance = target.instance ? this.cls.instances[msg.params[0]] : null;

    if (target.instance && !instance) {
      return error(msg.id, new WisperError(domain.RemoteObject, code.invalidInstance,
        `No instance with id '${id}'.`));
    }

    return null;
  }
}
