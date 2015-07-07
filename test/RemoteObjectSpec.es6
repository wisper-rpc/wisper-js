import { InterfaceName, Properties, RemoteObject } from '../src/RemoteObject.es6';
import * as type from '../src/type.es6';

import { Promise } from '../src/rpc.es6';
import log from '../src/logger.es6';

import sdk, { K } from '../src/rpc.es6';

describe("RemoteObject", function () {

  // Override `sdk.rpc` before each test, and reset it afterwards.
  var sdk_rpc = sdk.rpc;
  var nextId = 0;

  beforeEach(function () {
    sdk.rpc = function () {
      return Promise.resolve({
        id: String(nextId++)
      });
    }
  });

  afterEach(function () {
    sdk.rpc = sdk_rpc;
  });

  // Test class for tests.
  @InterfaceName("wisp.test.EmptyObject")
  @Properties({
    name: type.string
  })
  class TestRemoteObject extends RemoteObject {
    constructor() {
      super();
    }
  }

  it("constructor should return its own instance", function () {
    expect(new TestRemoteObject() instanceof RemoteObject).toBeTruthy();
  });

  it('should create properties from annotations', function () {
    const instance = new TestRemoteObject();

    expect(typeof instance.name).toEqual('string');
    expect(instance.name).toEqual('');
  });

  it("`ready` property is a Promise for the resolved instance", function (done) {
    var newInstance = new TestRemoteObject();

    expect(newInstance.ready instanceof Promise.constructor).toBeTruthy();

    newInstance.ready.then(instance => {
      expect(instance instanceof RemoteObject).toBeTruthy();
    }).then(done, done);
  });
});
