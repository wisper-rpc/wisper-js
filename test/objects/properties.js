import { properties, Local } from '../../src/objects';
import { string, number } from '../../src/types';

describe('properties', function () {
  @properties({
    name: string
  })
  class A extends Local {}


  it('throws if an inherited property is redeclared', function () {
    expect(function () {
      @properties({
        name: number
      })
      class B extends A {}

      return new B();
    }).toThrowError(/Can't redefine inherited property 'name: string'/);
  });
});
