// We provide our own implementations for functions that would result in needless bloat
// when certain lodash features (like `baseIteratee`) aren't used.

import baseForOwn from 'lodash-es/_baseForOwn';

export function mapValues(object, iteratee) {
  var result = {};
  // iteratee = baseIteratee(iteratee, 3);

  baseForOwn(object, function (value, key, object) {
    result[ key ] = iteratee(value, key, object);
  });
  return result;
}

// Like `clone` but hackier, simpler and good enough.
export function clonePlain(object) {
  return JSON.parse( JSON.stringify( object ) );
}
