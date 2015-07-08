import { string, number, boolean, readonly, array, object, nullable } from '../src/type.es6';

describe('type', function () {
  function all(arr) {
    return arr.reduce((a, b) => a && b, true)
  }

  it('defines basic types: string, number & boolean', function () {
    expect(all([
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
    ])).toBeTruthy();

    expect([
      string,
      boolean,
      number
    ].map(x => x.defaultValue())).toEqual(['', false, 0]);
  });

  it('can make a type readonly', function () {
    expect(all([number, string, boolean].map(type => {
      const newType = readonly(type);

      return !newType.writable && newType.defaultValue === type.defaultValue;
    }))).toBeTruthy();
  });

  it('can override defaultValues', function () {
    expect([
      string.default('cute cats'),
      boolean.default(true),
      number.default(10)
    ].map(x => x.defaultValue())).toEqual(['cute cats', true, 10]);
  });


  describe('can create composite types:', function () {

    const person = object({
      name: string,
      age: number
    });


    it('object', function () {
      let default1 = person.defaultValue(),
        default2 = person.defaultValue();

      // The properties assume their respective defaults.
      expect(default1).toEqual({ name: '', age: 0 });

      // The instances returned by `defaultValue` are not the same.
      expect(default1 === default2).toBeFalsy();

      // Needs all properties to be valid.
      expect(person.valid({ name: 'yo' })).toBeFalsy();

      // Properties must have correct type.
      expect(person.valid({ name: 'yo', age: '15' })).toBeFalsy();

      expect(person.valid("123")).toBeFalsy();
    });


    it('nullable', function () {
      const nullablePerson = nullable(person);

      expect(nullablePerson.defaultValue()).toEqual(null);
    });


    it('array', function () {
      expect(all([
        array(string).valid([]),
        array(string).valid(['megaman']),
        array(number).valid([13, 37]),
        array(person).valid([{ name: 'Dr. Light', age: 74 }])
      ])).toBeTruthy();
    });
  });
});
