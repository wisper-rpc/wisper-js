import { Properties, Remote, Local } from '../src/objects';
import { string, number } from '../src/types';
import signature from '../src/signature';

import { BaseBridge } from '../src/bridges';

const sdk = new BaseBridge();

var nextId = 0;
var lastMessage;

sdk.notify = sdk.invoke = function (method, params) {
  lastMessage = { method, params };

  return Promise.resolve({
    id: String(nextId++)
  });
};

sdk.notifyAsync = sdk.invokeAsync = function (method, params) {
  return Promise.all(params).then(this.invoke.bind(this, method));
};


// Test class for Remotes.
@sdk.exposeClassAs("wisp.test.EmptyObject")
@Properties({
  name: string
})
class TestRemoteObject extends Remote {
  constructor() {
    super();
  }
}

// Test class for Locals.
@sdk.exposeClassAs('wisp.test.Adder')
class Adder extends Local {
  constructor() {
    super();
    this.x = 5;
  }

  @signature([ number ], number)
  add(y) {
    return this.x + y;
  }

  @signature([ number, number ], number)
  static add(x, y) {
    return x + y;
  }
}

// Set the `bridge` properties of the test classes.
// Adder.prototype.bridge = TestRemoteObject.prototype.bridge = sdk;


describe('LocalObject', function () {
  it('constructor should return its own instance', function () {
    expect(new Adder() instanceof Local).toBeTruthy();
    expect(new Adder() instanceof Adder).toBeTruthy();
  });
});


describe("RemoteObject", function () {
  const instance = new TestRemoteObject();

  it("constructor should return its own instance", function () {
    expect(instance instanceof Remote).toBeTruthy();
    expect(instance instanceof TestRemoteObject).toBeTruthy();
  });

  it('should create properties from annotations', function (done) {
    expect(typeof instance.name).toEqual('string');
    expect(instance.name).toEqual('');

    instance.name = "Charlie";

    setTimeout(() => {
      expect(lastMessage).toEqual({
        method: 'wisp.test.EmptyObject:!',
        params: [ '0', 'name', 'Charlie' ]
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
