import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeCode,
  isValidCode,
  extractCodeCandidates,
  buildUssd,
  toPhoneUrl,
} from '../src/core/recharge.js';

test('clean a manually pasted grouped code', () => {
  assert.equal(sanitizeCode('1234 5678-901234'), '12345678901234');
  assert.equal(sanitizeCode('123456789012345'), '123456789012345');
});

test('require precisely 14 digits', () => {
  assert.equal(isValidCode('12345678901234'), true);
  assert.equal(isValidCode('1234567890123'), false);
  assert.equal(isValidCode('123456789012345'), false);
});

test('extract grouped code from OCR output', () => {
  assert.deepEqual(extractCodeCandidates('CODE: 1234 5678 901234'), ['12345678901234']);
});

test('never truncate 15 digits into a card number', () => {
  assert.deepEqual(extractCodeCandidates('123456789012345'), []);
});

test('return multiple distinct codes rather than choosing silently', () => {
  assert.deepEqual(
    extractCodeCandidates('12345678901234\n98765432109876'),
    ['12345678901234', '98765432109876'],
  );
});

test('build each operator-specific USSD string', () => {
  assert.equal(buildUssd('yas', '12345678901234'), '#321*12345678901234#');
  assert.equal(buildUssd('orange', '12345678901234'), '202*12345678901234');
  assert.equal(buildUssd('airtel', '12345678901234'), '*888*12345678901234#');
});

test('encode hashes for Android tel: URI', () => {
  assert.equal(toPhoneUrl('#321*12345678901234#'), 'tel:%23321*12345678901234%23');
});

test('never keep only 14 digits out of a 15-digit grouped value', () => {
  assert.deepEqual(extractCodeCandidates('12345678901234 5'), []);
  assert.deepEqual(extractCodeCandidates('1-12345678901234'), []);
});

test('Orange direct command retains the exact user-provided format, no extra hash', () => {
  const command = buildUssd('orange', '00998877665544');
  assert.equal(command, '202*00998877665544');
  assert.equal(toPhoneUrl(command), 'tel:202*00998877665544');
});

test('never create a dialing command from incomplete or non numeric OCR', () => {
  assert.throws(() => buildUssd('orange', '1234'));
  assert.throws(() => buildUssd('airtel', '1234567890123x'));
});
