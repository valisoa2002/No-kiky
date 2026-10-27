'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { extractCandidates } = require('../codes');

test('extrait un code de 14 chiffres en groupes', () => {
  assert.deepEqual(extractCandidates('Recharge 1234 5678 901234'), ['12345678901234']);
});
test('rejette un numero de 15 chiffres sans troncature', () => {
  assert.deepEqual(extractCandidates('123456789012345'), []);
});
test('renvoie les codes multiples sans en choisir un au hasard', () => {
  assert.deepEqual(extractCandidates('12345678901234\n98765432109876'), [
    '12345678901234', '98765432109876',
  ]);
});
test('accepte les tirets et refuse les lettres dans un code', () => {
  assert.deepEqual(extractCandidates('1234-5678-901234'), ['12345678901234']);
  assert.deepEqual(extractCandidates('1234 ABC 5678901234'), []);
});

test('ne tronque pas un nombre a 15 chiffres avec espaces ou tirets', () => {
  assert.deepEqual(extractCandidates('12345678901234 5'), []);
  assert.deepEqual(extractCandidates('1-12345678901234'), []);
});
