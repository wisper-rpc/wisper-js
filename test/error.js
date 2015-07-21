import { WisperError, domain, code } from '../src/errors';

describe('WisperError', function () {
  const typeError = new WisperError(domain.JavaScript, code.type, 'Expected number.');


  it('is an ES6 class', function () {
    expect(WisperError).toThrow();
  });


  it('gets it\'s name from the domain and code', function () {
    expect(new WisperError(domain.Protocol, code.oddResponse, 'message').name)
      .toEqual('OddResponseError');
    expect(new WisperError(domain.RemoteObject, code.invalidModifier, 'message').name)
      .toEqual('InvalidModifierError');
  });


  it('JSON.stringify', function () {
    expect(JSON.parse(JSON.stringify(typeError))).toEqual({
      domain: domain.JavaScript,
      code: code.type,
      name: 'TypeError',
      message: 'Expected number.'
    });
  });


  it('#cast', function () {
    // Native Errors are cast to WisperErrors.
    expect(WisperError.cast(new TypeError('Expected number.'))).toEqual(typeError);

    // WisperErrors are returned as is.
    expect(WisperError.cast(typeError)).toEqual(typeError);

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

    expect(we.domain).toBe(domain.RemoteObject);
    expect(we.name).toBe('InvalidArgumentsError');

    expect(we.underlying.domain).toBe(domain.iOSX);
    expect(we.underlying.code).toBe(0x5326);
    expect(we.underlying.name).toBe('Some-iOSX-Error');
    expect(we.underlying.underlying).toBe(undefined);
  });
});
