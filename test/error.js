import assert from 'assert';
import { WisperError, domain, code } from '../src/errors.js';

describe('WisperError', function () {
  const typeError = new WisperError(domain.JavaScript, code.type, 'Expected number.');


  it('is an ES6 class', function () {
    assert.throws( WisperError );
  });


  it('gets it\'s name from the domain and code', function () {
    assert.equal(new WisperError(domain.Protocol, code.oddResponse, 'message').name, 'OddResponseError');
    assert.equal(new WisperError(domain.RemoteObject, code.invalidModifier, 'message').name, 'InvalidModifierError');
  });


  it('JSON.stringify', function () {
    assert.deepEqual( JSON.parse( JSON.stringify( typeError ) ), {
      domain: domain.JavaScript,
      code: code.type,
      name: 'TypeError',
      message: 'Expected number.'
    });
  });


  it('#cast', function () {
    // Native Errors are cast to WisperErrors.
    assert.deepEqual( WisperError.cast(new TypeError('Expected number.')), typeError );

    // WisperErrors are returned as is.
    assert.deepEqual( WisperError.cast(typeError), typeError );

    // Error-like objects are also cast.
    const we = WisperError.cast({
      domain: domain.RemoteObject,
      code: code.invalidArguments,
      name: 'BadArgsYo!',
      message: 'There was something wrong with your arguments.',

      underlying: {
        domain: domain.iOSX,
        code: 0x5326, // Platform specific
        name: 'Some-iOSX-Error',
        message: 'This is the reason for your troubles'
      }
    });

    assert.ok( we instanceof WisperError );

    assert.equal( we.domain, domain.RemoteObject );
    assert.equal( we.name, 'InvalidArgumentsError' );

    assert.equal( we.underlying.domain, domain.iOSX );
    assert.equal( we.underlying.code, 0x5326 );
    assert.equal( we.underlying.name, 'Some-iOSX-Error' );
    assert.equal( we.underlying.underlying, undefined );
  });
});
