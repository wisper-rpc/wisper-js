import assert from 'assert';
import { any, string, number, boolean, readonly, array, object, nullable, isType } from '../src/types.js';

describe('type', function () {
  function all(arr) {
    return arr.reduce((a, b) => a && b, true);
  }


  it('knows what types are', function () {
    assert.deepEqual([
      number,
      string,
      {},
      1,
      null
    ].map(isType), [
      true,
      true,
      false,
      false,
      false
    ]);
  });


  it('has names', function () {
    assert.deepEqual([
      any, string, number, boolean,
      array(number), nullable(object({ x: number, y: number }))
    ].map(t => t.name), [
      'any', 'string', 'number', 'boolean',
      'array<number>', 'nullable<{ x: number, y: number }>'
    ]);
  });


  it('defines basic types: string, number & boolean', function () {
    assert.ok(all([
      any.valid(''),
      any.valid(true),
      any.valid(false),
      any.valid(6),

      string.valid(''),
      !string.valid(true),
      !string.valid(false),
      !string.valid(6),

      !boolean.valid(''),
      boolean.valid(true),
      boolean.valid(false),
      !boolean.valid(6),

      !number.valid(''),
      !number.valid(true),
      !number.valid(false),
      number.valid(6)
    ]));

    assert.deepEqual(
      [ string, boolean, number].map( x => x.defaultValue() ),
      ['', false, 0]
    );
  });

  it('can make a type readonly', function () {
    assert.ok( all([number, string, boolean].map(type => {
      const newType = readonly(type);

      return !newType.writable && newType.defaultValue === type.defaultValue;
    })));
  });

  it('can override defaultValues', function () {
    assert.deepEqual(
      [
        string.default('cute cats'),
        boolean.default(true),
        number.default(10)
      ].map(x => x.defaultValue()),
      ['cute cats', true, 10]
    );
  });


  it('throws exceptions if given invalid defaults', function () {
    assert.throws(() => number.default('yo'));
    assert.throws(() => object({ x: number }).default(null));
  });


  it('can marshal and unmarshal types', function () {
    // since any type can marshal into promises, any compositioning type must return a promise
    assert.ok( array(number).marshal([]) instanceof Promise );

    const color = Object.create(object({
      r: number,
      g: number,
      b: number,
      a: number
    }));

    color.name = 'color';

    color.unmarshal = str => {
      if (typeof str === 'string') {
        if (str.length < 7) return str;

        return {
          r: parseInt(str.slice(1,3), 16)/255,
          g: parseInt(str.slice(3,5), 16)/255,
          b: parseInt(str.slice(5,7), 16)/255,
          a: parseInt(str.slice(7) || 'ff', 16)/255
        }
      }

      return str;
    };

    assert.deepEqual( color.unmarshal('#ff0000'), {
      r: 1,
      g: 0,
      b: 0,
      a: 1
    });

    assert.ok( color.valid( color.unmarshal( '#00ff00' ) ) );
  });

  describe('can create composite types:', function () {

    const person = object({
      name: string,
      age: number,
      fullname: object({
        first: string,
        last: string
      })
    });

    function isFunctionThrowException(func, type) {
      try {
        func(type);
      } catch (e) {
        return e instanceof TypeError &&
            (e.message === 'Invalid base type.' ||
             e.message === 'Not all object properties were types.');
      }
      return false;
    }

    it('object', function () {
      const default1 = person.defaultValue(),
        default2 = person.defaultValue();

      // The properties assume their respective defaults.
      assert.deepEqual( default1, { name: '', age: 0, fullname: { first: '', last: '' } });

      // The instances returned by `defaultValue` are not the same.
      assert.notStrictEqual( default1, default2 );

      // Needs all properties to be valid.
      assert.ok( !person.valid({ name: 'yo' }) );

      // Properties must have correct type.
      assert.ok( !person.valid({ name: 'yo', age: '15' }) );

      // Anything else should fail.
      assert.ok( !person.valid('123') );
      assert.ok( !person.valid(123) );
      assert.ok( !person.valid(true) );
      assert.ok( !person.valid(null) );
    });

    it('"nullable" function should throw TypeError for invalid base type as parameter', function () {
      assert.ok([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(nullable, x)));
    });

    it('"readonly" function should throw TypeError for invalid base type as parameter', function () {
      assert.ok([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(readonly, x)));
    });

    it('"array" function should throw TypeError for invalid base type as parameter', function () {
      assert.ok([
        null,
        undefined,
        function () {},
        {}
      ].every(x => isFunctionThrowException(array, x)));
    });

    it('"object" function should throw TypeError for invalid property structure as parameter', function () {
      assert.ok([
        null, undefined, function () {},
        string, number, boolean, array(string), nullable(number), readonly(boolean),
        {
          name: string,
          age: boolean,
          fullname: object({
            first: string,
            last: string
          }),
          doSomething: function () {}
        }
      ].every(x => isFunctionThrowException(object, x)));
    });

    it('nullable', function () {
      const nullablePerson = nullable(person);

      assert.equal( nullablePerson.defaultValue(), null);

      // The `baseType` is valid.
      assert.ok( nullablePerson.valid({
        name: 'Dr. Wiley',
        age: 66,
        fullname: {
          first: '',
          last: ''
        }
      }));

      // `null` should be valid.
      assert.ok( nullablePerson.valid(null) );

      // Anything else should fail.
      assert.ok( !nullablePerson.valid(1) );
      assert.ok( !nullablePerson.valid('string') );
      assert.ok( !nullablePerson.valid(undefined) );
    });


    it('array', function () {
      assert.ok(all([
        array(string).valid([]),
        array(string).valid(['megaman']),
        array(number).valid([13, 37]),
        array(person).valid([{ name: 'Dr. Light', age: 74, fullname: {first: '', last: ''} }])
      ]));
    });
  });
});
