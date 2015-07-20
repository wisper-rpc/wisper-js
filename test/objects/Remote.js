import { properties, Remote, interfaceName } from '../../src/objects';
import { string } from '../../src/types';
// import signature from '../../src/signature';

import { BaseBridge } from '../../src/bridges';

const bridge = new BaseBridge();

var nextId = 0;
var messages = [];

function lastMessage() {
  return messages[messages.length - 1];
}

bridge.notify = bridge.invoke = function (method, params) {
  messages.push({ method, params });

  return Promise.resolve({
    id: String(nextId++)
  });
};


// Test class for Remotes.
@interfaceName(bridge, 'wisp.test.EmptyObject')
@properties({
  name: string
})
class TestRemoteObject extends Remote {
  constructor() {
    super();
  }
}


describe('RemoteObject', function () {
  it('constructor should return its own instance', function () {
    const instance = new TestRemoteObject();

    expect(instance instanceof Remote).toBeTruthy();
    expect(instance instanceof TestRemoteObject).toBeTruthy();
  });

  it('should create properties from annotations', function (done) {
    const instance = new TestRemoteObject();

    expect(typeof instance.name).toEqual('string');
    expect(instance.name).toEqual('');

    instance.name = 'Charlie';

    setTimeout(() => {
      expect(lastMessage()).toEqual({
        method: 'wisp.test.EmptyObject:!',
        params: [ '1', 'name', 'Charlie' ]
      });
      done();
    }, 20);
  });

  it('`ready` property is a Promise for the resolved instance', function (done) {
    var newInstance = new TestRemoteObject();

    expect(newInstance.ready instanceof Promise).toBeTruthy();

    newInstance.ready.then(instance => {
      expect(instance instanceof Remote).toBeTruthy();

      expect(lastMessage().method).toEqual('wisp.test.EmptyObject~');
    }).then(done, done);
  });
});
