import forOwn from 'lodash/object/forOwn';
import assign from 'lodash/object/assign';
import internal from './internal';


// Creates a property descriptor from a type and key.
function propertyDescriptor(cls, key, type) {
  const descriptor = {
    enumerable: true,
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
    const inheritedInternal = cls.prototype[internal],
      inheritedDefinitions = inheritedInternal && inheritedInternal.props;

    if (inheritedDefinitions) {
      Object.keys(definitions).forEach(name => {
        if (inheritedDefinitions.hasOwnProperty(name)) {
          throw new Error(`Can't redefine inherited property '${name}: ${inheritedDefinitions[name].name}'`);
        }
      });
    }

    // Setup default values for properties on prototype.
    Object.defineProperty(cls.prototype, internal, {
      writable: true,
      value: {}
    });

    Object.defineProperty(cls.prototype[internal], 'props', {
      enumerable: true,
      // Extend property definitions with inherited definitions.
      value: assign(definitions, inheritedDefinitions)
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
