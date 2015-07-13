import forOwn from 'lodash/object/forOwn';

const secretPrefix = '_';

const remoteObjectInstances = {};


// The `InterfaceName` decorator registers the RemoteObject
// under the given `name`.
export function InterfaceName(name) {
  // TODO: expose event functions
  // this.bridge.expose(name + ':!', function (id, event, data) {
  //
  // });

  return cls => { cls.prototype.interfaceName = name; }
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
        this.id.then(id => this.bridge.notify(this.interfaceName + ':!', [id, key, value]));
      }
    };
  }

  return descriptor;
}


export function expose(func) {
  func.exposed = true;
}

/*
  Base-class for RemoteObjects. Create new RemoteObjects by extending and
  decorating the class with @InterfaceName.

  Example:
    import { InterfaceName, Properties, RemoteObject } from './RemoteObject.es6';
    import { string } from './type.es6';

    @InterfaceName('wisp.ai.Audio')
    @Properties({
      src: string
    })
    class Audio extends RemoteObject {
      play() {

      }
    }

  Notes:
    RemoteObject cannot be made Thenable, due to the Promise unwrapping
    rules. The following method, results in an infinite chain of Promises.
    Instead, use the `ready` property.

    then(resolve, reject) {
      return this.id.then(() => this).then(resolve, reject);
    }
*/
export class RemoteObject {

  /**
   * @constructor
   * @param {Array<?>} args
   */
  constructor(args=[]) {
    this.id = this.bridge.rpc(this.interfaceName + '~', args).then(result => {
      forOwn(result.props, (val, key) => {
        this[secretPrefix + key] = val;
      });
      remoteObjectInstances[result.id] = this;
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
      this.bridge.notify(this.interfaceName + ':~');
      remoteObjectInstances[id] = null;
    });
  }
}
