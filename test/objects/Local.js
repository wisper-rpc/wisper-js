import assert from 'assert';
import internal from '../../src/objects/internal.js';
import { properties, Local, interfaceName } from '../../src/objects.js';
import { nullable, instance, number } from '../../src/types.js';
import signature from '../../src/signature.js';
import { WisperError, domain, code } from '../../src/errors.js';

import BaseBridge from '../../src/bridges/BaseBridge.js';

const bridge = new BaseBridge();

var nextId = 0;
var messages = [ ];

function lastMessage() {
  return messages[ messages.length - 1 ];
}

bridge.notify = bridge.invoke = function (method, params) {
  messages.push({ method, params });

  return Promise.resolve({
    id: String(nextId++)
  });
};


// Test class for Locals.
class Adder extends Local {
  // @signature([ number ], number)
  add(y) {
    return this.x + y;
  }

  // @signature([ number, number ], number)
  static add(x, y) {
    return x + y;
  }
}

Adder.add.parameterTypes = [ number, number ];
Adder.add.returnType = number;

properties({
  x: number.default( 5 )
}, Adder );
interfaceName( bridge, 'wisp.test.Adder' )( Adder );


class Adder2 extends Adder {}
properties({
  y: number
}, Adder2 );
interfaceName(bridge, 'wisp.test.Adder2')( Adder2 );

// Handlers for responses.
const handlers = {};

bridge.send = msg => {
  handlers[ msg.id ](msg);
};


describe('LocalObject', function () {
  it('can be exposed through multiple bridges, and has a router each', function () {
    assert.notEqual( Adder.routers, Adder2.routers );
  });

  it('constructor should return its own instance', (done) => {
    // Clear messages.
    messages = [];

    const adder = new Adder();

    assert.ok( adder instanceof Local );
    assert.ok( adder instanceof Adder );

    assert.equal( typeof adder[ internal ].id, 'string' );
    assert.equal( adder[ internal ].props.x, 5 );

    // assert.equal( adder.x, 5 );
    assert.equal( adder.bridge, null );

    // Expose the local instance `adder` through `bridge`.
    assert.deepEqual( messages, [] );
    Adder.routerThrough( bridge ).addInstance( adder );
    assert.equal( adder.bridge, bridge );

    setTimeout(() => {
      assert.equal( messages.length, 1 );

      assert.equal( typeof adder[ internal ].id, 'string' );
      assert.equal( adder[ internal ].props.x, 5 );

      assert.equal( lastMessage().method, 'wisp.test.Adder!' );
      assert.deepEqual( lastMessage().params[ 0 ], '~');
      assert.deepEqual( lastMessage().params[ 1 ], {
        id: adder[ internal ].id,
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

    assert.ok( a1 instanceof Local );
    assert.ok( a1 instanceof Adder );
    assert.ok( a1 instanceof Adder2 );

    assert.equal( 'x' in a1, true);
    assert.equal( 'y' in a1, true);

    assert.deepEqual( a1[ internal ].props, {
      x: 5,
      y: 0
    });

    a1.x = 2;
    a2.y = 4;

    assert.deepEqual( a2[ internal ].props, {
      x: 5,
      y: 4
    });

    assert.deepEqual( a1[ internal ].props, {
      x: 2,
      y: 0
    });

    a1.x = 'yo';

    assert.deepEqual( a1[ internal ].props, {
      x: 2,
      y: 0
    });
  });

  it("responds with an error if a method doesn't exist", function (done) {
    bridge.receive({
      method: 'wisp.test.Adder.sub',
      params: [ 5, 2 ],
      id: '5'
    });

    handlers[ '5' ] = msg => {
      assert.deepEqual( msg, {
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
      params: [ 5, 2 ],
      id: '6'
    });

    handlers[ '6' ] = msg => {
      assert.deepEqual( msg, {
        id: '6',
        result: 7
      });
      done();
    };
  });

  it('type-checks arguments of static methods invoked', function (done) {
    bridge.receive({
      method: 'wisp.test.Adder.add',
      params: [ '5', 2 ],
      id: '7'
    });

    handlers[ '7' ] = msg => {
      assert.deepEqual( msg, {
        id: '7',
        error: new WisperError(domain.RemoteObject, code.invalidArguments,
          `Expected argument #1 to be of type 'number', got: "5".`)
      });
      done();
    };
  });
});

describe('List test class', function () {
  const listBridge = new BaseBridge();

  // @interfaceName(listBridge, 'List')
  // @properties({
  //   val: number,
  //   next: nullable(instance(List))
  // })
  // @signature([ number ])
  class List extends Local {
    constructor(val) {
      super();
      this.val = val;
    }

    // @signature([ nullable(instance(List)) ])
    setNext(next) {
      this[ internal ].props.next = next;
    }

    sum() {
      if (this.next) {
        return this.val + this.next.sum();
      }

      return this.val;
    }
  }

  List.prototype.setNext.parameterTypes = [ nullable( instance( List ) ) ];

  signature([ number ]);
  interfaceName( listBridge, 'List' )( List );
  properties({
    val: number,
    next: nullable( instance( List ) )
  }, List );

  it('can take List instances as parameters', function (done) {
    const expects = [
      msg => {
        assert.equal( msg.method, 'List!' );
        assert.equal( msg.params[ 0 ], '~' );
        assert.deepEqual( msg.params[ 1 ].props, {
          val: 1,
          next: null
        });
      },
      msg => {
        assert.equal( msg.method, 'List!' );
        assert.equal( msg.params[ 0 ], '~' );
        assert.deepEqual( msg.params[ 1 ].props, {
          val: 2,
          next: null
        });
      },
      msg => {
        assert.deepEqual( msg, {
          id: '8',
          result: 3
        });
        done();
      }
    ];
    let counter = 0;

    listBridge.send = msg => expects[ counter++ ](msg);

    const l1 = new List(1),
      l2 = new List(2);

    assert.notEqual( l1[ internal ], l2[ internal ] );

    List.routerThrough( listBridge ).addInstance( l1 ).addInstance( l2 );

    listBridge.receive({
      method: 'List:setNext',
      params: [ l1[ internal ].id, l2[ internal ].id ]
    });

    listBridge.receive({
      id: '8',
      method: 'List:sum',
      params: [ l1[ internal ].id ]
    });
  });
});
