import internal from '../../src/objects/internal';
import { properties, Local, interfaceName } from '../../src/objects';
import { number } from '../../src/types';
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
@interfaceName(bridge, 'wisp.test.Adder')
@properties({
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

@interfaceName(bridge, 'wisp.test.Adder2')
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

    expect(adder[internal].id).not.toBeUndefined();

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
        id: adder[internal].id,
        props: {
          x: 5
        }
      });
      done();
    }, 40);
  });
});
