import sdk from './rpc.es6';
import { Promise } from './rpc.es6';
import log from './logger.es6';

const remoteObjectInstances = {};

export default class RemoteObject {

    /**
     * @constructor
     * @param {string} remoteName
     * @param {object} childObjectInstance
     */
    constructor(remoteName, childObjectInstance) {
        var self = this;

        if(!remoteName) {
            throw new ReferenceError('remoteName is not defined');
        }

        if(!childObjectInstance || typeof childObjectInstance !== 'object') {
            throw new ReferenceError('childObjectInstance is not defined');
        }

        self.remoteName = remoteName;

        return new Promise(function (resolve, reject) {
            self.constructNativeObject().then(function (id) {
                self._id = id;
                remoteObjectInstances[id] = childObjectInstance;
                resolve(self);
            }, function (error) {
                log(JSON.stringify(error));
                reject(error);
            });
        });
    }

    /**
     * Destroy the corresponding remote object at native end and
     * remove the instance from remoteObjectInstances collection
     */
    destroy() {
        this.destructNativeObject();
        remoteObjectInstances[this.id] = null;
    }

    /**
     * Sends the RPC request to native end to construct
     * the corresponding remote object.
     */
    constructNativeObject() {
        var self = this;

        return new Promise(function (resolve, reject) {
            sdk.rpc(self.remoteName + '~').then(function (id) {
                resolve(id);
            }, function (error) {
                log(JSON.stringify(error));
                reject(error);
            });
        });
    }

    /**
     * Sends the RPC notification to native end to destroy
     * the corresponding remote object.
     */
    destructNativeObject() {
        sdk.notify(this.remoteName + ':~', this.id);
    }

    /**
     * Gets the value of instance id
     * @return {string}
     */
    get id() {
        return this._id;
    }

    /**
     * Gets the value of remoteName
     * @return {string}
     */
    get remoteName() {
        return this._remoteName;
    }

    /**
     * Sets the value of remoteName
     * @param {string} value
     */
    set remoteName(value) {
        if(value) {
            this._remoteName = value;
        }
    }

    /**
     * Gets the instance of specific instance id
     * @param {string} instanceId
     * @return {RemoteObjectInstance}
     */
     static getInstance(instanceId) {
        if(RemoteObject.isInstanceExists(instanceId)) {
            return remoteObjectInstances[instanceId];
        }

        return null;
     }

    /**
     * Checks whether the instance exists or not for specific instance id
     * @param {string} instanceId
     * @return {bool}
     */
    static isInstanceExists(instanceId) {
        if(instanceId === undefined || !remoteObjectInstances[instanceId]) {
            log("No instance found for id: " + instanceId);

            //sdk.tryToSendRPC(/** @type {!RPCErrorResponse} */ ({
            //    error: RPC.Error.create(
            //        RPC.Error.Domain['RemoteObject'],
            //        'MissingInstance',
            //        "No instance of " + this.remoteName + " found for id: " + instanceId
            //    )
            //}));

            return false;
        }

        log("Instance available for id: " + instanceId);
        return true;
    }
}