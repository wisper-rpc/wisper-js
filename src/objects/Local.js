import Base from './Base.js';
import internal from './internal.js';
import stringId from '../stringId.js';


const nextId = stringId();


export default class Local extends Base {
  constructor() {
    super();
    this.bridge = null;
    this.interfaceName = '';

    this.id = Promise.resolve(this[internal].id = nextId());
  }

  static routerThrough(bridge) {
    // `this.routers` is dynamically created by `interfaceName`.
    return this.routers[bridge.id];
  }

  get ready() {
    return Promise.resolve(this);
  }

  set ready(value) {
    Object.defineProperty(this, 'ready', { value });
  }
}
