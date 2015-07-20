import assign from 'lodash/object/assign';
import Base from './Base';
import internal from './internal';

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
   * @param {Array<?>} args
   */
  constructor(args=[]) {
    super();
    this.id = this.bridge.invoke(this.interfaceName + '~', args).then(result => {
      const id = this[internal].id = result.id;

      // Set the local properties to those received.
      assign(this[internal].props, result.props);
      this.constructor.instances[result.id] = this;
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
