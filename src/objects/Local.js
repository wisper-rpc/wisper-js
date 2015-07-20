import Base from './Base';
import internal from './internal';
import stringId from '../stringId';


const nextId = stringId();


export default class Local extends Base {
  constructor() {
    super();
    this.bridge = null;

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
