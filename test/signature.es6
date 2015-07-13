import signature from '../src/signature.es6';
import { number } from '../src/types.es6';

describe('signature', function () {
  function should(val) {
    return ([params, returnType]) => {
      try {
          signature(params, returnType);
          return val;
      } catch (e) {
        return !val;
      }
    }
  }

  const shouldNotThrow = should(true);
  const shouldThrow = should(false);

  describe('takes an array of types, and an optional return type', function () {
    // Arrays of arguments for signature.

    it('shouldn\'t throw for correct args', function () {
      const correctArguments = [
          // empty array params, undefined
          [ [] ],

          // return a number
          [ [], number ],
      ];

      expect(correctArguments.every(shouldNotThrow)).toBeTruthy();
    });

    it('SHOULD throw for invalid args', function () {
      const invalidArguments = [
        [ number ],

        [ [], 5 ],

        [ [ 1 ] ],

        [ [ number, 1 ] ],
      ];

      expect(invalidArguments.every(shouldThrow)).toBeTruthy();
    });
  });

  it('should set properties on the annotated function', function () {
    let obj = {
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
