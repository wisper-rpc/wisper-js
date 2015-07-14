import forOwn from 'lodash/object/forOwn';

const secretPrefix = '_';


// Id generator for integer strings starting at '0'.
const nextId = ((id) => () => String(++id))(0);


/**
 * Base-class for Remotes. Create new Remotes by extending and
 * decorating the class with `@<wisper.Bridge>.exposeClassAs`.
 * Remotes have the following key properties, which shouldn't be overriden:
 *
 * On each instance:
 *   id:            Promise<string>
 *   ready:         Promise<this>
 *
 * On the prototype:
 *   bridge:        wisper.Bridge
 *   interfaceName: string
 *
 * On the class:
 *   instances:     Object<string, instance>
 *
 * Example:
 *   import { InterfaceName, Properties, Remote, types } from 'wisper-js';
 *   const { string } = types;
 *
 *   import bridge from './some-bridge.es6';
 *
 *   @bridge.exposeClassAs('wisp.ai.Audio')
 *   @Properties({
 *     src: string
 *   })
 *   class Audio extends Remote {
 *     constructor(src) {
 *       super([src]);
 *     }
 *
 *     play() {
 *       this.bridge.notifyAsync(this.interfaceName + ':play', [this.id]);
 *     }
 *   }
 */
export class Remote {

  /**
   * @constructor
   * @param {Array<?>} args
   */
  constructor(args=[]) {
    this.id = this.bridge.invoke(this.interfaceName + '~', args).then(result => {
      forOwn(result.props, (val, key) => {
        this[secretPrefix + key] = val;
      });
      this.constructor.instances[result.id] = this;
      return this._id = result.id;
    });

    this.ready = this.id.then(() => this);
  }

  /**
   * Destroy the corresponding remote object at native end and
   * remove the instance from remoteObjectInstances collection.
   */
  destroy() {
    this.id.then(id => {
      // Ensure `destroy` is only called once.
      if (this._id !== id) return;
      this._id = null;

      this.bridge.notify(this.interfaceName + ':~', [id]);
      delete this.constructor.instances[id];
    });
  }
}


export class Local {
  constructor() {
    this.id = Promise.resolve(this._id = nextId());
    this.ready = Promise.resolve(this);
  }
}


// The `Properties` decorator adds properties to the prototype
// of the decorated class. It automatically dispatches events
// over RPC whenever these properties are modified.
export function Properties(properties) {
  return cls => {
    // Setup default values for properties on prototype.
    forOwn(properties, (type, key) => {
      Object.defineProperty(cls.prototype, secretPrefix + key, {
        writable: true,
        value: type.defaultValue()
      });

      Object.defineProperty(cls.prototype, key, descriptor(cls, key, type));
    });
  }
}


// Creates a property descriptor from a type and key.
function descriptor(cls, key, type) {
  const secretKey = secretPrefix + key;

  const descriptor = {
    get() {
      return this[secretKey];
    }
  };

  if (type.writable) {
    descriptor.set = function (value) {
      if (type.valid(value)) {
        this[secretKey] = value;
        this.bridge.notifyAsync(this.interfaceName + ':!', [this.id, key, value]);
      }
    };
  }

  return descriptor;
}
