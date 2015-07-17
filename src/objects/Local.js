import Base from './Base';
import stringId from '../stringId';


const nextId = stringId();


export default class Local extends Base {
  constructor() {
    super();
    this.bridge = null;

    this.id = Promise.resolve(this._repr_.id = nextId());
  }

  static routerThrough(bridge) {
    // `this.routers` is dynamically created by `InterfaceName`.
    return this.routers[bridge.id];
  }

  get ready() {
    return Promise.resolve(this);
  }

  set ready(value) {
    Object.defineProperty(this, 'ready', { value });
  }
}
