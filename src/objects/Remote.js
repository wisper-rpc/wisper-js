import assign from 'lodash-es/assign';
import Base from './Base.js';
import internal from './internal.js';

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
export default class Remote extends Base {

  /**
   * @constructor
   * Takes any json compatible arguments and passes them in the constructor call.
   */
  constructor(...args) {
    super();
    this.id = this.bridge.invoke(this.interfaceName + '~', args).then(result => {
      let id;

      // Usually, the result of a construction event
      // should be an { id, props } object.
      if (typeof result === 'object') {
        id = this[internal].id = result.id;
        assign(this[internal].props, result.props);
      } else {
        // To support older implementations, result can also be just an id.
        id = result;
      }

      // Set the local properties to those received.
      this.constructor.instances[id] = this;
      return id;
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
      if (this[internal].id !== id) { return; }
      this[internal].id = null;

      this.bridge.notify(this.interfaceName + ':~', [id]);
      delete this.constructor.instances[id];
    });
  }
}
