import { isType } from './types.es6';


const invalidSignature = new TypeError('`signature` takes array of parameter types, and an optional return type.');


export default function signature(parameterTypes, returnType) {
  if (!Array.isArray(parameterTypes) || !parameterTypes.every(isType) ||
      (returnType && !isType(returnType))) {
    throw invalidSignature;
  }

  return (func) => {
    func.parameterTypes = parameterTypes;
    func.returnType = returnType;
  }
}
