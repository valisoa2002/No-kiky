import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCodeCandidates } from '../src/core/recharge.js';

test('les codes envoyes par le serveur ne sont jamais tronques', () => {
  const incoming = ['123456789012345', '1234 5678 901234'];
  assert.deepEqual(incoming.flatMap(extractCodeCandidates), ['12345678901234']);
});
