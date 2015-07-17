import { WisperError, domain, code } from '../errors';
import Local from './Local';


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


// Error constants.
const missingInstanceId = Promise.reject(new WisperError(domain.RemoteObject,
  code.invalidArguments, 'Missing instance id.'));

const destroyedInstance = Promise.reject(new WisperError(domain.RemoteObject,
  code.invalidInstance, 'The instance has been destroyed.'));


export default class ClassRouter {
  constructor(bridge, name, cls) {
    this.bridge = bridge;
    this.name = name;
    this.cls = cls;
    this.instances = cls.instances || null;
  }


  // Returns a ClassRouter to do routing for `cls`.
  static routing(bridge, name, cls) {
    if (cls.prototype instanceof Local) {
      return new LocalClassRouter(bridge, name, cls);
    }

    return new ClassRouter(bridge, name, cls);
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
    if (!msg.params.length) {
      return missingInstanceId;
    }

    const id = msg.params[0],
      instance = this.instances[id];

    if (!instance) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.invalidInstance, `No instance with id '${id}'.`));
    }

    if (target.tilde) {
      return this.destroyInstance(instance);
    }

    if (target.event && msg.params.length > 2) {
      return this.instanceEvent(instance, msg.params[1], msg.params[2]);
    }

    return this.instanceMethod(instance, target.method, msg.params);
  }


  // Destroy the given `instance`.
  destroyInstance(instance) {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.generic, 'UNIMPLEMENTED: instance destruction'));
  }


  // Dispatch an event on `instance` with the given `type` and `value`.
  instanceEvent(instance, type, value) {
    // If the instance has a secret property `type`, set its value.
    if ('_' + type in instance) {
      instance['_' + type] = value;
    }

    instance.emit(type, value);
  }


  // Call `instance`'s `method` with `args`.
  instanceMethod(instance, method, args) {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.missingProcedure,
      `'${this.name}' instances have no method '${method}'.`));
  }


  staticRoute(target, msg) {
    if (target.tilde) {
      return this.constructInstance(msg.params);
    }

    if (target.event && msg.params.length > 2) {
      return this.staticEvent(msg.params[0], msg.params[1]);
    }

    return this.staticFunction(target.method, msg.params);
  }


  // Construct an instance of `this.cls` with the given arguments.
  constructInstance(args) {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.generic, // TODO: add `private-constructor` error code
      `The constructor for ${this.name} is private.`
    ));
  }


  // Dispatch an event on `this.cls` with the given `type` and `value`.
  staticEvent(type, value) {
    this.cls.emit(type, value);
  }


  staticFunction(method, args) {
    const func = this.cls[method];

    if (typeof func !== 'function' || func.secret) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.missingProcedure,
        `'${this.name}' has no static method '${method}'.`));
    }

    return promisedApply(func, this.cls, args);
  }
}


// LocalClassRouter is a router for the `Local` class.
// It keeps track of the instances exposed through it.
class LocalClassRouter extends ClassRouter {
  constructor() {
      super(...arguments);
      this.instances = Object.create(null);

      if (!this.cls.routers) {
        this.cls.routers = Object.create(null);
      }

      this.cls.routers[this.bridge.id] = this;
  }


  // Adds the given local instance to the router,
  // and informs the other end of it's existence.
  addInstance(instance) {
    const id = instance._repr_.id;

    if (instance.bridge) {
      throw new Error(`${this.name} instance '${id}' is already connected to a bridge.`);
    }

    // Bind the instance to this bridge.
    instance.bridge = this.bridge;

    // Track the instance.
    this.instances[id] = instance;

    // Inform the other end of the instance's existence.
    this.bridge.notify(this.name + '!', ['~', instance._repr_]);
  }


  constructInstance(args) {
    // TODO: type checking of arguments.

    // Create an instance.
    const instance = Object.create(this.cls.prototype);

    // Safely, construct it from the given arguments.
    return promisedApply(this.cls, instance, args).then(() => {
      this.instances[instance._repr_.id] = instance;

      // Once the instance is initialized, pass on it's representation.
      return instance.ready.then( instance => instance._repr_);
    });
  }


  destroyInstance(instance) {
    delete this.instances[instance._id];
    instance._id = null;
    instance.id = destroyedInstance;
  }


  instanceMethod(instance, method, args) {
    const func = this.cls.prototype[method];

    if (typeof func !== 'function' || func.secret) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.missingProcedure,
        `'${this.name}' instances have no method '${method}'.`));
    }

    return promisedApply(func, instance, args);
  }
}
