import forOwn from 'lodash/object/forOwn';
import EventEmitter from 'events';


/**
 * Base-class for Remotes.
 * Remotes have the following key properties, which shouldn't be overriden:
 *
 * On each instance:
 *   id:            Promise<string>
 *   ready:         Promise<this>
 *
 * On the prototype:
 *   bridge:        wisper.Bridge
 *   interfaceName: string
 *
 * On the class:
 *   instances:     Object<string, instance>
 */
export default class Remote extends EventEmitter {

  /**
   * @constructor
   * @param {Array<?>} args
   */
  constructor(args=[]) {
    super();
    this.id = this.bridge.invoke(this.interfaceName + '~', args).then(result => {
      forOwn(result.props, (val, key) => {
        this['_' + key] = val;
      });
      this.constructor.instances[result.id] = this;
      return this._id = result.id;
    });

    this.ready = this.id.then(() => this);
  }

  /**
   * Destroy the corresponding remote object at native end and
   * remove the instance from remoteObjectInstances collection.
   */
  destroy() {
    this.id.then(id => {
      // Ensure `destroy` is only called once.
      if (this._id !== id) return;
      this._id = null;

      this.bridge.notify(this.interfaceName + ':~', [id]);
      delete this.constructor.instances[id];
    });
  }
}
