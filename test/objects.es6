import { InterfaceName, Properties, Remote } from '../src/objects.es6';
import * as type from '../src/types.es6';

import { BaseBridge } from '../src/bridges.es6';

const sdk = new BaseBridge();

describe("RemoteObject", function () {

  // Override `sdk.rpc` before each test, and reset it afterwards.
  const sdk_rpc = sdk.rpc,
    sdk_notify = sdk.notify;

  var nextId = 0;
  var lastMessage;

  beforeEach(function () {
    sdk.notify = sdk.invoke = function (method, params) {
      lastMessage = { method, params };

      return Promise.resolve({
        id: String(nextId++)
      });
    };

    sdk.notifyAsync = sdk.invokeAsync = function (method, params) {
      return Promise.all(params).then(this.invoke.bind(this, method));
    };
  });

  afterEach(function () {
    sdk.rpc = sdk_rpc;
    sdk.notify = sdk_notify;
  });

  // Test class for tests.
  @sdk.exposeClass
  @InterfaceName("wisp.test.EmptyObject")
  @Properties({
    name: type.string
  })
  class TestRemoteObject extends Remote {
    constructor() {
      super();
    }
  }

  it("constructor should return its own instance", function () {
    expect(new TestRemoteObject() instanceof Remote).toBeTruthy();
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

    expect(newInstance.ready instanceof Promise).toBeTruthy();

    newInstance.ready.then(instance => {
      expect(instance instanceof Remote).toBeTruthy();

      expect(lastMessage.method).toEqual('wisp.test.EmptyObject~');
    }).then(done, done);
  });
});
