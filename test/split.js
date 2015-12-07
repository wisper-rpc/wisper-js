import split from '../src/split';

it('split', function () {
  // Splits off the first identifier-like string, eating any dots.
  expect(split('a.b.c')).toEqual(['a', 'b.c']);

  // No remaining identifiers.
  expect(split('c')).toEqual(['c', '']);

  // Empty namespace.
  expect(split('.handshake')).toEqual(['', 'handshake']);

  // Method modifiers.
  expect(split('A.a')).toEqual(['A', 'a']);
  expect(split('A:a')).toEqual(['A', ':a']);

  expect(split('A!')).toEqual(['A', '!']);
  expect(split('A:!')).toEqual(['A', ':!']);

  expect(split('A~')).toEqual(['A', '~']);
  expect(split('A:~')).toEqual(['A', ':~']);

  expect(split('!')).toEqual(['!']);

  // TODO: Expand to handle special cases.
  expect(split('Aag_ag/asd4.a3')).toEqual(['Aag_ag', '/asd4.a3']);
  expect(split('/asd4.a3')).toEqual(['/asd4.a3']);
  expect(split('.')).toEqual(['', '']);
});
