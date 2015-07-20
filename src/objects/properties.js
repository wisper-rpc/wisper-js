import forOwn from 'lodash/object/forOwn';
import mapValues from 'lodash/object/mapValues';
import internal from './internal';


// Creates a property descriptor from a type and key.
function propertyDescriptor(cls, key, type) {
  const descriptor = {
    get() {
      // Return the value from the internal properties.
      return this[internal].props[key];
    }
  };

  if (type.writable) {
    descriptor.set = function (value) {
      // If the value type-checks, set it.
      if (type.valid(value)) {
        this[internal].props[key] = value;

        // If a bridge exists, notify of the change.
        if (this.bridge) {
          this.dispatch(key, value);
        }
      }
    };
  }

  return descriptor;
}



// The `Properties` decorator adds properties to the prototype
// of the decorated class. It automatically dispatches events
// over RPC whenever these properties are modified.
export default function properties(definitions, maybeCls) {
  const decorator = cls => {
    // Setup default values for properties on prototype.
    Object.defineProperty(cls.prototype, internal, {
      value: Object.create(cls.prototype[internal])
    });

    Object.defineProperty(cls.prototype[internal], 'props', {
      enumerable: true,
      value: mapValues(definitions, type => type.defaultValue())
    });

    forOwn(definitions, (type, key) => {
      Object.defineProperty(cls.prototype, key, propertyDescriptor(cls, key, type));
    });
  };

  if (maybeCls) {
    return decorator(maybeCls);
  }

  return decorator;
}
