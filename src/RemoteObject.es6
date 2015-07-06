import sdk, { K, forEach } from './rpc.es6';

const remoteObjectInstances = {};

export function InterfaceName(name) {
  // TODO: expose event functions
  // sdk.expose(name + ':!', function (id, event, data) {
  //
  // });

  return cls => { cls.interfaceName = name; }
}


/*
  Base-class for RemoteObjects. Create new RemoteObjects by extending and
  decorating the class with @InterfaceName.

  Example:

    @InterfaceName('wisp.ai.A')
    class A extends RemoteObject {}

  Notes:
    RemoteObject cannot be made Thenable, due to the Promise unwrapping
    rules. The following method, results in an infinite chain of Promises.
    Instead, use the `ready` property.

    then(resolve, reject) {
      return this.id.then(() => this).then(resolve, reject);
    }
*/
export class RemoteObject {

  /**
   * @constructor
   * @param {Array<?>} args
   */
  constructor(args=[]) {
    this.id = sdk.rpc(this.constructor.interfaceName + '~', args).then(result => {
      forEach(result.props, (val, key) => {
        this['_' + key] = val;
      });
      remoteObjectInstances[result.id] = this;
      return this._id = result.id;
    });

    this.ready = this.id.then(K(this));
  }

  /**
   * Destroy the corresponding remote object at native end and
   * remove the instance from remoteObjectInstances collection.
   */
  destroy() {
    this.id.then(id => {
      sdk.notify(this.constructor.interfaceName + ':~');
      remoteObjectInstances[id] = null;
    });
  }
}
