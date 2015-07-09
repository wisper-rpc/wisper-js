
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
    this.domain = domain;
    this.code = code;
    this.name = errorNames[domain][code] + 'Error';
    this.message = message;

    this.underlying = underlying;
    this.data = data;
  }

  // Casts a `WisperError` or a JavaScript `Error` to a `WisperError`.
  static cast(error) {
    if (error instanceof WisperError) {
      return error;
    }

    if (error instanceof Error) {
      return new WisperError(domain.JavaScript,
        jsErrors.indexOf(error.name.slice(0, -5)),
        error.message);
    }
  }
}
