import { isType } from './types';


const invalidSignature = new TypeError('`signature` takes array of parameter types, and an optional return type.');


export default function signature(parameterTypes, returnType) {
  if (!Array.isArray(parameterTypes) || !parameterTypes.every(isType) ||
      (returnType && !isType(returnType))) {
    throw invalidSignature;
  }

  return (target, key, descriptor) => {
    // Methods decorators receive three parameters.
    // Class decorators receive only one.
    const func = descriptor ? descriptor.value : target;
    func.parameterTypes = parameterTypes;
    func.returnType = returnType;
  }
}
