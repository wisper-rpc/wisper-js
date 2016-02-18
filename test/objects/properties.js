import assert from 'assert';
import { properties, Local } from '../../src/objects.js';
import { string, number } from '../../src/types.js';

describe('properties', () => {

  class A extends Local {}

  properties({
    name: string
  })( A );


  it('throws if an inherited property is redeclared', () => {
    assert.throws(() => {
      class B extends A {}

      properties({
        name: number
      })( B );

      return new B();
    }, /Can't redefine inherited property 'name: string'/ );
  });
});
