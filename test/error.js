import { WisperError, domain, code } from '../src/errors';

describe('WisperError', function () {
  const typeError = new WisperError(domain.JavaScript, code.type, "Expected number.");

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
      name: "TypeError",
      message: "Expected number."
    });
  });

  it('#cast', function () {
    expect(WisperError.cast(new TypeError("Expected number."))).toEqual(typeError);
    expect(WisperError.cast(typeError)).toEqual(typeError);
  });
});
