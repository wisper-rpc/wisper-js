
export const domain = {
  JavaScript: 0,
  Protocol: 1,
  RemoteObject: 2,

  iOSX: 10,
  Android: 20,
  Windows: 30
};

export const code = {
  generic: 0,
  eval: 1,
  range: 2,
  reference: 3,
  syntax: 4,
  type: 5,
  uri: 6,

  parse: 1,
  format: 2,
  missingProcedure: 3,
  invalidMessage: 4,
  oddResponse: 5,

  missingClass: 0,
  invalidInstance: 1,
  // missingProcedure: 2
  invalidArguments: 3,
  invalidModifier: 4
};

const jsErrors = [
  '', // Generic Error
  'Eval',
  'Range',
  'Reference',
  'Syntax',
  'Type',
  'URI'
];

//
const errorNames = [
  // JavaScript
  jsErrors,

  // Protocol
  [
  	'',
  	'Parse',
  	'Format',
  	'MissingProcedure',
  	'InvalidMessageType',
    'OddResponse'
  ],

  // RemoteObject
  [
  	'MissingClass',
  	'InvalidInstance',
  	'MissingProcedure',
  	'InvalidArguments',
  	'InvalidModifier'
  ]
];

export class WisperError {
  constructor(domain, code, message, underlying, data) {
    let name;

    this.domain = domain;
    this.code = code;
    this.name = '';
    this.message = message;

    if (errorNames[domain] && (name = errorNames[domain][code]) != null) {
      this.name = name + 'Error';
    }

    this.underlying = underlying;
    this.data = data;
  }

  // Casts a `WisperError`-like object to an actual `WisperError`.
  static cast(error) {
    if (error instanceof WisperError) return error;

    if (error instanceof Error) {
      return new WisperError(domain.JavaScript,
        jsErrors.indexOf(error.name.slice(0, -5)),
        error.message);
    }

    // It's a plain object.
    const err = new WisperError(
      error.domain, error.code, error.message,
      error.underlying ? WisperError.cast(error.underlying) : undefined,
      error.data);

    // Set the `name` property if the error name isn't locally available.
    err.name = err.name || error.name;

    return err;
  }
}
