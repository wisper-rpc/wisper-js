import assert from 'assert';
import signature from '../src/signature.js';
import { number } from '../src/types.js';

describe('signature', function () {
  function shouldAvoidThrow(val) {
    return ([params, returnType]) => {
      try {
        signature(params, returnType);
        return val;
      } catch (e) {
        return !val;
      }
    };
  }

  const shouldNotThrow = shouldAvoidThrow(true);
  const shouldThrow = shouldAvoidThrow(false);

  describe('takes an array of types, and an optional return type', function () {
    // Arrays of arguments for signature.

    it('shouldn\'t throw for correct args', function () {
      const correctArguments = [
          // empty array params, undefined
          [ [] ],

          // return a number
          [ [], number ]
      ];

      assert.ok( correctArguments.every( shouldNotThrow ) );
    });

    it('SHOULD throw for invalid args', function () {
      const invalidArguments = [
        [ number ],

        [ [], 5 ],

        [ [ 1 ] ],

        [ [ number, 1 ] ]
      ];

      assert.ok( invalidArguments.every( shouldThrow ) );
    });
  });

  it('should set properties on classes', function () {
    // TODO: Babel 6 doesn't support decorators. We should avoid them for now.
    // @signature([ number, number ])
    class Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    }
    Point.parameterTypes = [ number, number ];

    // This just becomes silly.
    assert.deepEqual( Point.parameterTypes, [ number, number ] );
  });

  it('should set properties on methods', function () {
    // TODO: Babel 6 doesn't support decorators. We should avoid them for now.
    const obj = {
      // @signature([ number, number ], number)
      fn() {},

      // @signature([ number ])
      fn2() {}
    };

    obj.fn.parameterTypes = [ number, number ];
    obj.fn.returnType = number;

    obj.fn2.parameterTypes = [ number ];

    // This just becomes silly.
    assert.deepEqual( obj.fn.parameterTypes, [ number, number ] );
    assert.deepEqual( obj.fn.returnType, number );

    assert.deepEqual( obj.fn2.parameterTypes, [ number ] );
    assert.deepEqual( obj.fn2.returnType, undefined );
  });
});
