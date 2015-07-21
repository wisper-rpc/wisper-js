import EventEmitter from 'events';
import internal from './internal';
import mapValues from 'lodash/object/mapValues';


export default class Base extends EventEmitter {
  constructor() {
    super();

    // Create the instance's `internal` property.
    this[internal] = Object.create(this[internal], {
      props: {
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

Base.prototype[internal] = Object.create(Object.prototype);
