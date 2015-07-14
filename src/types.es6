import mapValues from 'lodash/object/mapValues';
import every from 'lodash/collection/every';
import clone from 'lodash/lang/cloneDeep';
import isObject from 'lodash/lang/isPlainObject';

// A `type` has the following properties:
//   writable     : boolean
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
const invalidDefault = new TypeError("Invalid default value for type.");
const invalidProperties = new TypeError("Invalid object structure for properties argument.");
const invalidBaseType = new TypeError("Invalid base type.");


// The `any` type is at the top of the hierarchy.
// All values are valid, but it has no default.
export const any = {
  writable: true,
  valid: () => true,
  default: function (val) {
    if (!this.valid(val)) {
      throw invalidDefault;
    }

    const type = Object.create(this);
    type.defaultValue = () => clone(val);
    return type;
  }
};


// Creates a new type from a default value and a checker function.
function newtype(defaultValue, checker) {
  const type = Object.create(any);
  type.defaultValue = () => defaultValue;
  type.valid = checker;
  return type;
}


// Check if the argument is a valid type.
export function isType(type) {
  if (!type) return false;

  if (type === any) return true;

  return type === Object(type) && isType(Object.getPrototypeOf(type));
}


// Primitive types
export const string  = newtype('',    val => typeof val === 'string');
export const number  = newtype(0,     val => typeof val === 'number');
export const boolean = newtype(false, val => typeof val === 'boolean');


// Modifies the given `baseType` to be read-only.
export function readonly(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.writable = false;
  return type;
}


// Creates a type that is the array of the given `baseType`.
export function array(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.valid = type => Array.isArray(type) && type.every(baseType.valid);
  type.defaultValue = () => [];
  return type;
}


// Creates a new composite type of the given object structure.
// The given value must be an object with only properties.
export function object(properties) {
  if (!isObject(properties) || !every(properties, isType)) {
    throw invalidProperties;
  }

  const type = Object.create(any);

  type.valid = val =>
    isObject(val) &&
    every(properties, (baseType, key) => baseType.valid(val[key]));

  type.defaultValue = () => mapValues(properties, baseType => baseType.defaultValue());
  return type;
}


// Creates a type that is nullable of the given `baseType`.
export function nullable(baseType) {
  if (!isType(baseType)) {
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.valid = val => val === null || baseType.valid(val);
  type.defaultValue = () => null;
  return type;
}


// Creates a type that is satisfied by instances of `cls`.
export function instance(cls) {
  const type = Object.create(any);
  type.valid = val => val === null || val instanceof cls;
  type.defaultValue = () => null;
  return type;
}
