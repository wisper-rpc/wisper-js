import EventEmitter from 'events';


// Id generator for integer strings starting at '0'.
const nextId = ((id) => () => String(++id))(0);


export default class Local extends EventEmitter {
  constructor() {
    super();
    this.id = Promise.resolve(this._id = nextId());
  }

  get ready() {
    return Promise.resolve(this);
  }

  set ready(value) {
    Object.defineProperty(this, 'ready', { value });
  }
}
