import { K, map, every } from './rpc.es6';

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
const invalidProperties = TypeError("Invalid object structure for properties argument.");
const invalidBaseType = TypeError("Invalid base type.");

// The `any` type is at the top of the hierarchy.
// All values are valid, but it has no default.
const any = {
  writable: true,
  valid: K(true),
  default: function (val) {
    if (!this.valid(val)) {
      throw invalidDefault;
    }

    const type = Object.create(this);
    type.defaultValue = K(val);
    return type;
  }
};


// Creates a new type from a default value and a checker function.
function newtype(defaultValue, checker) {
  const type = Object.create(any);
  type.defaultValue = K(defaultValue);
  type.valid = checker;
  return type;
}

// Check the type is valid or not
function isType(type) {
  if (!type) {
    return false;
  } else if (type === any) {
    return true;
  } else {
    return isType(Object.getPrototypeOf(type));
  }
}


// Primitive types
export const string  = newtype('',    val => typeof val === 'string');
export const number  = newtype(0,     val => typeof val === 'number');
export const boolean = newtype(false, val => typeof val === 'boolean');


// Modifies the given `baseType` to be read-only.
export function readonly(baseType) {
  if(!isType(baseType)){
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.writable = false;
  return type;
}


// Creates a type that is the array of the given `baseType`.
export function array(baseType) {
  if(!isType(baseType)){
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.valid = type => {
    return Array.isArray(type) && type.every(baseType.valid);
  };
  type.defaultValue = () => [];
  return type;
}

// Creates a new composite type of the given object structure.
// The given value must be an object with only properties
export function object(properties) {
  if(!properties || typeof properties !== 'object' || !every(properties, (baseType) => isType(baseType))) {
    throw invalidProperties;
  }

  const type = Object.create(any);
  type.valid = val => typeof val === 'object' && every(properties, (baseType, key) => baseType.valid(val[key]));
  type.defaultValue = () => map(properties, baseType => baseType.defaultValue());
  return type;
}

// Creates a type that is nullable of the given `baseType`.
export function nullable(baseType) {
  if(!isType(baseType)){
    throw invalidBaseType;
  }

  const type = Object.create(baseType);
  type.valid = val => val === null ||  baseType.valid(val);
  type.defaultValue = () => null;
  return type;
}
