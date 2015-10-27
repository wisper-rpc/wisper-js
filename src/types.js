import mapValues from 'lodash/object/mapValues';
import every from 'lodash/collection/every';
import clone from 'lodash/lang/cloneDeep';
import isObject from 'lodash/lang/isPlainObject';
import identity from 'lodash/utility/identity';

// import {
//   mapValues,
//   every,
//   cloneDeep as clone,
//   isPlainObject as isObject
// } from 'future-lodash';


// A `type` has the following properties:
//   name         : string
//   writable     : boolean
//   instance     : boolean
//   defaultValue : () => type
//   default      : (type) => this
//   valid        : (type) => boolean
//
// The `default` method is used to create a new type with
// the given value as the default. The given value must be
// a valid value of the type.
//
// ```js
// console.log(number.defaultValue() === 0);
//
// let one = number.default(1);
// console.log(one.defaultValue() === 1);
//
// let two = number.default('2'); // throws TypeError
// ```


// The `TypeError` to throw when a default value is not a valid type.
const invalidDefault = new TypeError('Invalid default value for type.');
const invalidProperties = new TypeError('Invalid object structure for properties argument.');
const invalidBaseType = new TypeError('Invalid base type.');


// The `any` type is at the top of the hierarchy.
// All values are valid, but it has no default value.
export const any = {
  writable: true,
  instance: false,

  name: 'any',

  valid() {
    return true;
  },

  // Creates a new type, with `val` as the type's the default value.
  default(val) {
    if (!this.valid(val)) {
      throw invalidDefault;
    }

    const type = Object.create(this);

    type.defaultValue = () => clone(val);

    return type;
  },

  marshal: identity,

  unmarshal: identity
};


// Check if the argument is a valid type.
export function isType(type) {
  if (!type) {
    return false;
  }

  if (type === any) {
    return true;
  }

  return type === Object(type) && isType(Object.getPrototypeOf(type));
}


// Creates a primitive type from a name and a default value.
function primitive(name, defaultValue) {
  const type = Object.create(any);

  type.name = name;
  type.defaultValue = () => defaultValue;
  type.valid = val => typeof val === name;

  return type;
}


export const string = primitive('string', '');
export const number = primitive('number', 0);
export const boolean = primitive('boolean', false);


// Modifies the given `baseType` to be read-only.
export function readonly(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);

  type.name = `readonly<${baseType.name}>`;
  type.writable = false;

  return type;
}


// Creates a type that is the array of the given `baseType`.
export function array(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);

  type.name = `array<${baseType.name}>`;
  type.valid = val => Array.isArray(val) && val.every(baseType.valid);
  type.defaultValue = () => [];

  type.marshal = arr => arr.map( baseType.marshal );
  type.unmarshal = arr => arr.map( baseType.unmarshal );

  return type;
}


// Creates a new composite type of the given object structure.
// The given value must be an object with only properties.
export function object(properties) {
  if (!isObject(properties) || !every(properties, isType)) {
    throw invalidProperties;
  }

  const type = Object.create(any);

  type.name = '{ ' + Object.keys(properties).map(key =>
    key + ': ' + properties[key].name).join(', ') + ' }';

  type.valid = val =>
    isObject(val) &&
    every(properties, (baseType, key) => baseType.valid(val[key]));

  type.defaultValue = () => mapValues(properties, baseType => baseType.defaultValue());

  type.marshal = val => mapValues(properties, (baseType, key) => baseType.marshal( val[key] ));
  type.unmarshal = val => mapValues(properties, (baseType, key) => baseType.unmarshal( val[key] ));

  return type;
}


// Creates a type that is nullable of the given `baseType`.
export function nullable(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);

  type.name = `nullable<${baseType.name}>`;
  type.valid = val => val === null || baseType.valid(val);
  type.defaultValue = () => null;

  type.marshal = val => val === null ? val : baseType.marshal(val);
  type.unmarshal = val => val === null ? val : baseType.unmarshal(val);

  return type;
}


// Creates a type that is satisfied by instances of `cls`.
export function instance(cls) {
  if (typeof cls !== 'function') {
    throw invalidBaseType;
  }

  const type = Object.create(any);

  type.instance = true;
  type.name = `instance<${cls.name}>`;
  type.valid = val => val instanceof cls;
  type.defaultValue = () => null;

  type.marshal = obj => obj.id;
  type.unmarshal = id => cls.instances[id];

  return type;
}
