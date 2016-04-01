import EventEmitter from '../events.js';
import { mapValues } from '../lodash.js';
import internal from './internal.js';


export default class Base extends EventEmitter {
  constructor() {
    super();

    // Create the instance's `internal` property.
    this[internal] = Object.create(this[internal], {
      props: {
        enumerable: true,

        // Set defaults.
        value: mapValues(this[internal].props, type => type.defaultValue())
      }
    });
  }


  // Dispatch an event from this instance across the bridge.
  dispatch(type, value) {
    this.bridge.notifyAsync(this.interfaceName + ':!', [this.id, type, value]);
  }
}


// Give `Base` all methods of an `EventEmitter`,
// in turn handing them down to all subclasses.
const methods = Object.getOwnPropertyNames(EventEmitter.prototype)
  .reduce((object, name) => {
    object[name] = name;
    return object;
  }, Object.create(null));

Object.defineProperties(Base, mapValues(methods, name =>
  Object.getOwnPropertyDescriptor(EventEmitter.prototype, name)));

Base.prototype[internal] = Object.create(Object.prototype);
