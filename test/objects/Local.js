import { Properties, Local, InterfaceName } from '../../src/objects';
import { string, number } from '../../src/types';
import signature from '../../src/signature';

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


// Test class for Locals.
@InterfaceName(bridge, 'wisp.test.Adder')
@Properties({
  x: number
})
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

@InterfaceName(bridge, 'wisp.test.Adder2')
class Adder2 extends Adder {}


describe('LocalObject', function () {
  it('can be exposed through multiple bridges, and has a router each', function () {
    expect(Adder.routers).not.toBe(Adder2.routers);
  });

  it('constructor should return its own instance', function (done) {
    // Clear messages.
    messages = [];

    const adder = new Adder();
    expect(adder instanceof Local).toBeTruthy();
    expect(adder instanceof Adder).toBeTruthy();

    expect(adder._repr_.id).not.toBeUndefined();

    expect(adder.bridge).toBeNull();

    setTimeout(() => {
      expect(messages).toEqual([]);
      Adder.routerThrough(bridge).addInstance(adder);
      expect(adder.bridge).toBe(bridge);
    }, 20);

    setTimeout(() => {
      expect(messages.length).toBe(1);

      expect(lastMessage().method).toBe('wisp.test.Adder!');
      expect(lastMessage().params[0]).toEqual('~');
      expect(lastMessage().params[1]).toEqual({
        id: adder._repr_.id,
        props: {
          x: 5
        }
      });
      done();
    }, 40);
  });
});
