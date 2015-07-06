import sdk, { K, forEach } from './rpc.es6';
import log from './logger.es6';

const remoteObjectInstances = {};

export function InterfaceName(name) {
  return cls => cls.interfaceName = name;
}

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
    }

    /**
     * Destroy the corresponding remote object at native end and
     * remove the instance from remoteObjectInstances collection.
     */
    destroy() {
        this.id.then(id => {
            sdk.notify(this.constructor.name + ':~');
            remoteObjectInstances[id] = null;
        });
    }

    /**
     * Make RemoteObject instances Thenable.
     */
    then(res, rej) {
        return this.id.then(K(this)).then(res, rej);
    }

    catch(rej) {
      return this.id.then(K(this)).catch(rej);
    }
}

/*
  Example:

  @InterfaceName('wisp.ai.A')
  class A extends RemoteObject {}


*/
