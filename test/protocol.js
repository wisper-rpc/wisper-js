import { isMessage, isResponse, isResult, isInvoke, isPlainError, isError } from '../src/protocol';

describe('protocol', function () {
  const messages = [
    // Plain error
    { error: {} },

    // Result response
    { id: 'a', result: 2 },

    // Error response
    { id: 'b', error: {} },

    // Invoke
    { method: 'a', params: [] },

    // empty object
    {},

    // invalid
    null
  ];

  const passingChecks = [
    [ isMessage, isPlainError ],
    [ isMessage, isResponse, isResult ],
    [ isMessage, isResponse, isError ],
    [ isMessage, isInvoke ],
    [],
    []
  ];

  const failingChecks = [
    [ isResponse, isInvoke, isResult, isError ],
    [ isPlainError, isInvoke ],
    [ isPlainError, isInvoke, isResult ],
    [ isPlainError, isResult, isResponse ],
    [ isMessage ],
    [ isMessage ]
  ];

  it('validates the types of messages', function () {
    messages.every((msg, i) =>
      passingChecks[i].every(fn => fn(msg)) &&
      failingChecks[i].every(fn => !fn(msg)));
  });
});
