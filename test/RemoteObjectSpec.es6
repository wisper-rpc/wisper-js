import RemoteObject from '../src/RemoteObject.es6';
import { Promise } from '../src/rpc.es6';
import log from '../src/logger.es6';

describe("RemoteObject class", function() {
    const interfaceName = 'wisp.ai.TestRemoteObject';

    it("constructor should not return its own instance", function(){
        var newInstance = new RemoteObject(interfaceName, {});

        expect(newInstance instanceof RemoteObject).toBeFalsy();
    });

    it("constructor should return a promise instead of the own instance", function(){
        var newInstance = new RemoteObject(interfaceName, {});

        expect(newInstance instanceof Promise).toBeTruthy();
    });

    it("constructor will send the instance through promise after resolving it", function(done){

        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                resolve(Math.random());
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(remoteObjectInstance instanceof RemoteObject).toBeTruthy();

            done();
        });
    });

    it("constructor will throw error for invalid remoteName", function(){
        expect(function(){ new RemoteObject('', {}); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(null, {}); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(undefined, {}); }).toThrowError(ReferenceError);
    });

    it("constructor will throw error for invalid childObjectInstance", function(){
        expect(function(){ new RemoteObject(interfaceName, ''); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(interfaceName, 'sample_text'); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(interfaceName, null); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(interfaceName, undefined); }).toThrowError(ReferenceError);
        expect(function(){ new RemoteObject(interfaceName, 123); }).toThrowError(ReferenceError);
    });

    it("constructor stores the instance id of remote object after creating object successfully", function(done){
        var remoteObjectInstanceId;
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                remoteObjectInstanceId = Math.random();
                resolve(remoteObjectInstanceId);
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(remoteObjectInstance.id).toBe(remoteObjectInstanceId);

            done();
        });
    });

    it("constructor stores the child instance after creating object successfully", function(done){
        var remoteObjectInstanceId;
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                remoteObjectInstanceId = Math.random();
                resolve(remoteObjectInstanceId);
            });
        });

        var sampleChildClass = function(){}
        var sampleChildClassInstance = new sampleChildClass();

        var remoteObjectPromise = new RemoteObject(interfaceName, sampleChildClassInstance);

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(RemoteObject.getInstance(remoteObjectInstance.id)).toBe(sampleChildClassInstance);

            done();
        });
    });

    it("isInstanceExists method returns false for invalid instance id", function(){
        var result = RemoteObject.isInstanceExists("invalid id");
        expect(result).toBe(false);
    });

    it("isInstanceExists method returns true for valid instance id", function(done){
        var remoteObjectInstanceId;
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                remoteObjectInstanceId = Math.random();
                resolve(remoteObjectInstanceId);
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(RemoteObject.isInstanceExists(remoteObjectInstance.id)).toBeTruthy();

            done();
        });
    });

    it("getInstance method returns the object instance for specific instance id", function(done){
        var remoteObjectInstanceId;
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                remoteObjectInstanceId = Math.random();
                resolve(remoteObjectInstanceId);
            });
        });

        var sampleChildClass = function(){}
        var sampleChildClassInstance = new sampleChildClass();

        var remoteObjectPromise = new RemoteObject(interfaceName, sampleChildClassInstance);

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(RemoteObject.getInstance(remoteObjectInstance.id)).toBe(sampleChildClassInstance);

            done();
        });
    });

    it("getInstance method returns null if no instance available for specific instance id", function(done){
        var remoteObjectInstanceId;
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                remoteObjectInstanceId = Math.random();
                resolve(remoteObjectInstanceId);
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            expect(RemoteObject.getInstance('different_id')).toBeNull();

            done();
        });
    });

    it("remoteName setter method should not allow to set undefined, null or empty value", function(done){
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                resolve(Math.random());
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            remoteObjectInstance.remoteName = '';
            expect(remoteObjectInstance.remoteName).not.toBe('');

            remoteObjectInstance.remoteName = null;
            expect(remoteObjectInstance.remoteName).not.toBeNull();

            remoteObjectInstance.remoteName = undefined;
            expect(remoteObjectInstance.remoteName).toBeDefined();

            done();
        });
    });

    it("destroy method should remove the self instance from collection", function(done){
        spyOn(RemoteObject.prototype, "constructNativeObject").and.callFake(function() {
            return new Promise(function (resolve, reject) {
                resolve(Math.random());
            });
        });

        var remoteObjectPromise = new RemoteObject(interfaceName, {});

        remoteObjectPromise.then(function(remoteObjectInstance){
            remoteObjectInstance.destroy();
            expect(RemoteObject.getInstance(remoteObjectInstance.id)).toBeNull();

            done();
        });
    });
});