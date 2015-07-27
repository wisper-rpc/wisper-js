import internal from '../../src/objects/internal';
import { properties, Local, interfaceName } from '../../src/objects';
import { nullable, instance, number } from '../../src/types';
import signature from '../../src/signature';
import { WisperError, domain, code } from '../../src/errors';

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
  x: number.default(5)
})
class Adder extends Local {
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
@properties({
  y: number
})
class Adder2 extends Adder {}


// Handlers for responses.
const handlers = {};

bridge.send = msg => {
  handlers[msg.id](msg);
};


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

  it('should work with inheritance', function () {
    const a1 = new Adder2();
    const a2 = new Adder2();

    expect(a1 instanceof Local).toBeTruthy();
    expect(a1 instanceof Adder).toBeTruthy();
    expect(a1 instanceof Adder2).toBeTruthy();

    expect('x' in a1).toBe(true);
    expect('y' in a1).toBe(true);

    expect(a1[internal].props).toEqual({
      x: 5,
      y: 0
    });

    a1.x = 2;
    a2.y = 4;

    expect(a2[internal].props).toEqual({
      x: 5,
      y: 4
    });

    expect(a1[internal].props).toEqual({
      x: 2,
      y: 0
    });

    a1.x = 'yo';

    expect(a1[internal].props).toEqual({
      x: 2,
      y: 0
    });
  });

  it("responds with an error if a method doesn't exist", function (done) {
    bridge.receive({
      method: 'wisp.test.Adder.sub',
      params: [5, 2],
      id: '5'
    });

    handlers['5'] = msg => {
      expect(msg).toEqual({
        id: '5',
        error: new WisperError(domain.RemoteObject, code.missingProcedure,
          `'wisp.test.Adder' has no static method 'sub'.`)
      });
      done();
    };
  });

  it('can have static methods invoked', function (done) {
    bridge.receive({
      method: 'wisp.test.Adder.add',
      params: [5, 2],
      id: '6'
    });

    handlers['6'] = msg => {
      expect(msg).toEqual({
        id: '6',
        result: 7
      });
      done();
    };
  });

  it('type-checks arguments of static methods invoked', function (done) {
    bridge.receive({
      method: 'wisp.test.Adder.add',
      params: ['5', 2],
      id: '7'
    });

    handlers['7'] = msg => {
      expect(msg).toEqual({
        id: '7',
        error: new WisperError(domain.RemoteObject, code.invalidArguments,
          `Expected argument #1 to be of type 'number', got: "5".`)
      });
      done();
    };
  });
});

describe('List', function () {
  const listBridge = new BaseBridge();

  @interfaceName(listBridge, 'List')
  @properties({
    val: number,
    next: nullable(instance(List))
  })
  @signature([number])
  class List extends Local {
    constructor(val) {
      super();
      this.val = val;
    }

    @signature([nullable(instance(List))])
    setNext(next) {
      return next;
    }

    sum() {
      if (this.next) {
        return this.val + this.next.sum();
      }

      return this.val;
    }
  }

  it('can take List instances as parameters', function (done) {
    let firstId;

    const expects = [
      msg => {
        expect(msg.method).toBe('List!');
        expect(msg.params[0]).toBe('~');
        firstId = msg.params[1].id;
        expect(msg.params[1].props).toEqual({
          val: 1,
          next: null
        });
      },
      msg => {
        expect(msg.method).toBe('List!');
        expect(msg.params[1].id).not.toBe(firstId);
        expect(msg.params[1].props).toEqual({
          val: 2,
          next: null
        });
      },
      msg => {
        expect(msg).toEqual({
          id: '8',
          result: 3
        });
        done();
      }
    ];
    let counter = 0;

    listBridge.send = msg => expects[counter++](msg);

    const l1 = new List(1),
      l2 = new List(2);

    expect(l1[internal]).not.toBe(l2[internal]);

    List.routerThrough(listBridge).addInstance(l1).addInstance(l2);

    listBridge.receive({
      method: 'List:!',
      params: [ l1[internal].id, 'next', l2[internal].id ]
    });

    listBridge.receive({
      id: '8',
      method: 'List:sum',
      params: [ l1[internal].id ]
    });
  });
});
