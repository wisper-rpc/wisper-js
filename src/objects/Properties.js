import forOwn from 'lodash/object/forOwn';


// The `Properties` decorator adds properties to the prototype
// of the decorated class. It automatically dispatches events
// over RPC whenever these properties are modified.
export default function Properties(properties) {
  return cls => {
    // Setup default values for properties on prototype.
    forOwn(properties, (type, key) => {
      Object.defineProperty(cls.prototype, '_' + key, {
        writable: true,
        value: type.defaultValue()
      });

      Object.defineProperty(cls.prototype, key, descriptor(cls, key, type));
    });
  }
}


// Creates a property descriptor from a type and key.
function descriptor(cls, key, type) {
  const secretKey = '_' + key;

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
