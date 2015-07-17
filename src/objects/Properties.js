import forOwn from 'lodash/object/forOwn';
import mapValues from 'lodash/object/mapValues';


// The `Properties` decorator adds properties to the prototype
// of the decorated class. It automatically dispatches events
// over RPC whenever these properties are modified.
export default function Properties(properties) {
  return cls => {
    // Setup default values for properties on prototype.
    Object.defineProperty(cls.prototype, '_repr_', {
      value: Object.create(cls.prototype._repr_)
    });

    Object.defineProperty(cls.prototype._repr_, 'props', {
      enumerable: true,
      value: mapValues(properties, type => type.defaultValue())
    });

    forOwn(properties, (type, key) => {
      Object.defineProperty(cls.prototype, key, descriptor(cls, key, type));
    });
  }
}


// Creates a property descriptor from a type and key.
function descriptor(cls, key, type) {
  const descriptor = {
    get() {
      return this._repr_.props[key];
    }
  };

  if (type.writable) {
    descriptor.set = function (value) {
      if (type.valid(value)) {
        this._repr_.props[key] = value;
        this.bridge && this.bridge.notifyAsync(this.interfaceName + ':!', [this.id, key, value]);
      }
    };
  }

  return descriptor;
}
