import split from "./split.es6";
import { WisperError, domain, code } from './errors.es6';


export class Namespace {
  constructor() {
    this.routes = Object.create(null);
  }

  route(path, msg) {
    if (!path) {
      return Promise.reject(new WisperError(domain.protocol,
        code.missingProcedure, `Invalid path '${msg.method}'!`));
    }

    const [step, rest] = split(path);

    // Lookup the PathHandler.
    const handler = this.routes[step];

    if (!handler) {
      return Promise.reject(new WisperError(domain.protocol,
        code.missingProcedure, `No route for '${msg.method}'!`));
    }

    // Is it a Router?
    if (typeof handler.route === 'function') {
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


// TODO: return null if invalid modifiers
function parse(path) {
  const instance = path[0] === ':',
    event = path.endsWith('!'),
    tilde = path.endsWith('~'),
    method = path.slice(1);

  return {
    method: (event || tilde) ? null : path.slice(instance),
    event, instance, tilde
  };
}


// Like `Function.prototype.apply`,
// returns a Promise, or null if `func` returned undefined.
function promisedApply(func, ctx, args) {
  try {
    const result = func.apply(ctx, args);

    return result !== undefined ? Promise.resolve(result) : null;
  } catch (e) {
    return Promise.reject(WisperError.cast(e));
  }
}


export class Class {
  constructor(cls) {
    this.cls = cls;
  }

  route(path, msg) {
    const target = parse(path);

    if (!target) {
      // TODO: proper error message
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.invalidModifier, ''));
    }

    return target.instance ?
      this.instanceRoute(target, msg) :
      this.staticRoute(target, msg);
  }

  instanceRoute(target, msg) {
    const instance = this.cls.instances[msg.params[0]];

    if (!instance) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.invalidInstance, `No instance with id '${msg.params[0]}'.`));
    }

    if (target.tilde) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.generic, 'UNIMPLEMENT: instance destruction'));
    }

    if (target.event) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.generic, 'UNIMPLEMENT: instance events'));
    }

    return Promise.reject(new WisperError(domain.RemoteObject,
      code.generic, 'UNIMPLEMENT: method calls'));
  }

  staticRoute(target, msg) {
    if (target.tilde) {
      if (!this.cls.exposed) {
          return Promise.reject(new WisperError(domain.RemoteObject,
            code.generic, // TODO: add `private-constructor` error code
            `The constructor for ${this.className} is private.`
          ));
      }

      return Promise.reject(new WisperError(domain.RemoteObject,
        code.generic, 'UNIMPLEMENTED: remote construction'));
    }

    if (target.event) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.generic, 'UNIMPLEMENT: static events'));
    }

    // A static function?
    const func = this.cls[target.method];

    if (typeof func !== 'function' || func.exposed) {
      return Promise.reject(new WisperError(domain.RemoteObject, code.missingProcedure,
        `'${this.cls.prototype.interfaceName}' has no procedure '${target.method}'.`));
    }

    return promisedApply(func, this.cls, msg.params);
  }
}
