import assert from 'assert';
import split from '../src/split.js';

it('split', function () {
  // Splits off the first identifier-like string, eating any dots.
  assert.deepEqual( split('a.b.c'), ['a', 'b.c'] );

  // No remaining identifiers.
  assert.deepEqual( split('c'), ['c', ''] );

  // Empty namespace.
  assert.deepEqual( split('.handshake'), ['', 'handshake'] );

  // Method modifiers.
  assert.deepEqual( split('A.a'), ['A', 'a'] );
  assert.deepEqual( split('A:a'), ['A', ':a'] );

  assert.deepEqual( split('A!'), ['A', '!'] );
  assert.deepEqual( split('A:!'), ['A', ':!'] );

  assert.deepEqual( split('A~'), ['A', '~'] );
  assert.deepEqual( split('A:~'), ['A', ':~'] );

  assert.deepEqual( split('!'), ['!'] );

  // TODO: Expand to handle special cases.
  assert.deepEqual( split('Aag_ag/asd4.a3'), ['Aag_ag', '/asd4.a3'] );
  assert.deepEqual( split('/asd4.a3'), ['/asd4.a3'] );
  assert.deepEqual( split('.'), ['', ''] );
});
