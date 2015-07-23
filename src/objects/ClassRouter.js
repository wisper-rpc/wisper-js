import { WisperError, domain, code } from '../errors';
import Local from './Local';
import internal from './internal';


// TODO: return null if invalid modifiers
function parse(path) {
  const instance = path[0] === ':',
    event = path.endsWith('!'),
    tilde = path.endsWith('~'),
    method = (event || tilde) ? null : path.slice(instance);

  return { method, event, instance, tilde };
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


// Returns a Promise by calling `new Constructor(...args)`.
function promisedConstruct(Constructor, args) {
  try {
    return new Constructor(...args);
  } catch (e) {
    return Promise.reject(WisperError.cast(e));
  }
}


// Returns a Promise for type-checked arguments, or a rejected promise.
function resolveInstancesAndTypeCheck(instances, func, args) {
  const types = func.parameterTypes,
    n = types ? types.length : 0,
    newArgs = args.slice(0);

  for (let i = 0; i < n; i += 1) {
    // Resolve references to instances.
    if (types[i].instance) {
      const instance = instances[args[i]];

      if (types[i].valid(instance)) {
        newArgs[i] = instance;
        continue;
      }

      return Promise.reject(new WisperError(
        domain.RemoteObject,
        code.invalidInstance,
        `No instance with id '${args[i]}'.`
      ));
    }

    // Type-check other arguments.
    if (!types[i].valid(newArgs[i])) {
      return Promise.reject(new WisperError(
        domain.RemoteObject,
        code.invalidArguments,
        `Expected argument #${i + 1} to be of type '${types[i].name}', got: ${JSON.stringify(args[i])}.`
      ));
    }
  }

  return Promise.resolve(newArgs);
}


// Error constants.
const missingInstanceId = Promise.reject(new WisperError(domain.RemoteObject,
  code.invalidArguments, 'Missing instance id.'));

const destroyedInstance = Promise.reject(new WisperError(domain.RemoteObject,
  code.invalidInstance, 'The instance has been destroyed.'));

const invalidEventParameters = Promise.reject(new WisperError(domain.RemoteObject,
  code.invalidArguments, 'Wrong number of event parameters.'));


export default class ClassRouter {
  constructor(bridge, name, cls) {
    if (!bridge.meta.instances) {
      bridge.meta.instances = Object.create(null);
    }

    this.bridge = bridge;
    this.name = name;
    this.cls = cls;
    this.instances = bridge.meta.instances;
  }


  // Returns a ClassRouter to do routing for `cls`.
  static routing(bridge, name, cls) {
    if (cls.prototype instanceof Local) {
      return new LocalClassRouter(bridge, name, cls);
    }

    return new RemoteClassRouter(bridge, name, cls);
  }


  route(path, msg) {
    const target = parse(path);

    if (!target) {
      // TODO: proper error message
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.invalidModifier, ''));
    }

    // Is the target an instance or the class?
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

    if (!(instance instanceof this.cls)) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.invalidInstance, `No instance with id '${id}'.`));
    }

    if (target.tilde) {
      return this.destroyInstance(instance);
    }

    if (target.event) {
      if (msg.params.length !== 3) {
        return invalidEventParameters;
      }
      return this.instanceEvent(instance, msg.params[1], msg.params[2]);
    }

    return this.instanceMethod(instance, target.method, msg.params.slice(1));
  }


  // Destroy the given `instance`.
  destroyInstance() {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.generic, 'UNIMPLEMENTED: instance destruction'));
  }


  // Dispatch an event on `instance` with the given `key` and `value`.
  instanceEvent(instance, key, value) {
    const props = instance[internal].props;

    // If the instance has an internal property `key`,
    // check the type and set its value.
    if (key in props) {
      const types = this.cls.prototype[internal].props;
      const type = types[key];

      if (type.instance) {
        value = this.instances[value];
      }

      // Don't set the property or dispatch the event
      // if the value has the wrong type.
      if (!type.valid(value)) { return; }

      props[key] = value;
    }

    instance.emit(key, value);
  }


  // Call `instance`'s `method` with `args`.
  instanceMethod(instance, method) {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.missingProcedure,
      `'${this.name}' instances have no method '${method}'.`));
  }


  staticRoute(target, msg) {
    if (target.tilde) {
      return this.constructInstance(msg.params);
    }

    if (target.event) {
      if (msg.params.length !== 2) {
        return invalidEventParameters;
      }
      return this.staticEvent(msg.params[0], msg.params[1]);
    }

    return this.staticFunction(target.method, msg.params);
  }


  // Construct an instance of `this.cls` with the given `args`.
  constructInstance() {
    return Promise.reject(new WisperError(domain.RemoteObject,
      code.generic, // TODO: add `private-constructor` error code
      `The constructor for ${this.name} is private.`
    ));
  }


  // Dispatch an event on `this.cls` with the given `key` and `value`.
  staticEvent(key, value) {
    this.cls.emit(key, value);
  }


  staticFunction(method, plainArgs) {
    const func = this.cls[method];

    if (typeof func !== 'function' || func.secret) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.missingProcedure,
        `'${this.name}' has no static method '${method}'.`));
    }

    return resolveInstancesAndTypeCheck(this.instances, func, plainArgs)
      .then( args => promisedApply(func, this.cls, args));
  }
}


class RemoteClassRouter extends ClassRouter {
    constructor() {
      super(...arguments);

      this.cls.instances = this.instances;

      Object.defineProperties(this.cls.prototype, {
        interfaceName: { value: this.name },
        bridge: { value: this.bridge }
      });
    }
}


// LocalClassRouter is a router for the `Local` class.
// It keeps track of the instances exposed through it.
class LocalClassRouter extends ClassRouter {
  constructor() {
    super(...arguments);

    if (!this.cls.hasOwnProperty('routers')) {
      this.cls.routers = Object.create(null);
    }

    this.cls.routers[this.bridge.id] = this;
  }


  // Bind the instance to this bridge, and set its interface name.
  bindInstance(id, instance) {
    instance.instances = this.instances;
    instance.bridge = this.bridge;
    instance.interfaceName = this.name;

    // Track the instance.
    this.instances[id] = instance;
  }


  // Adds the given local instance to the router,
  // and informs the other end of it's existence.
  addInstance(instance) {
    const id = instance[internal].id;

    if (instance.bridge) {
      throw new Error(`${this.name} instance '${id}' is already connected to a bridge.`);
    }

    this.bindInstance(id, instance);

    // Inform the other end of the instance's existence.
    this.bridge.notify(this.name + '!', ['~', instance[internal]]);

    return this;
  }


  constructInstance(plainArgs) {
    // Safely, construct an instance from the given arguments.
    return resolveInstancesAndTypeCheck(this.instances, this.cls, plainArgs)
      .then( args => promisedConstruct(this.cls, args))
      .then( instance => {
        this.bindInstance(instance[internal].id, instance);

        // Once the instance is initialized, pass on it's representation.
        return instance.ready.then(() => instance[internal]);
      });
  }


  destroyInstance(instance) {
    delete this.instances[instance[internal].id];
    instance[internal].id = null;
    instance.id = destroyedInstance;

    instance.emit('destroy');
  }


  instanceMethod(instance, method, plainArgs) {
    const func = this.cls.prototype[method];

    if (typeof func !== 'function' || func.secret) {
      return Promise.reject(new WisperError(domain.RemoteObject,
        code.missingProcedure,
        `'${this.name}' instances have no method '${method}'.`));
    }

    return resolveInstancesAndTypeCheck(this.instances, func, plainArgs)
      .then( args => promisedApply(func, instance, args));
  }
}
