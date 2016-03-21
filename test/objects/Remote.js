import assert from 'assert';
import { properties, Remote, interfaceName } from '../../src/objects.js';
import { string } from '../../src/types.js';

import BaseBridge from '../../src/bridges/BaseBridge.js';

const bridge = new BaseBridge();

var nextId = 0;
var messages = [];

function lastMessage() {
  return messages[ messages.length - 1 ];
}

bridge.notify = bridge.invoke = function (method, params) {
  messages.push({ method, params });

  return Promise.resolve({
    id: String(nextId++)
  });
};


// Test class for Remotes.
class TestRemoteObject extends Remote {}

properties({
  name: string
})( TestRemoteObject );
interfaceName( bridge, 'wisp.test.EmptyObject' )( TestRemoteObject );


describe('RemoteObject', function () {
  it('constructor should return its own instance', function () {
    const instance = new TestRemoteObject();

    assert.ok( instance instanceof Remote );
    assert.ok( instance instanceof TestRemoteObject );
  });

  it('should create properties from annotations', function (done) {
    const instance = new TestRemoteObject();

    assert.equal( typeof instance.name, 'string' );
    assert.equal( instance.name, '' );

    instance.name = 'Charlie';

    setTimeout(() => {
      assert.deepEqual( lastMessage(), {
        method: 'wisp.test.EmptyObject:!',
        params: [ '1', 'name', 'Charlie' ]
      });
      done();
    }, 20);
  });

  it('`ready` property is a Promise for the resolved instance', () => {
    return new TestRemoteObject().ready.then(instance => {
      assert.ok( instance instanceof Remote );

      assert.equal( lastMessage().method, 'wisp.test.EmptyObject~' );
    });
  });
});
