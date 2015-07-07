import { InterfaceName, Properties, RemoteObject } from '../src/RemoteObject.es6';
import * as type from '../src/type.es6';

import { Promise } from '../src/rpc.es6';
import log from '../src/logger.es6';

import sdk, { K } from '../src/rpc.es6';

describe("RemoteObject", function () {

  // Override `sdk.rpc` before each test, and reset it afterwards.
  const sdk_rpc = sdk.rpc,
    sdk_notify = sdk.notify;

  var nextId = 0;
  var lastMessage;

  beforeEach(function () {
    sdk.notify = sdk.rpc = function (method, params) {
      lastMessage = { method, params };

      return Promise.resolve({
        id: String(nextId++)
      });
    };
  });

  afterEach(function () {
    sdk.rpc = sdk_rpc;
    sdk.notify = sdk_notify;
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

  it('should create properties from annotations', function (done) {
    const instance = new TestRemoteObject();

    expect(typeof instance.name).toEqual('string');
    expect(instance.name).toEqual('');

    instance.name = "Charlie";

    setTimeout(() => {
      expect(lastMessage).toEqual({
        method: 'wisp.test.EmptyObject:!',
        params: [ '1', 'name', 'Charlie' ]
      });
      done();
    }, 20);
  });

  it("`ready` property is a Promise for the resolved instance", function (done) {
    var newInstance = new TestRemoteObject();

    expect(newInstance.ready instanceof Promise.constructor).toBeTruthy();

    newInstance.ready.then(instance => {
      expect(instance instanceof RemoteObject).toBeTruthy();

      expect(lastMessage.method).toEqual('wisp.test.EmptyObject~');
    }).then(done, done);
  });
});
