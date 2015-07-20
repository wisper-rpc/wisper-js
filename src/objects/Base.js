import EventEmitter from 'events';
import internal from './internal';


export default class Base extends EventEmitter {
  constructor() {
    super();

    // Create the instance's `internal` property.
    const props = Object.create(this[internal].props);

    this[internal] = Object.create(this[internal]);
    this[internal].props = props;
  }
}

Base.prototype[internal] = Object.create(Object.prototype);
