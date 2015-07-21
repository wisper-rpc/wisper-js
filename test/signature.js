import signature from '../src/signature';
import { number } from '../src/types';

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

      expect(correctArguments.every(shouldNotThrow)).toBeTruthy();
    });

    it('SHOULD throw for invalid args', function () {
      const invalidArguments = [
        [ number ],

        [ [], 5 ],

        [ [ 1 ] ],

        [ [ number, 1 ] ]
      ];

      expect(invalidArguments.every(shouldThrow)).toBeTruthy();
    });
  });

  it('should set properties on classes', function () {
    @signature([ number, number ])
    class Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    }

    expect(Point.parameterTypes).toEqual([ number, number ]);
  });

  it('should set properties on methods', function () {
    const obj = {
      @signature([ number, number ], number)
      fn() {},

      @signature([ number ])
      fn2() {}
    };

    expect(obj.fn.parameterTypes).toEqual([ number, number ]);
    expect(obj.fn.returnType).toEqual(number);

    expect(obj.fn2.parameterTypes).toEqual([ number ]);
    expect(obj.fn2.returnType).toEqual(undefined);
  });
});
