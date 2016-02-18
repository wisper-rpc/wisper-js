import assert from 'assert';
import forOwn from 'lodash-es/forOwn';
import { isMessage, isResponse, isResult, isInvoke, isPlainError, isError } from '../src/protocol.js';

describe('protocol', function () {
  const messages = {
    // Plain error
    'plain error': { error: {} },

    // Result response
    'result response': { id: 'a', result: 2 },

    // Error response
    'error response': { id: 'b', error: {} },

    // Invoke
    'invoke': { method: 'a', params: [] },

    // empty object
    'empty object': {},

    // invalid
    'null': null
  };

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

  let i = 0;

  forOwn( messages, ( message, test ) => {
    const j = i++;

    it( 'validates ' + test, function () {
      assert.ok( passingChecks[ j ].every( fn => fn( message ) ), 'failed check should pass' );
      assert.ok( failingChecks[ j ].every( fn => !fn( message ) ), 'passed check should fail' );
    });
  });
});
